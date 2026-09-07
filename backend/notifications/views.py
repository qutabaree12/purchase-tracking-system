from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from config.pagination import OptionalPagination
from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = OptionalPagination

    def get_queryset(self):
        return (
            Notification.objects
            .filter(destinataire=self.request.user)
            .select_related('demande')
            .order_by('-date_creation')
        )

    # GET /api/notifications/non_lues/
    @action(detail=False, methods=['get'])
    def non_lues(self, request):
        notifications = self.get_queryset().filter(lu=False)

        serializer = self.get_serializer(
            notifications,
            many=True
        )

        return Response(serializer.data)

    # POST /api/notifications/ID/marquer_lue/
    @action(detail=True, methods=['post'])
    def marquer_lue(self, request, pk=None):
        notification = self.get_object()

        notification.lu = True
        notification.save(update_fields=['lu'])

        return Response({
            'detail': 'Notification marquée comme lue.'
        })

    # POST /api/notifications/marquer_toutes_lues/
    @action(detail=False, methods=['post'])
    def marquer_toutes_lues(self, request):
        self.get_queryset().filter(lu=False).update(lu=True)

        return Response({
            'detail': 'Notifications marquées comme lues.'
        })

    # DELETE /api/notifications/ID/
    # reste limité aux notifications de l'utilisateur connecté