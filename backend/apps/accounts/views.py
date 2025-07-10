"""
Views para o app Accounts
Gerencia autenticação, registro e perfis de usuários
"""

from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.contrib.auth import get_user_model, authenticate
from django.db import transaction
from django.contrib.auth.password_validation import validate_password, ValidationError

from .models import UserProfile, ChurchUser
from .serializers import (
    UserSerializer, UserProfileSerializer, ChurchUserSerializer,
    UserRegistrationSerializer, UserCompleteRegistrationSerializer,
    ChurchUserCreateSerializer, UserProfileCreateSerializer
)
from apps.core.permissions import IsChurchMember

User = get_user_model()


class CustomAuthTokenSerializer(serializers.Serializer):
    """
    Serializer customizado para autenticação por email.
    """
    email = serializers.EmailField(
        label="Email",
        write_only=True,
        help_text="E-mail usado para login"
    )
    password = serializers.CharField(
        label="Password",
        style={'input_type': 'password'},
        trim_whitespace=False,
        write_only=True,
        help_text="Senha do usuário"
    )
    token = serializers.CharField(
        label="Token",
        read_only=True,
        help_text="Token de autenticação"
    )

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            user = authenticate(request=self.context.get('request'),
                              username=email, password=password)

            if not user:
                msg = 'Não foi possível fazer login com as credenciais fornecidas.'
                raise serializers.ValidationError(msg, code='authorization')
        else:
            msg = 'É necessário fornecer "email" e "password".'
            raise serializers.ValidationError(msg, code='authorization')

        attrs['user'] = user
        return attrs


class CustomAuthToken(ObtainAuthToken):
    """
    Autenticação personalizada que aceita email como username.
    Endpoint: POST /api/v1/auth/login/
    """
    
    serializer_class = CustomAuthTokenSerializer
    
    def post(self, request, *args, **kwargs):
        """Login com email e senha"""
        serializer = self.serializer_class(data=request.data,
                                           context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
            'message': 'Login realizado com sucesso'
        })


class UserRegistrationViewSet(viewsets.GenericViewSet):
    """
    ViewSet para registro de usuários.
    Processo em duas etapas: registro inicial e completar perfil.
    """
    
    permission_classes = [permissions.AllowAny]
    
    @action(detail=False, methods=['post'])
    def register(self, request):
        """
        Registro inicial do usuário.
        Campos obrigatórios: email, full_name, password, password_confirm
        """
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                user = serializer.save()
                token, created = Token.objects.get_or_create(user=user)
                
                return Response({
                    'user': UserSerializer(user).data,
                    'token': token.key,
                    'message': 'Usuário criado com sucesso! Complete seu perfil.',
                    'next_step': 'complete_profile'
                }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def complete_profile(self, request):
        """
        Completa o registro do usuário orquestrando a criação da igreja,
        perfil e vínculo de 'owner' através do serializer.
        """
        serializer = UserCompleteRegistrationSerializer(
            data=request.data,
            context={'user': request.user}
        )
        serializer.is_valid(raise_exception=True)
        
        # O método `create` do serializer agora cuida de toda a lógica transacional
        result = serializer.save()
        
        return Response({
            'user': UserSerializer(result['user']).data,
            'church': ChurchUserSerializer(result['church_user']).data, # Retorna o contexto da igreja do usuário
            'message': 'Perfil completado com sucesso!'
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def available_denominations(self, request):
        """Listar denominações disponíveis para registro"""
        from apps.denominations.models import Denomination
        from apps.denominations.serializers import DenominationSummarySerializer
        
        denominations = Denomination.objects.filter(is_active=True).order_by('name')
        serializer = DenominationSummarySerializer(denominations, many=True)
        return Response(serializer.data)


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet para usuários do sistema
    """
    
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['email', 'full_name', 'first_name', 'last_name']
    filterset_fields = ['is_active', 'is_staff']
    ordering_fields = ['full_name', 'email', 'date_joined']
    ordering = ['full_name']
    
    def get_queryset(self):
        """Filtrar usuários baseado nas permissões"""
        user = self.request.user
        
        if user.is_superuser:
            return User.objects.all()
        
        # Buscar igrejas do usuário
        user_churches = user.church_users.filter(is_active=True).values_list('church_id', flat=True)
        
        # Retornar usuários das mesmas igrejas
        return User.objects.filter(
            church_users__church_id__in=user_churches,
            church_users__is_active=True
        ).distinct()
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Dados do usuário atual"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['patch'])
    def update_profile(self, request):
        """Atualizar perfil do usuário atual"""
        serializer = self.get_serializer(
            request.user,
            data=request.data,
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                'user': serializer.data,
                'message': 'Perfil atualizado com sucesso!'
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['patch'])
    def update_personal_data(self, request):
        """Atualizar dados pessoais e de perfil do usuário."""
        try:
            user = request.user
            profile, created = UserProfile.objects.get_or_create(user=user)
            data = request.data
            
            # Campos do modelo User (apenas os que são de autenticação/contato)
            user_fields = ['full_name', 'email', 'phone']
            user_updated = False
            for field in user_fields:
                if field in data and data.get(field) != getattr(user, field, None):
                    setattr(user, field, data[field])
                    user_updated = True
            if user_updated:
                user.save()

            # Campos do modelo UserProfile
            profile_fields = ['birth_date', 'gender', 'bio', 'email_notifications', 'sms_notifications', 'cpf']
            profile_updated = False
            for field in profile_fields:
                if field in data and data.get(field) != getattr(profile, field, None):
                    setattr(profile, field, data[field])
                    profile_updated = True
            if profile_updated:
                profile.save()
            
            # Recarregar o usuário para garantir que o 'profile' aninhado esteja atualizado
            user.refresh_from_db()

            return Response({
                'user': UserSerializer(user).data,
                'message': 'Dados pessoais atualizados com sucesso!'
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def my_church(self, request):
        """Dados da igreja do usuário atual"""
        try:
            # Buscar o ChurchUser do usuário atual
            church_user = request.user.church_users.filter(is_active=True).first()

            if not church_user:
                return Response({
                    'message': 'Usuário não está associado a nenhuma igreja ainda.'
                }, status=status.HTTP_200_OK)

            church = church_user.church

            # Retornar dados básicos da igreja
            return Response({
                'id': church.id,
                'name': church.name,
                'short_name': church.short_name,
                'cnpj': church.cnpj or '',
                'email': church.email,
                'phone': church.phone,
                'address': church.address,
                'city': church.city,
                'state': church.state,
                'zipcode': church.zipcode,
                'subscription_plan': church.subscription_plan,
                'user_role': church_user.get_role_display(),
            })

        except Exception as e:
                         return Response({
                 'error': 'Erro ao buscar dados da igreja'
             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['patch'])
    def update_church_data(self, request):
        """
        Atualizar dados da igreja do usuário.
        """
        try:
            from apps.churches.models import Church
            
            # Buscar a associação do usuário com uma igreja
            church_user = request.user.church_users.filter(is_active=True).first()

            if not church_user:
                return Response(
                    {'error': 'Usuário não está associado a nenhuma igreja.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Verificar se o usuário tem permissão para alterar dados da igreja
            if not church_user.is_admin:
                return Response(
                    {'error': 'Sem permissão para alterar dados da igreja.'},
                    status=status.HTTP_403_FORBIDDEN
                )

            church = church_user.church
            data = request.data

            # Campos que podem ser atualizados na igreja
            church_fields = ['name', 'short_name', 'cnpj', 'email', 'phone', 'address', 'city', 'state', 'zipcode']
            
            # Atualizar os campos da igreja
            updated_fields = []
            for field in church_fields:
                if field in data:
                    # Tratar o short_name automaticamente se não fornecido
                    if field == 'short_name' and not data.get('short_name') and field == 'name':
                        value = data['name'][:50]  # Limitar a 50 caracteres
                    else:
                        value = data[field]
                    
                    if getattr(church, field) != value:
                        setattr(church, field, value)
                        updated_fields.append(field)

            # Salvar apenas se houver mudanças
            if updated_fields:
                church.save(update_fields=updated_fields)

            return Response({
                'church': {
                    'id': church.id,
                    'name': church.name,
                    'short_name': church.short_name,
                    'cnpj': church.cnpj or '',
                    'email': church.email,
                    'phone': church.phone,
                    'address': church.address,
                    'city': church.city,
                    'state': church.state,
                    'zipcode': church.zipcode,
                    'subscription_plan': church.subscription_plan,
                    'user_role': church_user.get_role_display(),
                },
                'message': 'Dados da igreja atualizados com sucesso!'
            })

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='change-password')
    def change_password(self, request):
        """Altera a senha do usuário logado."""
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        if not all([old_password, new_password, confirm_password]):
            return Response({'error': 'Todos os campos são obrigatórios.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not user.check_password(old_password):
            return Response({'error': 'Senha antiga incorreta.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if new_password != confirm_password:
            return Response({'error': 'As novas senhas não coincidem.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            validate_password(new_password, user)
        except ValidationError as e:
            return Response({'error': list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({'message': 'Senha alterada com sucesso.'})

    @action(detail=False, methods=['post'], url_path='update-subscription')
    def update_subscription(self, request):
        """Atualiza o plano de assinatura da igreja do usuário."""
        # Lógica de atualização de plano (simulada)
        plan = request.data.get('plan')
        return Response({'message': f'Plano atualizado para {plan} com sucesso!'})

    @action(detail=False, methods=['post'], url_path='delete-account')
    def delete_account(self, request):
        """Exclui a conta do usuário logado."""
        user = request.user
        user.is_active = False
        user.save()
        # Idealmente, aqui você invalidaria o token de autenticação
        return Response({'message': 'Sua conta foi desativada com sucesso.'})

    @action(detail=False, methods=['post'], url_path='upload-avatar')
    def upload_avatar(self, request):
        """Upload de avatar do usuário logado."""
        try:
            if 'avatar' not in request.FILES:
                return Response(
                    {'error': 'Nenhum arquivo enviado.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            avatar_file = request.FILES['avatar']
            
            # Validar tipo de arquivo
            allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
            if avatar_file.content_type not in allowed_types:
                return Response(
                    {'error': 'Tipo de arquivo não permitido. Use apenas JPG, PNG ou GIF.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validar tamanho (5MB máximo)
            max_size = 5 * 1024 * 1024  # 5MB
            if avatar_file.size > max_size:
                return Response(
                    {'error': 'Arquivo muito grande. Tamanho máximo: 5MB.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Criar ou atualizar perfil
            profile, created = UserProfile.objects.get_or_create(user=request.user)
            
            # Remover avatar antigo se existir
            if profile.avatar:
                try:
                    profile.avatar.delete(save=False)
                except:
                    pass  # Ignorar erro se arquivo não existir
            
            # Salvar novo avatar
            profile.avatar = avatar_file
            profile.save()
            
            # Recarregar o usuário para garantir que as mudanças sejam refletidas
            request.user.refresh_from_db()
            
            return Response({
                'message': 'Avatar atualizado com sucesso!',
                'avatar_url': request.build_absolute_uri(profile.avatar.url) if profile.avatar else None,
                'user': UserSerializer(request.user, context={'request': request}).data
            })

        except Exception as e:
            return Response({
                'error': f'Erro ao fazer upload: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet para perfis de usuários
    """
    
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsChurchMember]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['user__full_name', 'user__email', 'cpf']
    filterset_fields = ['email_notifications', 'sms_notifications', 'is_active']
    ordering_fields = ['user__full_name', 'birth_date', 'created_at']
    ordering = ['user__full_name']
    
    def get_queryset(self):
        """Filtrar perfis da mesma igreja"""
        user = self.request.user
        
        if user.is_superuser:
            return UserProfile.objects.all()
        
        # Buscar igrejas do usuário
        user_churches = user.church_users.filter(is_active=True).values_list('church_id', flat=True)
        
        # Retornar perfis de usuários das mesmas igrejas
        return UserProfile.objects.filter(
            user__church_users__church_id__in=user_churches,
            user__church_users__is_active=True
        ).distinct()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserProfileCreateSerializer
        return UserProfileSerializer
    
    def perform_create(self, serializer):
        # Criar perfil para o usuário atual se não existir
        serializer.save(user=self.request.user)


class ChurchUserViewSet(viewsets.ModelViewSet):
    """
    ViewSet para usuários de igreja
    """
    
    queryset = ChurchUser.objects.all()
    serializer_class = ChurchUserSerializer
    permission_classes = [permissions.IsAuthenticated, IsChurchMember]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['user__full_name', 'user__email', 'church__name']
    filterset_fields = ['church', 'role', 'is_active']
    ordering_fields = ['user__full_name', 'role', 'joined_at']
    ordering = ['church', 'role', 'user__full_name']
    
    def get_queryset(self):
        """Filtrar usuários da mesma igreja"""
        user = self.request.user
        
        if user.is_superuser:
            return ChurchUser.objects.all()
        
        # Buscar igrejas do usuário
        user_churches = user.church_users.filter(is_active=True).values_list('church_id', flat=True)
        
        # Retornar usuários das mesmas igrejas
        return ChurchUser.objects.filter(
            church_id__in=user_churches,
            is_active=True
        )
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ChurchUserCreateSerializer
        return ChurchUserSerializer
    
    @action(detail=True, methods=['post'])
    def update_permissions(self, request, pk=None):
        """Atualizar permissões de um usuário"""
        church_user = self.get_object()
        
        # Verificar se o usuário atual pode gerenciar permissões
        if not request.user.church_users.filter(
            church=church_user.church,
            role__in=['super_admin', 'church_admin', 'pastor'],
            is_active=True
        ).exists():
            return Response({
                'error': 'Sem permissão para alterar permissões'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Atualizar permissões
        permissions_fields = [
            'can_access_admin', 'can_manage_members', 'can_manage_visitors',
            'can_manage_activities', 'can_view_reports', 'can_manage_branches'
        ]
        
        updated_fields = []
        for field in permissions_fields:
            if field in request.data:
                setattr(church_user, field, request.data[field])
                updated_fields.append(field)
        
        if updated_fields:
            church_user.save(update_fields=updated_fields)
            
            return Response({
                'church_user': ChurchUserSerializer(church_user).data,
                'message': f'Permissões atualizadas: {", ".join(updated_fields)}'
            })
        
        return Response({
            'message': 'Nenhuma permissão foi alterada'
        })
    
    @action(detail=False, methods=['get'])
    def my_churches(self, request):
        """Igrejas do usuário atual"""
        church_users = request.user.church_users.filter(is_active=True)
        serializer = self.get_serializer(church_users, many=True)
        return Response(serializer.data)
