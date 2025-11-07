"""
Signals para notificações automáticas
Cria notificações quando eventos importantes acontecem no sistema
"""
import logging
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone

logger = logging.getLogger(__name__)


# =====================================
# SIGNALS DE VISITANTES
# =====================================

@receiver(post_save, sender='visitors.Visitor')
def visitor_created_notification(sender, instance, created, **kwargs):
    """
    Notifica administradores quando novo visitante é cadastrado
    """
    if not created:
        return
    
    from apps.notifications.services import NotificationService
    
    try:
        # Notificar admins da igreja sobre novo visitante
        NotificationService.notify_church_admins(
            church=instance.church,
            notification_type='new_visitor',
            title='Novo Visitante Cadastrado',
            message=f'{instance.full_name} visitou {instance.branch.name if instance.branch else "a igreja"}',
            priority='medium',
            action_url=f'/visitantes/{instance.id}',  # URL em português
            metadata={
                'visitor_id': instance.id,
                'visitor_name': instance.full_name,
                'branch_id': instance.branch.id if instance.branch else None,
                'branch_name': instance.branch.name if instance.branch else None,
            }
        )
        
        # Se visitante quer oração, aumentar prioridade
        if instance.wants_prayer:
            NotificationService.notify_church_admins(
                church=instance.church,
                notification_type='new_visitor',
                title='Visitante Solicitou Oração',
                message=f'{instance.full_name} pediu oração',
                priority='high',
                action_url=f'/visitantes/{instance.id}',  # URL em português
                metadata={
                    'visitor_id': instance.id,
                    'wants_prayer': True,
                }
            )
        
        logger.info(f"Notificação criada para novo visitante: {instance.id}")
        
    except Exception as e:
        logger.error(f"Erro ao criar notificação de visitante: {e}")


@receiver(post_save, sender='visitors.Visitor')
def visitor_converted_notification(sender, instance, created, **kwargs):
    """
    Notifica quando visitante é convertido em membro
    """
    if created:
        return
    
    # Verificar se foi recém-convertido
    if not instance.converted_to_member or not instance.converted_member:
        return
    
    from apps.notifications.services import NotificationService
    
    try:
        # Notificar admins sobre conversão
        NotificationService.notify_church_admins(
            church=instance.church,
            notification_type='visitor_converted',
            title='Visitante Convertido em Membro',
            message=f'{instance.full_name} foi convertido em membro',
            priority='high',
            action_url=f'/membros/{instance.converted_member.id}',  # URL em português
            metadata={
                'visitor_id': instance.id,
                'member_id': instance.converted_member.id,
                'member_name': instance.converted_member.full_name,
                'conversion_date': instance.conversion_date.isoformat() if instance.conversion_date else None,
            }
        )
        
        logger.info(f"Notificação criada para conversão: visitante {instance.id} -> membro {instance.converted_member.id}")
        
    except Exception as e:
        logger.error(f"Erro ao criar notificação de conversão: {e}")


# =====================================
# SIGNALS DE MEMBROS
# =====================================

@receiver(post_save, sender='members.Member')
def member_created_notification(sender, instance, created, **kwargs):
    """
    Notifica administradores quando novo membro é cadastrado
    """
    if not created:
        return
    
    from apps.notifications.services import NotificationService
    
    try:
        # Notificar admins da igreja sobre novo membro
        NotificationService.notify_church_admins(
            church=instance.church,
            notification_type='new_member',
            title='Novo Membro Cadastrado',
            message=f'{instance.full_name} foi cadastrado como membro',
            priority='medium',
            action_url=f'/membros/{instance.id}',  # URL em português
            metadata={
                'member_id': instance.id,
                'member_name': instance.full_name,
                'branch_id': instance.branch.id if instance.branch else None,
                'branch_name': instance.branch.name if instance.branch else None,
            }
        )
        
        logger.info(f"Notificação criada para novo membro: {instance.id}")
        
    except Exception as e:
        logger.error(f"Erro ao criar notificação de novo membro: {e}")


@receiver(pre_save, sender='members.Member')
def member_status_changed_notification(sender, instance, **kwargs):
    """
    Notifica quando status de membresia de um membro muda
    Usa pre_save para capturar o valor antigo
    """
    if not instance.pk:
        return  # Novo membro, não precisa notificar mudança
    
    try:
        from apps.members.models import Member
        old_instance = Member.objects.get(pk=instance.pk)
        
        # Verificar se status mudou
        if old_instance.membership_status == instance.membership_status:
            return
        
        # Armazenar informação para post_save
        instance._status_changed = {
            'old_status': old_instance.membership_status,
            'new_status': instance.membership_status,
        }
        
    except Exception as e:
        logger.error(f"Erro ao verificar mudança de status do membro: {e}")


@receiver(post_save, sender='members.Member')
def member_status_changed_notification_post_save(sender, instance, created, **kwargs):
    """
    Cria notificação após mudança de status confirmada
    """
    if created or not hasattr(instance, '_status_changed'):
        return
    
    from apps.notifications.services import NotificationService
    
    try:
        status_info = instance._status_changed
        old_status = status_info['old_status']
        new_status = status_info['new_status']
        
        # Mapear status para nomes legíveis
        from apps.core.models import MembershipStatusChoices
        status_dict = dict(MembershipStatusChoices.choices)
        
        old_status_display = status_dict.get(old_status, old_status)
        new_status_display = status_dict.get(new_status, new_status)
        
        # Determinar prioridade baseado no novo status
        priority = 'medium'
        if new_status in ['deceased', 'excommunicated']:
            priority = 'high'
        elif new_status == 'inactive':
            priority = 'medium'
        
        # Notificar admins sobre mudança de status
        NotificationService.notify_church_admins(
            church=instance.church,
            notification_type='member_status_changed',
            title='Status de Membro Alterado',
            message=f'{instance.full_name}: {old_status_display} → {new_status_display}',
            priority=priority,
            action_url=f'/membros/{instance.id}',  # URL em português
            metadata={
                'member_id': instance.id,
                'member_name': instance.full_name,
                'old_status': old_status,
                'new_status': new_status,
                'old_status_display': old_status_display,
                'new_status_display': new_status_display,
            }
        )
        
        logger.info(f"Notificação criada para mudança de status: membro {instance.id} ({old_status} -> {new_status})")
        
        # Limpar flag temporário
        delattr(instance, '_status_changed')
        
    except Exception as e:
        logger.error(f"Erro ao criar notificação de mudança de status: {e}")


@receiver(post_save, sender='members.MemberTransferLog')
def member_transferred_notification(sender, instance, created, **kwargs):
    """
    Notifica quando membro é transferido entre igrejas
    """
    if not created:
        return
    
    from apps.notifications.services import NotificationService
    
    try:
        # Notificar admins da igreja de destino
        NotificationService.notify_church_admins(
            church=instance.to_church,
            notification_type='member_transferred',
            title='Membro Transferido',
            message=f'{instance.member.full_name} foi transferido de {instance.from_church.short_name}',
            priority='medium',
            action_url=f'/membros/{instance.member.id}',  # URL em português
            metadata={
                'member_id': instance.member.id,
                'member_name': instance.member.full_name,
                'from_church_id': instance.from_church.id,
                'from_church_name': instance.from_church.short_name,
                'to_church_id': instance.to_church.id,
                'to_church_name': instance.to_church.short_name,
                'reason': instance.reason,
            }
        )
        
        logger.info(f"Notificação criada para transferência: membro {instance.member.id}")
        
    except Exception as e:
        logger.error(f"Erro ao criar notificação de transferência: {e}")


# =====================================
# SIGNALS DE PERFIL DE USUÁRIO
# =====================================

@receiver(pre_save, sender='accounts.CustomUser')
def profile_updated_notification(sender, instance, **kwargs):
    """
    Notifica usuário quando seu perfil é atualizado
    """
    if not instance.pk:
        return  # Novo usuário, não precisa notificar
    
    try:
        from apps.accounts.models import CustomUser, ChurchUser
        old_instance = CustomUser.objects.get(pk=instance.pk)
        
        # Verificar se dados pessoais mudaram
        personal_fields = ['first_name', 'last_name', 'email', 'phone']
        changed_fields = []
        
        for field in personal_fields:
            old_value = getattr(old_instance, field, None)
            new_value = getattr(instance, field, None)
            if old_value != new_value:
                changed_fields.append(field)
        
        if changed_fields:
            instance._profile_updated = True
            instance._changed_fields = changed_fields
        
    except Exception as e:
        logger.error(f"Erro ao verificar mudança de perfil: {e}")


@receiver(post_save, sender='accounts.CustomUser')
def profile_updated_notification_post_save(sender, instance, created, **kwargs):
    """
    Cria notificação após atualização de perfil confirmada
    """
    if created or not hasattr(instance, '_profile_updated'):
        return
    
    from apps.notifications.services import NotificationService
    from apps.accounts.models import ChurchUser
    
    try:
        # Pegar igreja do usuário através de ChurchUser
        church_user = ChurchUser.objects.filter(user=instance).first()
        if not church_user:
            return  # Usuário sem igreja associada
        
        changed_fields = instance._changed_fields
        
        # Mapear nomes dos campos
        field_names = {
            'first_name': 'Nome',
            'last_name': 'Sobrenome',
            'email': 'E-mail',
            'phone': 'Telefone',
        }
        
        changed_fields_display = ', '.join([field_names.get(f, f) for f in changed_fields])
        
        # Notificar o próprio usuário
        NotificationService.create_notification(
            user=instance,
            church=church_user.church,
            notification_type='profile_updated',
            title='Perfil Atualizado',
            message=f'Seus dados foram atualizados: {changed_fields_display}',
            priority='low',
            action_url='/perfil',  # URL em português
            metadata={
                'changed_fields': changed_fields,
            }
        )
        
        logger.info(f"Notificação criada para atualização de perfil: usuário {instance.id}")
        
        # Limpar flags temporários
        delattr(instance, '_profile_updated')
        delattr(instance, '_changed_fields')
        
    except Exception as e:
        logger.error(f"Erro ao criar notificação de perfil atualizado: {e}")


@receiver(pre_save, sender='accounts.UserProfile')
def avatar_updated_notification(sender, instance, **kwargs):
    """
    Notifica usuário quando avatar é atualizado
    """
    if not instance.pk:
        return
    
    try:
        from apps.accounts.models import UserProfile
        old_instance = UserProfile.objects.get(pk=instance.pk)
        
        # Verificar se avatar mudou
        if old_instance.avatar != instance.avatar and instance.avatar:
            instance._avatar_updated = True
        
    except Exception as e:
        logger.error(f"Erro ao verificar mudança de avatar: {e}")


@receiver(post_save, sender='accounts.UserProfile')
def avatar_updated_notification_post_save(sender, instance, created, **kwargs):
    """
    Cria notificação após atualização de avatar confirmada
    """
    if created or not hasattr(instance, '_avatar_updated'):
        return
    
    from apps.notifications.services import NotificationService
    from apps.accounts.models import ChurchUser
    
    try:
        # Pegar igreja do usuário através de ChurchUser
        church_user = ChurchUser.objects.filter(user=instance.user).first()
        if not church_user:
            return  # Usuário sem igreja associada
        
        # Notificar o próprio usuário
        NotificationService.create_notification(
            user=instance.user,
            church=church_user.church,
            notification_type='avatar_updated',
            title='Avatar Atualizado',
            message='Sua foto de perfil foi atualizada com sucesso',
            priority='low',
            action_url='/perfil',  # URL em português
        )
        
        logger.info(f"Notificação criada para atualização de avatar: usuário {instance.user.id}")
        
        # Limpar flag temporário
        delattr(instance, '_avatar_updated')
        
    except Exception as e:
        logger.error(f"Erro ao criar notificação de avatar atualizado: {e}")


@receiver(pre_save, sender='accounts.CustomUser')
def password_changed_notification(sender, instance, **kwargs):
    """
    Notifica usuário quando senha é alterada
    """
    if not instance.pk:
        return
    
    try:
        from apps.accounts.models import CustomUser
        old_instance = CustomUser.objects.get(pk=instance.pk)
        
        # Verificar se senha mudou (hash)
        if old_instance.password != instance.password:
            instance._password_changed = True
        
    except Exception as e:
        logger.error(f"Erro ao verificar mudança de senha: {e}")


@receiver(post_save, sender='accounts.CustomUser')
def password_changed_notification_post_save(sender, instance, created, **kwargs):
    """
    Cria notificação após mudança de senha confirmada
    """
    if created or not hasattr(instance, '_password_changed'):
        return
    
    from apps.notifications.services import NotificationService
    from apps.accounts.models import ChurchUser
    
    try:
        # Pegar igreja do usuário através de ChurchUser
        church_user = ChurchUser.objects.filter(user=instance).first()
        if not church_user:
            return  # Usuário sem igreja associada
        
        # Notificar o próprio usuário (segurança)
        NotificationService.create_notification(
            user=instance,
            church=church_user.church,
            notification_type='password_changed',
            title='Senha Alterada',
            message='Sua senha foi alterada. Se não foi você, entre em contato imediatamente.',
            priority='critical',
            action_url='/perfil/seguranca',  # URL em português
        )
        
        logger.info(f"Notificação criada para mudança de senha: usuário {instance.id}")
        
        # Limpar flag temporário
        delattr(instance, '_password_changed')
        
    except Exception as e:
        logger.error(f"Erro ao criar notificação de senha alterada: {e}")
