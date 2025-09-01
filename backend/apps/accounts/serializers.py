"""
Serializers para o app Accounts
Gerencia serialização de usuários e perfis
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import UserProfile, ChurchUser
from django.db import transaction
from rest_framework.validators import UniqueTogetherValidator
from apps.core.models import GenderChoices, RoleChoices, SubscriptionPlanChoices

User = get_user_model()


class UserRegistrationValidationSerializer(serializers.Serializer):
    """
    Serializer para validação apenas dos dados de registro inicial.
    Este serializer NÃO cria o usuário, apenas valida os dados.
    Usado na etapa 1 do cadastro SaaS.
    """
    
    email = serializers.EmailField(
        help_text="E-mail será usado para login"
    )
    full_name = serializers.CharField(
        max_length=150,
        help_text="Nome completo do usuário"
    )
    phone = serializers.CharField(
        max_length=20,
        help_text="Telefone no formato (XX) XXXXX-XXXX"
    )
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
    birth_date = serializers.DateField(
        required=False,
        help_text="Data de nascimento"
    )
    gender = serializers.ChoiceField(
        choices=GenderChoices.choices,
        required=False,
        help_text="Gênero"
    )
    
    def validate_email(self, value):
        """Validar se e-mail já existe"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este e-mail já está em uso.")
        return value
    
    def validate_accept_terms(self, value):
        """Validar aceite dos termos"""
        if not value:
            raise serializers.ValidationError(
                'É obrigatório aceitar os Termos de Uso e Política de Privacidade.'
            )
        return value
    
    def validate(self, attrs):
        """Validar confirmação de senha"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'As senhas não coincidem.'
            })
        return attrs


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
    birth_date = serializers.DateField(
        required=False,
        help_text="Data de nascimento"
    )
    gender = serializers.ChoiceField(
        choices=GenderChoices.choices,
        required=False,
        help_text="Gênero"
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
        }
    
    def validate_accept_terms(self, value):
        """Validar aceite dos termos"""
        if not value:
            raise serializers.ValidationError(
                'É obrigatório aceitar os Termos de Uso e Política de Privacidade.'
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
        """Criar usuário com senha criptografada e perfil"""
        validated_data.pop('password_confirm')
        validated_data.pop('accept_terms')  # Não salvar no banco
        password = validated_data.pop('password')
        
        # Extrair dados do perfil
        birth_date = validated_data.pop('birth_date', None)
        gender = validated_data.pop('gender', None)
        
        # Criar usuário
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        
        # Criar perfil se tiver dados
        if birth_date or gender:
            UserProfile.objects.create(
                user=user,
                birth_date=birth_date,
                gender=gender
            )
        
        return user


class UserRegistrationValidationSerializer(serializers.Serializer):
    """
    Serializer para validação apenas dos dados pessoais.
    Este serializer NÃO cria o usuário, apenas valida os dados.
    Usado na etapa 1 do cadastro SaaS.
    """
    
    email = serializers.EmailField(help_text="E-mail será usado para login")
    full_name = serializers.CharField(max_length=150, help_text="Nome completo do usuário")
    phone = serializers.CharField(max_length=20, help_text="Telefone no formato (XX) XXXXX-XXXX")
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
    birth_date = serializers.DateField(
        required=False,
        help_text="Data de nascimento"
    )
    gender = serializers.ChoiceField(
        choices=GenderChoices.choices,
        required=False,
        help_text="Gênero"
    )
    
    def validate_email(self, value):
        """Validar se e-mail já existe"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este e-mail já está em uso.")
        return value
    
    def validate_accept_terms(self, value):
        """Validar aceite dos termos"""
        if not value:
            raise serializers.ValidationError(
                'É obrigatório aceitar os Termos de Uso e Política de Privacidade.'
            )
        return value
    
    def validate(self, attrs):
        """Validar confirmação de senha"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'As senhas não coincidem.'
            })
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer para UserProfile, sem aninhar o UserSerializer para evitar dependência circular."""
    
    age = serializers.ReadOnlyField()
    
    class Meta:
        model = UserProfile
        fields = [
            'id', 'user', 'cpf', 'birth_date', 'gender', 'age', 'avatar',
            'email_notifications', 'sms_notifications', 'last_login_ip',
            'bio', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at', 'last_login_ip', 'age']
        
    def to_representation(self, instance):
        """Customizar a representação para incluir URL completa do avatar"""
        data = super().to_representation(instance)
        if instance.avatar:
            request = self.context.get('request')
            if request:
                data['avatar'] = request.build_absolute_uri(instance.avatar.url)
            else:
                data['avatar'] = instance.avatar.url
        return data


class UserSerializer(serializers.ModelSerializer):
    """Serializer para User personalizado, incluindo o perfil."""
    
    display_name = serializers.ReadOnlyField()
    profile = serializers.SerializerMethodField()
    
    def get_profile(self, obj):
        """Método para incluir o perfil com contexto da request"""
        if hasattr(obj, 'profile'):
            return UserProfileSerializer(obj.profile, context=self.context).data
        return None
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'full_name', 'phone',
            'first_name', 'last_name', 'display_name',
            'is_active', 'date_joined', 'last_login', 'is_profile_complete',
            'profile'
        ]
        read_only_fields = ['id', 'username', 'date_joined', 'last_login', 'is_profile_complete', 'profile']


class ChurchDataValidationSerializer(serializers.Serializer):
    """
    Serializer para validação apenas dos dados da igreja.
    Este serializer NÃO cria a igreja, apenas valida os dados.
    Usado na etapa 2 do cadastro SaaS.
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


class UserCompleteRegistrationNewSerializer(serializers.Serializer):
    """
    Serializer para completar registro completo do usuário via cadastro SaaS.
    Este serializer recebe TODOS os dados (pessoais + igreja + plano) e cria tudo de uma vez.
    Usado na etapa 3 do cadastro SaaS.
    """
    
    # Dados pessoais (etapa 1)
    email = serializers.EmailField(help_text="E-mail será usado para login")
    full_name = serializers.CharField(max_length=150, help_text="Nome completo do usuário")
    phone = serializers.CharField(max_length=20, help_text="Telefone no formato (XX) XXXXX-XXXX")
    password = serializers.CharField(write_only=True, min_length=8, validators=[validate_password])
    birth_date = serializers.DateField(required=False)
    gender = serializers.ChoiceField(choices=GenderChoices.choices, required=False)
    
    # Dados da igreja (etapa 2)
    denomination_id = serializers.IntegerField(required=False, allow_null=True)
    church_name = serializers.CharField(max_length=200)
    church_cnpj = serializers.CharField(max_length=18, required=False, allow_blank=True)
    church_email = serializers.EmailField()
    church_phone = serializers.CharField(max_length=20)
    branch_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    church_address = serializers.CharField()
    pastor_name = serializers.CharField(max_length=200)
    
    # Dados do perfil do usuário (opcional)
    cpf = serializers.CharField(max_length=14, required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    email_notifications = serializers.BooleanField(default=True)
    sms_notifications = serializers.BooleanField(default=False)
    
    # Papel na igreja e plano (etapa 3)
    role = serializers.ChoiceField(
        choices=RoleChoices.choices,
        default=RoleChoices.DENOMINATION_ADMIN,
        help_text="Papel do usuário na igreja"
    )
    subscription_plan = serializers.ChoiceField(
        choices=SubscriptionPlanChoices.choices,
        required=True,
        help_text="Plano de assinatura escolhido"
    )
    
    def validate_email(self, value):
        """Validar se e-mail já existe"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este e-mail já está em uso.")
        return value
    
    def validate_role(self, value):
        """Validar que SUPER_ADMIN não pode ser atribuído via cadastro"""
        if value == RoleChoices.SUPER_ADMIN:
            raise serializers.ValidationError(
                "O papel de Super Administrador não pode ser atribuído via cadastro."
            )
        return value
    
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
        """
        Criar usuário DENOMINATION_ADMIN completo com igreja, filial e plano.
        IMPORTANTE: Só chama este método na etapa 3 com plano selecionado.
        """
        from apps.churches.models import Church
        from apps.branches.models import Branch
        from apps.denominations.models import Denomination
        import logging, traceback
        logger = logging.getLogger(__name__)
        
        with transaction.atomic():
            # 1. Extrair dados do perfil antes de criar o usuário
            birth_date = validated_data.pop('birth_date', None)
            gender = validated_data.pop('gender', None)
            cpf = validated_data.pop('cpf', None)
            bio = validated_data.pop('bio', '')
            email_notifications = validated_data.pop('email_notifications', True)
            sms_notifications = validated_data.pop('sms_notifications', False)
            
            # 2. Criar o usuário com campos do modelo CustomUser
            user_data = {
                'email': validated_data['email'],
                'full_name': validated_data['full_name'],
                'phone': validated_data['phone'],
                'subscription_plan': validated_data['subscription_plan']  # Salvar o plano
            }
            password = validated_data['password']
            
            user = User.objects.create_user(password=password, **user_data)
            logger.info('[CompleteRegistration] Usuário criado: %s com plano: %s', user.id, user.subscription_plan)
            
            # 3. Obter denominação
            denomination = None
            if validated_data.get('denomination_id'):
                denomination = Denomination.objects.get(id=validated_data['denomination_id'])
            
            # 4. Criar a igreja
            full_church_name = validated_data['church_name']
            short_name_parts = full_church_name.split()
            derived_short_name = ' '.join(short_name_parts[:2])[:50]
            
            church = Church.objects.create(
                name=full_church_name,
                short_name=derived_short_name or full_church_name[:50],
                cnpj=validated_data.get('church_cnpj'),
                email=validated_data.get('church_email'),
                phone=validated_data.get('church_phone'),
                address=validated_data.get('church_address'),
                city=validated_data.get('church_city', 'Cidade'),
                state=validated_data.get('church_state', 'SP'),
                zipcode=validated_data.get('church_zipcode', '00000-000'),
                denomination=denomination,
                subscription_plan=validated_data['subscription_plan']
            )
            
            # 5. Criar a filial sede
            branch_name = validated_data.get('branch_name') or "Sede"
            branch = Branch.objects.create(
                church=church,
                name=branch_name,
                short_name=(branch_name[:50] or 'Sede'),
                address=church.address or church.name,
                neighborhood='Centro',
                city=church.city,
                state=church.state,
                zipcode=church.zipcode
            )
            
            # 6. Vincular usuário à igreja como DENOMINATION_ADMIN
            church_user = ChurchUser.objects.create(
                user=user,
                church=church,
                role=validated_data.get('role', RoleChoices.DENOMINATION_ADMIN)
            )
            # Permissões são definidas automaticamente no método save() do modelo
            church_user.managed_branches.add(branch)
            
            # 7. Criar perfil do usuário com os dados extraídos
            profile_data = {
                'cpf': cpf,
                'bio': bio,
                'birth_date': birth_date,
                'gender': gender,
                'email_notifications': email_notifications,
                'sms_notifications': sms_notifications,
            }
            profile = UserProfile.objects.create(user=user, **profile_data)
            
            # 8. Marcar perfil como completo
            user.is_profile_complete = True
            user.save(update_fields=['is_profile_complete'])
            
            logger.info('[CompleteRegistration] Cadastro completo finalizado para user=%s church=%s branch=%s plano=%s', 
                       user.id, church.id, branch.id, user.subscription_plan)

            return {
                'user': user,
                'profile': profile,
                'church': church,
                'church_user': church_user,
                'branch': branch
            }


class UserCompleteRegistrationSerializer(serializers.Serializer):
    """
    Serializer para completar registro do usuário via cadastro SaaS.
    
    Fluxo de Cadastro SaaS (3 etapas):
    1. Dados pessoais básicos (UserRegistrationSerializer)
    2. Escolha da denominação + dados da igreja (este serializer)  
    3. Escolha do plano de assinatura (frontend)
    
    Resultado: Usuário vira Denomination Admin (assinante pagante)
    que pode criar e gerenciar múltiplas igrejas da denominação.
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
    
    # Adicionar os campos que foram movidos do CustomUser
    birth_date = serializers.DateField(required=False)
    gender = serializers.ChoiceField(choices=GenderChoices.choices, required=False)

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
        default=RoleChoices.DENOMINATION_ADMIN,
        help_text="Papel na denominação (usuário assinante do SaaS)"
    )
    
    def validate_role(self, value):
        """Validar que SUPER_ADMIN não pode ser atribuído via cadastro"""
        from apps.core.models import RoleChoices
        if value == RoleChoices.SUPER_ADMIN:
            raise serializers.ValidationError(
                "O papel de Super Administrador não pode ser atribuído via cadastro. "
                "Este papel é reservado apenas para desenvolvedores da plataforma."
            )
        return value
    
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
        """
        Orquestra a conclusão do cadastro SaaS, criando:
        1. Igreja inicial da denominação
        2. Filial sede da igreja
        3. Perfil do usuário
        4. Vínculo como Denomination Admin (assinante pagante)
        """
        from apps.churches.models import Church
        from apps.branches.models import Branch
        from apps.denominations.models import Denomination
        import logging, traceback
        logger = logging.getLogger(__name__)
        logger.info('[CompleteRegistration] Iniciando create com dados validados: %s', validated_data)
        
        user = self.context['user']

        with transaction.atomic():
            # 1. Obter denominação escolhida (obrigatória para cadastro SaaS)
            denomination = None
            if validated_data.get('denomination_id'):
                try:
                    denomination = Denomination.objects.get(id=validated_data['denomination_id'])
                except Denomination.DoesNotExist:
                    logger.error('[CompleteRegistration] Denominação %s não encontrada', validated_data['denomination_id'])
                    raise serializers.ValidationError({'denomination_id': ['Denominação não encontrada.']})
            else:
                raise serializers.ValidationError(
                    "Denominação é obrigatória para cadastro via SaaS."
                )
            
            # 2. Criar a primeira Igreja da denominação para este assinante
            # Derivar short_name simples (primeiras duas palavras) e usar defaults mínimos
            full_church_name = validated_data['church_name']
            short_name_parts = full_church_name.split()
            derived_short_name = ' '.join(short_name_parts[:2])[:50]
            try:
                church = Church.objects.create(
                    name=full_church_name,
                    short_name=derived_short_name or full_church_name[:50],
                    cnpj=validated_data.get('church_cnpj'),
                    email=validated_data.get('church_email'),
                    phone=validated_data.get('church_phone'),
                    address=validated_data.get('church_address'),
                    city=validated_data.get('church_city', 'Cidade'),
                    state=validated_data.get('church_state', 'SP'),
                    zipcode=validated_data.get('church_zipcode', '00000-000'),
                    denomination=denomination,
                    subscription_plan=validated_data.get('subscription_plan', 'basic')
                )
            except Exception as e:
                logger.error('[CompleteRegistration] Erro ao criar Church: %s\nPayload: %s\nTraceback: %s', e, validated_data, traceback.format_exc())
                raise serializers.ValidationError({'church': [f'Erro ao criar igreja: {e}']})

            # 3. Criar a Filial Sede
            branch_name = validated_data.get('branch_name') or "Sede"
            # Preencher campos obrigatórios da filial (short_name, neighborhood) antes de criar
            from django.db import IntegrityError
            try:
                branch = Branch.objects.create(
                    church=church,
                    name=branch_name,
                    short_name=(branch_name[:50] or 'Sede'),
                    address=church.address or church.name,
                    neighborhood='Centro',  # Valor padrão inicial; pode ser atualizado depois pelo usuário
                    city=church.city,
                    state=church.state,
                    zipcode=church.zipcode
                )
            except IntegrityError as e:
                logger.error('[CompleteRegistration] Erro ao criar Branch: %s', e)
                raise serializers.ValidationError({
                    'branch': ['Erro ao criar filial inicial (possível violação de integridade): ' + str(e)]
                })

            # 4. Vincular o Usuário à Igreja como Denomination Admin (assinante SaaS)
            user_role = validated_data.get('role', RoleChoices.DENOMINATION_ADMIN)
            church_user, created = ChurchUser.objects.get_or_create(
                user=user,
                church=church,
                defaults={'role': user_role}
            )
            
            # Garantir que as permissões sejam definidas corretamente
            if created:
                church_user.set_permissions_by_role()
                church_user.save()

            # Denomination Admin gerencia todas as filiais da denominação por padrão
            if church_user.role in [RoleChoices.DENOMINATION_ADMIN, RoleChoices.CHURCH_ADMIN, RoleChoices.PASTOR]:
                church_user.managed_branches.add(branch)

            # 5. Criar ou atualizar o UserProfile
            profile_data = {
                'cpf': validated_data.get('cpf'),
                'bio': validated_data.get('bio', ''),
                'birth_date': validated_data.get('birth_date'),
                'gender': validated_data.get('gender'),
                'email_notifications': validated_data.get('email_notifications', True),
                'sms_notifications': validated_data.get('sms_notifications', False),
            }
            # Usar update_or_create para criar o perfil se não existir, ou atualizá-lo.
            try:
                profile, created = UserProfile.objects.update_or_create(
                    user=user,
                    defaults=profile_data
                )
            except Exception as e:
                logger.error('[CompleteRegistration] Erro ao criar/atualizar perfil: %s', e)
                raise serializers.ValidationError({'profile': [f'Erro ao criar/atualizar perfil: {e}']})
            
            # 6. Marcar perfil como completo
            user.is_profile_complete = True
            user.save(update_fields=['is_profile_complete'])
            logger.info('[CompleteRegistration] Cadastro concluído com sucesso para user=%s church=%s branch=%s', user.id, church.id, branch.id)

            return {
                'user': user,
                'profile': profile,
                'church': church,
                'church_user': church_user,
                'branch': branch
            }


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
            'church', 'branch', 'role', 'can_access_admin', 'can_manage_members',
            'can_manage_visitors', 'can_manage_activities', 'can_view_reports',
            'can_manage_branches', 'notes'
        ]
        # Adiciona validação para garantir que a branch pertença à church
        validators = [
            UniqueTogetherValidator(
                queryset=ChurchUser.objects.all(),
                fields=('user', 'church'),
                message="Este usuário já está associado a esta igreja."
            )
        ]
    
    def validate_role(self, value):
        """Validar que SUPER_ADMIN não pode ser atribuído via cadastro"""
        from apps.core.models import RoleChoices
        if value == RoleChoices.SUPER_ADMIN:
            raise serializers.ValidationError(
                "O papel de Super Administrador não pode ser atribuído via cadastro. "
                "Este papel é reservado apenas para desenvolvedores da plataforma."
            )
        return value
    
    def create(self, validated_data):
        """Cria um novo usuário e o associa a uma igreja."""
        # Extrair dados do usuário
        user_data = {
            'email': validated_data.pop('email'),
            'full_name': validated_data.pop('full_name'),
            'phone': validated_data.pop('phone', ''),
            'password': validated_data.pop('password'),
        }
        
        # Criar usuário
        user = User.objects.create_user(**user_data)
        
        # Criar ChurchUser com os dados restantes
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


class ChurchUserSummarySerializer(serializers.ModelSerializer):
    """Serializer resumido para ChurchUser em listagens"""
    
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    church_name = serializers.CharField(source='church.short_name', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    role_color = serializers.CharField(source='get_role_color', read_only=True)
    is_denomination_admin = serializers.ReadOnlyField()
    
    class Meta:
        model = ChurchUser
        fields = [
            'id', 'user_name', 'user_email', 'church_name', 'role', 
            'role_display', 'role_color', 'is_denomination_admin',
            'can_manage_denomination', 'can_create_churches', 
            'can_manage_church_admins', 'can_view_financial_reports',
            'joined_at'
        ] 