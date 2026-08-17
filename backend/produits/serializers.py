from rest_framework import serializers

from .models import Fournisseur, Produit


class FournisseurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fournisseur
        fields = '__all__'


class ProduitSerializer(serializers.ModelSerializer):
    fournisseur_nom = serializers.CharField(
        source='id_fournisseur.nom_fournisseur', read_only=True
    )

    class Meta:
        model = Produit
        fields = '__all__'
