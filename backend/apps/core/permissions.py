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

class IsDenominationAdmin(BasePermission):
    """
    Allows access to users who are denomination administrators.
    This is determined by their role in any of their associated churches.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        # Check if the user has the 'denomination_admin' role in any of their ChurchUser links
        return request.user.church_users.filter(role=RoleChoices.DENOMINATION_ADMIN, is_active=True).exists()

class IsChurchAdmin(BasePermission):
    """
    Allows access to users who are administrators of a specific church.
    This includes denomination admins and church admins.
    The view must implement `get_church()` to provide the church object.
    """
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

        return request.user.church_users.filter(
            church=church,
            role__in=[RoleChoices.DENOMINATION_ADMIN, RoleChoices.CHURCH_ADMIN],
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

        # Church admins and higher can manage any branch in their church
        if church_user.role in [RoleChoices.DENOMINATION_ADMIN, RoleChoices.CHURCH_ADMIN]:
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

        # Assumes the view has a `get_church` method
        church = view.get_church()
        if not church:
            return False

        try:
            church_user = request.user.church_users.get(church=church, is_active=True)
            return church_user.can_manage_members
        except request.user.church_users.model.DoesNotExist:
            return False 