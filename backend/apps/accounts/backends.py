"""
Backend de autenticação personalizado para ObreiroVirtual
Permite login com email ao invés de username
"""

from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()


class EmailBackend(ModelBackend):
    """
    Backend de autenticação que permite login com email.
    Aceita tanto email quanto username para compatibilidade.
    """
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        """
        Autenticar usuário com email ou username
        
        Args:
            request: Request HTTP
            username: Email ou username do usuário
            password: Senha do usuário
            **kwargs: Argumentos adicionais
            
        Returns:
            User: Usuário autenticado ou None
        """
        if username is None or password is None:
            return None
        
        try:
            # Tentar encontrar usuário por email ou username
            user = User.objects.get(
                Q(email__iexact=username) | Q(username__iexact=username)
            )
            
            # Verificar senha
            if user.check_password(password) and self.user_can_authenticate(user):
                return user
                
        except User.DoesNotExist:
            # Executar hash da senha mesmo se usuário não existir
            # para evitar timing attacks
            User().set_password(password)
            return None
        
        return None
    
    def get_user(self, user_id):
        """
        Obter usuário pelo ID
        
        Args:
            user_id: ID do usuário
            
        Returns:
            User: Usuário ou None
        """
        try:
            user = User.objects.get(pk=user_id)
            return user if self.user_can_authenticate(user) else None
        except User.DoesNotExist:
            return None 