from rest_framework import serializers

from .models import Categorie, Fournisseur, Produit


class CategorieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categorie
        fields = '__all__'


class FournisseurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fournisseur
        fields = '__all__'


class ProduitSerializer(serializers.ModelSerializer):
    categorie_nom = serializers.CharField(source='categorie.nom_categorie', read_only=True)

    class Meta:
        model = Produit
        fields = '__all__'
