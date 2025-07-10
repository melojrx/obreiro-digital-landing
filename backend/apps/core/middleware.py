"""
Middleware para gerenciamento de Multi-Tenancy
"""

from apps.accounts.models import ChurchUser
import threading

_thread_locals = threading.local()

def get_current_request():
    """
    Retorna o objeto de requisição atual a partir do armazenamento
    thread-local.
    """
    return getattr(_thread_locals, 'request', None)

class TenantMiddleware:
    """
    Este middleware identifica o tenant (Church) com base no usuário logado
    e o anexa ao objeto de requisição (request).

    Ele garante que as views e outras partes do sistema saibam qual
    igreja está ativa para o usuário atual, permitindo o isolamento
    de dados.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Armazena o request no thread-local para acesso global
        _thread_locals.request = request

        # O middleware só atua se o usuário estiver autenticado
        if request.user and request.user.is_authenticated:
            try:
                # Busca o primeiro vínculo ChurchUser ativo para o usuário.
                # O select_related otimiza a consulta, buscando a igreja
                # e a filial na mesma query.
                church_user = ChurchUser.objects.select_related(
                    'church', 'branch'
                ).filter(user=request.user, is_active=True).first()

                if church_user:
                    request.church = church_user.church
                    request.branch = church_user.branch
                else:
                    request.church = None
                    request.branch = None
            
            except ChurchUser.DoesNotExist:
                request.church = None
                request.branch = None
        else:
            request.church = None
            request.branch = None

        response = self.get_response(request)

        # Limpa o request do thread-local após a requisição ser concluída
        if hasattr(_thread_locals, 'request'):
            del _thread_locals.request

        return response 