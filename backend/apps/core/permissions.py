"""
Permissões customizadas para o sistema multi-tenant ObreiroVirtual
"""

from rest_framework import permissions
from rest_framework.permissions import BasePermission


class IsChurchMember(BasePermission):
    """
    Permissão que permite acesso apenas a membros da igreja
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Superuser sempre tem acesso
        if request.user.is_superuser:
            return True
        
        # Verificar se usuário tem vínculo com alguma igreja
        return request.user.church_users.filter(is_active=True).exists()


class IsChurchAdmin(BasePermission):
    """
    Permissão que permite acesso apenas a administradores da igreja
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Superuser sempre tem acesso
        if request.user.is_superuser:
            return True
        
        # Verificar se usuário é admin de alguma igreja
        return request.user.church_users.filter(
            is_active=True,
            role__in=['church_admin', 'pastor']
        ).exists()


class IsChurchOwnerOrReadOnly(BasePermission):
    """
    Permissão que permite edição apenas para donos da igreja
    e leitura para membros
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Superuser sempre tem acesso
        if request.user.is_superuser:
            return True
        
        # Verificar se usuário tem vínculo com alguma igreja
        return request.user.church_users.filter(is_active=True).exists()
    
    def has_object_permission(self, request, view, obj):
        # Superuser sempre tem acesso
        if request.user.is_superuser:
            return True
        
        # Leitura permitida para membros da mesma igreja
        if request.method in permissions.SAFE_METHODS:
            return self._user_belongs_to_church(request.user, obj)
        
        # Escrita apenas para admins da igreja
        return self._user_is_church_admin(request.user, obj)
    
    def _user_belongs_to_church(self, user, obj):
        """Verifica se usuário pertence à mesma igreja do objeto"""
        church = getattr(obj, 'church', None)
        if not church:
            return False
        
        return user.church_users.filter(
            church=church,
            is_active=True
        ).exists()
    
    def _user_is_church_admin(self, user, obj):
        """Verifica se usuário é admin da igreja do objeto"""
        church = getattr(obj, 'church', None)
        if not church:
            return False
        
        return user.church_users.filter(
            church=church,
            is_active=True,
            role__in=['church_admin', 'pastor']
        ).exists()


class CanManageMembers(BasePermission):
    """
    Permissão para gerenciar membros
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        return request.user.church_users.filter(
            is_active=True,
            can_manage_members=True
        ).exists()


class CanManageVisitors(BasePermission):
    """
    Permissão para gerenciar visitantes
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        return request.user.church_users.filter(
            is_active=True,
            can_manage_visitors=True
        ).exists()


class CanManageActivities(BasePermission):
    """
    Permissão para gerenciar atividades
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        return request.user.church_users.filter(
            is_active=True,
            can_manage_activities=True
        ).exists()


class CanViewReports(BasePermission):
    """
    Permissão para visualizar relatórios
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        return request.user.church_users.filter(
            is_active=True,
            can_view_reports=True
        ).exists()


class IsDenominationAdmin(BasePermission):
    """
    Permissão para administradores de denominação
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        # Verificar se é administrador de alguma denominação
        return request.user.administered_denominations.filter(
            is_active=True
        ).exists()
    
    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser:
            return True
        
        # Verificar se é administrador desta denominação específica
        denomination = getattr(obj, 'denomination', obj)
        return denomination.administrator == request.user 