from rest_framework import serializers

from .models import LigneReception, Reception


class LigneReceptionSerializer(serializers.ModelSerializer):
    num_ligne_bc = serializers.IntegerField(source='ligne_bc_id', read_only=True)
    produit_nom = serializers.CharField(source='ligne_bc.num_produit.nom_produit', read_only=True)

    class Meta:
        model = LigneReception
        fields = ['num_ligne_bc', 'produit_nom', 'quantite_recue', 'reserve']


class ReceptionSerializer(serializers.ModelSerializer):
    bc_reference = serializers.CharField(source='id_dossier.id_bc.reference', read_only=True)
    transitaire_nom = serializers.CharField(source='id_transitaire.full_name', read_only=True)
    lignes = LigneReceptionSerializer(many=True, read_only=True)

    class Meta:
        model = Reception
        fields = [
            'id_reception', 'id_dossier', 'bc_reference', 'transitaire_nom',
            'date_reception', 'remarque', 'lignes',
        ]
        read_only_fields = fields
