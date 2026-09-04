from rest_framework import serializers

from .models import (
    BonDeCommande,
    LigneBonDeCommande,
    DossierImportation,
)


class LigneBonDeCommandeSerializer(serializers.ModelSerializer):
    produit_nom = serializers.CharField(
        source='num_produit.nom_produit',
        read_only=True,
    )

    prix_unitaire = serializers.FloatField(
        source='num_produit.prix_unit',
        read_only=True,
    )

    class Meta:
        model = LigneBonDeCommande
        fields = [
            'num_ligne_bc',
            'num_produit',
            'produit_nom',
            'prix_unitaire',
            'qte',
        ]


class BonDeCommandeSerializer(serializers.ModelSerializer):
    reference = serializers.CharField(read_only=True)

    fournisseur_nom = serializers.CharField(
        source='id_fournisseur.nom_fournisseur',
        read_only=True,
    )

    acheteur_nom = serializers.CharField(
        source='id_acheteur.full_name',
        read_only=True,
    )

    lignes = LigneBonDeCommandeSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = BonDeCommande
        fields = [
            'id_bc',
            'reference',
            'id_da',
            'id_acheteur',
            'acheteur_nom',
            'id_fournisseur',
            'fournisseur_nom',
            'date_creation',
            'montant',
            'status',
            'lignes',
        ]


class DossierImportationSerializer(serializers.ModelSerializer):
    bc_reference = serializers.CharField(
        source='id_bc.reference',
        read_only=True,
    )

    fournisseur_nom = serializers.CharField(
        source='id_bc.id_fournisseur.nom_fournisseur',
        read_only=True,
    )

    transitaire_nom = serializers.CharField(
        source='id_transitaire.full_name',
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = DossierImportation
        fields = [
            'id_dossier',
            'id_bc',
            'bc_reference',
            'fournisseur_nom',
            'id_transitaire',
            'transitaire_nom',
            'tarif_douane',
            'autorisation_necessaire',
            'autorisation_obtenue',
            'numero_autorisation',
            'mode_expedition',
            'lieu_chargement',
            'date_livraison_prevue',
            'date_reception_reelle',
            'statut',
        ]
        read_only_fields = [
            'id_dossier',
            'bc_reference',
            'fournisseur_nom',
            'transitaire_nom',
            'date_reception_reelle',
        ]