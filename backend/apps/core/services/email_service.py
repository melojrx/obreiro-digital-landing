"""
Serviço de envio de emails para o sistema Obreiro Digital.

Este módulo centraliza toda a lógica de envio de emails,
incluindo emails de boas-vindas com credenciais de acesso.

Características:
- Suporte a templates HTML e texto
- Logging detalhado de sucesso/falha
- Tratamento robusto de erros
- Contexto rico para templates
- Fallback para texto puro

Uso:
    from apps.core.services import EmailService
    
    EmailService.send_welcome_credentials(
        member_name='João Silva',
        user_email='joao@example.com',
        user_password='senha123',
        church_name='Igreja Central',
        role_display='Secretário(a)',
        role_description='Você pode gerenciar membros...',
    )
"""

import logging
from typing import Optional
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


class EmailServiceError(Exception):
    """Exceção customizada para erros do serviço de email."""
    pass


class EmailService:
    """
    Serviço centralizado para envio de emails.
    
    Todos os métodos são estáticos para facilitar o uso
    sem necessidade de instanciar a classe.
    """
    
    # Configurações padrão
    DEFAULT_FROM_EMAIL = settings.DEFAULT_FROM_EMAIL
    FRONTEND_URL = settings.FRONTEND_URL
    
    # Templates disponíveis
    TEMPLATE_WELCOME_MEMBER = 'emails/welcome_member.html'
    TEMPLATE_WELCOME_MEMBER_TXT = 'emails/welcome_member.txt'
    
    @staticmethod
    def _get_role_description(role: str) -> str:
        """
        Retorna descrição detalhada das capacidades de cada papel.
        
        Args:
            role: Código do papel (church_admin, secretary, etc)
            
        Returns:
            Descrição formatada das responsabilidades do papel
        """
        descriptions = {
            'super_admin': (
                'Como Super Administrador, você tem acesso completo ao sistema:\n'
                '• Gerenciar todas as denominações e igrejas\n'
                '• Configurar permissões globais\n'
                '• Acessar relatórios consolidados\n'
                '• Administrar usuários e cobranças'
            ),
            'church_admin': (
                'Como Administrador da Igreja, você pode:\n'
                '• Gerenciar todas as igrejas da denominação\n'
                '• Criar e administrar filiais\n'
                '• Cadastrar e editar membros\n'
                '• Definir líderes e responsáveis\n'
                '• Configurar atividades e ministérios\n'
                '• Visualizar relatórios consolidados\n'
                '• Gerenciar assinaturas e pagamentos'
            ),
            'secretary': (
                'Como Secretário(a), você pode:\n'
                '• Cadastrar e editar membros\n'
                '• Registrar visitantes\n'
                '• Organizar atividades e eventos\n'
                '• Gerenciar pedidos de oração\n'
                '• Gerar relatórios básicos\n'
                '• Atualizar informações da igreja'
            ),
            # Roles legados (mantidos para compatibilidade)
            'pastor': (
                'Como Pastor, você tem acesso às informações da igreja e pode '
                'acompanhar membros, atividades e relatórios.'
            ),
            'leader': (
                'Como Líder, você pode visualizar informações do seu ministério '
                'e acompanhar atividades relacionadas.'
            ),
            'member': (
                'Como Membro, você pode visualizar informações gerais da igreja '
                'e participar de atividades.'
            ),
            'read_only': (
                'Você tem acesso somente leitura às informações da igreja.'
            ),
        }
        
        return descriptions.get(role, 'Você tem acesso ao sistema Obreiro Digital.')
    
    @staticmethod
    def _build_email_context(
        member_name: str,
        user_email: str,
        user_password: str,
        church_name: str,
        role_display: str,
        role_code: str,
        **extra_context
    ) -> dict:
        """
        Constrói o contexto completo para renderização dos templates.
        
        Args:
            member_name: Nome completo do membro
            user_email: Email do usuário
            user_password: Senha temporária gerada
            church_name: Nome da igreja
            role_display: Nome amigável do papel (ex: "Secretário(a)")
            role_code: Código do papel (ex: "secretary")
            **extra_context: Contexto adicional personalizado
            
        Returns:
            Dicionário com todas as variáveis para o template
        """
        context = {
            # Dados do membro
            'member_name': member_name,
            'user_email': user_email,
            'user_password': user_password,
            
            # Dados da igreja
            'church_name': church_name,
            
            # Dados do papel
            'role_display': role_display,
            'role_description': EmailService._get_role_description(role_code),
            
            # URLs do sistema
            'login_url': f'{EmailService.FRONTEND_URL}/login',
            'frontend_url': EmailService.FRONTEND_URL,
            
            # Metadata
            'support_email': 'suporteobreirovirtual@gmail.com',
        }
        
        # Adiciona contexto extra se fornecido
        context.update(extra_context)
        
        return context
    
    @staticmethod
    def send_welcome_credentials(
        member_name: str,
        user_email: str,
        user_password: str,
        church_name: str,
        role_display: str,
        role_code: str,
        **extra_context
    ) -> bool:
        """
        Envia email de boas-vindas com credenciais de acesso ao sistema.
        
        Este método renderiza templates HTML e texto puro, envia email
        multipart (HTML + texto) e registra logs detalhados.
        
        Args:
            member_name: Nome completo do membro (ex: "João Silva")
            user_email: Email do usuário (destino do email)
            user_password: Senha temporária gerada automaticamente
            church_name: Nome da igreja (ex: "Igreja Central")
            role_display: Nome amigável do papel (ex: "Secretário(a)")
            role_code: Código do papel (ex: "secretary")
            **extra_context: Contexto adicional para o template
            
        Returns:
            True se o email foi enviado com sucesso, False caso contrário
            
        Raises:
            EmailServiceError: Se houver erro crítico no envio
            
        Exemplo:
            >>> EmailService.send_welcome_credentials(
            ...     member_name='João Silva',
            ...     user_email='joao@example.com',
            ...     user_password='abc123XYZ',
            ...     church_name='Igreja Central',
            ...     role_display='Secretário(a)',
            ...     role_code='secretary',
            ... )
            True
        """
        try:
            # Validações básicas
            if not all([member_name, user_email, user_password, church_name, role_display, role_code]):
                raise EmailServiceError(
                    "Todos os parâmetros obrigatórios devem ser fornecidos"
                )
            
            logger.info(
                f"📧 Iniciando envio de email de boas-vindas para {user_email} "
                f"(Igreja: {church_name}, Papel: {role_display})"
            )
            
            # Construir contexto para os templates
            context = EmailService._build_email_context(
                member_name=member_name,
                user_email=user_email,
                user_password=user_password,
                church_name=church_name,
                role_display=role_display,
                role_code=role_code,
                **extra_context
            )
            
            # Renderizar templates
            try:
                html_content = render_to_string(
                    EmailService.TEMPLATE_WELCOME_MEMBER,
                    context
                )
                text_content = render_to_string(
                    EmailService.TEMPLATE_WELCOME_MEMBER_TXT,
                    context
                )
            except Exception as e:
                logger.error(f"❌ Erro ao renderizar templates: {e}")
                raise EmailServiceError(f"Falha ao renderizar templates: {e}")
            
            # Criar email multipart (HTML + texto puro)
            subject = f'Bem-vindo ao Obreiro Digital - {church_name}'
            
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,  # Versão texto (fallback)
                from_email=EmailService.DEFAULT_FROM_EMAIL,
                to=[user_email],
            )
            
            # Anexar versão HTML
            email.attach_alternative(html_content, "text/html")
            
            # Enviar email
            email.send(fail_silently=False)
            
            logger.info(
                f"✅ Email de boas-vindas enviado com sucesso para {user_email}"
            )
            
            return True
            
        except EmailServiceError:
            # Re-raise exceções de serviço
            raise
            
        except Exception as e:
            logger.error(
                f"❌ Erro ao enviar email de boas-vindas para {user_email}: {e}",
                exc_info=True
            )
            raise EmailServiceError(f"Falha ao enviar email: {e}")
    
    @staticmethod
    def send_password_reset(
        user_email: str,
        reset_token: str,
        member_name: Optional[str] = None,
    ) -> bool:
        """
        Envia email de redefinição de senha (FUTURO).
        
        Args:
            user_email: Email do usuário
            reset_token: Token de redefinição
            member_name: Nome do membro (opcional)
            
        Returns:
            True se enviado com sucesso
            
        Note:
            Este método será implementado no futuro quando
            tivermos o fluxo de redefinição de senha.
        """
        logger.warning(
            f"⚠️  Método send_password_reset ainda não implementado "
            f"(chamado para {user_email})"
        )
        raise NotImplementedError(
            "Funcionalidade de redefinição de senha será implementada em breve"
        )
    
    @staticmethod
    def send_notification(
        user_email: str,
        subject: str,
        message: str,
        **extra_context
    ) -> bool:
        """
        Envia notificação genérica por email (FUTURO).
        
        Args:
            user_email: Email do destinatário
            subject: Assunto do email
            message: Corpo da mensagem
            **extra_context: Contexto adicional
            
        Returns:
            True se enviado com sucesso
            
        Note:
            Este método será implementado no futuro para
            notificações gerais do sistema.
        """
        logger.warning(
            f"⚠️  Método send_notification ainda não implementado "
            f"(chamado para {user_email})"
        )
        raise NotImplementedError(
            "Funcionalidade de notificações genéricas será implementada em breve"
        )
