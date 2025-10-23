"""
Middleware para gerenciamento de Multi-Tenancy (tenant = Denomination)
"""

import threading

from apps.accounts.models import ChurchUser
from apps.core.models import RoleChoices
from apps.denominations.models import Denomination  # novo import

_thread_locals = threading.local()

def get_current_request():
    """Retorna o objeto de requisição atual (thread-local)."""
    return getattr(_thread_locals, 'request', None)

def get_current_denomination():
    """Convenience para uso fora de views/serializers."""
    req = get_current_request()
    return getattr(req, 'denomination', None) if req else None

class TenantMiddleware:
    """
    Identifica o tenant (Denomination) com base no usuário logado OU no header
    `X-Denomination-Id` e anexa `request.denomination`.

    Mantém `request.church` e `request.branch` como escopos convenientes,
    mas o isolamento de dados deve usar SEMPRE `request.denomination`.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Armazena o request no thread-local para acesso global
        _thread_locals.request = request

        request.church_user = None
        request.denomination = None
        request.church = None
        request.branch = None

        # 1) Usuário autenticado: prioriza a igreja ativa
        church_user = None
        if request.user and request.user.is_authenticated:
            # Preferir o vínculo marcado como "ativo" pelo usuário;
            # fallback: qualquer vínculo ativo
            qs = (ChurchUser.objects
                  .select_related('church__denomination', 'branch')
                  .filter(user=request.user, is_active=True)
                  .order_by('-is_user_active_church', 'id'))
            church_user = qs.first()

            if church_user:
                request.church_user = church_user
                request.church = church_user.church
                # TODO: suportar branch ativa assim que ChurchUser tiver referência explícita
                branch_attr = getattr(church_user, 'active_branch', None)
                if branch_attr is not None:
                    request.branch = branch_attr
                # tenant principal
                if church_user.church and church_user.church.denomination:
                    request.denomination = church_user.church.denomination

        # 2) Header opcional X-Denomination-Id (para multi-denom, público/QR etc.)
        #    - Só aceita se o usuário (quando autenticado) tiver acesso a essa denominação.
        #    - Se não autenticado, apenas valida se a denominação existe (para rotas públicas).
        header_denom_id = request.headers.get('X-Denomination-Id')
        if header_denom_id:
            try:
                header_denom = Denomination.objects.get(pk=header_denom_id)
                if request.user and request.user.is_authenticated:
                    # Apenas staff/backoffice podem forçar override via header
                    is_staff_like = (
                        request.user.is_superuser
                        or request.user.is_staff
                        or request.user.church_users.filter(
                            role=RoleChoices.SUPER_ADMIN,
                            is_active=True,
                        ).exists()
                    )
                    if not is_staff_like:
                        header_denom = None  # Ignorar override não autorizado
                    else:
                        # valida se o usuário possui ao menos um vínculo a uma church dessa denominação
                        has_access = ChurchUser.objects.filter(
                            user=request.user,
                            is_active=True,
                            church__denomination=header_denom
                        ).exists()
                        if not has_access:
                            header_denom = None
                if header_denom:
                    if request.user and request.user.is_authenticated:
                        request.denomination = header_denom
                        # Opcional: reposicionar church/branch "ativas" para essa denom
                        if not (request.church and request.church.denomination_id == header_denom.id):
                            cu = (ChurchUser.objects
                                  .select_related('church__denomination', 'branch')
                                  .filter(user=request.user,
                                          is_active=True,
                                          church__denomination=header_denom)
                                  .order_by('-is_user_active_church', 'id')
                                  .first())
                            if cu:
                                request.church_user = cu
                                request.church = cu.church
                                branch_attr = getattr(cu, 'active_branch', None)
                                if branch_attr is not None:
                                    request.branch = branch_attr
                else:
                    # Usuário anônimo: permite denom para rotas públicas
                    request.denomination = header_denom
            except Denomination.DoesNotExist:
                # Header inválido: mantém o que já foi inferido acima (ou None)
                pass

        response = self.get_response(request)

        # Limpa o request do thread-local ao final
        if hasattr(_thread_locals, 'request'):
            del _thread_locals.request

        return response
