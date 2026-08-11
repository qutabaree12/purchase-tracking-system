from rest_framework.routers import DefaultRouter

from .views import CategorieViewSet, FournisseurViewSet, ProduitViewSet

router = DefaultRouter()
router.register('categories', CategorieViewSet)
router.register('fournisseurs', FournisseurViewSet)
router.register('produits', ProduitViewSet)

urlpatterns = router.urls
