from rest_framework.routers import DefaultRouter

from .views import FournisseurViewSet, ProduitViewSet

router = DefaultRouter()
router.register('fournisseurs', FournisseurViewSet)
router.register('produits', ProduitViewSet)

urlpatterns = router.urls
