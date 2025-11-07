"""
Views para recuperação de senha
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .serializers_password_reset import (
    RequestPasswordResetSerializer,
    ValidateResetTokenSerializer,
    ResetPasswordSerializer
)
from apps.core.services import EmailService
from apps.core.services.email_service import EmailServiceError
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])  # Qualquer um pode solicitar reset
def request_password_reset(request):
    """
    Solicita redefinição de senha.
    
    POST /api/v1/auth/password-reset/request/
    Body: { "email": "usuario@exemplo.com" }
    
    Resposta sempre retorna sucesso (por segurança),
    mas só envia email se o email existir.
    """
    serializer = RequestPasswordResetSerializer(
        data=request.data,
        context={'request': request}
    )
    
    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Criar token (retorna None se email não existir)
    reset_token = serializer.save()
    
    # Se token foi criado, enviar email
    if reset_token:
        try:
            EmailService.send_password_reset(
                user_email=reset_token.user.email,
                reset_token=reset_token.token,
                member_name=reset_token.user.full_name
            )
            
            logger.info(
                f"📧 Email de redefinição enviado para {reset_token.user.email}"
            )
        except EmailServiceError as e:
            logger.error(
                f"❌ Erro ao enviar email de redefinição para {reset_token.user.email}: {e}",
                exc_info=True
            )
            # Não falhar a requisição se email não for enviado
            # Admin pode investigar logs
        except Exception as e:
            logger.error(
                f"❌ Erro inesperado ao enviar email: {e}",
                exc_info=True
            )
    
    # SEMPRE retornar sucesso (por segurança)
    # Não revelar se o email existe ou não
    return Response({
        'message': 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.',
        'detail': 'Verifique sua caixa de entrada e spam.'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])  # Qualquer um pode validar token
def validate_reset_token(request):
    """
    Valida um token de redefinição.
    
    POST /api/v1/auth/password-reset/validate/
    Body: { "token": "abc123..." }
    
    Retorna se o token é válido ou não.
    """
    serializer = ValidateResetTokenSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    
    return Response({
        'message': 'Token válido.',
        'valid': True
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])  # Qualquer um pode resetar com token válido
def reset_password(request):
    """
    Redefine a senha usando um token válido.
    
    POST /api/v1/auth/password-reset/confirm/
    Body: {
        "token": "abc123...",
        "new_password": "SenhaNova123!",
        "confirm_password": "SenhaNova123!"
    }
    
    Se bem-sucedido, o token é marcado como usado
    e o usuário pode fazer login com a nova senha.
    """
    serializer = ResetPasswordSerializer(
        data=request.data,
        context={'request': request}
    )
    
    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Redefinir senha
    user = serializer.save()
    
    logger.info(
        f"✅ Senha redefinida com sucesso para {user.email}"
    )
    
    return Response({
        'message': 'Senha redefinida com sucesso!',
        'detail': 'Você já pode fazer login com sua nova senha.',
        'user_email': user.email
    }, status=status.HTTP_200_OK)
