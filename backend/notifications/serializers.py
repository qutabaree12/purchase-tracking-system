from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id_notification',
            'destinataire',
            'demande',
            'type',
            'titre',
            'message',
            'lu',
            'date_creation',
        ]
        read_only_fields = [
            'id_notification',
            'destinataire',
            'date_creation',
        ]