"""
Mixins utilitários para escopo multi-tenant (igreja/filial).

Fornece um filtro de queryset padronizado baseado no usuário logado,
respeitando papéis e filiais atribuídas quando aplicável.
"""

from typing import Optional
from django.db.models import QuerySet


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
        # Preferir church injetada pelo middleware
        church = getattr(request, 'church', None)
        if church:
            return church
        # Fallback: igreja ativa via ChurchUser
        try:
            from apps.accounts.models import ChurchUser
            return ChurchUser.objects.get_active_church_for_user(request.user)
        except Exception:
            return None

    def _get_active_branch(self, request):
        return getattr(request, 'branch', None)

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

        # Se houver branch no contexto, pode restringir ainda mais
        active_branch = self._get_active_branch(request)
        if has_branch and active_branch is not None:
            try:
                queryset = queryset.filter(**{self.branch_field_name: active_branch})
            except Exception:
                # Modelo pode não possuir branch; ignorar
                pass

        # Aplicar regra de SECRETARY → branches atribuídas
        try:
            church_user = user.church_users.filter(church=active_church, is_active=True).first()
            if church_user and has_branch and hasattr(queryset.model, self.branch_field_name):
                # Se existir controle por branches e secretário tiver branches atribuídas, filtrar
                if church_user.managed_branches.exists():
                    queryset = queryset.filter(**{f"{self.branch_field_name}__in": church_user.managed_branches.all()})
        except Exception:
            pass

        return queryset

