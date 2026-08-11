from rest_framework import viewsets

from .models import Categorie, Fournisseur, Produit
from .serializers import CategorieSerializer, FournisseurSerializer, ProduitSerializer


class CategorieViewSet(viewsets.ModelViewSet):
    queryset = Categorie.objects.all()
    serializer_class = CategorieSerializer


class FournisseurViewSet(viewsets.ModelViewSet):
    queryset = Fournisseur.objects.all()
    serializer_class = FournisseurSerializer


class ProduitViewSet(viewsets.ModelViewSet):
    queryset = Produit.objects.select_related('categorie').all()
    serializer_class = ProduitSerializer
    search_fields = ['nom_produit', 'reference']
