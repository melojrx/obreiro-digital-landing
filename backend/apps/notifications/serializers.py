"""
Serializers para o sistema de notificações
"""
from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer completo para notificações
    Usado para listagem e detalhamento
    """
    
    # Campos calculados
    is_recent = serializers.ReadOnlyField()
    age_in_days = serializers.ReadOnlyField()
    
    # Campos de display
    notification_type_display = serializers.CharField(
        source='get_notification_type_display',
        read_only=True
    )
    priority_display = serializers.CharField(
        source='get_priority_display',
        read_only=True
    )
    
    class Meta:
        model = Notification
        fields = [
            'id',
            'user',
            'church',
            'notification_type',
            'notification_type_display',
            'title',
            'message',
            'is_read',
            'read_at',
            'metadata',
            'action_url',
            'priority',
            'priority_display',
            'is_recent',
            'age_in_days',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'user',
            'church',
            'notification_type',
            'title',
            'message',
            'metadata',
            'action_url',
            'priority',
            'created_at',
            'updated_at',
        ]


class NotificationListSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para listagem
    Otimizado para performance em grandes listas
    """
    
    notification_type_display = serializers.CharField(
        source='get_notification_type_display',
        read_only=True
    )
    
    class Meta:
        model = Notification
        fields = [
            'id',
            'notification_type',
            'notification_type_display',
            'title',
            'message',
            'is_read',
            'action_url',
            'priority',
            'created_at',
        ]


class MarkAsReadSerializer(serializers.Serializer):
    """
    Serializer para marcar notificação como lida
    Usado no endpoint mark_read
    """
    is_read = serializers.BooleanField(default=True)
    
    def update(self, instance, validated_data):
        """Marca a notificação como lida"""
        if validated_data.get('is_read', True):
            instance.mark_as_read()
        else:
            instance.mark_as_unread()
        return instance


class UnreadCountSerializer(serializers.Serializer):
    """
    Serializer para contagem de não lidas
    Usado no endpoint unread_count
    """
    count = serializers.IntegerField(read_only=True)


class BulkMarkAsReadSerializer(serializers.Serializer):
    """
    Serializer para marcar múltiplas notificações como lidas
    """
    notification_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False,
        help_text='Lista de IDs de notificações para marcar como lidas'
    )
