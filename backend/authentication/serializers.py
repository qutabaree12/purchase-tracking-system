from rest_framework import serializers

from .models import Employe


class EmployeSerializer(serializers.ModelSerializer):
    id_emp = serializers.IntegerField(read_only=True)
    full_name = serializers.CharField(read_only=True)
    email = serializers.CharField(read_only=True)

    class Meta:
        model = Employe
        fields = ['id_emp', 'full_name', 'email', 'role', 'etat']
        read_only_fields = fields


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    mot_de_passe = serializers.CharField(write_only=True)

    def validate(self, attrs):
        employe = Employe.objects.filter(email_emp=attrs['email']).first()
        if not employe or not employe.check_password(attrs['mot_de_passe']):
            raise serializers.ValidationError('Email ou mot de passe incorrect.')
        if employe.etat != Employe.Etat.ACTIF:
            raise serializers.ValidationError('Compte archivé ou inactif.')
        attrs['employe'] = employe
        return attrs
