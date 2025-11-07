"""
Serializers para recuperação de senha
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models_password_reset import PasswordResetToken
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


class RequestPasswordResetSerializer(serializers.Serializer):
    """
    Serializer para solicitar redefinição de senha.
    Recebe apenas o email do usuário.
    """
    email = serializers.EmailField(
        required=True,
        help_text='Email do usuário que esqueceu a senha'
    )
    
    def validate_email(self, value):
        """Validar que o email existe no sistema"""
        # Normalizar email
        value = value.lower().strip()
        
        # Verificar se existe usuário com este email
        if not User.objects.filter(email=value, is_active=True).exists():
            # Por segurança, não revelar se o email existe ou não
            # Retornar sucesso sempre, mas logar tentativa suspeita
            logger.warning(
                f"⚠️  Tentativa de redefinição de senha para email não cadastrado: {value}"
            )
        
        return value
    
    def create(self, validated_data):
        """
        Cria um token de redefinição de senha.
        
        Retorna o token criado (ou None se email não existir).
        """
        email = validated_data['email']
        
        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            # Por segurança, não revelar que o email não existe
            # Retornar None silenciosamente
            return None
        
        # Pegar IP do request (se disponível)
        request = self.context.get('request')
        ip_address = None
        if request:
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip_address = x_forwarded_for.split(',')[0]
            else:
                ip_address = request.META.get('REMOTE_ADDR')
        
        # Criar token
        token = PasswordResetToken.create_for_user(user, ip_address=ip_address)
        
        logger.info(
            f"✅ Token de redefinição criado para {user.email} (IP: {ip_address})"
        )
        
        return token


class ValidateResetTokenSerializer(serializers.Serializer):
    """
    Serializer para validar um token de redefinição.
    """
    token = serializers.CharField(
        required=True,
        help_text='Token de redefinição de senha'
    )
    
    def validate_token(self, value):
        """Validar que o token existe e é válido"""
        try:
            reset_token = PasswordResetToken.objects.get(token=value)
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError('Token inválido ou expirado.')
        
        if not reset_token.is_valid():
            raise serializers.ValidationError('Token inválido ou expirado.')
        
        return value


class ResetPasswordSerializer(serializers.Serializer):
    """
    Serializer para redefinir a senha com um token válido.
    """
    token = serializers.CharField(
        required=True,
        help_text='Token de redefinição de senha'
    )
    
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        min_length=8,
        help_text='Nova senha (mínimo 8 caracteres)'
    )
    
    confirm_password = serializers.CharField(
        required=True,
        write_only=True,
        help_text='Confirmação da nova senha'
    )
    
    def validate_token(self, value):
        """Validar que o token existe e é válido"""
        try:
            reset_token = PasswordResetToken.objects.get(token=value)
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError('Token inválido ou expirado.')
        
        if not reset_token.is_valid():
            raise serializers.ValidationError('Token inválido ou expirado.')
        
        # Armazenar token no contexto para uso no update
        self.context['reset_token'] = reset_token
        
        return value
    
    def validate_new_password(self, value):
        """Validar a nova senha usando validadores do Django"""
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        
        return value
    
    def validate(self, attrs):
        """Validar que as senhas conferem"""
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'As senhas não conferem.'
            })
        
        return attrs
    
    def save(self):
        """
        Redefine a senha do usuário e marca o token como usado.
        
        Returns:
            User: Usuário com senha redefinida
        """
        reset_token = self.context['reset_token']
        new_password = self.validated_data['new_password']
        
        # Pegar o usuário
        user = reset_token.user
        
        # Log hash anterior (para debug)
        old_hash = user.password[:30]
        logger.debug(f"[RESET] Hash anterior: {old_hash}...")
        
        # Redefinir senha
        user.set_password(new_password)
        user.save(update_fields=['password'])
        
        # Verificar que a senha foi salva corretamente
        user.refresh_from_db()
        new_hash = user.password[:30]
        password_check = user.check_password(new_password)
        
        logger.debug(f"[RESET] Hash novo: {new_hash}...")
        logger.debug(f"[RESET] Verificação check_password: {password_check}")
        
        if not password_check:
            logger.error(
                f"❌ ERRO CRÍTICO: Senha NÃO foi salva corretamente para {user.email}! "
                f"check_password retornou False após save()"
            )
            raise Exception("Falha ao salvar senha - verificação falhou")
        
        # Marcar token como usado
        reset_token.mark_as_used()
        
        logger.info(
            f"✅ Senha redefinida com sucesso para usuário {user.email} - Verificação: OK"
        )
        
        return user


class PasswordResetTokenSerializer(serializers.ModelSerializer):
    """
    Serializer para leitura de tokens (admin/debug).
    """
    user_email = serializers.CharField(source='user.email', read_only=True)
    is_valid = serializers.SerializerMethodField()
    time_remaining = serializers.SerializerMethodField()
    
    class Meta:
        model = PasswordResetToken
        fields = [
            'id', 'user_email', 'token', 'expires_at', 'is_used', 
            'used_at', 'ip_address', 'created_at', 'is_valid', 'time_remaining'
        ]
        read_only_fields = fields
    
    def get_is_valid(self, obj):
        """Verifica se o token ainda é válido"""
        return obj.is_valid()
    
    def get_time_remaining(self, obj):
        """Retorna tempo restante em segundos"""
        if not obj.is_valid():
            return 0
        
        remaining = obj.time_remaining()
        return max(0, int(remaining.total_seconds()))
