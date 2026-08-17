from rest_framework import viewsets

from .models import Fournisseur, Produit
from .serializers import FournisseurSerializer, ProduitSerializer


class FournisseurViewSet(viewsets.ModelViewSet):
    queryset = Fournisseur.objects.all()
    serializer_class = FournisseurSerializer


class ProduitViewSet(viewsets.ModelViewSet):
    queryset = Produit.objects.select_related('id_fournisseur').all()
    serializer_class = ProduitSerializer
    search_fields = ['nom_produit', 'reference']
