from rest_framework.routers import DefaultRouter

from .views import DemandeAchatViewSet

router = DefaultRouter()
router.register('demandes', DemandeAchatViewSet, basename='demandes')

urlpatterns = router.urls
