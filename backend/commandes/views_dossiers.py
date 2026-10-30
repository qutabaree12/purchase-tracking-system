import datetime

from django.db import transaction
from django.db.models import Q
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from authentication.models import Employe
from config.pagination import OptionalPagination
from notifications.utils import (
    notifier_controle_decision,
    notifier_dossier_a_verifier,
    notifier_dossier_assigne,
    notifier_dossier_mis_a_jour,
    notifier_reception_validee,
)

from .models import DossierImportation
from .serializers import DossierImportationSerializer

Statut = DossierImportation.Statut
Controle = DossierImportation.StatutControle


def _erreur(detail, code=status.HTTP_400_BAD_REQUEST):
    return Response({'detail': detail}, status=code)


class DossierImportationViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """Dossiers d'importation : pas de création ni de suppression par l'API.

    Circuit : acheteur assigne un transitaire -> le transitaire renseigne le dossier
    -> le contrôleur valide (lettre de crédit) ou refuse -> le transitaire valide
    la réception."""

    serializer_class = DossierImportationSerializer
    pagination_class = OptionalPagination
    http_method_names = ['get', 'patch', 'post', 'head', 'options']

    def get_queryset(self):
        qs = DossierImportation.objects.select_related(
            'id_bc__id_fournisseur',
            'id_bc__id_acheteur',
            'id_bc__id_da',
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
        elif role == Employe.Role.CONTROLEUR:
            # Le contrôleur ne voit que les dossiers que le transitaire a renseignés
            # (transitaire assigné + mode, lieu et date prévue). `__gt=''` écarte
            # à la fois les valeurs vides et NULL. Les anciens dossiers déjà livrés,
            # antérieurs au contrôle, sont masqués.
            qs = (
                qs.filter(
                    id_transitaire__isnull=False,
                    mode_expedition__gt='',
                    lieu_chargement__gt='',
                    date_livraison_prevue__isnull=False,
                )
                .exclude(Q(statut=Statut.LIVRE) & Q(statut_controle=Controle.A_VERIFIER))
            )
        elif role in (Employe.Role.ADMIN, Employe.Role.DIRECTEUR):
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

    # ------------------------------------------------------------------
    # Le transitaire renseigne son dossier
    # ------------------------------------------------------------------

    def update(self, request, *args, **kwargs):
        dossier = self.get_object()
        refus = self._refus_si_pas_transitaire_assigne(
            dossier, "Seul le transitaire assigné peut modifier ce dossier."
        )
        if refus:
            return refus
        if dossier.statut == Statut.LIVRE:
            return _erreur("Ce dossier est livré : il n'est plus modifiable.")
        if dossier.statut_controle == Controle.VALIDE:
            return _erreur(
                "Ce dossier a été validé par le contrôleur : il n'est plus modifiable."
            )
        return super().update(request, *args, **kwargs)

    def perform_update(self, serializer):
        etait_pret = serializer.instance.pret_pour_controle
        etait_refuse = serializer.instance.statut_controle == Controle.REFUSE

        # Un dossier refusé, une fois corrigé, repart automatiquement en vérification.
        extra = {'statut_controle': Controle.A_VERIFIER} if etait_refuse else {}
        dossier = serializer.save(**extra)

        notifier_dossier_mis_a_jour(dossier)
        if dossier.pret_pour_controle and (not etait_pret or etait_refuse):
            notifier_dossier_a_verifier(dossier)

    # ------------------------------------------------------------------
    # L'acheteur assigne le transitaire
    # ------------------------------------------------------------------

    @action(detail=True, methods=['post'])
    def assigner_transitaire(self, request, pk=None):
        dossier = self.get_object()

        if (
            getattr(request.user, 'role', None) != Employe.Role.ACHETEUR
            or dossier.id_bc.id_acheteur_id != request.user.id_emp
        ):
            return _erreur("Vous n'êtes pas autorisé à assigner ce dossier.", status.HTTP_403_FORBIDDEN)

        if dossier.statut == Statut.LIVRE:
            return _erreur("Ce dossier est déjà livré : réassignation impossible.")
        if dossier.statut_controle == Controle.VALIDE:
            return _erreur("Ce dossier est validé par le contrôleur : réassignation impossible.")

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
        if dossier.statut == Statut.A_TRAITER:
            dossier.statut = Statut.EN_COURS
        dossier.save()

        if transitaire_a_change:
            notifier_dossier_assigne(dossier)

        return Response(self.get_serializer(dossier).data, status=status.HTTP_200_OK)

    # ------------------------------------------------------------------
    # Le contrôleur décide
    # ------------------------------------------------------------------

    @action(detail=True, methods=['post'])
    def verifier_controleur(self, request, pk=None):
        dossier = self.get_object()

        if getattr(request.user, 'role', None) != Employe.Role.CONTROLEUR:
            return _erreur(
                "Seul le contrôleur peut effectuer cette vérification.",
                status.HTTP_403_FORBIDDEN,
            )

        decision = request.data.get('decision')
        commentaire = str(request.data.get('commentaire') or '').strip()

        if decision not in ('valide', 'refuse'):
            return _erreur("La décision doit être 'valide' ou 'refuse'.")
        if decision == 'refuse' and not commentaire:
            return _erreur("Un commentaire est obligatoire en cas de refus.")
        if len(commentaire) > 1000:
            return _erreur("Le commentaire ne doit pas dépasser 1000 caractères.")

        numero_lc = banque_lc = ''
        date_lc = None
        if decision == 'valide':
            numero_lc = str(request.data.get('numero_lc') or '').strip()
            banque_lc = str(request.data.get('banque_lc') or '').strip()
            brut = str(request.data.get('date_lc') or '').strip()
            if not numero_lc or not banque_lc or not brut:
                return _erreur(
                    "Pour valider le dossier, renseignez le numéro, "
                    "la banque et la date de la lettre de crédit."
                )
            if len(numero_lc) > 100 or len(banque_lc) > 200:
                return _erreur("Numéro ou nom de banque trop long.")
            try:
                date_lc = datetime.date.fromisoformat(brut)
            except ValueError:
                return _erreur("La date de la lettre de crédit est invalide (format AAAA-MM-JJ).")
            if date_lc > datetime.date.today():
                return _erreur("La date de la lettre de crédit ne peut pas être dans le futur.")

        with transaction.atomic():
            # Verrou : deux décisions simultanées ne peuvent pas passer ensemble.
            dossier = DossierImportation.objects.select_for_update().get(pk=dossier.pk)

            if dossier.statut != Statut.EN_COURS:
                return _erreur("Seul un dossier en cours peut être vérifié.")
            if dossier.statut_controle != Controle.A_VERIFIER:
                return _erreur("Ce dossier a déjà fait l'objet d'une décision du contrôleur.")
            if not dossier.pret_pour_controle:
                return _erreur(
                    "Le dossier n'est pas complet : le transitaire doit renseigner "
                    "le mode d'expédition, le lieu de chargement et la date de livraison prévue."
                )

            dossier.statut_controle = decision
            dossier.commentaire_controle = commentaire
            dossier.date_controle = datetime.date.today()
            dossier.numero_lc = numero_lc
            dossier.banque_lc = banque_lc
            dossier.date_lc = date_lc
            dossier.save(update_fields=[
                'statut_controle',
                'commentaire_controle',
                'date_controle',
                'numero_lc',
                'banque_lc',
                'date_lc',
            ])
            notifier_controle_decision(dossier)

        return Response(self.get_serializer(dossier).data, status=status.HTTP_200_OK)

    # ------------------------------------------------------------------
    # Le transitaire valide la réception
    # ------------------------------------------------------------------

    @action(detail=True, methods=['post'])
    def valider_reception(self, request, pk=None):
        dossier = self.get_object()
        refus = self._refus_si_pas_transitaire_assigne(
            dossier, "Vous n'êtes pas autorisé à valider cette réception."
        )
        if refus:
            return refus

        with transaction.atomic():
            dossier = DossierImportation.objects.select_for_update().get(pk=dossier.pk)

            if dossier.statut == Statut.LIVRE:
                return _erreur('La réception de ce dossier a déjà été validée.')
            if dossier.statut != Statut.EN_COURS:
                return _erreur("Le dossier doit être en cours pour valider la réception.")
            if dossier.statut_controle != Controle.VALIDE:
                return _erreur(
                    "Le contrôle du dossier doit être validé avant "
                    "de poursuivre le processus."
                )
            if dossier.autorisation_necessaire and not dossier.autorisation_obtenue:
                return _erreur("Une autorisation est nécessaire et n'a pas encore été obtenue.")

            dossier.date_reception_reelle = datetime.date.today()
            dossier.statut = Statut.LIVRE
            dossier.save(update_fields=['date_reception_reelle', 'statut'])
            notifier_reception_validee(dossier)

        return Response(self.get_serializer(dossier).data, status=status.HTTP_200_OK)
