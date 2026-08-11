from django.db import models

from authentication.models import Employe
from produits.models import Produit


class DemandeAchat(models.Model):
    """Demande d'achat (table Supabase `demande_achat`)."""

    class Statut(models.TextChoices):
        EN_COURS = 'en_cours', 'En cours'
        APPROUVEE = 'approuvee', 'Approuvée'
        REFUSEE = 'refusee', 'Refusée'

    id_da = models.AutoField(primary_key=True)
    numero_da = models.CharField(max_length=30)
    dot = models.CharField(max_length=30, blank=True, null=True)
    id_demandeur = models.ForeignKey(
        Employe,
        on_delete=models.CASCADE,
        db_column='id_demandeur',
        related_name='demandes',
    )
    date_creation = models.DateField()
    objet = models.CharField(max_length=255)
    statut = models.CharField(max_length=20, choices=Statut.choices, default=Statut.EN_COURS)

    class Meta:
        db_table = 'demande_achat'
        verbose_name = 'Demande d\'achat'
        verbose_name_plural = 'Demandes d\'achat'
        managed = True

    def __str__(self):
        return self.numero_da

    @property
    def reference(self):
        return self.numero_da


class LigneDemandeAchat(models.Model):
    """Ligne d'une demande (table Supabase `ligne_demande_achat`)."""

    num_ligne_da = models.AutoField(primary_key=True)
    id_da = models.ForeignKey(
        DemandeAchat,
        on_delete=models.CASCADE,
        db_column='id_da',
        related_name='lignes',
    )
    id_produit = models.ForeignKey(
        Produit,
        on_delete=models.PROTECT,
        db_column='id_produit',
        related_name='lignes_demande',
    )
    designation = models.CharField(max_length=255)
    qte = models.IntegerField()
    prix_unit = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = 'ligne_demande_achat'
        verbose_name = 'Ligne de demande'
        verbose_name_plural = 'Lignes de demandes'
        managed = True

    def __str__(self):
        return f"{self.id_da} - {self.designation} x{self.qte}"


class LettreRejet(models.Model):
    """Lettre de rejet d'une demande (table Supabase `lettre_rejet`)."""

    id_lrej = models.AutoField(primary_key=True)
    id_da = models.ForeignKey(
        DemandeAchat,
        on_delete=models.CASCADE,
        db_column='id_da',
        related_name='lettres_rejet',
    )
    id_acheteur = models.ForeignKey(
        Employe,
        on_delete=models.PROTECT,
        db_column='id_acheteur',
        related_name='lettres_rejet',
    )
    date_rej = models.DateField()
    motif = models.CharField(max_length=500)

    class Meta:
        db_table = 'lettre_rejet'
        verbose_name = 'Lettre de rejet'
        verbose_name_plural = 'Lettres de rejet'
        managed = True

    def __str__(self):
        return f"Rejet {self.id_da} - {self.motif[:30]}"
