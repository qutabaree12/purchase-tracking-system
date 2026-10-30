import datetime

from django.db import models, transaction
from django.db.utils import IntegrityError
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from authentication.models import Employe
from config.pagination import OptionalPagination
from config.permissions import roles_autorises
from demandes.models import DemandeAchat, LigneDemandeAchat
from produits.models import Fournisseur, Produit

from .models import BonDeCommande, DossierImportation, LigneBonDeCommande
from .serializers import BonDeCommandeSerializer

EstAcheteur = roles_autorises(Employe.Role.ACHETEUR)


def _erreur(detail, code=status.HTTP_400_BAD_REQUEST):
    return Response({'detail': detail}, status=code)


# ---------------------------------------------------------------------------
# Regroupement
# ---------------------------------------------------------------------------

def _regrouper_par_fournisseur(lignes, couverts=frozenset()):
    """Regroupe les lignes par fournisseur du produit et somme les quantités.
    `couverts` : ensemble de (id_da, id_fournisseur) déjà commandés (BC actif) : ignorés.
    Retourne (paniers, produits_sans_fournisseur). Chaque panier indique `ids_da`,
    les DA dont il est issu."""
    paniers = {}
    ignores = {}
    for ligne in lignes:
        produit = ligne.id_produit
        fournisseur = produit.id_fournisseur
        if not fournisseur:
            ignores[produit.pk] = {'produit_id': produit.pk, 'nom': produit.nom_produit}
            continue
        if (ligne.id_da_id, fournisseur.pk) in couverts:
            continue
        if fournisseur.pk not in paniers:
            paniers[fournisseur.pk] = {
                'fournisseur_id': fournisseur.pk,
                'fournisseur_nom': fournisseur.nom_fournisseur,
                'produits': {},
                'ids_da': set(),
            }
        paniers[fournisseur.pk]['ids_da'].add(ligne.id_da_id)
        prix = float(ligne.prix_unit or produit.prix_unit or 0)
        entry = paniers[fournisseur.pk]['produits']
        if produit.pk in entry:
            entry[produit.pk]['quantite'] += ligne.qte
        else:
            entry[produit.pk] = {
                'produit_id': produit.pk,
                'nom': produit.nom_produit,
                'prix_unitaire': prix,
                'quantite': ligne.qte,
            }
    liste = [
        {
            'fournisseur_id': p['fournisseur_id'],
            'fournisseur_nom': p['fournisseur_nom'],
            'ids_da': sorted(p['ids_da']),
            'produits': list(p['produits'].values()),
        }
        for p in paniers.values()
    ]
    return liste, list(ignores.values())


@api_view(['POST'])
@permission_classes([IsAuthenticated, EstAcheteur])
def regroupement(request):
    """POST /api/regroupement/  { ids_da }
    Regroupe par fournisseur ce qui reste à commander dans les DA APPROUVÉES de
    l'acheteur connecté, parmi celles sélectionnées.
    La réponse contient aussi 'ignores' : produits sans fournisseur,
    qui ne peuvent pas être commandés."""
    ids_da = request.data.get('ids_da')
    if not ids_da or not isinstance(ids_da, list):
        return Response({'paniers': [], 'ignores': []})
    try:
        ids_da = [int(i) for i in ids_da]
    except (TypeError, ValueError):
        return _erreur('Liste de demandes invalide.')

    demandes = DemandeAchat.objects.filter(
        statut=DemandeAchat.Statut.APPROUVEE,
        id_acheteur=request.user,
        id_da__in=ids_da,
    )
    # (DA, fournisseur) déjà couverts par un bon de commande actif
    couverts = set(
        BonDeCommande.demandes.through.objects
        .filter(
            demandeachat__in=demandes,
            bondecommande__status=BonDeCommande.Statut.EN_COURS,
        )
        .values_list('demandeachat_id', 'bondecommande__id_fournisseur')
    )
    lignes = (
        LigneDemandeAchat.objects
        .filter(id_da__in=demandes)
        .select_related('id_produit__id_fournisseur')
    )
    paniers, ignores = _regrouper_par_fournisseur(lignes, couverts)
    return Response({'paniers': paniers, 'ignores': ignores})


# ---------------------------------------------------------------------------
# Génération des bons de commande
# ---------------------------------------------------------------------------

def _demandes_eligibles(acheteur, fournisseur_id):
    """DA approuvées de l'acheteur qui ont au moins une ligne chez ce fournisseur
    et qui ne sont pas déjà couvertes par un BC actif de ce fournisseur."""
    couvertes = BonDeCommande.demandes.through.objects.filter(
        bondecommande__id_fournisseur=fournisseur_id,
        bondecommande__status=BonDeCommande.Statut.EN_COURS,
    ).values('demandeachat_id')
    return (
        DemandeAchat.objects
        .filter(
            statut=DemandeAchat.Statut.APPROUVEE,
            id_acheteur=acheteur,
            lignes__id_produit__id_fournisseur=fournisseur_id,
        )
        .exclude(pk__in=couvertes)
        .distinct()
    )


def _creer_bc(acheteur, panier, aujourdhui, prochain_num):
    """Valide un panier et crée BC + dossier + lignes.
    À appeler dans une transaction : toute erreur annule l'ensemble du lot."""
    try:
        fournisseur = Fournisseur.objects.get(pk=panier['fournisseur_id'])
    except (Fournisseur.DoesNotExist, ValueError, TypeError):
        raise ValidationError({'detail': 'Fournisseur introuvable.'})

    quantites = {}
    for item in panier.get('produits') or []:
        try:
            produit_id = int(item['produit_id'])
            quantite = int(item['quantite'])
        except (KeyError, TypeError, ValueError):
            raise ValidationError({'detail': 'Une ligne du panier est invalide.'})
        if quantite < 1:
            raise ValidationError({'detail': 'Les quantités doivent être supérieures à zéro.'})
        quantites[produit_id] = quantites.get(produit_id, 0) + quantite
    if not quantites:
        raise ValidationError({'detail': f'Le panier de {fournisseur.nom_fournisseur} est vide.'})

    produits = {p.pk: p for p in Produit.objects.filter(pk__in=list(quantites))}
    for produit_id in quantites:
        produit = produits.get(produit_id)
        if produit is None or produit.id_fournisseur_id != fournisseur.pk:
            raise ValidationError({
                'detail': f"Le produit {produit_id} n'appartient pas au fournisseur "
                          f"{fournisseur.nom_fournisseur}."
            })

    # DA regroupées : celles indiquées par le client, re-vérifiées côté serveur.
    # Sans liste, on prend toutes les DA éligibles pour ce fournisseur.
    eligibles = _demandes_eligibles(acheteur, fournisseur.pk)
    ids_da = panier.get('ids_da')
    if ids_da is not None:
        try:
            ids_da = {int(i) for i in ids_da}
        except (TypeError, ValueError):
            raise ValidationError({'detail': 'Liste de demandes invalide.'})
        demandes = list(eligibles.filter(pk__in=ids_da))
        if not ids_da or len(demandes) != len(ids_da):
            raise ValidationError({
                'detail': "Une des demandes indiquées n'est pas éligible pour "
                          f"{fournisseur.nom_fournisseur}."
            })
    else:
        demandes = list(eligibles)
    if not demandes:
        raise ValidationError({
            'detail': f"Aucune demande approuvée n'est à commander chez {fournisseur.nom_fournisseur}."
        })
    demandes.sort(key=lambda d: d.pk)

    # Le montant est recalculé côté serveur : le prix envoyé par le client est ignoré.
    montant = sum(
        float(produits[pid].prix_unit or 0) * qte for pid, qte in quantites.items()
    )

    bc = BonDeCommande.objects.create(
        id_da=demandes[0],
        id_acheteur=acheteur,
        id_fournisseur=fournisseur,
        date_creation=aujourdhui,
        montant=montant,
        status=BonDeCommande.Statut.EN_COURS,
    )
    bc.demandes.set(demandes)
    DossierImportation.objects.create(id_bc=bc, statut=DossierImportation.Statut.A_TRAITER)
    for pid, qte in quantites.items():
        LigneBonDeCommande.objects.create(
            num_ligne_bc=prochain_num,
            id_bc=bc,
            num_produit_id=pid,
            qte=qte,
        )
        prochain_num += 1
    return bc, prochain_num


@api_view(['POST'])
@permission_classes([IsAuthenticated, EstAcheteur])
def generer_bons_commande(request):
    """POST /api/bons-commande/generer/
    Body : { paniers: [{ fournisseur_id, ids_da, produits: [{produit_id, quantite}] }] }
    Crée un BC par panier, tout ou rien."""
    paniers = request.data.get('paniers')
    if not isinstance(paniers, list) or not paniers:
        return _erreur('Aucun panier fourni.')

    fournisseurs_ids = []
    for panier in paniers:
        if not isinstance(panier, dict) or not panier.get('fournisseur_id'):
            return _erreur('Chaque panier doit indiquer un fournisseur.')
        fournisseurs_ids.append(panier['fournisseur_id'])
    if len(set(fournisseurs_ids)) != len(fournisseurs_ids):
        return _erreur('Deux paniers ont le même fournisseur : impossible de générer.')

    aujourdhui = datetime.date.today()
    if BonDeCommande.objects.filter(
        id_acheteur=request.user,
        date_creation=aujourdhui,
        id_fournisseur_id__in=fournisseurs_ids,
    ).exists():
        return _erreur("Un bon de commande existe déjà aujourd'hui pour un fournisseur sélectionné.")

    try:
        with transaction.atomic():
            # num_ligne_bc n'est pas auto-incrémenté en base : numérotation manuelle
            # (à remplacer par la séquence PostgreSQL lors d'une étape ultérieure).
            prochain_num = (
                LigneBonDeCommande.objects.aggregate(m=models.Max('num_ligne_bc'))['m'] or 0
            ) + 1
            bons = []
            for panier in paniers:
                bc, prochain_num = _creer_bc(request.user, panier, aujourdhui, prochain_num)
                bons.append(bc)
    except IntegrityError:
        return _erreur("Un bon de commande existe déjà aujourd'hui pour un fournisseur sélectionné.")

    return Response(
        {'bons_de_commande': [BonDeCommandeSerializer(bc).data for bc in bons]},
        status=status.HTTP_201_CREATED,
    )


# ---------------------------------------------------------------------------
# Bons de commande : lecture seule (création uniquement via /generer/)
# ---------------------------------------------------------------------------

class BonDeCommandeViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BonDeCommandeSerializer
    pagination_class = OptionalPagination

    def get_queryset(self):
        qs = (
            BonDeCommande.objects
            .select_related('id_acheteur', 'id_fournisseur', 'id_da')
            .prefetch_related('lignes__num_produit', 'demandes')
        )
        user = self.request.user
        role = getattr(user, 'role', None)

        if role == Employe.Role.ACHETEUR:
            qs = qs.filter(id_acheteur=user)
        elif role == Employe.Role.CHEF_DEPARTEMENT:
            qs = qs.filter(demandes__id_demandeur__id_departement__id_chef=user).distinct()
        elif role == Employe.Role.TRANSITAIRE:
            qs = qs.filter(dossier_importation__id_transitaire=user)
        elif role == Employe.Role.DEMANDEUR:
            qs = qs.filter(demandes__id_demandeur=user).distinct()
        elif role in (Employe.Role.ADMIN, Employe.Role.DIRECTEUR, Employe.Role.CONTROLEUR):
            pass
        else:
            qs = qs.none()

        return qs.order_by('-id_bc')
