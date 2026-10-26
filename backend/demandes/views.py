import datetime

from django.db import transaction
from django.db.models import Prefetch
from django.utils import timezone

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from authentication.models import Employe
from commandes.models import BonDeCommande
from config.pagination import OptionalPagination
from notifications.models import Notification
from notifications.utils import notifier_da_assignee, notifier_da_approuvee, notifier_da_refusee

from .models import DemandeAchat, LigneDemandeAchat, LettreRejet
from .serializers import DemandeAchatSerializer


def _refus(detail, code=status.HTTP_403_FORBIDDEN):
    return Response({'detail': detail}, status=code)


class DemandeAchatViewSet(viewsets.ModelViewSet):
    """CRUD des demandes d'achat + changement de statut."""

    serializer_class = DemandeAchatSerializer
    pagination_class = OptionalPagination

    def get_queryset(self):
        qs = (
            DemandeAchat.objects
            .select_related('id_demandeur', 'id_acheteur')
            .prefetch_related(
                'lettres_rejet',
                Prefetch(
                    'bons_commande',
                    queryset=BonDeCommande.objects.select_related('dossier_importation'),
                ),
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
        return qs.order_by('-date_creation', '-id_da')

    # ---------- outils internes ----------

    def _role(self):
        return getattr(self.request.user, 'role', None)

    def _est_demandeur_proprietaire(self, demande):
        return (
            self._role() == Employe.Role.DEMANDEUR
            and demande.id_demandeur_id == self.request.user.pk
        )

    def _creer_lignes(self, demande, lignes_data):
        for ligne in lignes_data:
            try:
                id_produit = ligne['id_produit']
                qte = int(ligne.get('qte', 1))
                prix = float(ligne.get('prix_unit', 0))
            except (KeyError, TypeError, ValueError):
                raise ValidationError({'detail': 'Une ligne de la demande est invalide.'})
            if qte < 1 or prix < 0:
                raise ValidationError({'detail': 'Quantité ou prix invalide sur une ligne.'})
            LigneDemandeAchat.objects.create(
                id_da=demande,
                id_produit_id=id_produit,
                designation=ligne.get('designation', ''),
                qte=qte,
                prix_unit=prix,
            )

    # ---------- CRUD ----------

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Crée la DA + ses lignes (tout ou rien)."""
        if self._role() != Employe.Role.DEMANDEUR:
            return _refus("Seul un demandeur peut créer une demande.")

        data = request.data.copy()
        lignes_data = data.pop('lignes', [])
        if not lignes_data:
            return _refus(
                'Une demande doit contenir au moins une ligne de produit.',
                status.HTTP_400_BAD_REQUEST,
            )

        annee = datetime.date.today().year
        dernier = (
            DemandeAchat.objects
            .filter(numero_da__startswith=f'DA-{annee}-')
            .order_by('-id_da')
            .first()
        )
        dernier_num = int(dernier.numero_da.split('-')[-1]) if dernier else 0
        numero_da = f'DA-{annee}-{dernier_num + 1:04d}'

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        demande = serializer.save(
            id_demandeur=request.user,
            date_creation=datetime.date.today(),
            numero_da=numero_da,
        )
        self._creer_lignes(demande, lignes_data)

        # Notifie le chef du département du demandeur, s'il existe
        chef = None
        if demande.id_demandeur.id_departement:
            chef = demande.id_demandeur.id_departement.id_chef
        if chef:
            Notification.objects.create(
                destinataire=chef,
                demande=demande,
                type=Notification.Type.DA_ASSIGNEE,
                titre="Nouvelle demande d'achat",
                message=f'Une nouvelle demande {demande.numero_da} a été créée par {demande.id_demandeur.full_name}.',
            )

        return Response(self.get_serializer(demande).data, status=status.HTTP_201_CREATED)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        """Modifie la DA + remplace ses lignes (tout ou rien)."""
        partial = kwargs.pop('partial', False)
        demande = self.get_object()

        if not self._est_demandeur_proprietaire(demande):
            return _refus("Seul le demandeur peut modifier sa demande.")
        if demande.id_acheteur_id is not None or demande.statut != DemandeAchat.Statut.EN_COURS:
            return _refus(
                'Cette demande est déjà en cours de traitement, modification impossible.',
                status.HTTP_400_BAD_REQUEST,
            )

        data = request.data.copy()
        lignes_data = data.pop('lignes', None)
        if lignes_data is not None and not lignes_data:
            return _refus(
                'Une demande doit contenir au moins une ligne de produit.',
                status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(demande, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        demande = serializer.save()

        if lignes_data is not None:
            demande.lignes.all().delete()
            self._creer_lignes(demande, lignes_data)

        return Response(self.get_serializer(demande).data)

    def destroy(self, request, *args, **kwargs):
        demande = self.get_object()
        if not self._est_demandeur_proprietaire(demande):
            return _refus("Seul le demandeur peut supprimer sa demande.")
        if demande.id_acheteur_id is not None or demande.statut != DemandeAchat.Statut.EN_COURS:
            return _refus(
                'Une demande déjà prise en charge ne peut plus être supprimée.',
                status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)

    # ---------- actions métier ----------

    @action(detail=True, methods=['post'])
    def assigner_acheteur(self, request, pk=None):
        """POST /api/demandes/{pk}/assigner_acheteur/  { acheteur_id }"""
        demande = self.get_object()

        departement = demande.id_demandeur.id_departement
        chef = departement.id_chef if departement else None
        if self._role() != Employe.Role.CHEF_DEPARTEMENT or chef is None or chef.pk != request.user.pk:
            return _refus("Seul le chef du département du demandeur peut assigner un acheteur.")
        if demande.statut != DemandeAchat.Statut.EN_COURS:
            return _refus('Cette demande est déjà traitée.', status.HTTP_400_BAD_REQUEST)

        acheteur_id = request.data.get('acheteur_id')
        if not acheteur_id:
            return _refus('Veuillez choisir un acheteur.', status.HTTP_400_BAD_REQUEST)

        acheteur = Employe.objects.filter(
            id_emp=acheteur_id,
            role=Employe.Role.ACHETEUR,
            etat=Employe.Etat.ACTIF,
        ).first()
        if not acheteur:
            return _refus("Employé introuvable ou n'est pas un acheteur actif.", status.HTTP_400_BAD_REQUEST)

        if demande.id_acheteur_id == acheteur.pk:
            return Response(self.get_serializer(demande).data)

        demande.id_acheteur = acheteur
        demande.date_assignation = timezone.now()
        demande.save()
        demande.refresh_from_db()

        notifier_da_assignee(demande)
        Notification.objects.create(
            destinataire=acheteur,
            demande=demande,
            type=Notification.Type.DA_ASSIGNEE,
            titre='Nouvelle demande assignée',
            message=f'La demande {demande.numero_da} vous a été assignée.',
        )

        return Response(self.get_serializer(demande).data)

    def _controle_decision_acheteur(self, demande):
        """Renvoie une Response d'erreur, ou None si l'acheteur peut décider."""
        if self._role() != Employe.Role.ACHETEUR or demande.id_acheteur_id != self.request.user.pk:
            return _refus("Seul l'acheteur assigné peut décider de cette demande.")
        if demande.statut != DemandeAchat.Statut.EN_COURS:
            return _refus('Cette demande a déjà été traitée.', status.HTTP_400_BAD_REQUEST)
        return None

    @action(detail=True, methods=['post'])
    def accepter(self, request, pk=None):
        demande = self.get_object()
        erreur = self._controle_decision_acheteur(demande)
        if erreur:
            return erreur

        demande.statut = DemandeAchat.Statut.APPROUVEE
        demande.date_approbation = datetime.date.today()
        demande.save()

        notifier_da_approuvee(demande)
        return Response(self.get_serializer(demande).data)

    @action(detail=True, methods=['post'])
    def rejeter(self, request, pk=None):
        demande = self.get_object()
        erreur = self._controle_decision_acheteur(demande)
        if erreur:
            return erreur

        motif = (request.data.get('motif') or '').strip()
        if not motif:
            return _refus('Le motif du refus est obligatoire.', status.HTTP_400_BAD_REQUEST)
        if len(motif) > 500:
            return _refus('Le motif ne doit pas dépasser 500 caractères.', status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
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

        notifier_da_refusee(demande, motif)
        return Response(self.get_serializer(demande).data)