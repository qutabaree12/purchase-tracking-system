from rest_framework import viewsets

from authentication.models import Employe
from config.permissions import lecture_pour_tous_ecriture_roles

from .models import Fournisseur, Produit
from .serializers import FournisseurSerializer, ProduitSerializer

# Lecture : tout utilisateur connecté. Écriture : administrateur uniquement.
PeutModifierCatalogue = lecture_pour_tous_ecriture_roles(Employe.Role.ADMIN)


class FournisseurViewSet(viewsets.ModelViewSet):
    queryset = Fournisseur.objects.all()
    serializer_class = FournisseurSerializer
    permission_classes = [PeutModifierCatalogue]


class ProduitViewSet(viewsets.ModelViewSet):
    queryset = Produit.objects.select_related('id_fournisseur').all()
    serializer_class = ProduitSerializer
    search_fields = ['nom_produit', 'reference']
    permission_classes = [PeutModifierCatalogue]
