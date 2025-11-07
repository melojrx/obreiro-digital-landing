"""
Modelos para recuperação de senha
"""
import secrets
from datetime import timedelta
from django.db import models
from django.utils import timezone
from apps.core.models import BaseModel


class PasswordResetToken(BaseModel):
    """
    Token de redefinição de senha.
    
    Características:
    - Token único e seguro (32 caracteres)
    - Expira em 1 hora
    - Pode ser usado apenas uma vez
    - Vinculado a um usuário específico
    """
    
    user = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.CASCADE,
        related_name='password_reset_tokens',
        verbose_name='Usuário',
        help_text='Usuário que solicitou a redefinição'
    )
    
    token = models.CharField(
        'Token',
        max_length=64,
        unique=True,
        help_text='Token único para redefinição de senha'
    )
    
    expires_at = models.DateTimeField(
        'Expira em',
        help_text='Data e hora de expiração do token'
    )
    
    is_used = models.BooleanField(
        'Utilizado',
        default=False,
        help_text='Indica se o token já foi utilizado'
    )
    
    used_at = models.DateTimeField(
        'Utilizado em',
        null=True,
        blank=True,
        help_text='Data e hora em que o token foi utilizado'
    )
    
    ip_address = models.GenericIPAddressField(
        'Endereço IP',
        null=True,
        blank=True,
        help_text='IP de onde foi solicitada a redefinição'
    )
    
    class Meta:
        verbose_name = 'Token de Redefinição de Senha'
        verbose_name_plural = 'Tokens de Redefinição de Senha'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['user', 'is_used']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"Token de {self.user.email} - {'Usado' if self.is_used else 'Válido'}"
    
    @classmethod
    def generate_token(cls):
        """Gera um token seguro de 32 caracteres"""
        return secrets.token_urlsafe(32)
    
    @classmethod
    def create_for_user(cls, user, ip_address=None):
        """
        Cria um novo token de redefinição para um usuário.
        Invalida tokens anteriores do mesmo usuário.
        
        Args:
            user: Instância do CustomUser
            ip_address: IP de onde veio a solicitação (opcional)
            
        Returns:
            PasswordResetToken: Token criado
        """
        # Invalidar tokens anteriores não utilizados
        cls.objects.filter(
            user=user,
            is_used=False,
            expires_at__gt=timezone.now()
        ).update(is_active=False)
        
        # Criar novo token
        token = cls(
            user=user,
            token=cls.generate_token(),
            expires_at=timezone.now() + timedelta(hours=1),  # Expira em 1 hora
            ip_address=ip_address,
            is_active=True
        )
        token.save()
        
        return token
    
    def is_valid(self):
        """
        Verifica se o token ainda é válido.
        
        Returns:
            bool: True se válido, False caso contrário
        """
        if self.is_used:
            return False
        
        if not self.is_active:
            return False
        
        if timezone.now() > self.expires_at:
            return False
        
        return True
    
    def mark_as_used(self):
        """Marca o token como utilizado"""
        self.is_used = True
        self.used_at = timezone.now()
        self.save(update_fields=['is_used', 'used_at', 'updated_at'])
    
    def time_remaining(self):
        """
        Retorna o tempo restante até a expiração.
        
        Returns:
            timedelta: Tempo restante (ou timedelta negativo se expirado)
        """
        return self.expires_at - timezone.now()
