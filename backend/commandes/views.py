import datetime

from django.db import models
from django.db.utils import IntegrityError
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from demandes.models import DemandeAchat, LigneDemandeAchat
from .models import BonDeCommande, LigneBonDeCommande
from .serializers import BonDeCommandeSerializer


def _regrouper_par_fournisseur(lignes):
    """Regroupe les lignes par fournisseur du produit et somme les quantités."""
    paniers = {}
    for ligne in lignes:
        produit = ligne.id_produit
        fournisseur = produit.id_fournisseur
        if not fournisseur:
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
    return [
        {
            'fournisseur_id': p['fournisseur_id'],
            'fournisseur_nom': p['fournisseur_nom'],
            'produits': list(p['produits'].values()),
        }
        for p in paniers.values()
    ]


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def regroupement(request):
    """POST /api/regroupement/
    Regroupe les demandes acceptées (ou celles passées en body {ids_da})
    par fournisseur du produit → paniers.
    """
    ids_da = request.data.get('ids_da')
    # Ne regroupe que les demandes approuvées qui n'ont pas encore de bon de commande
    demandes = DemandeAchat.objects.filter(
        statut=DemandeAchat.Statut.APPROUVEE,
        bons_commande__isnull=True,
    )
    if ids_da:
        demandes = demandes.filter(id_da__in=ids_da)

    lignes = (
        LigneDemandeAchat.objects
        .filter(id_da__in=demandes)
        .select_related('id_produit__id_fournisseur')
    )
    paniers = _regrouper_par_fournisseur(lignes)
    return Response({'paniers': paniers})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generer_bons_commande(request):
    """POST /api/bons-commande/generer/
    Body : { paniers: [{ fournisseur_id, produits: [{produit_id, quantite, prix_unitaire}] }] }
    → crée un BonDeCommande par panier (par fournisseur).
    """
    paniers = request.data.get('paniers', [])
    if not paniers:
        return Response({'detail': 'Aucun panier fourni.'}, status=status.HTTP_400_BAD_REQUEST)

    # Règle métier : un seul BC par (fournisseur + jour + acheteur)
    aujourdhui = datetime.date.today()
    fournisseurs_ids = [p.get('fournisseur_id') for p in paniers if p.get('fournisseur_id')]
    if len(set(fournisseurs_ids)) != len(fournisseurs_ids):
        return Response(
            {'detail': 'Deux paniers ont le même fournisseur : impossible de générer.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    deja_generes = BonDeCommande.objects.filter(
        id_acheteur=request.user,
        date_creation=aujourdhui,
        id_fournisseur_id__in=fournisseurs_ids,
    ).values_list('id_fournisseur_id', flat=True)
    if deja_generes:
        return Response(
            {'detail': 'Un bon de commande existe déjà aujourd\'hui pour un fournisseur sélectionné.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    bons = []
    # num_ligne_bc n'est pas auto-incrémenté en base → numérotation manuelle
    next_num_ligne = (LigneBonDeCommande.objects.aggregate(m=models.Max('num_ligne_bc'))['m'] or 0) + 1

    try:
        for panier in paniers:
            fournisseur_id = panier.get('fournisseur_id')
            produits = panier.get('produits', [])
            if not fournisseur_id or not produits:
                continue

            montant = sum(
                float(p.get('prix_unitaire', 0)) * float(p.get('quantite', 0))
                for p in produits
            )

            # id_da est NOT NULL en base : on récupère une demande approuvée
            # qui contient l'un des produits du panier (la 1ère trouvée).
            id_da = panier.get('id_da')
            if not id_da:
                premiere_ligne = (
                    LigneDemandeAchat.objects
                    .filter(id_produit_id__in=[p['produit_id'] for p in produits])
                    .exclude(id_da__statut=DemandeAchat.Statut.REFUSEE)
                    .first()
                )
                id_da = premiere_ligne.id_da_id if premiere_ligne else None

            bc = BonDeCommande.objects.create(
                id_da_id=id_da,
                id_acheteur=request.user,
                id_fournisseur_id=fournisseur_id,
                date_creation=datetime.date.today(),
                montant=montant,
                status=BonDeCommande.Statut.EN_COURS,
            )
            for p in produits:
                LigneBonDeCommande.objects.create(
                    num_ligne_bc=next_num_ligne,
                    id_bc=bc,
                    num_produit_id=p['produit_id'],
                    qte=p['quantite'],
                )
                next_num_ligne += 1
            bons.append(BonDeCommandeSerializer(bc).data)
    except IntegrityError:
        return Response(
            {'detail': 'Un bon de commande existe déjà pour un fournisseur aujourd\'hui.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response({'bons_de_commande': bons}, status=status.HTTP_201_CREATED)


class BonDeCommandeViewSet(viewsets.ModelViewSet):
    """CRUD des bons de commande — chaque acheteur ne voit que les SIENS."""

    serializer_class = BonDeCommandeSerializer

    def get_queryset(self):
        qs = (
            BonDeCommande.objects
            .select_related('id_acheteur', 'id_fournisseur')
            .prefetch_related('lignes__num_produit')
        )
        # L'acheteur ne voit que ses bons ; l'admin voit tout
        if getattr(self.request.user, 'role', None) == 'acheteur':
            qs = qs.filter(id_acheteur=self.request.user)
        return qs
