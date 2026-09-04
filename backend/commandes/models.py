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
        constraints = [
            models.UniqueConstraint(
                fields=['id_fournisseur', 'date_creation', 'id_acheteur'],
                name='unique_bc_fournisseur_jour_acheteur',
                violation_error_message=(
                    'Un bon de commande existe déjà pour ce fournisseur aujourd\'hui.'
                ),
            ),
        ]

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


class DossierImportation(models.Model):
    """Dossier de suivi de l'importation lié à un bon de commande."""

    class Statut(models.TextChoices):
        A_TRAITER = 'a traiter', 'À traiter'
        EN_COURS = 'en cours', 'En cours'
        LIVRE = 'livré', 'Livré'

    id_dossier = models.BigAutoField(primary_key=True)

    id_bc = models.OneToOneField(
        BonDeCommande,
        on_delete=models.CASCADE,
        db_column='id_bc',
        related_name='dossier_importation',
    )

    id_transitaire = models.ForeignKey(
        Employe,
        on_delete=models.SET_NULL,
        db_column='id_transitaire',
        null=True,
        blank=True,
        related_name='dossiers_importation',
    )

    tarif_douane = models.CharField(
        max_length=100,
        null=True,
        blank=True,
    )

    autorisation_necessaire = models.BooleanField(default=False)

    autorisation_obtenue = models.BooleanField(default=False)

    numero_autorisation = models.CharField(
        max_length=100,
        null=True,
        blank=True,
    )

    mode_expedition = models.CharField(
        max_length=100,
        null=True,
        blank=True,
    )

    lieu_chargement = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )

    date_livraison_prevue = models.DateField(
        null=True,
        blank=True,
    )

    date_reception_reelle = models.DateField(
        null=True,
        blank=True,
    )

    statut = models.CharField(
        max_length=20,
        choices=Statut.choices,
        default=Statut.A_TRAITER,
    )

    class Meta:
        db_table = 'DossierImportation'
        verbose_name = "Dossier d'importation"
        verbose_name_plural = "Dossiers d'importation"
        managed = True

    def __str__(self):
        return f"Dossier importation - {self.id_bc.reference}"
