"""
Views para gerenciamento de usuários e autenticação
"""

from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from django.contrib.auth import authenticate
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.contrib.auth.password_validation import ValidationError

from .models import CustomUser, UserProfile, ChurchUser
from .serializers import (
    UserRegistrationSerializer,
    UserCompleteRegistrationSerializer,
    UserSerializer,
    UserProfileSerializer,
    ChurchUserSerializer,
    ChurchUserCreateSerializer,
)
from .auth_serializers import CustomAuthTokenSerializer
from apps.core.models import RoleChoices
from apps.core.permissions import IsSuperUser, IsChurchAdmin, IsMemberUser
from apps.churches.models import Church
from apps.denominations.models import Denomination


class UserLoginView(ObtainAuthToken):
    """
    View personalizada para login
    """
    serializer_class = CustomAuthTokenSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                           context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'is_profile_complete': user.is_profile_complete
            }
        })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def available_roles_view(request):
    """
    Retorna os papéis disponíveis para atribuição baseado na hierarquia do usuário logado.
    
    Hierarquia:
    - DENOMINATION_ADMIN: pode atribuir todos os papéis abaixo
    - CHURCH_ADMIN: pode atribuir papéis de Pastor, Secretary, Leader, Member
    - PASTOR: pode atribuir papéis de Secretary, Leader, Member
    - SECRETARY: pode atribuir papéis de Leader, Member
    - LEADER: pode atribuir apenas Member
    - MEMBER: não pode atribuir papéis
    """
    
    # Obter o papel do usuário logado
    church_user = request.user.church_users.first()
    if not church_user:
        return Response(
            {'error': 'Usuário não está associado a nenhuma igreja'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user_role = church_user.role
    
    # Definir hierarquia de papéis
    role_hierarchy = {
        RoleChoices.SUPER_ADMIN: [
            RoleChoices.DENOMINATION_ADMIN,
            RoleChoices.CHURCH_ADMIN,
            RoleChoices.PASTOR,
            RoleChoices.SECRETARY,
            RoleChoices.LEADER,
            RoleChoices.MEMBER,
            RoleChoices.READ_ONLY
        ],
        RoleChoices.DENOMINATION_ADMIN: [
            RoleChoices.CHURCH_ADMIN,
            RoleChoices.PASTOR,
            RoleChoices.SECRETARY,
            RoleChoices.LEADER,
            RoleChoices.MEMBER,
            RoleChoices.READ_ONLY
        ],
        RoleChoices.CHURCH_ADMIN: [
            RoleChoices.PASTOR,
            RoleChoices.SECRETARY,
            RoleChoices.LEADER,
            RoleChoices.MEMBER,
            RoleChoices.READ_ONLY
        ],
        RoleChoices.PASTOR: [
            RoleChoices.SECRETARY,
            RoleChoices.LEADER,
            RoleChoices.MEMBER,
            RoleChoices.READ_ONLY
        ],
        RoleChoices.SECRETARY: [
            RoleChoices.LEADER,
            RoleChoices.MEMBER,
            RoleChoices.READ_ONLY
        ],
        RoleChoices.LEADER: [
            RoleChoices.MEMBER,
            RoleChoices.READ_ONLY
        ],
        RoleChoices.MEMBER: [],
        RoleChoices.READ_ONLY: []
    }
    
    # Obter papéis disponíveis para o usuário
    available_roles = role_hierarchy.get(user_role, [])
    
    # Converter para formato de resposta
    roles_data = []
    for role in available_roles:
        roles_data.append({
            'value': role,
            'label': dict(RoleChoices.choices)[role],
            'description': get_role_description(role)
        })
    
    return Response({
        'user_role': user_role,
        'user_role_label': dict(RoleChoices.choices)[user_role],
        'available_roles': roles_data,
        'can_assign_roles': len(available_roles) > 0
    })


def get_role_description(role):
    """
    Retorna descrição detalhada do papel
    """
    descriptions = {
        RoleChoices.DENOMINATION_ADMIN: 'Administrador com acesso a todas as igrejas da denominação',
        RoleChoices.CHURCH_ADMIN: 'Administrador com acesso total à igreja e suas filiais',
        RoleChoices.PASTOR: 'Pastor com permissões administrativas (exceto gestão de filiais)',
        RoleChoices.SECRETARY: 'Secretário com acesso a membros, visitantes e relatórios',
        RoleChoices.LEADER: 'Líder com acesso a visitantes e atividades',
        RoleChoices.MEMBER: 'Membro comum com acesso básico',
        RoleChoices.READ_ONLY: 'Usuário com acesso somente leitura'
    }
    return descriptions.get(role, 'Papel do sistema')


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def available_churches_view(request):
    """
    Retorna lista de igrejas disponíveis para cadastro
    """
    churches = Church.objects.filter(is_active=True)
    data = []
    
    for church in churches:
        data.append({
            'id': church.id,
            'name': church.name,
            'short_name': church.short_name,
            'denomination': church.denomination.name if church.denomination else None,
            'city': church.city,
            'state': church.state,
        })
    
    return Response(data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def available_denominations_view(request):
    """
    Retorna lista de denominações disponíveis
    """
    denominations = Denomination.objects.filter(is_active=True)
    data = []
    
    for denomination in denominations:
        data.append({
            'id': denomination.id,
            'name': denomination.name,
            'short_name': denomination.short_name,
            'description': denomination.description,
        })
    
    return Response(data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_church_view(request):
    """
    Retorna dados da igreja do usuário logado
    """
    church_user = request.user.church_users.first()
    if not church_user:
        return Response(
            {'error': 'Usuário não está associado a nenhuma igreja'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    church = church_user.church
    
    return Response({
        'id': church.id,
        'name': church.name,
        'short_name': church.short_name,
        'email': church.email,
        'phone': church.phone,
        'address': church.address,
        'city': church.city,
        'state': church.state,
        'zipcode': church.zipcode,
        'role': church_user.role,
        'role_label': church_user.get_role_display(),
        'permissions': {
            'can_access_admin': church_user.can_access_admin,
            'can_manage_members': church_user.can_manage_members,
            'can_manage_visitors': church_user.can_manage_visitors,
            'can_manage_activities': church_user.can_manage_activities,
            'can_view_reports': church_user.can_view_reports,
            'can_manage_branches': church_user.can_manage_branches,
        }
    })
