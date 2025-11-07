"""
Admin para o sistema de notificações
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """
    Admin customizado para notificações
    Permite visualização e gestão eficiente
    """
    
    list_display = [
        'status_icon',
        'title',
        'user',
        'church',
        'notification_type',
        'priority_badge',
        'created_at',
        'is_read',
    ]
    
    list_filter = [
        'is_read',
        'notification_type',
        'priority',
        'created_at',
        'church',
    ]
    
    search_fields = [
        'title',
        'message',
        'user__email',
        'user__full_name',
        'church__name',
    ]
    
    readonly_fields = [
        'created_at',
        'updated_at',
        'read_at',
        'is_recent',
        'age_in_days',
    ]
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': (
                'user',
                'church',
                'notification_type',
                'priority',
            )
        }),
        ('Conteúdo', {
            'fields': (
                'title',
                'message',
                'action_url',
            )
        }),
        ('Metadados', {
            'fields': (
                'metadata',
            ),
            'classes': ('collapse',),
        }),
        ('Status', {
            'fields': (
                'is_read',
                'read_at',
                'is_recent',
                'age_in_days',
            )
        }),
        ('Auditoria', {
            'fields': (
                'created_at',
                'updated_at',
            ),
            'classes': ('collapse',),
        }),
    )
    
    date_hierarchy = 'created_at'
    
    actions = [
        'mark_as_read',
        'mark_as_unread',
        'delete_selected',
    ]
    
    def status_icon(self, obj):
        """Ícone visual do status"""
        if obj.is_read:
            return format_html(
                '<span style="color: green; font-size: 16px;">✓</span>'
            )
        return format_html(
            '<span style="color: red; font-size: 16px;">●</span>'
        )
    status_icon.short_description = 'Status'
    
    def priority_badge(self, obj):
        """Badge colorido para prioridade"""
        colors = {
            'low': '#6c757d',
            'medium': '#0dcaf0',
            'high': '#ffc107',
            'critical': '#dc3545',
        }
        color = colors.get(obj.priority, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
            color,
            obj.get_priority_display().upper()
        )
    priority_badge.short_description = 'Prioridade'
    
    def mark_as_read(self, request, queryset):
        """Action para marcar notificações como lidas"""
        count = 0
        for notification in queryset:
            if not notification.is_read:
                notification.mark_as_read()
                count += 1
        
        self.message_user(
            request,
            f'{count} notificação(ões) marcada(s) como lida(s).'
        )
    mark_as_read.short_description = 'Marcar como lida'
    
    def mark_as_unread(self, request, queryset):
        """Action para marcar notificações como não lidas"""
        count = 0
        for notification in queryset:
            if notification.is_read:
                notification.mark_as_unread()
                count += 1
        
        self.message_user(
            request,
            f'{count} notificação(ões) marcada(s) como não lida(s).'
        )
    mark_as_unread.short_description = 'Marcar como não lida'
    
    def get_queryset(self, request):
        """Otimiza queryset com select_related"""
        qs = super().get_queryset(request)
        return qs.select_related('user', 'church')
