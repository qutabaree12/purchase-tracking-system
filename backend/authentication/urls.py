from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import EmployeViewSet, login, logout, me

router = DefaultRouter()
router.register('users', EmployeViewSet, basename='users')

urlpatterns = [
    path('auth/login', login, name='login'),
    path('auth/logout', logout, name='logout'),
    path('auth/me', me, name='me'),
    path('auth/refresh', TokenRefreshView.as_view(), name='token_refresh'),
    path('', include(router.urls)),
]
