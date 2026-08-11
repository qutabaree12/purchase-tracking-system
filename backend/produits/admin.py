from django.contrib import admin

from .models import Categorie, Fournisseur, Produit


@admin.register(Categorie)
class CategorieAdmin(admin.ModelAdmin):
    list_display = ('id_categorie', 'nom_categorie')


@admin.register(Fournisseur)
class FournisseurAdmin(admin.ModelAdmin):
    list_display = ('id_fournisseur', 'nom_fournisseur', 'adresse_fournisseur', 'tel_fournisseur')
    search_fields = ('nom_fournisseur',)


@admin.register(Produit)
class ProduitAdmin(admin.ModelAdmin):
    list_display = ('num_produit', 'nom_produit', 'prix_unit', 'id_categorie')
    list_filter = ('id_categorie',)
    search_fields = ('nom_produit',)
