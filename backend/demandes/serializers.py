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
    has_bc = serializers.SerializerMethodField()
    motif_refus = serializers.SerializerMethodField()
    suivi = serializers.SerializerMethodField()

    class Meta:
        model = DemandeAchat
        fields = [
            'id_da', 'numero_da', 'dot', 'id_demandeur', 'demandeur_nom',
            'id_acheteur', 'acheteur_nom', 'date_creation', 'objet', 'statut', 'date_assignation',
            'date_approbation', 'date_rejet', 'lignes', 'has_bc', 'motif_refus', 'suivi',
        ]
        # Seuls "dot" et "objet" peuvent être envoyés par le client.
        # Tout le reste est décidé par le serveur.
        read_only_fields = [
            'id_da', 'numero_da', 'id_demandeur', 'id_acheteur', 'date_creation',
            'statut', 'date_assignation', 'date_approbation', 'date_rejet',
        ]

    def get_has_bc(self, obj):
        # `bons_commande` est préchargé → pas de requête SQL supplémentaire
        return len(obj.bons_commande.all()) > 0

    def get_motif_refus(self, obj):
        # `lettres_rejet` est préchargé → pas de requête SQL supplémentaire
        lettre = next(iter(obj.lettres_rejet.all()), None)
        return lettre.motif if lettre else None

    def get_suivi(self, obj):
        """BC liés à la DA + état de leur dossier d'importation.
        On n'expose volontairement ni le tarif douanier ni le transitaire."""
        resultat = []
        for bc in obj.bons_commande.all():
            dossier = getattr(bc, 'dossier_importation', None)
            resultat.append({
                'id_bc': bc.id_bc,
                'reference': bc.reference,
                'statut_bc': bc.status,
                'statut_dossier': dossier.statut if dossier else None,
                'date_livraison_prevue': dossier.date_livraison_prevue if dossier else None,
                'date_reception_reelle': dossier.date_reception_reelle if dossier else None,
            })
        return resultat