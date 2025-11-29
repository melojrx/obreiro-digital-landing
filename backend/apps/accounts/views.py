from datetime import date, datetime

from django.core.exceptions import ValidationError
from django.db import transaction
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.core.models import GenderChoices, RoleChoices, validate_cpf

from .auth_serializers import CustomAuthTokenSerializer
from apps.core.throttling import AuthAnonRateThrottle, AuthUserRateThrottle
from .models import ChurchUser, CustomUser, UserProfile

class CustomAuthToken(ObtainAuthToken):
    serializer_class = CustomAuthTokenSerializer
    throttle_classes = [AuthAnonRateThrottle, AuthUserRateThrottle]
    
    def post(self, request, *args, **kwargs):
        print('🔍 DEBUG - Login Request Data:', request.data)
        print('🔍 DEBUG - Content Type:', request.content_type)
        
        serializer = self.serializer_class(data=request.data, context={'request': request})
        
        if not serializer.is_valid():
            print('❌ DEBUG - Serializer Errors:', serializer.errors)
        
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)

        # Se o usuário já possui vínculo com alguma igreja, considerar perfil completo
        try:
            from .models import ChurchUser
            if not getattr(user, 'is_profile_complete', False):
                has_church = ChurchUser.objects.filter(user=user, is_active=True).exists()
                if has_church:
                    user.is_profile_complete = True
                    try:
                        user.save(update_fields=['is_profile_complete', 'updated_at'])
                    except Exception:
                        user.save()
        except Exception:
            pass
        
        print('✅ DEBUG - Login successful for user:', user.email)
        
        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'phone': user.phone,
                'is_profile_complete': user.is_profile_complete,
                'is_superuser': user.is_superuser,
                'is_staff': user.is_staff,
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
            'is_active': church_user.is_user_active_church,
            'active_branch': {
                'id': church_user.active_branch.id,
                'name': church_user.active_branch.name
            } if church_user.active_branch else None
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

    church_user = ChurchUser.objects.get(
        user=user,
        church=active_church,
        is_active=True
    )

    active_branch = church_user.active_branch
    if not active_branch:
        active_branch = ChurchUser.objects.get_active_branch_for_user(user)
        if active_branch and church_user.active_branch_id != active_branch.id:
            church_user.active_branch = active_branch
            church_user.save(update_fields=['active_branch'])
    
    return Response({
        'active_church': {
            'id': active_church.id,
            'name': active_church.name,
            'short_name': active_church.short_name,
            'city': active_church.city,
            'state': active_church.state,
            'denomination_name': active_church.denomination.name if active_church.denomination else None,
            'active_branch': {
                'id': active_branch.id,
                'name': active_branch.name
            } if active_branch else None
        }
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_active_church(request):
    """Define qual igreja é ativa para o usuário"""
    user = request.user
    church_id = request.data.get('church_id')
    branch_id = request.data.get('branch_id')
    
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
        if branch_id:
            try:
                branch = church_user.church.branches.get(id=branch_id, is_active=True)
            except church_user.church.branches.model.DoesNotExist:
                return Response(
                    {'error': 'Filial não encontrada ou inativa para esta igreja'},
                    status=status.HTTP_404_NOT_FOUND
                )
            church_user.active_branch = branch
        else:
            church_user.active_branch = None
        church_user.save()
        
        return Response({
            'message': f'Igreja {church_user.church.name} definida como ativa',
            'active_church': {
                'id': church_user.church.id,
                'name': church_user.church.name,
                'short_name': church_user.church.short_name,
                'active_branch': {
                    'id': church_user.active_branch.id,
                    'name': church_user.active_branch.name
                } if church_user.active_branch else None
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
        'is_superuser': user.is_superuser,
        'is_staff': user.is_staff,
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
        'active_branch': {
            'id': church_user.active_branch.id,
            'name': church_user.active_branch.name
        } if church_user.active_branch else None
    })


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_personal_data(request):
    """Atualiza dados pessoais do usuário autenticado (nome, email, telefone, perfil)."""
    user: CustomUser = request.user

    data = request.data or {}

    # Atualizar dados básicos do usuário
    full_name = data.get('full_name')
    email = data.get('email')
    phone = data.get('phone')

    if email and email != user.email:
        # Garantir unicidade global
        if CustomUser.objects.filter(email=email).exclude(pk=user.pk).exists():
            return Response({'error': 'Este e-mail já está em uso por outro usuário.'}, status=status.HTTP_400_BAD_REQUEST)
        user.email = email

    if full_name:
        user.full_name = full_name

    if phone:
        user.phone = phone

    user.save()

    # Atualizar perfil complementar
    profile, _ = UserProfile.objects.get_or_create(user=user)
    bio = data.get('bio')
    if bio is not None:
        profile.bio = bio

    birth_date = data.get('birth_date')
    if birth_date:
        try:
            profile.birth_date = datetime.strptime(birth_date, '%Y-%m-%d').date()
        except Exception:
            # Ignorar formato inválido silenciosamente; validação básica no front
            pass

    gender = data.get('gender')
    if gender:
        gender = gender.upper()
        if gender in dict(GenderChoices.choices):
            profile.gender = gender

    profile.save()

    # Montar payload compatível com frontend User
    user_payload = {
        'id': user.id,
        'email': user.email,
        'full_name': user.full_name,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'phone': user.phone,
        'subscription_plan': user.subscription_plan,
        'is_profile_complete': True,
        'profile': {
            'bio': profile.bio,
            'birth_date': profile.birth_date.isoformat() if profile.birth_date else None,
            'gender': profile.gender,
            'avatar': profile.avatar.url if profile.avatar else None,
            'cpf': profile.cpf,
            'address': profile.address,
            'zipcode': profile.zipcode,
            'number': profile.number,
            'email_notifications': profile.email_notifications,
            'sms_notifications': profile.sms_notifications,
        },
    }

    return Response({'user': user_payload, 'message': 'Dados pessoais atualizados com sucesso.'})


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_church_data(request):
    """Atualiza dados da igreja ativa do usuário autenticado."""
    user = request.user
    church = ChurchUser.objects.get_active_church_for_user(user)
    if not church:
        return Response({'error': 'Usuário não possui igreja ativa.'}, status=status.HTTP_400_BAD_REQUEST)

    data = request.data or {}
    # Atualizar campos básicos da igreja
    for field in ['name', 'cnpj', 'email', 'phone', 'address', 'city', 'state', 'zipcode']:
        if field in data:
            setattr(church, field, data.get(field))
    church.save()

    # Papel do usuário na igreja
    cu = ChurchUser.objects.filter(user=user, church=church, is_active=True).first()
    church_payload = {
        'id': church.id,
        'name': church.name,
        'short_name': getattr(church, 'short_name', '') or '',
        'cnpj': church.cnpj or '',
        'email': church.email or '',
        'phone': church.phone or '',
        'address': church.address or '',
        'city': church.city,
        'state': church.state,
        'zipcode': church.zipcode or '',
        'subscription_plan': church.subscription_plan,
        'role': cu.get_role_display() if cu else '',
        'role_label': cu.get_role_display() if cu else '',
        'user_role': cu.role if cu else '',
        'active_branch': {
            'id': cu.active_branch.id,
            'name': cu.active_branch.name
        } if cu and cu.active_branch else None
    }

    return Response({'church': church_payload, 'message': 'Dados da igreja atualizados com sucesso.'})

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
        required_fields = [
            'email',
            'full_name',
            'password',
            'subscription_plan',
            'phone',
            'birth_date',
            'gender',
            'cpf'
        ]
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

        # Validar CPF
        cpf_raw = data.get('cpf', '')
        cpf_digits = ''.join(filter(str.isdigit, cpf_raw))
        try:
            validate_cpf(cpf_digits)
        except ValidationError as exc:
            return Response(
                {'error': 'CPF inválido', 'details': exc.messages},
                status=status.HTTP_400_BAD_REQUEST
            )

        cpf_formatted = f"{cpf_digits[:3]}.{cpf_digits[3:6]}.{cpf_digits[6:9]}-{cpf_digits[9:]}"

        # Garantir CPF único (considerando diferentes formatações)
        existing_cpfs = UserProfile.objects.filter(cpf__isnull=False).values_list('cpf', flat=True)
        if any(''.join(filter(str.isdigit, existing or '')) == cpf_digits for existing in existing_cpfs):
            return Response(
                {
                    'error': 'CPF já cadastrado no sistema. Se você já possui conta, faça login ou recupere sua senha.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar data de nascimento e converter para date
        birth_date_str = data.get('birth_date')
        try:
            birth_date = datetime.strptime(birth_date_str, '%Y-%m-%d').date()
        except (ValueError, TypeError):
            return Response(
                {'error': 'Data de nascimento inválida. Use o formato YYYY-MM-DD.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Garantir idade mínima de 18 anos
        today = date.today()
        age = today.year - birth_date.year - (
            (today.month, today.day) < (birth_date.month, birth_date.day)
        )
        if age < 18:
            return Response(
                {'error': 'Usuário deve ter pelo menos 18 anos para concluir o cadastro.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar gênero
        gender_raw = data.get('gender')
        gender = gender_raw.upper() if isinstance(gender_raw, str) else ''
        if gender not in dict(GenderChoices.choices):
            valid_choices = ', '.join(dict(GenderChoices.choices).keys())
            return Response(
                {'error': f'Gênero inválido. Use um dos valores: {valid_choices}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Criar usuário e perfil em uma transação
        with transaction.atomic():
            # Criar usuário
            user = CustomUser.objects.create_user(
                email=data['email'],
                password=data['password'],
                full_name=data['full_name'],
                phone=data['phone'],
                subscription_plan=data['subscription_plan'],
                is_profile_complete=True
            )
            
            # Criar perfil complementar
            # Normalizar role: se vier 'CHURCH_ADMIN', converte para 'church_admin'
            intended_role = data.get('role', 'CHURCH_ADMIN')
            if intended_role == 'CHURCH_ADMIN':
                intended_role = RoleChoices.CHURCH_ADMIN  # 'church_admin'
            elif intended_role == 'DENOMINATION_ADMIN':
                # Papel legado removido: converte para CHURCH_ADMIN
                intended_role = RoleChoices.CHURCH_ADMIN
            
            profile = UserProfile.objects.create(
                user=user,
                birth_date=birth_date,
                gender=gender,
                cpf=cpf_formatted,
                bio=data.get('bio', ''),
                email_notifications=data.get('email_notifications', True),
                sms_notifications=data.get('sms_notifications', False),
                intended_role=intended_role  # Salvar papel pretendido no formato correto
            )
            
            # Tratar denominação (selecionada ou criada via "Outros")
            from apps.denominations.models import Denomination

            denomination = None
            denomination_id = data.get('denomination_id')
            denomination_other_name = data.get('denomination_other_name')
            selected_other = isinstance(denomination_id, str) and denomination_id.lower() in ['outros', 'outro', 'other']

            if denomination_id and not selected_other:
                try:
                    denomination = Denomination.objects.get(id=denomination_id)
                except Denomination.DoesNotExist:
                    return Response(
                        {'error': 'Denominação selecionada não foi encontrada.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            if (selected_other or denomination_other_name) and denomination is None:
                other_name = denomination_other_name or data.get('denomination_name')
                if not other_name:
                    return Response(
                        {'error': 'Informe o nome da denominação quando selecionar "Outros".'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                required_address_fields = {
                    'user_address': 'Endereço',
                    'user_city': 'Cidade',
                    'user_state': 'Estado',
                    'user_zipcode': 'CEP',
                }
                missing_address = [label for field, label in required_address_fields.items() if not data.get(field)]
                if missing_address:
                    return Response(
                        {'error': f'Campos obrigatórios para criar a denominação automática: {", ".join(missing_address)}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                address_parts = [data.get('user_address')]
                if data.get('user_number'):
                    address_parts.append(f"nº {data['user_number']}")
                if data.get('user_complement'):
                    address_parts.append(data['user_complement'])
                if data.get('user_neighborhood'):
                    address_parts.append(f"Bairro {data['user_neighborhood']}")
                headquarters_address = ', '.join(filter(None, address_parts))

                denomination = Denomination.objects.create(
                    name=other_name,
                    short_name=other_name[:50],
                    description="Denominação criada automaticamente a partir do cadastro.",
                    administrator=user,
                    email=data['email'],
                    phone=data['phone'],
                    website='',
                    headquarters_address=headquarters_address,
                    headquarters_city=data['user_city'],
                    headquarters_state=data['user_state'],
                    headquarters_zipcode=data['user_zipcode'],
                    cnpj=None
                )

            if denomination:
                profile.intended_denomination = denomination
            
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
                'has_church': False,  # Usuário recém-cadastrado não tem igreja ainda
                'needs_church_setup': True,  # Precisa criar/vincular igreja
                'intended_role': intended_role,
                'profile': {
                    'birth_date': str(profile.birth_date) if profile.birth_date else None,
                    'gender': profile.gender,
                    'bio': profile.bio,
                    'cpf': profile.cpf,
                    'avatar': profile.avatar.url if profile.avatar else None,
                }
            }

            if profile.intended_denomination:
                user_data['intended_denomination'] = {
                    'id': profile.intended_denomination.id,
                    'name': profile.intended_denomination.name
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
