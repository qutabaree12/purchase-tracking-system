from rest_framework import serializers

from produits.serializers import ProduitSerializer
from .models import DemandeAchat, LigneDemandeAchat


class LigneDemandeAchatSerializer(serializers.ModelSerializer):
    produit_detail = ProduitSerializer(source='id_produit', read_only=True)

    class Meta:
        model = LigneDemandeAchat
        fields = ['num_ligne_da', 'id_produit', 'produit_detail', 'designation', 'qte', 'prix_unit']


class DemandeAchatSerializer(serializers.ModelSerializer):
    demandeur_nom = serializers.CharField(source='id_demandeur.full_name', read_only=True)
    acheteur_nom = serializers.CharField(source='id_acheteur.full_name', read_only=True, default=None)
    lignes = LigneDemandeAchatSerializer(many=True, read_only=True)

    class Meta:
        model = DemandeAchat
        fields = [
            'id_da', 'numero_da', 'dot', 'id_demandeur', 'demandeur_nom',
            'id_acheteur', 'acheteur_nom', 'date_creation', 'objet', 'statut', 'lignes',
        ]
