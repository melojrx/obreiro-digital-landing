"""
Custom permissions for the Obreiro Virtual API.

These classes control access to different parts of the API based on the
user's role within their church or denomination. This ensures that users
can only perform actions they are authorized for.
"""

from rest_framework.permissions import BasePermission, SAFE_METHODS
from apps.accounts.models import RoleChoices

class IsSuperUser(BasePermission):
    """
    Allows access only to Django superusers.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_superuser

class IsPlatformAdmin(BasePermission):
    """
    Allows access only to platform administrators (SUPER_ADMIN role).
    This is for managing the SaaS platform itself, not individual churches.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if user is Django superuser OR has SUPER_ADMIN role
        return (
            request.user.is_superuser or
            request.user.church_users.filter(
                role=RoleChoices.SUPER_ADMIN, 
                is_active=True
            ).exists()
        )

class IsChurchAdmin(BasePermission):
    """
    Allows access to users who are administrators of a church or multiple churches.
    
    This is the primary administrative role for paying customers who can:
    - Manage one or multiple churches (if they have a denomination)
    - Create and configure churches
    - Manage members, visitors, and activities
    - Designate branch managers
    - Access consolidated reports
    
    Note: This role replaces the old DENOMINATION_ADMIN role, centralizing
          all church and denomination administration.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Verifica se o usuário tem papel de CHURCH_ADMIN em qualquer igreja
        return request.user.church_users.filter(
            role=RoleChoices.CHURCH_ADMIN,
            is_active=True
        ).exists()
    
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        # Get the church from the object being accessed
        church = None
        if hasattr(obj, 'church'):
            church = obj.church
        elif isinstance(obj, __import__('apps.churches.models', fromlist=['Church']).Church):
            church = obj
        else:
            return False # Cannot determine the church from the object

        # Verifica se o usuário é CHURCH_ADMIN da igreja
        return request.user.church_users.filter(
            church=church,
            role=RoleChoices.CHURCH_ADMIN,
            is_active=True
        ).exists()

class IsBranchManager(BasePermission):
    """
    Allows access to users who can manage a specific branch.
    This includes church admins (who can manage all branches) or users
    specifically assigned to manage a branch.
    The view must implement `get_branch()` or the object must have a `branch` attribute.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        # Determine the branch and church from the object
        branch = None
        if hasattr(obj, 'branch'):
            branch = obj.branch
        elif isinstance(obj, __import__('apps.branches.models', fromlist=['Branch']).Branch):
            branch = obj
        
        if not branch:
            return False

        church = branch.church

        # Check for user's ChurchUser link for the relevant church
        try:
            church_user = request.user.church_users.get(church=church, is_active=True)
        except request.user.church_users.model.DoesNotExist:
            return False

        # Church admins can manage any branch in their church
        if church_user.role == RoleChoices.CHURCH_ADMIN:
            return True

        # Check if the user has specific permission and is assigned to the branch
        if church_user.can_manage_branches and church_user.managed_branches.filter(pk=branch.pk).exists():
            return True

        return False

class IsMemberUser(BasePermission):
    """
    Allows access if the user is at least a member of the church associated with the request.
    This is a baseline permission for authenticated users to see content within their own church.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.church_users.exists()

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        church = None
        if hasattr(obj, 'church'):
            church = obj.church
        elif isinstance(obj, __import__('apps.churches.models', fromlist=['Church']).Church):
            church = obj
        
        if not church:
            return False # Cannot determine church context

        # Checks if user belongs to the church of the object they are trying to access
        return request.user.church_users.filter(church=church, is_active=True).exists()

class IsReadOnly(BasePermission):
    """
    Allows read-only access to any authenticated user.
    """
    def has_permission(self, request, view):
        return request.method in SAFE_METHODS

class CanManageMembers(BasePermission):
    """
    Checks if the user has the 'can_manage_members' permission flag
    for the relevant church.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Try to get church from view method or user's church
        church = None
        if hasattr(view, 'get_user_church'):
            church = view.get_user_church()
        
        if not church:
            # Fallback: get first church from user
            church_user = request.user.church_users.filter(is_active=True).first()
            if church_user:
                church = church_user.church
        
        if not church:
            return False

        try:
            church_user = request.user.church_users.get(church=church, is_active=True)
            return church_user.can_manage_members
        except request.user.church_users.model.DoesNotExist:
            return False


class IsChurchAdminOrCanManageMembers(BasePermission):
    """
    Permite acesso para administradores de igreja OU usuários com permissão de gerenciar membros
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Primeiro verifica se é admin da igreja
        church_admin_permission = IsChurchAdmin()
        if church_admin_permission.has_permission(request, view):
            return True
        
        # Se não for admin, verifica se pode gerenciar membros
        manage_members_permission = CanManageMembers()
        return manage_members_permission.has_permission(request, view)
    
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Primeiro verifica se é admin da igreja
        church_admin_permission = IsChurchAdmin()
        if church_admin_permission.has_object_permission(request, view, obj):
            return True
        
        # Se não for admin, verifica se pode gerenciar membros
        manage_members_permission = CanManageMembers()
        return manage_members_permission.has_permission(request, view)


# Permissões específicas para gestão de denominação
class CanManageDenomination(BasePermission):
    """
    Verifica se o usuário pode gerenciar denominação.
    Apenas CHURCH_ADMIN pode gerenciar a denominação.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        from apps.accounts.models import RoleChoices
        
        # CHURCH_ADMIN pode gerenciar a denominação
        return request.user.church_users.filter(
            role=RoleChoices.CHURCH_ADMIN,
            is_active=True
        ).exists()

class CanCreateChurches(BasePermission):
    """
    Verifica se o usuário pode criar igrejas.
    Apenas CHURCH_ADMIN pode criar novas igrejas.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        from apps.accounts.models import RoleChoices
        
        # CHURCH_ADMIN pode criar igrejas na sua denominação
        return request.user.church_users.filter(
            role=RoleChoices.CHURCH_ADMIN,
            is_active=True
        ).exists()

class CanManageChurchAdmins(BasePermission):
    """
    Verifica se o usuário pode gerenciar administradores de igreja.
    Apenas CHURCH_ADMIN pode gerenciar outros admins.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        from apps.accounts.models import RoleChoices
        
        # Apenas CHURCH_ADMIN pode gerenciar outros admins
        return request.user.church_users.filter(
            role=RoleChoices.CHURCH_ADMIN,
            is_active=True
        ).exists()

class CanViewFinancialReports(BasePermission):
    """
    Verifica se o usuário pode visualizar relatórios financeiros
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return request.user.church_users.filter(
            can_view_financial_reports=True,
            is_active=True
        ).exists()

class IsHierarchicallyAuthorized(BasePermission):
    """
    Verifica se o usuário está autorizado hierarquicamente para acessar um recurso.
    Usado para validar acesso a igrejas/denominações baseado na hierarquia.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Determinar o contexto do objeto (igreja, denominação, etc.)
        church = None
        denomination = None
        
        if hasattr(obj, 'church'):
            church = obj.church
        elif hasattr(obj, 'denomination'):
            denomination = obj.denomination
        elif isinstance(obj, __import__('apps.churches.models', fromlist=['Church']).Church):
            church = obj
        elif isinstance(obj, __import__('apps.denominations.models', fromlist=['Denomination']).Denomination):
            denomination = obj
        
        # Verificar se o usuário pode gerenciar baseado na hierarquia
        for church_user in request.user.church_users.filter(is_active=True):
            # Verificar acesso à igreja específica
            if church and church_user.can_manage_church(church):
                return True
                
            # Verificar acesso à denominação específica
            if denomination and church_user.can_access_denomination_dashboard(denomination):
                return True
        
        return False