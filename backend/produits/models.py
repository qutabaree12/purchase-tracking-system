from django.db import models


class Categorie(models.Model):
    """Catégorie d'un produit (table Supabase `Catégorie`)."""

    id_categorie = models.BigAutoField(primary_key=True, db_column='id_catégorie')
    nom_categorie = models.CharField(max_length=100, db_column='nom_catégorie')

    class Meta:
        db_table = 'Catégorie'
        verbose_name = 'Catégorie'
        verbose_name_plural = 'Catégories'
        managed = True

    def __str__(self):
        return self.nom_categorie

    @property
    def nom(self):
        return self.nom_categorie


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
    id_categorie = models.ForeignKey(
        Categorie,
        on_delete=models.PROTECT,
        db_column='id_catégorie',
        related_name='produits',
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

    @property
    def categorie(self):
        return self.id_categorie
