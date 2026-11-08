from rest_framework import viewsets, permissions
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from config.permissions import roles_autorises

from .models import Employe
from .serializers import EmployeSerializer, LoginSerializer
from .throttles import LoginRateThrottle

# Qui peut consulter la liste des employés : administration et assignations.
PeutConsulterEmployes = roles_autorises(
    Employe.Role.ADMIN,
    Employe.Role.CHEF_DEPARTEMENT,
    Employe.Role.ACHETEUR,
)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([LoginRateThrottle])
def login(request):
    """POST /api/auth/login → { email, mot_de_passe } → { access, refresh, user }"""
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    employe = serializer.validated_data['employe']
    refresh = RefreshToken.for_user(employe)
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': EmployeSerializer(employe).data,
    })


@api_view(['GET'])
def me(request):
    """GET /api/auth/me → utilisateur connecté"""
    return Response(EmployeSerializer(request.user).data)


@api_view(['POST'])
def logout(request):
    """POST /api/auth/logout → simple déconnexion (token invalidé côté client)"""
    return Response({'detail': 'Déconnecté.'})


class EmployeViewSet(viewsets.ModelViewSet):
    """Gestion des employés."""

    queryset = Employe.objects.all()
    serializer_class = EmployeSerializer

    def get_queryset(self):
        qs = Employe.objects.all()

        # Un chef de département ne voit que les acheteurs (assignation des DA),
        # un acheteur que les transitaires (assignation des dossiers).
        role_connecte = getattr(self.request.user, 'role', None)
        if role_connecte == Employe.Role.CHEF_DEPARTEMENT:
            qs = qs.filter(role=Employe.Role.ACHETEUR)
        elif role_connecte == Employe.Role.ACHETEUR:
            qs = qs.filter(role=Employe.Role.TRANSITAIRE)

        role = self.request.query_params.get('role')
        etat = self.request.query_params.get('etat')

        if role:
            qs = qs.filter(role=role)

        if etat:
            qs = qs.filter(etat=etat)

        return qs

    def get_permissions(self):
        if self.action in (
            'create',
            'update',
            'partial_update',
            'destroy',
        ):
            return [permissions.IsAdminUser()]

        return [PeutConsulterEmployes()]
