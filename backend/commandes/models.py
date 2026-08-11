from django.db import models

from authentication.models import Employe
from produits.models import Fournisseur, Produit
from demandes.models import DemandeAchat


class BonDeCommande(models.Model):
    """Bon de commande (table Supabase `BonDeCommande`)."""

    class Statut(models.TextChoices):
        EN_COURS = 'en cours', 'En cours'
        ANNULE = 'annulé', 'Annulé'

    id_bc = models.BigAutoField(primary_key=True)
    id_da = models.ForeignKey(
        DemandeAchat,
        on_delete=models.SET_NULL,
        db_column='id_da',
        null=True,
        blank=True,
        related_name='bons_commande',
    )
    id_acheteur = models.ForeignKey(
        Employe,
        on_delete=models.PROTECT,
        db_column='id_acheteur',
        related_name='bons_commande',
    )
    date_creation = models.DateField(db_column='date_création')
    montant = models.FloatField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=Statut.choices, default=Statut.EN_COURS)
    id_fournisseur = models.ForeignKey(
        Fournisseur,
        on_delete=models.PROTECT,
        db_column='id_fournisseur',
        related_name='bons_commande',
    )

    class Meta:
        db_table = 'BonDeCommande'
        verbose_name = 'Bon de commande'
        verbose_name_plural = 'Bons de commande'
        managed = True

    def __str__(self):
        return f"BC-{self.id_bc}"

    @property
    def reference(self):
        return f"BC-{self.id_bc}"


class LigneBonDeCommande(models.Model):
    """Ligne d'un bon de commande (table Supabase `Ligne de BonDeCommande`)."""

    num_ligne_bc = models.BigAutoField(primary_key=True)
    id_bc = models.ForeignKey(
        BonDeCommande,
        on_delete=models.CASCADE,
        db_column='id_bc',
        related_name='lignes',
    )
    num_produit = models.ForeignKey(
        Produit,
        on_delete=models.PROTECT,
        db_column='num_produit',
        related_name='lignes_bc',
    )
    qte = models.BigIntegerField(blank=True, null=True)

    class Meta:
        db_table = 'Ligne de BonDeCommande'
        verbose_name = 'Ligne de bon de commande'
        verbose_name_plural = 'Lignes de bons de commande'
        managed = True

    def __str__(self):
        return f"BC-{self.id_bc_id} - {self.num_produit} x{self.qte}"
