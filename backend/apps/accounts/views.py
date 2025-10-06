from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from django.db import transaction
from .auth_serializers import CustomAuthTokenSerializer
from .models import ChurchUser, CustomUser, UserProfile

class CustomAuthToken(ObtainAuthToken):
    serializer_class = CustomAuthTokenSerializer
    
    def post(self, request, *args, **kwargs):
        print('🔍 DEBUG - Login Request Data:', request.data)
        print('🔍 DEBUG - Content Type:', request.content_type)
        
        serializer = self.serializer_class(data=request.data, context={'request': request})
        
        if not serializer.is_valid():
            print('❌ DEBUG - Serializer Errors:', serializer.errors)
        
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        
        print('✅ DEBUG - Login successful for user:', user.email)
        
        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'phone': user.phone,
                'is_profile_complete': user.is_profile_complete,
            }
        })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_churches(request):
    """Lista todas as igrejas do usuário atual"""
    user = request.user
    
    # Buscar todas as igrejas onde o usuário tem acesso
    church_users = ChurchUser.objects.filter(
        user=user, 
        is_active=True
    ).select_related('church', 'church__denomination')
    
    churches_data = []
    for church_user in church_users:
        church = church_user.church
        churches_data.append({
            'id': church.id,
            'name': church.name,
            'short_name': church.short_name,
            'city': church.city,
            'state': church.state,
            'denomination_name': church.denomination.name if church.denomination else None,
            'role': church_user.get_role_display(),
            'role_code': church_user.role,
            'is_active': church_user.is_user_active_church
        })
    
    return Response({
        'count': len(churches_data),
        'churches': churches_data
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def active_church(request):
    """Retorna a igreja ativa do usuário"""
    user = request.user
    
    # Buscar igreja ativa
    active_church = ChurchUser.objects.get_active_church_for_user(user)
    
    if not active_church:
        return Response(
            {'error': 'Usuário não tem igreja ativa configurada'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    return Response({
        'active_church': {
            'id': active_church.id,
            'name': active_church.name,
            'short_name': active_church.short_name,
            'city': active_church.city,
            'state': active_church.state,
            'denomination_name': active_church.denomination.name if active_church.denomination else None
        }
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_active_church(request):
    """Define qual igreja é ativa para o usuário"""
    user = request.user
    church_id = request.data.get('church_id')
    
    if not church_id:
        return Response(
            {'error': 'church_id é obrigatório'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Verificar se o usuário tem acesso à igreja
        church_user = ChurchUser.objects.get(
            user=user,
            church_id=church_id,
            is_active=True
        )
        
        # Desmarcar outras igrejas como ativas
        ChurchUser.objects.filter(
            user=user,
            is_user_active_church=True
        ).update(is_user_active_church=False)
        
        # Marcar a nova igreja como ativa
        church_user.is_user_active_church = True
        church_user.save()
        
        return Response({
            'message': f'Igreja {church_user.church.name} definida como ativa',
            'active_church': {
                'id': church_user.church.id,
                'name': church_user.church.name,
                'short_name': church_user.church.short_name
            }
        })
        
    except ChurchUser.DoesNotExist:
        return Response(
            {'error': 'Igreja não encontrada ou usuário sem acesso'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    """Retorna dados do usuário atual"""
    user = request.user
    
    # Buscar perfil se existir
    profile_data = {}
    intended_role = None
    intended_denomination = None
    
    if hasattr(user, 'profile') and user.profile:
        profile_data = {
            'bio': user.profile.bio,
            'birth_date': user.profile.birth_date,
            'gender': user.profile.gender,
            'avatar': user.profile.avatar.url if user.profile.avatar else None,
            'email_notifications': user.profile.email_notifications,
            'sms_notifications': user.profile.sms_notifications,
        }
        intended_role = user.profile.intended_role
        if user.profile.intended_denomination:
            intended_denomination = {
                'id': user.profile.intended_denomination.id,
                'name': user.profile.intended_denomination.name
            }
    
    # Buscar vínculo com igrejas (ChurchUser)
    church_users = ChurchUser.objects.filter(user=user, is_active=True)
    has_church = church_users.exists()
    
    # Determinar se precisa criar igreja:
    # 1. Usuário recém-cadastrado como CHURCH_ADMIN sem igreja (intended_role)
    # 2. Usuário existente que ficou sem igreja ativa (has_church=False)
    # 3. Usuário com subscription_plan mas sem igreja vinculada
    needs_church_setup = False
    
    if intended_role == 'CHURCH_ADMIN' and not has_church:
        # Caso 1: Recém-cadastrado com papel pretendido
        needs_church_setup = True
    elif not has_church and user.subscription_plan:
        # Caso 2: Tem plano mas não tem igreja (removido ou desvinculado)
        needs_church_setup = True
    elif not has_church and user.is_profile_complete:
        # Caso 3: Perfil completo mas sem igreja (edge case)
        needs_church_setup = True
    
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
        'subscription_plan': user.subscription_plan,
        'profile': profile_data,
        'intended_role': intended_role,
        'intended_denomination': intended_denomination,
        'has_church': has_church,
        'needs_church_setup': needs_church_setup
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_church(request):
    """Retorna dados da igreja ativa do usuário"""
    user = request.user
    
    # Buscar igreja ativa
    active_church = ChurchUser.objects.get_active_church_for_user(user)
    
    if not active_church:
        return Response(
            {'error': 'Usuário não tem igreja ativa configurada'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Buscar papel do usuário na igreja
    church_user = ChurchUser.objects.get(
        user=user,
        church=active_church,
        is_active=True
    )
    
    return Response({
        'id': active_church.id,
        'name': active_church.name,
        'short_name': active_church.short_name,
        'cnpj': active_church.cnpj or '',
        'email': active_church.email or '',
        'phone': active_church.phone or '',
        'address': active_church.address or '',
        'city': active_church.city,
        'state': active_church.state,
        'zipcode': active_church.zipcode or '',
        'subscription_plan': active_church.subscription_plan,
        'role': church_user.get_role_display(),  # Label legível (ex: "Admin de Igreja")
        'role_label': church_user.get_role_display(),  # Mantido para compatibilidade
        'user_role': church_user.role,  # Código do papel (ex: "CHURCH_ADMIN")
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_avatar(request):
    """Upload de avatar do usuário"""
    user = request.user
    
    if 'avatar' not in request.FILES:
        return Response(
            {'error': 'Arquivo de avatar é obrigatório'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    avatar_file = request.FILES['avatar']
    
    # Validar tipo de arquivo
    allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if avatar_file.content_type not in allowed_types:
        return Response(
            {'error': 'Tipo de arquivo não permitido. Use JPEG, PNG, GIF ou WebP'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validar tamanho (5MB max)
    if avatar_file.size > 5 * 1024 * 1024:
        return Response(
            {'error': 'Arquivo muito grande. Tamanho máximo: 5MB'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Criar ou atualizar perfil
        from .models import UserProfile
        profile, created = UserProfile.objects.get_or_create(user=user)
        
        # Salvar avatar
        profile.avatar = avatar_file
        profile.save()
        
        # Retornar dados atualizados
        user_data = {
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
                'email_notifications': profile.email_notifications,
                'sms_notifications': profile.sms_notifications,
            }
        }
        
        return Response({
            'user': user_data,
            'avatar_url': profile.avatar.url,
            'message': 'Avatar atualizado com sucesso'
        })
        
    except Exception as e:
        return Response(
            {'error': f'Erro ao salvar avatar: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def finalize_registration(request):
    """
    Endpoint para finalizar o cadastro completo de um novo usuário.
    Cria o usuário com todos os dados coletados nas 3 etapas do cadastro.
    """
    try:
        data = request.data
        
        # Validar campos obrigatórios
        required_fields = ['email', 'full_name', 'password', 'subscription_plan']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return Response(
                {'error': f'Campos obrigatórios faltando: {", ".join(missing_fields)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar se email já existe
        if CustomUser.objects.filter(email=data['email']).exists():
            return Response(
                {'error': 'Email já cadastrado no sistema'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Criar usuário e perfil em uma transação
        with transaction.atomic():
            # Criar usuário
            user = CustomUser.objects.create_user(
                email=data['email'],
                password=data['password'],
                full_name=data['full_name'],
                phone=data.get('phone', ''),
                subscription_plan=data['subscription_plan'],
                is_profile_complete=True
            )
            
            # Criar perfil complementar
            from apps.core.models import RoleChoices
            
            # Normalizar role: se vier 'CHURCH_ADMIN', converte para 'church_admin'
            intended_role = data.get('role', 'CHURCH_ADMIN')
            if intended_role == 'CHURCH_ADMIN':
                intended_role = RoleChoices.CHURCH_ADMIN  # 'church_admin'
            elif intended_role == 'DENOMINATION_ADMIN':
                # Papel legado removido: converte para CHURCH_ADMIN
                intended_role = RoleChoices.CHURCH_ADMIN
            
            profile = UserProfile.objects.create(
                user=user,
                birth_date=data.get('birth_date'),
                gender=data.get('gender'),
                cpf=data.get('cpf'),
                bio=data.get('bio', ''),
                email_notifications=data.get('email_notifications', True),
                sms_notifications=data.get('sms_notifications', False),
                intended_role=intended_role  # Salvar papel pretendido no formato correto
            )
            
            # Salvar denominação pretendida se fornecida
            if data.get('denomination_id'):
                from apps.denominations.models import Denomination
                try:
                    denomination = Denomination.objects.get(id=data['denomination_id'])
                    profile.intended_denomination = denomination
                except Denomination.DoesNotExist:
                    pass
            
            # Salvar dados de endereço do usuário no perfil (se fornecidos)
            if data.get('user_zipcode'):
                profile.zipcode = data['user_zipcode']
            if data.get('user_address'):
                profile.address = data['user_address']
            if data.get('user_city'):
                profile.city = data['user_city']
            if data.get('user_state'):
                profile.state = data['user_state']
            if data.get('user_neighborhood'):
                profile.neighborhood = data['user_neighborhood']
            if data.get('user_number'):
                profile.number = data['user_number']
            if data.get('user_complement'):
                profile.complement = data['user_complement']
            
            profile.save()
            
            # Criar token de autenticação
            token, _ = Token.objects.get_or_create(user=user)
            
            # Preparar resposta
            user_data = {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'phone': user.phone,
                'is_profile_complete': user.is_profile_complete,
                'subscription_plan': user.subscription_plan,
                'profile': {
                    'birth_date': str(profile.birth_date) if profile.birth_date else None,
                    'gender': profile.gender,
                    'bio': profile.bio,
                    'cpf': profile.cpf,
                    'avatar': profile.avatar.url if profile.avatar else None,
                }
            }
            
            return Response({
                'token': token.key,
                'user': user_data,
                'message': 'Cadastro finalizado com sucesso!'
            }, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        print(f'❌ Erro ao finalizar registro: {str(e)}')
        import traceback
        traceback.print_exc()
        return Response(
            {'error': f'Erro ao finalizar cadastro: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )