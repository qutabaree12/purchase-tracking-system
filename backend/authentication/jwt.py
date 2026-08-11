from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.settings import api_settings

from .models import Employe


class EmployeJWTAuthentication(JWTAuthentication):
    """Authentifie les requêtes avec notre modèle Employe au lieu du User par défaut."""

    def get_user(self, validated_token):
        user_id = validated_token[api_settings.USER_ID_CLAIM]
        try:
            return Employe.objects.get(pk=user_id)
        except Employe.DoesNotExist:
            raise InvalidToken('Utilisateur introuvable.')
