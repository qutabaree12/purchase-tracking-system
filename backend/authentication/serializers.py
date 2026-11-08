from django.conf import settings
from rest_framework import serializers
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.settings import api_settings

from .models import Employe, Departement


class DepartementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Departement
        fields = ['id_departement', 'nom', 'dot', 'id_chef']


class EmployeSerializer(serializers.ModelSerializer):
    id_emp = serializers.IntegerField(read_only=True)
    full_name = serializers.CharField(read_only=True)
    email = serializers.CharField(read_only=True)

    class Meta:
        model = Employe
        fields = ['id_emp', 'full_name', 'email', 'role', 'etat', 'id_departement']
        read_only_fields = fields


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    mot_de_passe = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs['email'].strip()
        employe = Employe.objects.filter(email_emp__iexact=email).first()
        if not employe or not employe.check_password(attrs['mot_de_passe']):
            raise serializers.ValidationError('Email ou mot de passe incorrect.')
        if employe.etat != Employe.Etat.ACTIF:
            raise serializers.ValidationError('Compte archivé ou inactif.')
        attrs['employe'] = employe
        return attrs


class EmployeTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        refresh = self.token_class(attrs['refresh'])
        user_id = refresh.payload.get(api_settings.USER_ID_CLAIM)
        if user_id:
            employe = Employe.objects.filter(pk=user_id).first()
            if not employe or employe.etat != Employe.Etat.ACTIF:
                raise AuthenticationFailed(
                    self.error_messages['no_active_account'],
                    'no_active_account',
                )

        data = {'access': str(refresh.access_token)}
        if api_settings.ROTATE_REFRESH_TOKENS:
            refresh.set_jti()
            refresh.set_exp()
            refresh.set_iat()
            if 'rest_framework_simplejwt.token_blacklist' in settings.INSTALLED_APPS:
                refresh.outstand()
            data['refresh'] = str(refresh)
        return data
