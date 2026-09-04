import datetime

from django.db import models
from django.db.utils import IntegrityError
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from demandes.models import DemandeAchat, LigneDemandeAchat
from .models import BonDeCommande, LigneBonDeCommande, DossierImportation
from .serializers import BonDeCommandeSerializer, DossierImportationSerializer
from authentication.models import Employe


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

            DossierImportation.objects.create(id_bc=bc, statut=DossierImportation.Statut.A_TRAITER)
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
    """CRUD des bons de commande."""

    serializer_class = BonDeCommandeSerializer

    def get_queryset(self):
        qs = (
            BonDeCommande.objects
            .select_related('id_acheteur', 'id_fournisseur')
            .prefetch_related('lignes__num_produit')
        )

        user = self.request.user

        # L'acheteur voit uniquement ses propres BC
        if getattr(user, 'role', None) == 'acheteur':
            qs = qs.filter(id_acheteur=user)

        # Le transitaire voit uniquement les BC
        # dont le dossier d'importation lui est assigné
        elif getattr(user, 'role', None) == 'transitaire':
            qs = qs.filter(
                dossier_importation__id_transitaire=user
            )

        return qs


class DossierImportationViewSet(viewsets.ModelViewSet):
    """
    Gestion des dossiers d'importation.

    - Acheteur : voit les dossiers liés à ses BC.
    - Transitaire : voit uniquement les dossiers qui lui sont assignés.
    """

    serializer_class = DossierImportationSerializer

    def get_queryset(self):
        qs = (
            DossierImportation.objects
            .select_related(
                'id_bc__id_fournisseur',
                'id_bc__id_acheteur',
                'id_transitaire',
            )
        )

        user = self.request.user

        # Transitaire :
        # uniquement les dossiers qui lui sont assignés
        if getattr(user, 'role', None) == 'transitaire':
            qs = qs.filter(id_transitaire=user)

        # Acheteur :
        # uniquement les dossiers de ses propres BC
        elif getattr(user, 'role', None) == 'acheteur':
            qs = qs.filter(id_bc__id_acheteur=user)

        return qs

    @action(detail=True, methods=['post'])
    def assigner_transitaire(self, request, pk=None):
        """
        L'acheteur propriétaire du BC assigne un transitaire.
        """

        dossier = self.get_object()

        # Vérification : seul l'acheteur propriétaire peut assigner
        if (
            getattr(request.user, 'role', None) != 'acheteur'
            or dossier.id_bc.id_acheteur_id != request.user.id_emp
        ):
            return Response(
                {
                    'detail':
                    "Vous n'êtes pas autorisé à assigner ce dossier."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        transitaire_id = request.data.get('transitaire_id')

        if not transitaire_id:
            return Response(
                {
                    'detail':
                    'Veuillez choisir un transitaire.'
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        transitaire = Employe.objects.filter(
            id_emp=transitaire_id,
            role=Employe.Role.TRANSITAIRE,
            etat=Employe.Etat.ACTIF,
        ).first()

        if not transitaire:
            return Response(
                {
                    'detail':
                    "Employé introuvable ou n'est pas un transitaire actif."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        dossier.id_transitaire = transitaire

        # Dès qu'un transitaire est assigné,
        # le dossier passe de "à traiter" à "en cours".
        if dossier.statut == DossierImportation.Statut.A_TRAITER:
            dossier.statut = DossierImportation.Statut.EN_COURS

        dossier.save()

        return Response(
            self.get_serializer(dossier).data
        )

    @action(detail=True, methods=['post'])
    def valider_reception(self, request, pk=None):
        """
        Marque le dossier comme livré.
        La date de réception réelle est la date du jour.
        """

        dossier = self.get_object()

        # Seul le transitaire assigné peut valider la réception
        if (
            getattr(request.user, 'role', None) != 'transitaire'
            or dossier.id_transitaire_id != request.user.id_emp
        ):
            return Response(
                {
                    'detail':
                    "Vous n'êtes pas autorisé à valider cette réception."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        dossier.date_reception_reelle = datetime.date.today()
        dossier.statut = DossierImportation.Statut.LIVRE

        dossier.save()

        return Response(
            self.get_serializer(dossier).data
        )