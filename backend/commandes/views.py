import datetime

from django.db import models, transaction
from django.db.utils import IntegrityError
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from authentication.models import Employe
from config.pagination import OptionalPagination
from config.permissions import roles_autorises
from demandes.models import DemandeAchat, LigneDemandeAchat
from notifications.utils import (
    notifier_dossier_assigne,
    notifier_dossier_mis_a_jour,
    notifier_reception_validee,
)
from produits.models import Fournisseur, Produit

from .models import BonDeCommande, DossierImportation, LigneBonDeCommande
from .serializers import BonDeCommandeSerializer, DossierImportationSerializer

EstAcheteur = roles_autorises(Employe.Role.ACHETEUR)


def _erreur(detail, code=status.HTTP_400_BAD_REQUEST):
    return Response({'detail': detail}, status=code)


# ---------------------------------------------------------------------------
# Regroupement
# ---------------------------------------------------------------------------

def _regrouper_par_fournisseur(lignes):
    """Regroupe les lignes par fournisseur du produit et somme les quantités.
    Retourne (paniers, produits_sans_fournisseur)."""
    paniers = {}
    ignores = {}
    for ligne in lignes:
        produit = ligne.id_produit
        fournisseur = produit.id_fournisseur
        if not fournisseur:
            ignores[produit.pk] = {'produit_id': produit.pk, 'nom': produit.nom_produit}
            continue
        if fournisseur.pk not in paniers:
            paniers[fournisseur.pk] = {
                'fournisseur_id': fournisseur.pk,
                'fournisseur_nom': fournisseur.nom_fournisseur,
                'produits': {},
            }
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
            'produits': list(p['produits'].values()),
        }
        for p in paniers.values()
    ]
    return liste, list(ignores.values())


@api_view(['POST'])
@permission_classes([IsAuthenticated, EstAcheteur])
def regroupement(request):
    """POST /api/regroupement/  { ids_da }
    Regroupe par fournisseur les DA APPROUVÉES de l'acheteur connecté,
    sans bon de commande, parmi celles sélectionnées.
    La réponse contient aussi 'ignores' : produits sans fournisseur,
    qui ne peuvent pas être commandés."""
    ids_da = request.data.get('ids_da')
    if not ids_da or not isinstance(ids_da, list):
        return Response({'paniers': [], 'ignores': []})

    demandes = DemandeAchat.objects.filter(
        statut=DemandeAchat.Statut.APPROUVEE,
        id_acheteur=request.user,
        bons_commande__isnull=True,
        id_da__in=ids_da,
    )
    lignes = (
        LigneDemandeAchat.objects
        .filter(id_da__in=demandes)
        .select_related('id_produit__id_fournisseur')
    )
    paniers, ignores = _regrouper_par_fournisseur(lignes)
    return Response({'paniers': paniers, 'ignores': ignores})


# ---------------------------------------------------------------------------
# Génération des bons de commande
# ---------------------------------------------------------------------------

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

    # DA d'origine : uniquement une DA approuvée de cet acheteur, sans BC.
    eligibles = DemandeAchat.objects.filter(
        statut=DemandeAchat.Statut.APPROUVEE,
        id_acheteur=acheteur,
        bons_commande__isnull=True,
    )
    id_da = panier.get('id_da')
    if id_da:
        try:
            demande = eligibles.filter(pk=int(id_da)).first()
        except (TypeError, ValueError):
            demande = None
        if demande is None:
            raise ValidationError({'detail': "La demande indiquée n'est pas éligible."})
    else:
        demande = (
            eligibles.filter(lignes__id_produit__in=list(quantites))
            .order_by('id_da')
            .first()
        )

    # Le montant est recalculé côté serveur : le prix envoyé par le client est ignoré.
    montant = sum(
        float(produits[pid].prix_unit or 0) * qte for pid, qte in quantites.items()
    )

    bc = BonDeCommande.objects.create(
        id_da=demande,
        id_acheteur=acheteur,
        id_fournisseur=fournisseur,
        date_creation=aujourdhui,
        montant=montant,
        status=BonDeCommande.Statut.EN_COURS,
    )
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
    Body : { paniers: [{ fournisseur_id, produits: [{produit_id, quantite}] }] }
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
            .select_related('id_acheteur', 'id_fournisseur')
            .prefetch_related('lignes__num_produit')
        )
        user = self.request.user
        role = getattr(user, 'role', None)

        if role == Employe.Role.ACHETEUR:
            qs = qs.filter(id_acheteur=user)
        elif role == Employe.Role.CHEF_DEPARTEMENT:
            qs = qs.filter(id_da__id_demandeur__id_departement__id_chef=user)
        elif role == Employe.Role.TRANSITAIRE:
            qs = qs.filter(dossier_importation__id_transitaire=user)
        elif role == Employe.Role.DEMANDEUR:
            qs = qs.filter(id_da__id_demandeur=user)
        elif role in (Employe.Role.ADMIN, Employe.Role.DIRECTEUR, Employe.Role.CONTROLEUR):
            pass
        else:
            qs = qs.none()

        return qs.order_by('-id_bc')


# ---------------------------------------------------------------------------
# Dossiers d'importation : pas de création ni de suppression par l'API
# ---------------------------------------------------------------------------

class DossierImportationViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = DossierImportationSerializer
    pagination_class = OptionalPagination
    http_method_names = ['get', 'patch', 'post', 'head', 'options']

    def get_queryset(self):
        qs = DossierImportation.objects.select_related(
            'id_bc__id_fournisseur',
            'id_bc__id_acheteur',
            'id_transitaire',
        )
        user = self.request.user
        role = getattr(user, 'role', None)

        if role == Employe.Role.TRANSITAIRE:
            qs = qs.filter(id_transitaire=user)
        elif role == Employe.Role.ACHETEUR:
            qs = qs.filter(id_bc__id_acheteur=user)
        elif role == Employe.Role.CHEF_DEPARTEMENT:
            qs = qs.filter(id_bc__id_da__id_demandeur__id_departement__id_chef=user)
        elif role in (Employe.Role.ADMIN, Employe.Role.DIRECTEUR, Employe.Role.CONTROLEUR):
            pass
        else:
            qs = qs.none()

        return qs.order_by('-id_dossier')

    def _refus_si_pas_transitaire_assigne(self, dossier, message):
        user = self.request.user
        if (
            getattr(user, 'role', None) != Employe.Role.TRANSITAIRE
            or dossier.id_transitaire_id != user.id_emp
        ):
            return _erreur(message, status.HTTP_403_FORBIDDEN)
        return None

    def update(self, request, *args, **kwargs):
        dossier = self.get_object()
        refus = self._refus_si_pas_transitaire_assigne(
            dossier, "Seul le transitaire assigné peut modifier ce dossier."
        )
        if refus:
            return refus
        if dossier.statut == DossierImportation.Statut.LIVRE:
            return _erreur("Ce dossier est livré : il n'est plus modifiable.")
        return super().update(request, *args, **kwargs)

    def perform_update(self, serializer):
        dossier = serializer.save()
        notifier_dossier_mis_a_jour(dossier)

    @action(detail=True, methods=['post'])
    def assigner_transitaire(self, request, pk=None):
        dossier = self.get_object()

        if (
            getattr(request.user, 'role', None) != Employe.Role.ACHETEUR
            or dossier.id_bc.id_acheteur_id != request.user.id_emp
        ):
            return _erreur("Vous n'êtes pas autorisé à assigner ce dossier.", status.HTTP_403_FORBIDDEN)

        if dossier.statut == DossierImportation.Statut.LIVRE:
            return _erreur("Ce dossier est déjà livré : réassignation impossible.")

        transitaire_id = request.data.get('transitaire_id')
        if not transitaire_id:
            return _erreur('Veuillez choisir un transitaire.')

        transitaire = Employe.objects.filter(
            id_emp=transitaire_id,
            role=Employe.Role.TRANSITAIRE,
            etat=Employe.Etat.ACTIF,
        ).first()
        if not transitaire:
            return _erreur("Employé introuvable ou n'est pas un transitaire actif.")

        transitaire_a_change = dossier.id_transitaire_id != transitaire.id_emp
        dossier.id_transitaire = transitaire
        if dossier.statut == DossierImportation.Statut.A_TRAITER:
            dossier.statut = DossierImportation.Statut.EN_COURS
        dossier.save()

        if transitaire_a_change:
            notifier_dossier_assigne(dossier)

        return Response(self.get_serializer(dossier).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def verifier_controleur(self, request, pk=None):
        dossier = self.get_object()

        if getattr(request.user, 'role', None) != Employe.Role.CONTROLEUR:
            return _erreur(
                "Seul le contrôleur peut effectuer cette vérification.",
                status.HTTP_403_FORBIDDEN,
            )

        decision = request.data.get('decision')
        commentaire = str(request.data.get('commentaire', '')).strip()

        if decision not in ('valide', 'refuse'):
            return _erreur(
                "La décision doit être 'valide' ou 'refuse'."
            )

        if decision == 'refuse' and not commentaire:
            return _erreur(
                "Un commentaire est obligatoire en cas de refus."
            )

        numero_lc = str(request.data.get('numero_lc', '')).strip()
        banque_lc = str(request.data.get('banque_lc', '')).strip()
        date_lc = request.data.get('date_lc') or None

        if decision == 'valide':
            if not numero_lc or not banque_lc or not date_lc:
                return _erreur(
                    "Pour valider le dossier, renseignez le numéro, "
                    "la banque et la date de la lettre de crédit."
                )

        dossier.statut_controle = decision
        dossier.commentaire_controle = commentaire
        dossier.date_controle = datetime.date.today()

        if decision == 'valide':
            dossier.numero_lc = numero_lc
            dossier.banque_lc = banque_lc
            dossier.date_lc = date_lc
        else:
            dossier.numero_lc = ''
            dossier.banque_lc = ''
            dossier.date_lc = None

        dossier.save(update_fields=[
            'statut_controle',
            'commentaire_controle',
            'date_controle',
            'numero_lc',
            'banque_lc',
            'date_lc',
        ])

        return Response(
            self.get_serializer(dossier).data,
            status=status.HTTP_200_OK,
        )
    
    @action(detail=True, methods=['post'])
    def valider_reception(self, request, pk=None):
        dossier = self.get_object()
        refus = self._refus_si_pas_transitaire_assigne(
            dossier, "Vous n'êtes pas autorisé à valider cette réception."
        )
        if refus:
            return refus

        with transaction.atomic():
            # Verrou sur la ligne : deux validations simultanées ne passent pas ensemble.
            dossier = DossierImportation.objects.select_for_update().get(pk=dossier.pk)

            if dossier.statut == DossierImportation.Statut.LIVRE:
                return _erreur('La réception de ce dossier a déjà été validée.')
            if dossier.statut != DossierImportation.Statut.EN_COURS:
                return _erreur("Le dossier doit être en cours pour valider la réception.")
            if (
                dossier.statut_controle
                != DossierImportation.StatutControle.VALIDE
            ):
                return _erreur(
                    "Le contrôle du dossier doit être validé avant "
                    "de poursuivre le processus."
                )
            # Règle proposée : retire ce bloc si tu ne veux pas ce blocage.
            if dossier.autorisation_necessaire and not dossier.autorisation_obtenue:
                return _erreur("Une autorisation est nécessaire et n'a pas encore été obtenue.")

            dossier.date_reception_reelle = datetime.date.today()
            dossier.statut = DossierImportation.Statut.LIVRE
            dossier.save(update_fields=['date_reception_reelle', 'statut'])
            notifier_reception_validee(dossier)

        return Response(self.get_serializer(dossier).data, status=status.HTTP_200_OK)