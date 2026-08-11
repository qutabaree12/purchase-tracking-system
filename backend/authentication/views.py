from rest_framework import viewsets, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Employe
from .serializers import EmployeSerializer, LoginSerializer


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
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
    """CRUD des employés (réservé à l'admin)."""
    queryset = Employe.objects.all()
    serializer_class = EmployeSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]
