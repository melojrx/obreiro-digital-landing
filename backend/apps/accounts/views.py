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
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os
from PIL import Image
from io import BytesIO
from django.utils import timezone

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


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_me_view(request):
    """
    Retorna dados completos do usuário logado
    """
    user = request.user
    profile = getattr(user, 'profile', None)
    
    return Response({
        'id': user.id,
        'email': user.email,
        'full_name': user.full_name,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'phone': user.phone,
        'is_active': user.is_active,
        'date_joined': user.date_joined,
        'is_profile_complete': user.is_profile_complete,
        'profile': {
            'bio': profile.bio if profile else '',
            'birth_date': profile.birth_date if profile else None,
            'gender': profile.gender if profile else '',
            'avatar': profile.avatar.url if profile and profile.avatar else None,
        } if profile else None
    })


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_personal_data_view(request):
    """
    Atualiza dados pessoais do usuário
    """
    user = request.user
    data = request.data
    
    # Atualizar campos do usuário
    if 'full_name' in data:
        user.full_name = data['full_name']
        # Atualizar first_name e last_name baseado no full_name
        name_parts = data['full_name'].split()
        if name_parts:
            user.first_name = name_parts[0]
            user.last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''
    
    if 'email' in data:
        # Verificar se o email já existe
        if CustomUser.objects.filter(email=data['email']).exclude(id=user.id).exists():
            return Response(
                {'error': 'Este email já está sendo usado por outro usuário'},
                status=status.HTTP_400_BAD_REQUEST
            )
        user.email = data['email']
    
    if 'phone' in data:
        user.phone = data['phone']
    
    user.save()
    
    # Atualizar ou criar perfil
    profile, created = UserProfile.objects.get_or_create(user=user)
    
    if 'bio' in data:
        profile.bio = data['bio']
    
    if 'birth_date' in data:
        profile.birth_date = data['birth_date'] if data['birth_date'] else None
    
    if 'gender' in data:
        profile.gender = data['gender']
    
    profile.save()
    
    # Retornar dados atualizados
    return Response({
        'user': {
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone': user.phone,
            'is_active': user.is_active,
            'date_joined': user.date_joined,
            'is_profile_complete': user.is_profile_complete,
            'profile': {
                'bio': profile.bio,
                'birth_date': profile.birth_date,
                'gender': profile.gender,
                'avatar': profile.avatar.url if profile.avatar else None,
            }
        },
        'message': 'Dados pessoais atualizados com sucesso'
    })


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_church_data_view(request):
    """
    Atualiza dados da igreja do usuário
    """
    user = request.user
    church_user = user.church_users.first()
    
    if not church_user:
        return Response(
            {'error': 'Usuário não está associado a nenhuma igreja'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    church = church_user.church
    data = request.data
    
    # Atualizar campos da igreja
    if 'name' in data:
        church.name = data['name']
    
    if 'cnpj' in data:
        church.cnpj = data['cnpj']
    
    if 'email' in data:
        church.email = data['email']
    
    if 'phone' in data:
        church.phone = data['phone']
    
    if 'address' in data:
        church.address = data['address']
    
    if 'city' in data:
        church.city = data['city']
    
    if 'state' in data:
        church.state = data['state']
    
    if 'zipcode' in data:
        church.zipcode = data['zipcode']
    
    church.save()
    
    # Retornar dados atualizados
    return Response({
        'church': {
            'id': church.id,
            'name': church.name,
            'short_name': church.short_name,
            'cnpj': church.cnpj,
            'email': church.email,
            'phone': church.phone,
            'address': church.address,
            'city': church.city,
            'state': church.state,
            'zipcode': church.zipcode,
            'subscription_plan': church.subscription_plan,
            'user_role': church_user.role,
        },
        'message': 'Dados da igreja atualizados com sucesso'
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_avatar_view(request):
    """
    Upload de avatar do usuário
    """
    user = request.user
    
    if 'avatar' not in request.FILES:
        return Response(
            {'error': 'Nenhum arquivo enviado'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    avatar_file = request.FILES['avatar']
    
    # Validar tipo de arquivo
    allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if avatar_file.content_type not in allowed_types:
        return Response(
            {'error': 'Tipo de arquivo não suportado. Use JPEG, PNG, GIF ou WebP'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validar tamanho (máximo 5MB)
    if avatar_file.size > 5 * 1024 * 1024:
        return Response(
            {'error': 'Arquivo muito grande. Tamanho máximo: 5MB'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Processar imagem
        img = Image.open(avatar_file)
        
        # Redimensionar se necessário (máximo 300x300)
        if img.width > 300 or img.height > 300:
            img.thumbnail((300, 300), Image.Resampling.LANCZOS)
        
        # Converter para RGB se necessário
        if img.mode in ('RGBA', 'LA', 'P'):
            img = img.convert('RGB')
        
        # Salvar imagem processada
        output = BytesIO()
        img.save(output, format='JPEG', quality=85)
        output.seek(0)
        
        # Criar ou atualizar perfil
        profile, created = UserProfile.objects.get_or_create(user=user)
        
        # Remover avatar antigo se existir
        if profile.avatar:
            try:
                default_storage.delete(profile.avatar.name)
            except:
                pass
        
        # Salvar novo avatar com timestamp para evitar cache
        import time
        timestamp = int(time.time())
        file_extension = os.path.splitext(avatar_file.name)[1] or '.jpg'
        filename = f'avatars/user_{user.id}_{timestamp}{file_extension}'
        profile.avatar.save(
            filename,
            ContentFile(output.read()),
            save=True
        )
        
        avatar_url = profile.avatar.url
        
        return Response({
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': user.phone,
                'is_active': user.is_active,
                'date_joined': user.date_joined,
                'is_profile_complete': user.is_profile_complete,
                'profile': {
                    'bio': profile.bio,
                    'birth_date': profile.birth_date,
                    'gender': profile.gender,
                    'avatar': avatar_url,
                }
            },
            'avatar_url': avatar_url,
            'message': 'Avatar atualizado com sucesso'
        })
        
    except Exception as e:
        return Response(
            {'error': f'Erro ao processar imagem: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_account_view(request):
    """
    Deleta permanentemente a conta do usuário
    Requer confirmação via senha
    """
    user = request.user
    data = request.data
    
    # Verificar se a senha foi fornecida
    if 'password' not in data:
        return Response(
            {'error': 'Senha é obrigatória para deletar a conta'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verificar se a senha está correta
    if not user.check_password(data['password']):
        return Response(
            {'error': 'Senha incorreta'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verificar se o usuário confirmou a ação
    if not data.get('confirm_deletion', False):
        return Response(
            {'error': 'É necessário confirmar a exclusão da conta'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        with transaction.atomic():
            # Remover avatar se existir
            profile = getattr(user, 'profile', None)
            if profile and profile.avatar:
                try:
                    default_storage.delete(profile.avatar.name)
                except:
                    pass
            
            # Deletar token de autenticação
            try:
                Token.objects.filter(user=user).delete()
            except:
                pass
            
            # Armazenar informações para resposta
            user_email = user.email
            user_name = user.full_name
            
            # Deletar usuário (cascade irá deletar perfil e relacionamentos)
            user.delete()
            
            return Response({
                'message': f'Conta de {user_name} ({user_email}) foi deletada permanentemente',
                'deleted_at': timezone.now().isoformat()
            })
            
    except Exception as e:
        return Response(
            {'error': f'Erro ao deletar conta: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
