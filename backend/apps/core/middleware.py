"""
Middleware Multi-Tenant para Obreiro Virtual
Controla o contexto de igreja/filial por usuário
"""

from django.contrib.auth.models import AnonymousUser


class TenantMiddleware:
    """
    Middleware que adiciona contexto de igreja e filial ao request
    baseado no usuário autenticado.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Inicializar contexto padrão
        request.church = None
        request.branch = None
        request.user_permissions = []

        # Se usuário está autenticado, buscar contexto
        user = getattr(request, 'user', AnonymousUser())
        
        if user.is_authenticated:
            # Import local para evitar circular import
            try:
                from apps.accounts.models import ChurchUser
                
                # Buscar link do usuário com igreja/filial
                church_user = (
                    ChurchUser.objects
                    .select_related("church", "branch")
                    .filter(user=user, is_active=True)
                    .first()
                )
                
                if church_user:
                    request.church = church_user.church
                    request.branch = church_user.branch
                    request.user_role = church_user.role
                    
                    # Cache de permissões (implementar depois)
                    request.user_permissions = self._get_user_permissions(church_user)
                    
            except ImportError:
                # Model ainda não criado, ignorar
                pass

        response = self.get_response(request)
        return response

    def _get_user_permissions(self, church_user):
        """
        Obter permissões do usuário baseado no role.
        Implementar lógica específica conforme necessário.
        """
        # TODO: Implementar cache de permissões
        # TODO: Implementar lógica por role (admin, pastor, secretario, etc)
        return [] 