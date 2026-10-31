import os

from django.http import FileResponse
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from authentication.models import Employe

from .models import DocumentDossier, DossierImportation
from .views_dossiers import DossierImportationViewSet

Statut = DossierImportation.Statut
Controle = DossierImportation.StatutControle

TAILLE_MAX = 5 * 1024 * 1024
MAX_DOCUMENTS = 30
SIGNATURES = {
    '.pdf': (b'%PDF',),
    '.png': (b'\x89PNG',),
    '.jpg': (b'\xff\xd8\xff',),
    '.jpeg': (b'\xff\xd8\xff',),
}


def _erreur(detail, code=status.HTTP_400_BAD_REQUEST):
    return Response({'detail': detail}, status=code)


class DocumentDossierSerializer(serializers.ModelSerializer):
    type_label = serializers.CharField(source='get_type_display', read_only=True)
    depose_par_nom = serializers.CharField(source='id_depose_par.full_name', read_only=True)
    taille = serializers.SerializerMethodField()

    class Meta:
        model = DocumentDossier
        fields = [
            'id_document', 'id_dossier', 'type', 'type_label',
            'nom_fichier', 'date_depot', 'depose_par_nom', 'taille',
        ]
        read_only_fields = fields

    def get_taille(self, obj):
        try:
            return obj.fichier.size
        except (OSError, ValueError):
            return None


class DocumentDossierViewSet(viewsets.GenericViewSet):
    """Pièces justificatives des dossiers d'importation.
    Dépôt et suppression : transitaire assigné, tant que le dossier n'est ni validé ni livré."""

    serializer_class = DocumentDossierSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def _dossiers_visibles(self):
        # Mêmes règles de visibilité que l'API des dossiers.
        vue = DossierImportationViewSet()
        vue.request = self.request
        vue.kwargs = {}
        vue.action = 'list'
        return vue.get_queryset()

    def get_queryset(self):
        return (
            DocumentDossier.objects
            .filter(id_dossier__in=self._dossiers_visibles())
            .select_related('id_depose_par')
            .order_by('-date_depot')
        )

    def _refus_modification(self, dossier):
        user = self.request.user
        if (
            getattr(user, 'role', None) != Employe.Role.TRANSITAIRE
            or dossier.id_transitaire_id != user.id_emp
        ):
            return _erreur(
                "Seul le transitaire assigné peut gérer les pièces de ce dossier.",
                status.HTTP_403_FORBIDDEN,
            )
        if dossier.statut == Statut.LIVRE:
            return _erreur("Ce dossier est livré : ses pièces ne sont plus modifiables.")
        if dossier.statut_controle == Controle.VALIDE:
            return _erreur("Ce dossier est validé par le contrôleur : ses pièces ne sont plus modifiables.")
        return None

    def list(self, request):
        qs = self.get_queryset()
        dossier = request.query_params.get('dossier')
        if dossier:
            try:
                qs = qs.filter(id_dossier=int(dossier))
            except ValueError:
                return _erreur('Dossier invalide.')
        return Response(self.get_serializer(qs, many=True).data)

    def create(self, request):
        try:
            dossier_id = int(request.data.get('dossier'))
        except (TypeError, ValueError):
            return _erreur('Dossier invalide.')

        dossier = self._dossiers_visibles().filter(pk=dossier_id).first()
        if dossier is None:
            return _erreur('Dossier introuvable.', status.HTTP_404_NOT_FOUND)

        refus = self._refus_modification(dossier)
        if refus:
            return refus

        type_doc = request.data.get('type')
        if type_doc not in DocumentDossier.Type.values:
            return _erreur('Type de pièce invalide.')

        fichier = request.FILES.get('fichier')
        if not fichier:
            return _erreur('Aucun fichier envoyé.')

        extension = os.path.splitext(fichier.name)[1].lower()
        if extension not in SIGNATURES:
            return _erreur('Format refusé : seuls PDF, PNG et JPG sont acceptés.')
        if fichier.size > TAILLE_MAX:
            return _erreur('Fichier trop volumineux (5 Mo maximum).')

        debut = fichier.read(8)
        fichier.seek(0)
        if not debut.startswith(SIGNATURES[extension]):
            return _erreur("Le contenu du fichier ne correspond pas à son format.")

        if dossier.documents.count() >= MAX_DOCUMENTS:
            return _erreur(f'Limite de {MAX_DOCUMENTS} pièces atteinte pour ce dossier.')

        document = DocumentDossier.objects.create(
            id_dossier=dossier,
            type=type_doc,
            fichier=fichier,
            nom_fichier=os.path.basename(fichier.name)[:255],
            id_depose_par=request.user,
        )
        return Response(self.get_serializer(document).data, status=status.HTTP_201_CREATED)

    def destroy(self, request, pk=None):
        document = self.get_object()
        refus = self._refus_modification(document.id_dossier)
        if refus:
            return refus
        document.fichier.delete(save=False)
        document.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get'])
    def telecharger(self, request, pk=None):
        document = self.get_object()
        try:
            return FileResponse(
                document.fichier.open('rb'),
                as_attachment=True,
                filename=document.nom_fichier,
            )
        except (FileNotFoundError, OSError, ValueError):
            return _erreur('Fichier introuvable sur le serveur.', status.HTTP_404_NOT_FOUND)
