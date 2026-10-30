from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import BonDeCommandeViewSet, generer_bons_commande, regroupement
from .views_dossiers import DossierImportationViewSet

router = DefaultRouter()
router.register('bons-commande', BonDeCommandeViewSet, basename='bons-commande')
router.register('dossiers-importation', DossierImportationViewSet, basename='dossiers-importation')  

urlpatterns = [
    path('regroupement/', regroupement, name='regroupement'),
    path('bons-commande/generer/', generer_bons_commande, name='generer-bons-commande'),
    path('', include(router.urls)),
]
