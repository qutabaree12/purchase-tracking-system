from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import EmployeViewSet, login, logout, me
from .serializers import EmployeTokenRefreshSerializer

router = DefaultRouter()
router.register('users', EmployeViewSet, basename='users')

urlpatterns = [
    path('auth/login', login, name='login'),
    path('auth/logout', logout, name='logout'),
    path('auth/me', me, name='me'),
    path('auth/refresh', TokenRefreshView.as_view(serializer_class=EmployeTokenRefreshSerializer), name='token_refresh'),
    path('', include(router.urls)),
]
