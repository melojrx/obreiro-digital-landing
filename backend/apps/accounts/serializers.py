"""
Serializers para o app Accounts
Gerencia serialização de usuários e perfis
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import UserProfile, ChurchUser

User = get_user_model()


class CustomAuthTokenSerializer(serializers.Serializer):
    """
    Serializer customizado para autenticação por email.
    Substitui o serializer padrão que usa username.
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
            from django.contrib.auth import authenticate
            
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


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer para registro inicial de usuário.
    Campos mínimos necessários para criar conta.
    """
    
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        validators=[validate_password],
        help_text="Senha com pelo menos 8 caracteres"
    )
    password_confirm = serializers.CharField(
        write_only=True,
        help_text="Confirmação da senha"
    )
    
    class Meta:
        model = User
        fields = [
            'email', 'full_name', 'phone', 'password', 'password_confirm'
        ]
        extra_kwargs = {
            'email': {'help_text': 'E-mail será usado para login'},
            'full_name': {'help_text': 'Nome completo do usuário'},
            'phone': {'help_text': 'Telefone no formato (XX) XXXXX-XXXX', 'required': False},
        }
    
    def validate(self, attrs):
        """Validar confirmação de senha"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'As senhas não coincidem.'
            })
        return attrs
    
    def create(self, validated_data):
        """Criar usuário com senha criptografada"""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        return user


class UserCompleteRegistrationSerializer(serializers.Serializer):
    """
    Serializer para completar registro do usuário.
    Inclui dados do perfil e associação com igreja.
    """
    
    # Dados do perfil
    cpf = serializers.CharField(
        max_length=14,
        required=False,
        allow_blank=True,
        help_text="CPF do usuário (opcional)"
    )
    birth_date = serializers.DateField(
        required=False,
        allow_null=True,
        help_text="Data de nascimento"
    )
    bio = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Biografia ou descrição"
    )
    
    # Preferências
    email_notifications = serializers.BooleanField(
        default=True,
        help_text="Receber notificações por e-mail"
    )
    sms_notifications = serializers.BooleanField(
        default=False,
        help_text="Receber notificações por SMS"
    )
    
    # Dados da igreja
    church_id = serializers.IntegerField(
        help_text="ID da igreja à qual deseja se associar"
    )
    role = serializers.CharField(
        default='member',
        help_text="Papel na igreja (member, leader, etc.)"
    )
    
    def validate_church_id(self, value):
        """Validar se a igreja existe"""
        from apps.churches.models import Church
        try:
            Church.objects.get(id=value, is_active=True)
        except Church.DoesNotExist:
            raise serializers.ValidationError("Igreja não encontrada ou inativa.")
        return value
    
    def create(self, validated_data):
        """Completar registro do usuário"""
        user = self.context['user']
        church_id = validated_data.pop('church_id')
        role = validated_data.pop('role')
        
        # Criar perfil
        profile_data = {
            'cpf': validated_data.get('cpf'),
            'birth_date': validated_data.get('birth_date'),
            'bio': validated_data.get('bio'),
            'email_notifications': validated_data.get('email_notifications', True),
            'sms_notifications': validated_data.get('sms_notifications', False),
        }
        
        profile, created = UserProfile.objects.get_or_create(
            user=user,
            defaults=profile_data
        )
        
        if not created:
            # Atualizar perfil existente
            for key, value in profile_data.items():
                if value is not None:
                    setattr(profile, key, value)
            profile.save()
        
        # Criar associação com igreja
        from apps.churches.models import Church
        church = Church.objects.get(id=church_id)
        
        church_user, created = ChurchUser.objects.get_or_create(
            user=user,
            church=church,
            defaults={'role': role}
        )
        
        return {
            'user': user,
            'profile': profile,
            'church_user': church_user
        }


class UserSerializer(serializers.ModelSerializer):
    """Serializer para User personalizado"""
    
    display_name = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'full_name', 'phone',
            'first_name', 'last_name', 'display_name',
            'is_active', 'date_joined', 'last_login'
        ]
        read_only_fields = ['id', 'username', 'date_joined', 'last_login']


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer para UserProfile"""
    
    user = UserSerializer(read_only=True)
    age = serializers.ReadOnlyField()
    
    class Meta:
        model = UserProfile
        fields = [
            'id', 'user', 'cpf', 'birth_date', 'age', 'avatar',
            'email_notifications', 'sms_notifications', 'last_login_ip',
            'bio', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_login_ip']


class ChurchUserSerializer(serializers.ModelSerializer):
    """Serializer para ChurchUser"""
    
    user = UserSerializer(read_only=True)
    church_name = serializers.CharField(source='church.name', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    role_color = serializers.CharField(source='get_role_color', read_only=True)
    is_admin = serializers.ReadOnlyField()
    is_leader = serializers.ReadOnlyField()
    
    class Meta:
        model = ChurchUser
        fields = [
            'id', 'user', 'church', 'church_name', 'role', 'role_display', 'role_color',
            'can_access_admin', 'can_manage_members', 'can_manage_visitors',
            'can_manage_activities', 'can_view_reports', 'can_manage_branches',
            'is_admin', 'is_leader', 'joined_at', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'church_name', 'role_display', 'role_color',
            'is_admin', 'is_leader', 'joined_at', 'created_at', 'updated_at'
        ]


class ChurchUserCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de ChurchUser"""
    
    email = serializers.EmailField(write_only=True)
    full_name = serializers.CharField(write_only=True)
    phone = serializers.CharField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = ChurchUser
        fields = [
            'email', 'full_name', 'phone', 'password',
            'church', 'role', 'can_access_admin', 'can_manage_members',
            'can_manage_visitors', 'can_manage_activities', 'can_view_reports',
            'can_manage_branches', 'notes'
        ]
    
    def create(self, validated_data):
        # Extrair dados do usuário
        user_data = {
            'email': validated_data.pop('email'),
            'full_name': validated_data.pop('full_name'),
            'phone': validated_data.pop('phone', ''),
            'password': validated_data.pop('password'),
        }
        
        # Criar usuário
        user = User.objects.create_user(**user_data)
        
        # Criar ChurchUser
        church_user = ChurchUser.objects.create(user=user, **validated_data)
        
        return church_user


class UserProfileCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de UserProfile"""
    
    class Meta:
        model = UserProfile
        fields = [
            'cpf', 'birth_date', 'bio', 'avatar',
            'email_notifications', 'sms_notifications'
        ]
    
    def create(self, validated_data):
        # O usuário deve ser passado no contexto
        user = self.context['user']
        return UserProfile.objects.create(user=user, **validated_data) 