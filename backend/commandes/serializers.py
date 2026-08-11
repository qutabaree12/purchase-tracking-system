from rest_framework import serializers

from .models import BonDeCommande, LigneBonDeCommande


class LigneBonDeCommandeSerializer(serializers.ModelSerializer):
    produit_nom = serializers.CharField(source='num_produit.nom_produit', read_only=True)

    class Meta:
        model = LigneBonDeCommande
        fields = ['num_ligne_bc', 'id_bc', 'num_produit', 'produit_nom', 'qte']


class BonDeCommandeSerializer(serializers.ModelSerializer):
    acheteur_nom = serializers.CharField(source='id_acheteur.full_name', read_only=True)
    fournisseur_nom = serializers.CharField(source='id_fournisseur.nom_fournisseur', read_only=True)
    lignes = LigneBonDeCommandeSerializer(many=True, read_only=True)

    class Meta:
        model = BonDeCommande
        fields = [
            'id_bc', 'reference', 'id_da', 'id_acheteur', 'acheteur_nom',
            'id_fournisseur', 'fournisseur_nom', 'date_creation', 'montant',
            'status', 'lignes',
        ]
