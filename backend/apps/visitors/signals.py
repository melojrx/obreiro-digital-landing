"""
Signals para o módulo de visitantes
Notificações automáticas quando visitantes se registram
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags

from .models import Visitor


@receiver(post_save, sender=Visitor)
def visitor_registered_notification(sender, instance, created, **kwargs):
    """
    Notifica a equipe pastoral quando um novo visitante se registra
    """
    if not created:
        return
    
    # Só notificar para registros via QR code
    if instance.registration_source != 'qr_code':
        return
    
    try:
        # Dados para o template
        context = {
            'visitor': instance,
            'branch': instance.branch,
            'church': instance.church,
            'registration_date': instance.created_at,
        }
        
        # Renderizar template HTML (se existir)
        try:
            html_message = render_to_string('emails/new_visitor_notification.html', context)
            plain_message = strip_tags(html_message)
        except:
            # Fallback para mensagem simples
            plain_message = f"""
Novo Visitante Registrado via QR Code

Nome: {instance.full_name}
E-mail: {instance.email}
Telefone: {instance.phone}
Igreja: {instance.church.name}
Filial: {instance.branch.name}
Data: {instance.created_at.strftime('%d/%m/%Y às %H:%M')}

Primeira visita: {'Sim' if instance.first_visit else 'Não'}
Quer oração: {'Sim' if instance.wants_prayer else 'Não'}
Interesse em grupo de crescimento: {'Sim' if instance.wants_growth_group else 'Não'}

Observações: {instance.observations or 'Nenhuma'}

---
Sistema Obreiro Digital
"""
            html_message = None
        
        # Lista de destinatários (pastor da filial + administrativos)
        recipients = []
        
        # Pastor responsável pela filial
        if instance.branch.pastor and instance.branch.pastor.email:
            recipients.append(instance.branch.pastor.email)
        
        # Buscar outros usuários administrativos da igreja
        try:
            from apps.accounts.models import ChurchUser
            admin_users = ChurchUser.objects.filter(
                church=instance.church,
                is_active=True,
                role__in=['CHURCH_ADMIN', 'PASTOR', 'SECRETARY']
            ).select_related('user')
            
            for church_user in admin_users:
                if church_user.user.email and church_user.user.email not in recipients:
                    recipients.append(church_user.user.email)
        except:
            pass
        
        # Se não há destinatários específicos, usar e-mail da igreja
        if not recipients and instance.church.email:
            recipients.append(instance.church.email)
        
        # Se ainda não há destinatários, usar e-mail padrão
        if not recipients:
            recipients = [settings.DEFAULT_FROM_EMAIL]
        
        # Enviar notificação
        if recipients:
            send_mail(
                subject=f'[{instance.church.short_name}] Novo Visitante: {instance.full_name}',
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=recipients,
                html_message=html_message,
                fail_silently=True  # Não quebrar se falhar
            )
            
            print(f"📧 Notificação enviada para {len(recipients)} destinatário(s) sobre novo visitante: {instance.full_name}")
        
        # Log do evento
        print(f"🆕 Novo visitante registrado via QR Code: {instance.full_name} ({instance.church.name} - {instance.branch.name})")
        
    except Exception as e:
        print(f"❌ Erro ao enviar notificação de novo visitante: {e}")


@receiver(post_save, sender=Visitor)
def visitor_converted_notification(sender, instance, created, **kwargs):
    """
    Notifica quando um visitante é convertido em membro
    """
    if created:
        return
    
    # Verificar se foi convertido agora
    if not instance.converted_to_member or not instance.conversion_date:
        return
    
    # Verificar se a conversão é recente (para evitar notificações duplicadas)
    from django.utils import timezone
    from datetime import timedelta
    
    if instance.conversion_date < timezone.now() - timedelta(minutes=5):
        return
    
    try:
        # Dados para notificação
        context = {
            'visitor': instance,
            'member': instance.converted_member,
            'branch': instance.branch,
            'church': instance.church,
            'conversion_date': instance.conversion_date,
        }
        
        # Mensagem de conversão
        plain_message = f"""
Visitante Convertido em Membro

Visitante: {instance.full_name}
Membro ID: {instance.converted_member.id if instance.converted_member else 'N/A'}
Igreja: {instance.church.name}
Filial: {instance.branch.name}
Data da Conversão: {instance.conversion_date.strftime('%d/%m/%Y às %H:%M')}

Notas da Conversão: {instance.conversion_notes or 'Nenhuma'}

---
Sistema Obreiro Digital
"""
        
        # Lista de destinatários
        recipients = []
        
        if instance.branch.pastor and instance.branch.pastor.email:
            recipients.append(instance.branch.pastor.email)
        
        # Buscar administrativos
        try:
            from apps.accounts.models import ChurchUser
            admin_users = ChurchUser.objects.filter(
                church=instance.church,
                is_active=True,
                role__in=['CHURCH_ADMIN', 'PASTOR']
            ).select_related('user')
            
            for church_user in admin_users:
                if church_user.user.email and church_user.user.email not in recipients:
                    recipients.append(church_user.user.email)
        except:
            pass
        
        if not recipients and instance.church.email:
            recipients.append(instance.church.email)
        
        if not recipients:
            recipients = [settings.DEFAULT_FROM_EMAIL]
        
        # Enviar notificação
        if recipients:
            send_mail(
                subject=f'[{instance.church.short_name}] Visitante Convertido: {instance.full_name}',
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=recipients,
                fail_silently=True
            )
            
            print(f"🎉 Notificação de conversão enviada para {len(recipients)} destinatário(s): {instance.full_name}")
        
    except Exception as e:
        print(f"❌ Erro ao enviar notificação de conversão: {e}")