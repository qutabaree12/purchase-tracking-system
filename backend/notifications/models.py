from django.db import models

from authentication.models import Employe
from demandes.models import DemandeAchat


class Notification(models.Model):

    class Type(models.TextChoices):
        DA_ASSIGNEE = 'da_assignee', 'DA assignée'
        DA_APPROUVEE = 'da_approuvee', 'DA approuvée'
        DA_REFUSEE = 'da_refusee', 'DA refusée'

        BC_DISPONIBLE = 'bc_disponible', 'BC disponible'
        BC_PRIS_EN_CHARGE = 'bc_pris_en_charge', 'BC pris en charge'

        LC_CREEE = 'lc_creee', 'Lettre de crédit créée'
        DEDOUANEMENT = 'dedouanement', 'Dédouanement'
        LIVRAISON = 'livraison', 'Livraison'

    id_notification = models.BigAutoField(primary_key=True)

    destinataire = models.ForeignKey(
        Employe,
        on_delete=models.CASCADE,
        related_name='notifications',
    )

    demande = models.ForeignKey(
        DemandeAchat,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications',
    )

    type = models.CharField(
        max_length=30,
        choices=Type.choices,
    )

    titre = models.CharField(max_length=255)

    message = models.CharField(max_length=500)

    lu = models.BooleanField(default=False)

    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_creation']


    #str : afficher le titre et non pas le nom
    def __str__(self):
        return self.titre