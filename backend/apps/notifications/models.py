"""
Models para o sistema de notificações
Segue o padrão multi-tenant do projeto
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError

from apps.core.models import BaseModel, TenantManager
from apps.churches.models import Church


class NotificationTypeChoices(models.TextChoices):
    """Tipos de notificações do sistema"""
    
    # Visitantes
    NEW_VISITOR = 'new_visitor', 'Novo Visitante'
    VISITOR_CONVERTED = 'visitor_converted', 'Visitante Convertido'
    
    # Membros
    NEW_MEMBER = 'new_member', 'Novo Membro'
    MEMBER_TRANSFERRED = 'member_transferred', 'Membro Transferido'
    MEMBER_STATUS_CHANGED = 'member_status_changed', 'Status de Membro Alterado'
    
    # Usuário
    PROFILE_UPDATED = 'profile_updated', 'Perfil Atualizado'
    AVATAR_UPDATED = 'avatar_updated', 'Avatar Atualizado'
    PASSWORD_CHANGED = 'password_changed', 'Senha Alterada'
    
    # Sistema
    SYSTEM_ALERT = 'system_alert', 'Alerta do Sistema'


class NotificationPriorityChoices(models.TextChoices):
    """Níveis de prioridade das notificações"""
    LOW = 'low', 'Baixa'
    MEDIUM = 'medium', 'Média'
    HIGH = 'high', 'Alta'
    CRITICAL = 'critical', 'Crítica'


class NotificationManager(TenantManager):
    """Manager especializado para notificações"""
    
    def unread(self):
        """Retorna notificações não lidas"""
        return self.get_queryset().filter(is_read=False)
    
    def read(self):
        """Retorna notificações lidas"""
        return self.get_queryset().filter(is_read=True)
    
    def for_user(self, user):
        """Retorna notificações de um usuário específico"""
        return self.get_queryset().filter(user=user)
    
    def by_type(self, notification_type):
        """Retorna notificações de um tipo específico"""
        return self.get_queryset().filter(notification_type=notification_type)
    
    def by_priority(self, priority):
        """Retorna notificações por prioridade"""
        return self.get_queryset().filter(priority=priority)
    
    def recent(self, days=7):
        """Retorna notificações recentes dos últimos N dias"""
        cutoff_date = timezone.now() - timezone.timedelta(days=days)
        return self.get_queryset().filter(created_at__gte=cutoff_date)
    
    def mark_all_as_read(self, user, church):
        """Marca todas as notificações de um usuário como lidas"""
        return self.get_queryset().filter(
            user=user,
            church=church,
            is_read=False
        ).update(
            is_read=True,
            read_at=timezone.now()
        )


class Notification(BaseModel):
    """
    Model para notificações do sistema
    
    Segue o padrão multi-tenant, permitindo notificações
    específicas por igreja e usuário.
    """
    
    # Destinatário
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='Usuário',
        help_text='Usuário que receberá a notificação'
    )
    
    # Isolamento multi-tenant
    church = models.ForeignKey(
        Church,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='Igreja',
        help_text='Igreja no contexto da notificação'
    )
    
    # Tipo e conteúdo
    notification_type = models.CharField(
        'Tipo',
        max_length=30,
        choices=NotificationTypeChoices.choices,
        db_index=True,
        help_text='Tipo de notificação'
    )
    
    title = models.CharField(
        'Título',
        max_length=200,
        help_text='Título breve da notificação'
    )
    
    message = models.TextField(
        'Mensagem',
        max_length=500,
        help_text='Conteúdo detalhado da notificação'
    )
    
    # Status
    is_read = models.BooleanField(
        'Lida',
        default=False,
        db_index=True,
        help_text='Indica se a notificação foi lida'
    )
    
    read_at = models.DateTimeField(
        'Lida em',
        null=True,
        blank=True,
        help_text='Data e hora em que foi lida'
    )
    
    # Metadados (JSON)
    metadata = models.JSONField(
        'Metadados',
        default=dict,
        blank=True,
        help_text='Dados adicionais em formato JSON (IDs relacionados, etc.)'
    )
    
    # Link de ação
    action_url = models.CharField(
        'URL de Ação',
        max_length=500,
        null=True,
        blank=True,
        help_text='URL para redirecionar ao clicar na notificação'
    )
    
    # Prioridade
    priority = models.CharField(
        'Prioridade',
        max_length=10,
        choices=NotificationPriorityChoices.choices,
        default=NotificationPriorityChoices.MEDIUM,
        db_index=True,
        help_text='Nível de prioridade da notificação'
    )
    
    # Manager personalizado
    objects = NotificationManager()
    
    class Meta:
        verbose_name = 'Notificação'
        verbose_name_plural = 'Notificações'
        ordering = ['-created_at']  # Mais recentes primeiro
        indexes = [
            models.Index(fields=['user', 'church', '-created_at']),
            models.Index(fields=['user', 'is_read', '-created_at']),
            models.Index(fields=['church', 'notification_type', '-created_at']),
            models.Index(fields=['priority', '-created_at']),
        ]
        # Permissões personalizadas
        permissions = [
            ('can_view_all_notifications', 'Pode ver todas as notificações'),
            ('can_send_bulk_notifications', 'Pode enviar notificações em massa'),
        ]
    
    def __str__(self):
        status = '✓' if self.is_read else '●'
        return f'{status} [{self.get_priority_display()}] {self.title} - {self.user.get_full_name()}'
    
    def mark_as_read(self):
        """Marca a notificação como lida"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at', 'updated_at'])
    
    def mark_as_unread(self):
        """Marca a notificação como não lida"""
        if self.is_read:
            self.is_read = False
            self.read_at = None
            self.save(update_fields=['is_read', 'read_at', 'updated_at'])
    
    @property
    def is_recent(self):
        """Verifica se a notificação é recente (menos de 24h)"""
        return (timezone.now() - self.created_at).days < 1
    
    @property
    def age_in_days(self):
        """Retorna a idade da notificação em dias"""
        return (timezone.now() - self.created_at).days
    
    def clean(self):
        """Validações customizadas"""
        super().clean()
        
        # Validar que action_url seja uma URL válida se fornecida
        if self.action_url and not self.action_url.startswith('/'):
            if not (self.action_url.startswith('http://') or self.action_url.startswith('https://')):
                raise ValidationError({
                    'action_url': 'URL de ação deve começar com / ou ser uma URL completa (http/https)'
                })
        
        # Validar que metadata seja um dict
        if not isinstance(self.metadata, dict):
            raise ValidationError({
                'metadata': 'Metadados devem ser um objeto JSON válido'
            })
    
    def save(self, *args, **kwargs):
        """Sobrescreve save para executar validações"""
        self.full_clean()
        super().save(*args, **kwargs)
