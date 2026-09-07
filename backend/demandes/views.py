import datetime
from django.utils import timezone  # NOUVEAU
from django.db.models import Prefetch

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from authentication.models import Employe

from .models import DemandeAchat, LigneDemandeAchat, LettreRejet
from .serializers import DemandeAchatSerializer
from config.pagination import OptionalPagination
from notifications.models import Notification
from notifications.utils import notifier_da_assignee, notifier_da_approuvee, notifier_da_refusee  # NOUVEAU


class DemandeAchatViewSet(viewsets.ModelViewSet):
    """CRUD des demandes d'achat + changement de statut."""

    serializer_class = DemandeAchatSerializer
    pagination_class = OptionalPagination

    def get_queryset(self):
        # OPTIMISATION : précharge tout (demandeur, acheteur, lignes + produit +
        # fournisseur, BC, lettres de rejet) pour éviter les requêtes N+1.
        qs = (
            DemandeAchat.objects
            .select_related('id_demandeur', 'id_acheteur')
            .prefetch_related(
                'bons_commande',
                'lettres_rejet',
                Prefetch(
                    'lignes',
                    queryset=LigneDemandeAchat.objects.select_related(
                        'id_produit__id_fournisseur'
                    ),
                ),
            )
        )
        role = getattr(self.request.user, 'role', None)
        if role == 'acheteur':
            qs = qs.filter(id_acheteur=self.request.user)
        elif role == 'demandeur':
            qs = qs.filter(id_demandeur=self.request.user)
        elif role == 'chef département':
            qs = qs.filter(id_demandeur__id_departement__id_chef=self.request.user)
        statut = self.request.query_params.get('statut')
        if statut:
            qs = qs.filter(statut=statut)
        # Tri stable : requis pour une pagination cohérente (UnorderedObjectList)
        return qs.order_by('-date_creation', '-id_da')

    def create(self, request, *args, **kwargs):
        """Crée la DA + ses lignes."""
        data = request.data
        lignes_data = data.pop('lignes', [])

        if not lignes_data:
            return Response(
                {'detail': 'Une demande doit contenir au moins une ligne de produit.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data['id_demandeur'] = request.user.id_emp
        data['date_creation'] = datetime.date.today()

        if not data.get('numero_da'):
            annee = datetime.date.today().year
            dernier = DemandeAchat.objects.filter(numero_da__startswith=f'DA-{annee}-').order_by('-id_da').first()
            if dernier:
                dernier_num = int(dernier.numero_da.split('-')[-1])
            else:
                dernier_num = 0
            data['numero_da'] = f'DA-{annee}-{dernier_num + 1:04d}'

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

        # NOUVEAU : notifie le chef du département du demandeur, s'il existe
        chef = None
        if demande.id_demandeur.id_departement:
            chef = demande.id_demandeur.id_departement.id_chef
        if chef:
            Notification.objects.create(
                destinataire=chef,
                demande=demande,
                type=Notification.Type.DA_ASSIGNEE,  # réutilise le type existant, voir note ci-dessous
                titre='Nouvelle demande d\'achat',
                message=f'Une nouvelle demande {demande.numero_da} a été créée par {demande.id_demandeur.full_name}.',
            )

        return Response(self.get_serializer(demande).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Modifie la DA + remplace ses lignes."""
        partial = kwargs.pop('partial', False)
        demande = self.get_object()

        if demande.id_acheteur_id is not None:
            return Response(
                {'detail': 'Cette demande est déjà en cours de traitement, modification impossible.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = request.data
        lignes_data = data.pop('lignes', None)
        data.pop('date_creation', None)

        serializer = self.get_serializer(demande, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        demande = serializer.save()

        if lignes_data is not None:
            if not lignes_data:
                return Response(
                    {'detail': 'Une demande doit contenir au moins une ligne de produit.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            demande.lignes.all().delete()
            for ligne in lignes_data:
                LigneDemandeAchat.objects.create(
                    id_da=demande,
                    id_produit_id=ligne['id_produit'],
                    designation=ligne.get('designation', ''),
                    qte=ligne.get('qte', 1),
                    prix_unit=ligne.get('prix_unit', 0),
                )

        return Response(self.get_serializer(demande).data)

    @action(detail=True, methods=['post'])
    def assigner_acheteur(self, request, pk=None):
        """POST /api/demandes/{pk}/assigner_acheteur/  { acheteur_id }"""
        demande = self.get_object()

        # NOUVEAU : évite de re-notifier si l'acheteur est déjà le même (double-clic residuel)
        acheteur_id = request.data.get('acheteur_id')
        if not acheteur_id:
            return Response(
                {'detail': 'Veuillez choisir un acheteur.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if str(demande.id_acheteur_id) == str(acheteur_id):
            return Response(self.get_serializer(demande).data)

        demande.id_acheteur_id = acheteur_id
        demande.date_assignation = timezone.now()  # CHANGÉ : timezone.now() au lieu de datetime.datetime.now()
        demande.save()
        demande.refresh_from_db()

        # CHANGÉ : utilise l'utilitaire existant (demandeur) + ajoute la notif acheteur
        notifier_da_assignee(demande)

        acheteur = Employe.objects.get(id_emp=acheteur_id)
        Notification.objects.create(
            destinataire=acheteur,
            demande=demande,
            type=Notification.Type.DA_ASSIGNEE,
            titre='Nouvelle demande assignée',
            message=f'La demande {demande.numero_da} vous a été assignée.',
        )

        return Response(self.get_serializer(demande).data)

    @action(detail=True, methods=['post'])
    def accepter(self, request, pk=None):
        demande = self.get_object()
        demande.statut = DemandeAchat.Statut.APPROUVEE
        demande.date_approbation = datetime.date.today()
        demande.save()

        notifier_da_approuvee(demande)  # NOUVEAU

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
        demande.date_rejet = datetime.date.today()
        demande.save()

        notifier_da_refusee(demande, motif)  # CHANGÉ : utilise l'utilitaire au lieu du code dupliqué

        return Response(self.get_serializer(demande).data)