"""
Mixins utilitários para escopo multi-tenant (igreja/filial).

Fornece um filtro de queryset padronizado baseado no usuário logado,
respeitando papéis e filiais atribuídas quando aplicável.
"""

from typing import Optional
from django.db.models import QuerySet
import logging

logger = logging.getLogger(__name__)


class ChurchScopedQuerysetMixin:
    """
    Mixin para aplicar escopo de tenant a QuerySets.

    Regras:
    - Superuser: retorna queryset sem filtro.
    - Base: filtra por igreja ativa (request.church ou ChurchUser.get_active_church_for_user).
    - Secretary: se o modelo tem campo "branch", filtra por branches atribuídas quando existirem.
    - request.branch (se definido) restringe ainda mais quando fizer sentido.
    """

    church_field_name = 'church'  # Nome do campo FK para Church
    branch_field_name = 'branch'  # Nome do campo FK para Branch (quando existir)

    def _get_active_church(self, request):
        """
        Obtém a igreja ativa do request.
        
        Prioridade:
        1. Header X-Church (enviado pelo frontend para seleção de igreja)
        2. request.church (setado pelo middleware)
        3. Igreja ativa via ChurchUser (fallback)
        """
        # 1. Verificar header X-Church primeiro (DRF já autenticou)
        header_church_id = request.headers.get('X-Church')
        if header_church_id and request.user and request.user.is_authenticated:
            try:
                from apps.churches.models import Church
                from apps.accounts.models import ChurchUser
                
                # Verificar se o usuário tem acesso a essa igreja
                has_church_access = ChurchUser.objects.filter(
                    user=request.user,
                    church_id=header_church_id,
                    is_active=True
                ).exists()
                
                if has_church_access:
                    church = Church.objects.filter(pk=header_church_id).first()
                    if church:
                        logger.info(f"[_get_active_church] ✅ Igreja do header X-Church: {church.name} (ID: {church.id})")
                        return church
            except Exception as e:
                logger.error(f"[_get_active_church] ❌ Erro ao processar X-Church: {e}")
        
        # 2. Preferir church injetada pelo middleware
        church = getattr(request, 'church', None)
        if church:
            logger.info(f"[_get_active_church] Igreja do request.church: {church.name}")
            return church
            
        # 3. Fallback: igreja ativa via ChurchUser
        try:
            from apps.accounts.models import ChurchUser
            church = ChurchUser.objects.get_active_church_for_user(request.user)
            if church:
                logger.info(f"[_get_active_church] Igreja do ChurchUser: {church.name}")
            return church
        except Exception:
            return None

    def _get_active_branch(self, request):
        """
        Obtém a branch ativa do request.
        
        Prioridade:
        1. Header X-Branch (enviado pelo frontend para seleção de branch)
        2. request.branch (setado pelo middleware)
        3. None (sem branch ativa)
        """
        # 1. Verificar header X-Branch primeiro (DRF já autenticou)
        header_branch_id = request.headers.get('X-Branch')
        if header_branch_id and request.user and request.user.is_authenticated:
            try:
                from apps.branches.models import Branch
                from apps.accounts.models import ChurchUser
                
                # Verificar se o usuário tem acesso a essa branch
                # Primeiro verificar se a branch existe e pertence à igreja do usuário
                active_church = self._get_active_church(request)
                if active_church:
                    branch = Branch.objects.filter(
                        pk=header_branch_id,
                        church=active_church,
                        is_active=True
                    ).first()
                    
                    if branch:
                        logger.info(f"[_get_active_branch] ✅ Branch do header X-Branch: {branch.name} (ID: {branch.id})")
                        return branch
                    else:
                        logger.warning(f"[_get_active_branch] ❌ Branch {header_branch_id} não encontrada ou não pertence à igreja")
            except Exception as e:
                logger.error(f"[_get_active_branch] ❌ Erro ao processar X-Branch: {e}")
        
        # 2. Fallback: usar request.branch (setado pelo middleware)
        branch = getattr(request, 'branch', None)
        logger.info(f"[_get_active_branch] Branch do request.branch: {branch}")
        return branch

    def filter_queryset_by_scope(self, request, queryset: QuerySet, *, has_branch: Optional[bool] = True) -> QuerySet:
        user = request.user
        if not user or not user.is_authenticated:
            return queryset.none()

        if user.is_superuser:
            return queryset

        active_church = self._get_active_church(request)
        if not active_church:
            return queryset.none()

        # Filtrar por igreja
        queryset = queryset.filter(**{self.church_field_name: active_church})

        # Se houver branch no contexto, SEMPRE filtrar pela branch ativa
        active_branch = self._get_active_branch(request)
        
        # DEBUG: Log para verificar se branch está sendo detectada
        logger.info(f"[BRANCH FILTER] active_branch={active_branch}, has_branch={has_branch}, user={user.username}")
        
        if has_branch and active_branch is not None:
            try:
                # IMPORTANTE: Sempre filtra pela branch ativa para evitar ver membros de outras branches
                logger.info(f"[BRANCH FILTER] Aplicando filtro de branch: {active_branch.name} (ID: {active_branch.id})")
                queryset = queryset.filter(**{self.branch_field_name: active_branch})
            except Exception as e:
                # Modelo pode não possuir branch; ignorar
                logger.warning(f"[BRANCH FILTER] Erro ao filtrar por branch: {e}")
                pass
        elif has_branch and hasattr(queryset.model, self.branch_field_name):
            # Se não há branch ativa mas o modelo tem branch, aplicar regra de SECRETARY
            logger.info(f"[BRANCH FILTER] Sem branch ativa, verificando managed_branches para SECRETARY")
            try:
                church_user = user.church_users.filter(church=active_church, is_active=True).first()
                if church_user and church_user.managed_branches.exists():
                    # Secretário com branches específicas: mostrar apenas essas branches
                    managed = church_user.managed_branches.all()
                    logger.info(f"[BRANCH FILTER] SECRETARY com {managed.count()} branches gerenciadas")
                    queryset = queryset.filter(**{f"{self.branch_field_name}__in": managed})
            except Exception as e:
                logger.warning(f"[BRANCH FILTER] Erro ao aplicar filtro de SECRETARY: {e}")
                pass

        return queryset

