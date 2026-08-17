import datetime

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import DemandeAchat, LigneDemandeAchat, LettreRejet
from .serializers import DemandeAchatSerializer


class DemandeAchatViewSet(viewsets.ModelViewSet):
    """CRUD des demandes d'achat + changement de statut."""

    serializer_class = DemandeAchatSerializer

    def get_queryset(self):
        qs = DemandeAchat.objects.select_related('id_demandeur').prefetch_related('lignes__id_produit')
        role = getattr(self.request.user, 'role', None)
        if role == 'acheteur':
            qs = qs.filter(id_acheteur=self.request.user)
        elif role == 'demandeur':
            qs = qs.filter(id_demandeur=self.request.user)
        statut = self.request.query_params.get('statut')
        if statut:
            qs = qs.filter(statut=statut)
        return qs

    def create(self, request, *args, **kwargs):
        """Crée la DA + ses lignes.
        Body : { numero_da, dot, objet, lignes: [{id_produit, designation, qte, prix_unit}] }
        """
        data = request.data
        lignes_data = data.pop('lignes', [])
        data['id_demandeur'] = request.user.id_emp
        data['date_creation'] = data.get('date_creation', datetime.date.today())

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        demande = serializer.save()

        for ligne in lignes_data:
            LigneDemandeAchat.objects.create(
                id_da=demande,
                id_produit_id=ligne['id_produit'],
                designation=ligne.get('designation', ''),
                qte=ligne.get('qte', 1),
                prix_unit=ligne.get('prix_unit', 0),
            )
        return Response(self.get_serializer(demande).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def assigner_acheteur(self, request, pk=None):
        """POST /api/demandes/{pk}/assigner_acheteur/  { acheteur_id }"""
        demande = self.get_object()
        acheteur_id = request.data.get('acheteur_id')
        if not acheteur_id:
            return Response(
                {'detail': 'Veuillez choisir un acheteur.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        demande.id_acheteur_id = acheteur_id
        demande.save()
        return Response(self.get_serializer(demande).data)

    @action(detail=True, methods=['post'])
    def accepter(self, request, pk=None):
        demande = self.get_object()
        demande.statut = DemandeAchat.Statut.APPROUVEE
        demande.save()
        return Response(self.get_serializer(demande).data)

    @action(detail=True, methods=['post'])
    def rejeter(self, request, pk=None):
        demande = self.get_object()
        motif = request.data.get('motif', '')
        if motif:
            LettreRejet.objects.update_or_create(
                id_da=demande,
                defaults={
                    'id_acheteur': request.user,
                    'date_rej': datetime.date.today(),
                    'motif': motif,
                },
            )
        demande.statut = DemandeAchat.Statut.REFUSEE
        demande.save()
        return Response(self.get_serializer(demande).data)
