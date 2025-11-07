"""
Service layer para criação e gerenciamento de notificações
Centraliza a lógica de negócio de notificações
"""
from typing import List, Optional, Dict, Any
from django.contrib.auth import get_user_model
from django.db.models import Q

from apps.churches.models import Church
from apps.branches.models import Branch
from apps.accounts.models import ChurchUser
from .models import Notification, NotificationTypeChoices, NotificationPriorityChoices


User = get_user_model()


class NotificationService:
    """
    Serviço centralizado para criação e gerenciamento de notificações
    
    Exemplos de uso:
        # Notificar usuário específico
        NotificationService.create_notification(
            user=user,
            church=church,
            notification_type='new_visitor',
            title='Novo visitante',
            message='João Silva visitou a igreja',
            metadata={'visitor_id': 123}
        )
        
        # Notificar todos admins da igreja
        NotificationService.notify_church_admins(
            church=church,
            notification_type='new_member',
            title='Novo membro',
            message='Maria foi cadastrada como membro'
        )
    """
    
    @staticmethod
    def create_notification(
        user: User,
        church: Church,
        notification_type: str,
        title: str,
        message: str,
        metadata: Optional[Dict[str, Any]] = None,
        action_url: Optional[str] = None,
        priority: str = NotificationPriorityChoices.MEDIUM
    ) -> Notification:
        """
        Cria uma notificação para um usuário específico
        
        Args:
            user: Usuário destinatário
            church: Igreja no contexto da notificação
            notification_type: Tipo da notificação (usar NotificationTypeChoices)
            title: Título da notificação
            message: Mensagem detalhada
            metadata: Dados adicionais em formato dict
            action_url: URL para redirecionar ao clicar
            priority: Prioridade (low, medium, high, critical)
        
        Returns:
            Notification: Notificação criada
        """
        return Notification.objects.create(
            user=user,
            church=church,
            notification_type=notification_type,
            title=title,
            message=message,
            metadata=metadata or {},
            action_url=action_url,
            priority=priority
        )
    
    @staticmethod
    def notify_church_admins(
        church: Church,
        notification_type: str,
        title: str,
        message: str,
        metadata: Optional[Dict[str, Any]] = None,
        action_url: Optional[str] = None,
        priority: str = NotificationPriorityChoices.MEDIUM
    ) -> List[Notification]:
        """
        Notifica todos os administradores de uma igreja
        
        Inclui:
        - CHURCH_ADMIN (Administrador da Igreja)
        - DENOMINATION_ADMIN (se a igreja pertence a uma denominação)
        
        Args:
            church: Igreja
            notification_type: Tipo da notificação
            title: Título
            message: Mensagem
            metadata: Metadados opcionais
            action_url: URL de ação
            priority: Prioridade
        
        Returns:
            List[Notification]: Lista de notificações criadas
        """
        # Buscar usuários com papel de admin na igreja
        church_users = ChurchUser.objects.filter(
            church=church,
            is_active=True,
            role__in=['church_admin', 'denomination_admin']  # lowercase
        ).select_related('user')
        
        notifications = []
        for church_user in church_users:
            if church_user.user and church_user.user.is_active:
                notification = NotificationService.create_notification(
                    user=church_user.user,
                    church=church,
                    notification_type=notification_type,
                    title=title,
                    message=message,
                    metadata=metadata,
                    action_url=action_url,
                    priority=priority
                )
                notifications.append(notification)
        
        return notifications
    
    @staticmethod
    def notify_church_secretaries(
        church,
        notification_type: str,
        title: str,
        message: str,
        metadata: dict = None,
        action_url: str = None,
        priority: str = 'medium'
    ):
        """
        Notifica todos os secretários de uma igreja
        
        Args:
            church: Igreja
            notification_type: Tipo da notificação
            title: Título
            message: Mensagem
            metadata: Metadados opcionais
            action_url: URL de ação
            priority: Prioridade
        
        Returns:
            List[Notification]: Lista de notificações criadas
        """
        # Buscar usuários com papel de secretário na igreja
        church_users = ChurchUser.objects.filter(
            church=church,
            is_active=True,
            role='secretary'  # role correto
        ).select_related('user')
        
        notifications = []
        for church_user in church_users:
            if church_user.user and church_user.user.is_active:
                notification = NotificationService.create_notification(
                    user=church_user.user,
                    church=church,
                    notification_type=notification_type,
                    title=title,
                    message=message,
                    metadata=metadata,
                    action_url=action_url,
                    priority=priority
                )
                notifications.append(notification)
        
        return notifications
    
    @staticmethod
    def notify_branch_managers(
        branch: Branch,
        notification_type: str,
        title: str,
        message: str,
        metadata: Optional[Dict[str, Any]] = None,
        action_url: Optional[str] = None,
        priority: str = NotificationPriorityChoices.MEDIUM
    ) -> List[Notification]:
        """
        Notifica gestores de uma filial específica
        
        Inclui:
        - Pastor responsável pela filial
        - Administradores da igreja matriz
        
        Args:
            branch: Filial
            notification_type: Tipo da notificação
            title: Título
            message: Mensagem
            metadata: Metadados opcionais
            action_url: URL de ação
            priority: Prioridade
        
        Returns:
            List[Notification]: Lista de notificações criadas
        """
        notifications = []
        
        # Notificar pastor responsável pela filial (se houver)
        if branch.pastor and branch.pastor.user:
            notification = NotificationService.create_notification(
                user=branch.pastor.user,
                church=branch.church,
                notification_type=notification_type,
                title=title,
                message=message,
                metadata=metadata,
                action_url=action_url,
                priority=priority
            )
            notifications.append(notification)
        
        # Notificar também os admins da igreja
        admin_notifications = NotificationService.notify_church_admins(
            church=branch.church,
            notification_type=notification_type,
            title=title,
            message=message,
            metadata=metadata,
            action_url=action_url,
            priority=priority
        )
        notifications.extend(admin_notifications)
        
        return notifications
    
    @staticmethod
    def notify_users_by_role(
        church: Church,
        roles: List[str],
        notification_type: str,
        title: str,
        message: str,
        metadata: Optional[Dict[str, Any]] = None,
        action_url: Optional[str] = None,
        priority: str = NotificationPriorityChoices.MEDIUM
    ) -> List[Notification]:
        """
        Notifica usuários com papéis específicos em uma igreja
        
        Args:
            church: Igreja
            roles: Lista de papéis (ex: ['CHURCH_ADMIN', 'SECRETARY'])
            notification_type: Tipo da notificação
            title: Título
            message: Mensagem
            metadata: Metadados opcionais
            action_url: URL de ação
            priority: Prioridade
        
        Returns:
            List[Notification]: Lista de notificações criadas
        """
        church_users = ChurchUser.objects.filter(
            church=church,
            is_active=True,
            role__in=roles
        ).select_related('user')
        
        notifications = []
        for church_user in church_users:
            if church_user.user and church_user.user.is_active:
                notification = NotificationService.create_notification(
                    user=church_user.user,
                    church=church,
                    notification_type=notification_type,
                    title=title,
                    message=message,
                    metadata=metadata,
                    action_url=action_url,
                    priority=priority
                )
                notifications.append(notification)
        
        return notifications
    
    @staticmethod
    def mark_as_read(notification_id: int, user: User) -> bool:
        """
        Marca uma notificação como lida
        
        Args:
            notification_id: ID da notificação
            user: Usuário (para validação de ownership)
        
        Returns:
            bool: True se marcada com sucesso, False se não encontrada
        """
        try:
            notification = Notification.objects.get(id=notification_id, user=user)
            notification.mark_as_read()
            return True
        except Notification.DoesNotExist:
            return False
    
    @staticmethod
    def mark_all_as_read(user: User, church: Church) -> int:
        """
        Marca todas as notificações de um usuário como lidas
        
        Args:
            user: Usuário
            church: Igreja (contexto multi-tenant)
        
        Returns:
            int: Número de notificações marcadas
        """
        return Notification.objects.mark_all_as_read(user, church)
    
    @staticmethod
    def get_unread_count(user: User, church: Church) -> int:
        """
        Retorna contagem de notificações não lidas
        
        Args:
            user: Usuário
            church: Igreja
        
        Returns:
            int: Quantidade de notificações não lidas
        """
        return Notification.objects.filter(
            user=user,
            church=church,
            is_read=False
        ).count()
    
    @staticmethod
    def cleanup_old_notifications(days_read: int = 30, days_unread: int = 90) -> Dict[str, int]:
        """
        Remove notificações antigas
        
        Args:
            days_read: Dias para manter notificações lidas (padrão: 30)
            days_unread: Dias para manter notificações não lidas (padrão: 90)
        
        Returns:
            Dict com contagens de remoções
        """
        from django.utils import timezone
        
        cutoff_read = timezone.now() - timezone.timedelta(days=days_read)
        cutoff_unread = timezone.now() - timezone.timedelta(days=days_unread)
        
        # Deletar notificações lidas antigas
        deleted_read = Notification.objects.filter(
            is_read=True,
            read_at__lt=cutoff_read
        ).delete()
        
        # Deletar notificações não lidas muito antigas
        deleted_unread = Notification.objects.filter(
            is_read=False,
            created_at__lt=cutoff_unread
        ).delete()
        
        return {
            'deleted_read': deleted_read[0] if deleted_read else 0,
            'deleted_unread': deleted_unread[0] if deleted_unread else 0,
            'total': (deleted_read[0] if deleted_read else 0) + (deleted_unread[0] if deleted_unread else 0)
        }
