from django.db import models


class Fournisseur(models.Model):
    """Fournisseur externe (table Supabase `Fournisseur`)."""

    id_fournisseur = models.BigAutoField(primary_key=True)
    nom_fournisseur = models.CharField(max_length=200)
    adresse_fournisseur = models.CharField(max_length=255, blank=True, null=True)
    tel_fournisseur = models.BigIntegerField(blank=True, null=True)

    class Meta:
        db_table = 'Fournisseur'
        verbose_name = 'Fournisseur'
        verbose_name_plural = 'Fournisseurs'
        managed = True

    def __str__(self):
        return self.nom_fournisseur

    @property
    def nom(self):
        return self.nom_fournisseur


class Produit(models.Model):
    """Produit acheté (table Supabase `Produit`)."""

    num_produit = models.BigAutoField(primary_key=True)
    nom_produit = models.CharField(max_length=200)
    prix_unit = models.FloatField(blank=True, null=True)
    id_fournisseur = models.ForeignKey(
        Fournisseur,
        on_delete=models.PROTECT,
        db_column='id_fournisseur',
        related_name='produits',
        null=True,
        blank=True,
    )

    class Meta:
        db_table = 'Produit'
        verbose_name = 'Produit'
        verbose_name_plural = 'Produits'
        managed = True

    def __str__(self):
        return self.nom_produit

    @property
    def nom(self):
        return self.nom_produit

    @property
    def prix_unitaire(self):
        return self.prix_unit
