from django.db.models import Q
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from authentication.models import Employe
from config.pagination import OptionalPagination

from .models import DossierImportation, Reception
from .reception import ReceptionInvalide, enregistrer_reception, solde_lignes
from .serializers_reception import ReceptionSerializer

Statut = DossierImportation.Statut
Controle = DossierImportation.StatutControle


def _erreur(detail, code=status.HTTP_400_BAD_REQUEST):
    return Response({'detail': detail}, status=code)


class ReceptionViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """Réceptions de marchandise par ligne de bon de commande.

    GET  /api/receptions/?dossier=<id>   historique
    GET  /api/receptions/a-recevoir/     dossiers que le transitaire peut réceptionner
    POST /api/receptions/                { id_dossier, lignes: [{num_ligne_bc, quantite, reserve?}], remarque? }"""

    serializer_class = ReceptionSerializer
    pagination_class = OptionalPagination

    def get_queryset(self):
        qs = (
            Reception.objects
            .select_related('id_dossier__id_bc', 'id_transitaire')
            .prefetch_related('lignes__ligne_bc__num_produit')
        )
        user = self.request.user
        role = getattr(user, 'role', None)
        if role == Employe.Role.TRANSITAIRE:
            qs = qs.filter(id_dossier__id_transitaire=user)
        elif role == Employe.Role.ACHETEUR:
            qs = qs.filter(id_dossier__id_bc__id_acheteur=user)
        elif role == Employe.Role.CHEF_DEPARTEMENT:
            qs = qs.filter(id_dossier__id_bc__id_da__id_demandeur__id_departement__id_chef=user)
        elif role in (Employe.Role.ADMIN, Employe.Role.DIRECTEUR, Employe.Role.CONTROLEUR):
            pass
        else:
            qs = qs.none()

        dossier = self.request.query_params.get('dossier')
        if dossier and str(dossier).isdigit():
            qs = qs.filter(id_dossier=int(dossier))
        return qs

    def _est_transitaire(self):
        return getattr(self.request.user, 'role', None) == Employe.Role.TRANSITAIRE

    def create(self, request, *args, **kwargs):
        if not self._est_transitaire():
            return _erreur("Seul le transitaire assigné peut enregistrer une réception.",
                           status.HTTP_403_FORBIDDEN)
        id_dossier = request.data.get('id_dossier')
        if not str(id_dossier or '').isdigit():
            return _erreur('Dossier invalide.')
        dossier = DossierImportation.objects.filter(
            pk=int(id_dossier), id_transitaire=request.user
        ).first()
        if dossier is None:
            return _erreur('Dossier introuvable.', status.HTTP_404_NOT_FOUND)

        try:
            dossier, complet = enregistrer_reception(
                dossier.pk, request.user,
                request.data.get('lignes'), request.data.get('remarque'),
            )
        except ReceptionInvalide as erreur:
            return _erreur(str(erreur))

        return Response(
            {
                'detail': 'Réception complète : dossier livré.' if complet else 'Réception partielle enregistrée.',
                'complet': complet,
                'lignes': solde_lignes(dossier),
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=['get'], url_path='a-recevoir')
    def a_recevoir(self, request):
        if not self._est_transitaire():
            return _erreur("Réservé au transitaire.", status.HTTP_403_FORBIDDEN)
        dossiers = (
            DossierImportation.objects
            .filter(id_transitaire=request.user, statut=Statut.EN_COURS,
                    statut_controle=Controle.VALIDE)
            .select_related('id_bc__id_fournisseur')
            .order_by('date_livraison_prevue', 'id_dossier')
        )
        resultat = []
        for dossier in dossiers:
            lignes = solde_lignes(dossier)
            if not lignes:
                continue
            bloque = None
            if dossier.autorisation_necessaire and not dossier.autorisation_obtenue:
                bloque = "Autorisation nécessaire non obtenue"
            resultat.append({
                'id_dossier': dossier.pk,
                'bc_reference': dossier.id_bc.reference,
                'fournisseur_nom': dossier.id_bc.id_fournisseur.nom_fournisseur,
                'date_livraison_prevue': dossier.date_livraison_prevue,
                'bloque': bloque,
                'lignes': lignes,
            })
        return Response(resultat)
