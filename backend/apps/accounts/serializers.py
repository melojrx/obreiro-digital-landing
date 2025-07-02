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
    accept_terms = serializers.BooleanField(
        write_only=True,
        help_text="Aceite dos termos de uso e política de privacidade"
    )
    
    class Meta:
        model = User
        fields = [
            'email', 'full_name', 'phone', 'birth_date', 'gender', 
            'password', 'password_confirm', 'accept_terms'
        ]
        extra_kwargs = {
            'email': {'help_text': 'E-mail será usado para login'},
            'full_name': {'help_text': 'Nome completo do usuário'},
            'phone': {'help_text': 'Telefone no formato (XX) XXXXX-XXXX'},
            'birth_date': {'help_text': 'Data de nascimento (deve ter pelo menos 18 anos)'},
            'gender': {'help_text': 'Gênero do usuário'},
        }
    
    def validate_accept_terms(self, value):
        """Validar aceite dos termos"""
        if not value:
            raise serializers.ValidationError(
                'É obrigatório aceitar os Termos de Uso e Política de Privacidade.'
            )
        return value
    
    def validate_birth_date(self, value):
        """Validar idade mínima"""
        if value:
            from datetime import date
            today = date.today()
            age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
            if age < 18:
                raise serializers.ValidationError(
                    'Você deve ter pelo menos 18 anos para se cadastrar.'
                )
        return value
    
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
        validated_data.pop('accept_terms')  # Não salvar no banco
        password = validated_data.pop('password')
        
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        return user


class UserCompleteRegistrationSerializer(serializers.Serializer):
    """
    Serializer para completar registro do usuário.
    Inclui dados da igreja (etapa 2 do cadastro).
    """
    
    # Dados da igreja
    denomination_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="ID da denominação (opcional)"
    )
    church_name = serializers.CharField(
        max_length=200,
        help_text="Nome completo da igreja"
    )
    church_cnpj = serializers.CharField(
        max_length=18,
        required=False,
        allow_blank=True,
        help_text="CNPJ da igreja (opcional)"
    )
    church_email = serializers.EmailField(
        help_text="E-mail da igreja"
    )
    church_phone = serializers.CharField(
        max_length=20,
        help_text="Telefone da igreja"
    )
    branch_name = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
        help_text="Nome da filial/campus (deixe em branco se for sede principal)"
    )
    church_address = serializers.CharField(
        help_text="Endereço completo da igreja"
    )
    pastor_name = serializers.CharField(
        max_length=200,
        help_text="Nome do pastor responsável"
    )
    
    # Dados do perfil do usuário (opcional)
    cpf = serializers.CharField(
        max_length=14,
        required=False,
        allow_blank=True,
        help_text="CPF do usuário (opcional)"
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
    
    # Papel na igreja
    role = serializers.CharField(
        default='pastor',
        help_text="Papel na igreja (pastor, admin, etc.)"
    )
    
    # Plano de assinatura
    subscription_plan = serializers.CharField(
        required=False,
        default='basic',
        help_text="Plano de assinatura escolhido (basic, professional, enterprise, denomination)"
    )
    
    def validate_denomination_id(self, value):
        """Validar se a denominação existe"""
        if value:
            from apps.denominations.models import Denomination
            try:
                Denomination.objects.get(id=value, is_active=True)
            except Denomination.DoesNotExist:
                raise serializers.ValidationError("Denominação não encontrada ou inativa.")
        return value
    
    def validate_church_cnpj(self, value):
        """Validar CNPJ se fornecido"""
        if value:
            from apps.core.models import validate_cnpj
            validate_cnpj(value)
        return value
    
    def validate_church_phone(self, value):
        """Validar formato do telefone"""
        import re
        if not re.match(r'^\(\d{2}\)\s\d{4,5}-\d{4}$', value):
            raise serializers.ValidationError(
                "Telefone deve estar no formato (XX) XXXXX-XXXX"
            )
        return value
    
    def create(self, validated_data):
        """Completar registro do usuário e criar igreja"""
        user = self.context['user']
        
        # Extrair dados da igreja
        church_data = {
            'name': validated_data['church_name'],
            'short_name': validated_data['church_name'],  # Usar o mesmo nome por padrão
            'email': validated_data['church_email'],
            'phone': validated_data['church_phone'],
            'address': validated_data['church_address'],
            'city': 'Não informado',  # Valor padrão
            'state': 'SP',  # Valor padrão
            'zipcode': '00000-000',  # Valor padrão
            'cnpj': validated_data.get('church_cnpj') or None,
        }
        
        # Tentar extrair cidade/estado do endereço se possível
        address_parts = validated_data['church_address'].split(',')
        if len(address_parts) >= 2:
            # Tentar extrair cidade/estado da última parte
            last_part = address_parts[-1].strip()
            if '/' in last_part:
                city_state = last_part.split('/')
                if len(city_state) == 2:
                    church_data['city'] = city_state[0].strip()
                    church_data['state'] = city_state[1].strip()[:2].upper()
        
        # Definir plano de assinatura se fornecido
        if 'subscription_plan' in validated_data:
            church_data['subscription_plan'] = validated_data['subscription_plan']
        
        # Criar igreja
        from apps.churches.models import Church
        from apps.denominations.models import Denomination
        
        # Adicionar denominação se fornecida
        if validated_data.get('denomination_id'):
            try:
                church_data['denomination'] = Denomination.objects.get(
                    id=validated_data['denomination_id']
                )
            except Denomination.DoesNotExist:
                pass  # Ignorar se não encontrar
        
        church = Church.objects.create(**church_data)
        
        # Criar perfil do usuário
        profile_data = {
            'cpf': validated_data.get('cpf'),
            'bio': validated_data.get('bio', ''),  # Valor padrão vazio
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
        
        # Marcar o perfil do usuário como completo
        user.is_profile_complete = True
        user.save()
        
        # Criar associação do usuário com a igreja como pastor/admin
        role = validated_data.get('role', 'pastor')
        
        church_user, created = ChurchUser.objects.get_or_create(
            user=user,
            church=church,
            defaults={'role': role}
        )
        
        # Definir pastor responsável
        pastor_name = validated_data.get('pastor_name')
        if pastor_name:
            if pastor_name == user.full_name:
                # Se é o próprio usuário, definir como pastor principal
                church.main_pastor = user
                church.save()
            else:
                # Se é outro pastor, salvar no campo description
                church.description = f"Pastor responsável: {pastor_name}"
                church.save()
        
        # Criar filial se especificada
        branch = None
        if validated_data.get('branch_name'):
            try:
                from apps.branches.models import Branch
                branch = Branch.objects.create(
                    church=church,
                    name=validated_data['branch_name'],
                    address=church.address,
                    city=church.city,
                    state=church.state,
                    zipcode=church.zipcode,
                    is_headquarters=False
                )
            except Exception:
                # Ignorar erro de filial se o modelo não existir ainda
                pass
        
        return {
            'user': user,
            'profile': profile,
            'church': church,
            'church_user': church_user,
            'branch': branch
        }


class UserSerializer(serializers.ModelSerializer):
    """Serializer para User personalizado"""
    
    display_name = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'full_name', 'phone',
            'first_name', 'last_name', 'display_name',
            'is_active', 'date_joined', 'last_login', 'is_profile_complete'
        ]
        read_only_fields = ['id', 'username', 'date_joined', 'last_login', 'is_profile_complete']


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