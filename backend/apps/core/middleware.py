"""
Middleware para gerenciamento de Multi-Tenancy (tenant = Denomination)
"""

import threading
import logging

from apps.accounts.models import ChurchUser
from apps.core.models import RoleChoices
from apps.denominations.models import Denomination  # novo import

logger = logging.getLogger(__name__)

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

        # 1.5) Headers X-Church e X-Branch (para navegação entre churches/branches)
        #      - Permite que o frontend selecione qual church/branch visualizar
        #      - Valida se o usuário tem acesso antes de aplicar
        header_church_id = request.headers.get('X-Church')
        header_branch_id = request.headers.get('X-Branch')
        
        logger.info(f"[MIDDLEWARE] Headers recebidos: X-Church={header_church_id}, X-Branch={header_branch_id}")
        logger.info(f"[MIDDLEWARE] request.user={getattr(request, 'user', None)}, is_authenticated={getattr(request.user, 'is_authenticated', False) if hasattr(request, 'user') else False}")
        
        if header_church_id and request.user and request.user.is_authenticated:
            try:
                from apps.churches.models import Church
                header_church = Church.objects.get(pk=header_church_id)
                
                # Verificar se o usuário tem acesso a essa igreja
                has_church_access = ChurchUser.objects.filter(
                    user=request.user,
                    church=header_church,
                    is_active=True
                ).exists()
                
                logger.info(f"[MIDDLEWARE] Usuário {request.user.username} tem acesso à igreja {header_church.name}? {has_church_access}")
                
                if has_church_access:
                    request.church = header_church
                    logger.info(f"[MIDDLEWARE] ✅ Igreja definida: {header_church.name} (ID: {header_church.id})")
                    if header_church.denomination:
                        request.denomination = header_church.denomination
                    
                    # Se também enviou X-Branch, validar e aplicar
                    if header_branch_id:
                        logger.info(f"[MIDDLEWARE] Tentando buscar branch ID={header_branch_id} da igreja ID={header_church.id}")
                        try:
                            from apps.branches.models import Branch
                            header_branch = Branch.objects.get(
                                pk=header_branch_id,
                                church=header_church,  # Branch deve pertencer à igreja
                                is_active=True
                            )
                            request.branch = header_branch
                            logger.info(f"[MIDDLEWARE] ✅✅✅ Branch SETADA no request: {header_branch.name} (ID: {header_branch.id})")
                            logger.info(f"[MIDDLEWARE] ✅ request.branch={getattr(request, 'branch', None)}")
                        except Branch.DoesNotExist:
                            # Branch inválida ou não pertence à igreja, ignorar
                            logger.warning(f"[MIDDLEWARE] ❌ Branch {header_branch_id} não encontrada ou não pertence à igreja {header_church.name}")
                        except Exception as e:
                            logger.error(f"[MIDDLEWARE] ❌ Erro ao buscar branch: {e}")
                            pass
                    else:
                        # Sem X-Branch, usar a branch padrão (Matriz)
                        logger.info(f"[MIDDLEWARE] Sem X-Branch no header, request.branch = None")
                        request.branch = None
            except Church.DoesNotExist:
                # Header inválido, manter o que foi inferido acima
                logger.warning(f"[MIDDLEWARE] ❌ Igreja {header_church_id} não encontrada")
                pass
            except Exception as e:
                # Qualquer outro erro, manter o que foi inferido
                logger.warning(f"[MIDDLEWARE] ❌ Erro ao processar headers X-Church/X-Branch: {e}")

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
