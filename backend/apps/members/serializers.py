"""
Serializers para o app Members
Gerencia serialização de membros
"""

import secrets
import logging
from rest_framework import serializers
from datetime import date
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import Member, MembershipStatusLog, MembershipStatus
from apps.branches.models import Branch
from apps.core.models import MembershipStatusChoices, MinisterialFunctionChoices, RoleChoices
from apps.accounts.models import ChurchUser
from .models import MinisterialFunctionHistory
from apps.core.services import EmailService
from apps.core.services.email_service import EmailServiceError

User = get_user_model()
logger = logging.getLogger(__name__)


class MemberSerializer(serializers.ModelSerializer):
    """
    Serializer completo para Member
    """
    
    # Campos calculados
    age = serializers.SerializerMethodField()
    membership_years = serializers.SerializerMethodField()
    full_address = serializers.SerializerMethodField()
    spouse_name = serializers.SerializerMethodField()
    church_name = serializers.CharField(source='church.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    membership_status_display = serializers.CharField(source='get_membership_status_display', read_only=True)
    ministerial_function_display = serializers.CharField(source='get_ministerial_function_display', read_only=True)
    # Acesso ao sistema
    has_system_access = serializers.SerializerMethodField()
    system_user_email = serializers.SerializerMethodField()
    system_user_role = serializers.SerializerMethodField()
    system_user_role_label = serializers.SerializerMethodField()
    
    class Meta:
        model = Member
        fields = [
            # Identificação
            'id', 'church', 'church_name', 'branch', 'branch_name', 'user',
            
            # Dados pessoais
            'full_name', 'cpf', 'rg', 'birth_date', 'age', 'gender', 'marital_status',
            
            # Contato
            'email', 'phone', 'phone_secondary',
            
            # Endereço
            'address', 'number', 'complement', 'neighborhood', 'city', 'state', 'zipcode', 'full_address',
            
            # Dados eclesiásticos 
            'membership_status', 'membership_status_display',
            'membership_date', 'membership_start_date', 'membership_end_date', 'membership_years', 'previous_church', 
            'transfer_letter',
            
            # Dados ministeriais
            'ministerial_function', 'ministerial_function_display',
            
            # Dados familiares
            'spouse', 'spouse_name', 'children_count', 'responsible',
            
            # Dados adicionais
            'profession', 'education_level', 'photo', 'notes',

            # Preferências
            'accept_sms', 'accept_email', 'accept_whatsapp',

            # Controle
            'is_active', 'created_at', 'updated_at',

            # Acesso ao sistema
            'has_system_access', 'system_user_email', 'system_user_role', 'system_user_role_label',
        ]
        read_only_fields = [
            'id', 'church_name', 'branch_name', 'age', 'membership_years', 'full_address',
            'spouse_name', 'membership_status_display', 'ministerial_function_display',
            'created_at', 'updated_at'
        ]
    
    def get_age(self, obj):
        """Calcula a idade baseada na data de nascimento"""
        return obj.age
    
    # Removido campo de conversão
    
    def get_membership_years(self, obj):
        """Calcula anos de membresia"""
        return obj.membership_years
    
    def get_full_address(self, obj):
        """Retorna endereço completo formatado"""
        return obj.full_address

    def get_spouse_name(self, obj):
        """Retorna o nome do cônjuge se ele for membro"""
        if obj.spouse:
            return obj.spouse.full_name
        return None

    def get_has_system_access(self, obj):
        try:
            return bool(obj.user_id)
        except Exception:
            return False

    def get_system_user_email(self, obj):
        try:
            return obj.user.email if obj.user_id and getattr(obj, 'user', None) else None
        except Exception:
            return None

    def get_system_user_role(self, obj):
        try:
            if not obj.user_id or not obj.church_id:
                return None
            from apps.accounts.models import ChurchUser
            cu = ChurchUser.objects.filter(user_id=obj.user_id, church_id=obj.church_id, is_active=True).first()
            return cu.role if cu else None
        except Exception:
            return None

    def get_system_user_role_label(self, obj):
        try:
            if not obj.user_id or not obj.church_id:
                return None
            from apps.accounts.models import ChurchUser
            cu = ChurchUser.objects.filter(user_id=obj.user_id, church_id=obj.church_id, is_active=True).first()
            return cu.get_role_display() if cu else None
        except Exception:
            return None


class MemberListSerializer(serializers.ModelSerializer):
    """
    Serializer otimizado para listagem de membros
    """
    
    age = serializers.SerializerMethodField()
    church_name = serializers.CharField(source='church.name', read_only=True)
    membership_status_display = serializers.CharField(source='get_membership_status_display', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    ministerial_function_display = serializers.CharField(source='get_ministerial_function_display', read_only=True)
    
    class Meta:
        model = Member
        fields = [
            'id', 'user', 'full_name', 'email', 'phone', 'birth_date', 'age',
            'church_name', 'branch_name', 'membership_status', 'membership_status_display',
            'ministerial_function', 'ministerial_function_display',
            'membership_date', 'membership_start_date', 'membership_end_date',
            'is_active'
        ]
    
    def get_age(self, obj):
        """Calcula a idade baseada na data de nascimento"""
        return obj.age


class MemberCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para criação de membros com suporte a criação de usuário do sistema
    """
    
    # Campos para criação de usuário do sistema
    create_system_user = serializers.BooleanField(default=False, write_only=True)
    system_role = serializers.ChoiceField(
        choices=[
            (RoleChoices.CHURCH_ADMIN, 'Administrador da Igreja'),
            (RoleChoices.SECRETARY, 'Secretário(a)'),
        ],
        required=False,
        write_only=True
    )
    user_email = serializers.EmailField(required=False, write_only=True)
    # REMOVIDO: user_password - senha será gerada automaticamente e enviada por email
    
    branch = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.none(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Member
        fields = [
            # Campos obrigatórios e principais
            'church', 'branch', 'full_name', 'birth_date',
            
            # Documentos
            'cpf', 'rg',
            
            # Dados pessoais
            'gender', 'marital_status',
            
            # Contato
            'email', 'phone', 'phone_secondary',
            
            # Endereço
            'address', 'number', 'complement', 'neighborhood', 'city', 'state', 'zipcode',
            
            # Dados eclesiásticos
            'membership_status', 'membership_start_date', 'membership_end_date', 
            'previous_church', 'transfer_letter',
            
            # Dados ministeriais
            'ministerial_function',
            
            # Dados familiares
            'spouse', 'children_count', 'responsible',
            
            # Dados adicionais
            'profession', 'education_level', 'photo', 'notes',
            
            # Preferências
            'accept_sms', 'accept_email', 'accept_whatsapp',
            
            # Campos para criação de usuário do sistema
            # NOTA: user_password foi removido - senha é gerada automaticamente
            'create_system_user', 'system_role', 'user_email'
        ]
    
    def validate_cpf(self, value):
        """Validação de CPF (opcional) com unicidade por denominação"""
        if not value or not str(value).strip():
            return None

        # Determinar denominação a partir da igreja
        church = None
        if self.context.get('request'):
            from apps.accounts.models import ChurchUser
            user = self.context['request'].user
            church = ChurchUser.objects.get_active_church_for_user(user)
        if not church and self.initial_data:
            church_id = self.initial_data.get('church')
            if church_id:
                from apps.churches.models import Church
                try:
                    church = Church.objects.get(id=church_id)
                except Church.DoesNotExist:
                    pass

        if church and church.denomination_id:
            exists = Member.objects.filter(
                cpf=value,
                is_active=True,
                church__denomination_id=church.denomination_id,
            ).exists()
        elif church:
            exists = Member.objects.filter(
                cpf=value,
                is_active=True,
                church=church,
            ).exists()
        else:
            # fallback conservador: permitir
            exists = False

        if exists:
            raise serializers.ValidationError("Este CPF já está cadastrado nesta denominação.")
        return value

    def validate_branch(self, value):
        """Garante que a filial pertença à igreja ativa"""
        if not value:
            return value

        request = self.context.get('request')
        church = None
        if request:
            from apps.accounts.models import ChurchUser
            church = ChurchUser.objects.get_active_church_for_user(request.user)

        if church and value.church_id != church.id:
            raise serializers.ValidationError("A filial selecionada não pertence à sua igreja ativa.")
        # Secretary write guard
        if request and request.method in ('POST', 'PUT', 'PATCH'):
            if not self._user_can_write_branch(request.user, value):
                raise serializers.ValidationError("Sem permissão para escrever nesta filial.")
        return value

    def __init__(self, *args, **kwargs):
        request = kwargs.get('context', {}).get('request') if kwargs.get('context') else None
        super().__init__(*args, **kwargs)
        if request:
            from apps.accounts.models import ChurchUser
            church = ChurchUser.objects.get_active_church_for_user(request.user)
            if church:
                self.fields['branch'].queryset = Branch.objects.filter(church=church, is_active=True)

    def _user_can_write_branch(self, user, branch):
        if not branch or not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        try:
            for cu in user.church_users.filter(is_active=True):
                if cu.can_manage_church(branch.church):
                    return True
            cu = user.church_users.filter(church=branch.church, is_active=True).first()
            if cu and cu.can_manage_members:
                if not cu.managed_branches.exists():
                    return True
                return cu.managed_branches.filter(pk=branch.pk).exists()
        except Exception:
            pass
        return False
    
    def validate_phone(self, value):
        """Validação de telefone"""
        if not value:
            raise serializers.ValidationError("Telefone é obrigatório.")
        return value
    
    def validate_email(self, value):
        """Validação de email"""
        # Apenas validar se email foi fornecido e não é string vazia
        if value and value.strip():
            # Tentar obter a igreja do contexto ou dos dados iniciais
            church = None
            
            # Primeiro, tentar obter do contexto do request
            if self.context.get('request'):
                from apps.accounts.models import ChurchUser
                user = self.context['request'].user
                church = ChurchUser.objects.get_active_church_for_user(user)
            
            # Se não conseguiu do contexto, tentar dos dados iniciais (durante criação)
            if not church and self.initial_data:
                church_id = self.initial_data.get('church')
                if church_id:
                    from apps.churches.models import Church
                    try:
                        church = Church.objects.get(id=church_id)
                    except Church.DoesNotExist:
                        pass
            
            # Se conseguiu obter a igreja, validar unicidade
            if church:
                existing = Member.objects.filter(
                    church=church,
                    email=value,
                    is_active=True
                ).exists()
                
                if existing:
                    raise serializers.ValidationError("Este e-mail já está cadastrado nesta igreja.")
        
        # Se email é string vazia, retornar None para salvar como NULL no banco
        return value if value and value.strip() else None
    
    def validate(self, attrs):
        """Validações gerais"""
        # Compat: se vier apenas membership_date, mapear para membership_start_date
        md = self.initial_data.get('membership_date') if isinstance(self.initial_data, dict) else None
        if md and not attrs.get('membership_start_date'):
            try:
                attrs['membership_start_date'] = md
            except Exception:
                pass
        # Validar idade mínima
        if attrs.get('birth_date'):
            today = date.today()
            age = today.year - attrs['birth_date'].year - ((today.month, today.day) < (attrs['birth_date'].month, attrs['birth_date'].day))
            if age > 120:
                raise serializers.ValidationError("Data de nascimento inválida - idade muito avançada.")
        
        # Validações para criação de usuário do sistema
        if attrs.get('create_system_user'):
            if not attrs.get('system_role'):
                raise serializers.ValidationError(
                    "Papel do sistema é obrigatório quando criar usuário do sistema está marcado."
                )
            
            if not attrs.get('user_email'):
                raise serializers.ValidationError(
                    "E-mail para login é obrigatório quando criar usuário do sistema está marcado."
                )
            
            # Validar se o e-mail já existe NESTA IGREJA (tenant isolation)
            # Um mesmo e-mail pode ser usado em igrejas diferentes
            user_email = attrs['user_email']
            request = self.context.get('request')
            
            if request and hasattr(request, 'church') and request.church:
                # Verificar se já existe um usuário com este e-mail vinculado a ESTA igreja
                from apps.accounts.models import ChurchUser
                
                existing_user = User.objects.filter(email=user_email, is_active=True).first()
                if existing_user:
                    # Verificar se este usuário já está vinculado à igreja atual
                    is_in_church = ChurchUser.objects.filter(
                        user=existing_user,
                        church=request.church,
                        is_active=True
                    ).exists()
                    
                    if is_in_church:
                        raise serializers.ValidationError(
                            f"Este e-mail já está sendo usado por outro usuário nesta igreja."
                        )
                    # Se o e-mail existe em outra igreja, permitir (multi-tenant)
            
            # NOTA: Validação de senha removida - senha será gerada automaticamente
        
        return attrs
    
    def create(self, validated_data):
        """Criar membro e opcionalmente usuário do sistema"""
        # Extrair dados do usuário do sistema
        create_system_user = validated_data.pop('create_system_user', False)
        system_role = validated_data.pop('system_role', None)
        user_email = validated_data.pop('user_email', None)
        # NOTA: user_password removido - será gerado automaticamente
        
        # Criar o membro
        member = super().create(validated_data)
        
        # Registrar histórico inicial de função ministerial (se houver)
        if member.ministerial_function:
            from datetime import date
            MinisterialFunctionHistory.objects.create(
                member=member,
                function=member.ministerial_function,
                start_date=date.today(),
                changed_by=self.context.get('request').user if self.context.get('request') else None,
                notes='Registro inicial via criação de membro'
            )

        # Registrar log inicial de status de membresia
        try:
            MembershipStatusLog.objects.create(
                member=member,
                old_status=member.membership_status,  # Sem status anterior conhecido
                new_status=member.membership_status,
                changed_by=self.context.get('request').user if self.context.get('request') else None,
                reason='Status inicial'
            )
        except Exception:  # Evita falha do cadastro por causa do log
            pass
        
        # Criar usuário do sistema se solicitado
        if create_system_user and system_role and user_email:
            try:
                # NOVO: Gerar senha segura automaticamente
                generated_password = secrets.token_urlsafe(12)
                
                logger.info(
                    f"🔐 Gerando credenciais de sistema para membro {member.full_name} "
                    f"(email: {user_email}, papel: {system_role})"
                )
                
                # Criar usuário
                user = User.objects.create_user(
                    email=user_email,
                    password=generated_password,  # Senha gerada automaticamente
                    full_name=member.full_name,
                    phone=member.phone or '',
                    is_active=True
                )
                
                # Associar usuário ao membro
                member.user = user
                member.save()
                
                # Criar ChurchUser com o papel especificado
                ChurchUser.objects.create(
                    user=user,
                    church=member.church,
                    role=system_role,
                    is_active=True
                )
                
                # NOVO: Enviar email com credenciais
                try:
                    # Obter nome amigável do papel
                    role_display = dict([
                        (RoleChoices.CHURCH_ADMIN, 'Administrador da Igreja'),
                        (RoleChoices.SECRETARY, 'Secretário(a)'),
                        (RoleChoices.SUPER_ADMIN, 'Super Administrador'),
                    ]).get(system_role, system_role)
                    
                    EmailService.send_welcome_credentials(
                        member_name=member.full_name,
                        user_email=user_email,
                        user_password=generated_password,
                        church_name=member.church.name,
                        role_display=role_display,
                        role_code=system_role,
                    )
                    
                    logger.info(
                        f"✅ Email de boas-vindas enviado com sucesso para {user_email}"
                    )
                    
                except EmailServiceError as e:
                    # Log do erro mas não falha a criação do membro
                    logger.error(
                        f"❌ Falha ao enviar email de boas-vindas para {user_email}: {e}",
                        exc_info=True
                    )
                    # Poderia adicionar uma notificação ao admin aqui
                    
                except Exception as e:
                    logger.error(
                        f"❌ Erro inesperado ao enviar email para {user_email}: {e}",
                        exc_info=True
                    )
                
            except Exception as e:
                # Se houver erro na criação do usuário, deletar o membro criado
                member.delete()
                logger.error(
                    f"❌ Erro ao criar usuário do sistema para {member.full_name}: {e}",
                    exc_info=True
                )
                raise serializers.ValidationError(f"Erro ao criar usuário do sistema: {str(e)}")
        
        return member


class MemberUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para atualização de membros.
    Também permite conceder acesso ao sistema para membros existentes.
    """

    branch = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.none(),
        required=False,
        allow_null=True
    )
    
    # Campos para concessão de acesso ao sistema (opcional)
    grant_system_access = serializers.BooleanField(required=False, write_only=True)
    system_role = serializers.ChoiceField(
        choices=[
            (RoleChoices.CHURCH_ADMIN, 'Administrador da Igreja'),
            (RoleChoices.SECRETARY, 'Secretário(a)'),
        ],
        required=False,
        write_only=True
    )
    user_email = serializers.EmailField(required=False, write_only=True)

    class Meta:
        model = Member
        fields = [
            # Não permitir alteração de church e campos críticos
            'full_name', 'cpf', 'rg', 'birth_date', 'gender', 'marital_status',
            'email', 'phone', 'phone_secondary', 'address', 'number', 'complement', 'neighborhood', 
            'city', 'state', 'zipcode', 
            'membership_status', 'membership_start_date', 'membership_end_date', 'previous_church', 'transfer_letter', 
            'ministerial_function', 'spouse', 'children_count', 'responsible', 'profession', 'education_level', 
            'photo', 'notes', 'accept_sms', 'accept_email', 'accept_whatsapp',
            'branch',
            # Campos para conceder acesso ao sistema
            'grant_system_access', 'system_role', 'user_email'
        ]
    
    def validate_cpf(self, value):
        """Validação de CPF (opcional) na atualização com unicidade por denominação"""
        if not value or not str(value).strip():
            return None
        
        church = getattr(self.instance, 'church', None)
        if church and church.denomination_id:
            exists = Member.objects.filter(
                cpf=value,
                is_active=True,
                church__denomination_id=church.denomination_id,
            ).exclude(pk=self.instance.pk).exists()
        elif church:
            exists = Member.objects.filter(
                cpf=value,
                is_active=True,
                church=church,
            ).exclude(pk=self.instance.pk).exists()
        else:
            exists = False
        
        if exists:
            raise serializers.ValidationError("Este CPF já está cadastrado nesta denominação.")
        return value
    
    def validate(self, attrs):
        """Validações gerais incluindo concessão de acesso ao sistema"""
        # Validações para concessão de acesso ao sistema
        if attrs.get('grant_system_access'):
            # Verificar se membro já tem usuário
            if self.instance and self.instance.user:
                raise serializers.ValidationError(
                    "Este membro já possui acesso ao sistema."
                )
            
            if not attrs.get('system_role'):
                raise serializers.ValidationError(
                    "Papel do sistema é obrigatório ao conceder acesso."
                )
            
            if not attrs.get('user_email'):
                raise serializers.ValidationError(
                    "E-mail para login é obrigatório ao conceder acesso."
                )
            
            # Validar se o e-mail já existe NESTA IGREJA (tenant isolation)
            # Um mesmo e-mail pode ser usado em igrejas diferentes
            user_email = attrs['user_email']
            request = self.context.get('request')
            
            if request and hasattr(request, 'church') and request.church:
                # Verificar se já existe um usuário com este e-mail vinculado a ESTA igreja
                from apps.accounts.models import ChurchUser
                
                existing_user = User.objects.filter(email=user_email, is_active=True).first()
                if existing_user:
                    # Verificar se este usuário já está vinculado à igreja atual
                    is_in_church = ChurchUser.objects.filter(
                        user=existing_user,
                        church=request.church,
                        is_active=True
                    ).exists()
                    
                    if is_in_church:
                        raise serializers.ValidationError(
                            f"Este e-mail já está sendo usado por outro usuário nesta igreja."
                        )
                    # Se o e-mail existe em outra igreja, permitir (multi-tenant)
        
        return attrs

    def update(self, instance, validated_data):
        """
        Atualiza membro e sincroniza histórico de função quando função muda.
        Também permite conceder acesso ao sistema para membros existentes.
        """
        # Extrair dados de concessão de acesso
        grant_system_access = validated_data.pop('grant_system_access', False)
        system_role = validated_data.pop('system_role', None)
        user_email = validated_data.pop('user_email', None)
        
        old_function = instance.ministerial_function
        new_function = validated_data.get('ministerial_function', old_function)
        old_status = instance.membership_status
        new_status = validated_data.get('membership_status', old_status)
        member = super().update(instance, validated_data)
        
        # Lógica de histórico de função ministerial (mantida)
        if new_function != old_function:
            from datetime import date, timedelta
            # Encerrar histórico atual (se existir)
            current = member.ministerial_function_history.filter(end_date__isnull=True).first()
            if current:
                # Encerrar no dia anterior ao novo início
                end_date = date.today() - timedelta(days=1)
                if current.start_date and end_date <= current.start_date:
                    end_date = current.start_date
                current.end_date = end_date
                current.save(update_fields=['end_date', 'updated_at'])
            # Criar novo histórico
            MinisterialFunctionHistory.objects.create(
                member=member,
                function=new_function,
                start_date=date.today(),
                changed_by=self.context.get('request').user if self.context.get('request') else None,
                notes='Atualização via edição de membro'
            )
        
        # Log de mudança de status de membresia (mantido)
        if new_status != old_status:
            try:
                MembershipStatusLog.objects.create(
                    member=member,
                    old_status=old_status,
                    new_status=new_status,
                    changed_by=self.context.get('request').user if self.context.get('request') else None,
                    reason='Alteração via edição do membro'
                )
            except Exception:
                pass
        
        # NOVO: Conceder acesso ao sistema se solicitado
        if grant_system_access and system_role and user_email:
            try:
                # Gerar senha segura automaticamente
                generated_password = secrets.token_urlsafe(12)
                
                logger.info(
                    f"🔐 Concedendo acesso ao sistema para membro existente {member.full_name} "
                    f"(email: {user_email}, papel: {system_role})"
                )
                
                # Criar usuário
                user = User.objects.create_user(
                    email=user_email,
                    password=generated_password,
                    full_name=member.full_name,
                    phone=member.phone or '',
                    is_active=True
                )
                
                # Associar usuário ao membro
                member.user = user
                member.save()
                
                # Criar ChurchUser com o papel especificado
                ChurchUser.objects.create(
                    user=user,
                    church=member.church,
                    role=system_role,
                    is_active=True
                )
                
                # Enviar email com credenciais
                try:
                    # Obter nome amigável do papel
                    role_display = dict([
                        (RoleChoices.CHURCH_ADMIN, 'Administrador da Igreja'),
                        (RoleChoices.SECRETARY, 'Secretário(a)'),
                        (RoleChoices.SUPER_ADMIN, 'Super Administrador'),
                    ]).get(system_role, system_role)
                    
                    EmailService.send_welcome_credentials(
                        member_name=member.full_name,
                        user_email=user_email,
                        user_password=generated_password,
                        church_name=member.church.name,
                        role_display=role_display,
                        role_code=system_role,
                    )
                    
                    logger.info(
                        f"✅ Email de boas-vindas enviado com sucesso para {user_email}"
                    )
                    
                except EmailServiceError as e:
                    logger.error(
                        f"❌ Falha ao enviar email de boas-vindas para {user_email}: {e}",
                        exc_info=True
                    )
                    
                except Exception as e:
                    logger.error(
                        f"❌ Erro inesperado ao enviar email para {user_email}: {e}",
                        exc_info=True
                    )
                
            except Exception as e:
                logger.error(
                    f"❌ Erro ao conceder acesso ao sistema para {member.full_name}: {e}",
                    exc_info=True
                )
                raise serializers.ValidationError(
                    f"Erro ao conceder acesso ao sistema: {str(e)}"
                )
        
        return member
    
    def validate_phone(self, value):
        """Validação de telefone na atualização"""
        if not value:
            raise serializers.ValidationError("Telefone é obrigatório.")
        return value

    def validate_branch(self, value):
        """Validação da filial na atualização + permissão branch-aware"""
        if not value:
            return value

        church = None
        if self.instance and hasattr(self.instance, 'church'):
            church = self.instance.church
        elif self.context.get('request'):
            from apps.accounts.models import ChurchUser
            church = ChurchUser.objects.get_active_church_for_user(self.context['request'].user)

        if church and value.church_id != church.id:
            raise serializers.ValidationError("A filial selecionada não pertence à mesma igreja.")

        request = self.context.get('request')
        if request and request.method in ('PUT', 'PATCH'):
            if not self._user_can_write_branch(request.user, value):
                raise serializers.ValidationError("Sem permissão para editar membro nesta filial.")
        return value

    def _user_can_write_branch(self, user, branch):
        if not branch or not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        try:
            for cu in user.church_users.filter(is_active=True):
                if cu.can_manage_church(branch.church):
                    return True
            cu = user.church_users.filter(church=branch.church, is_active=True).first()
            if cu and cu.can_manage_members:
                if not cu.managed_branches.exists():
                    return True
                return cu.managed_branches.filter(pk=branch.pk).exists()
        except Exception:
            pass
        return False
    
    def validate_email(self, value):
        """Validação de email na atualização"""
        # Apenas validar se email foi fornecido e não é string vazia
        if value and value.strip():
            # Tentar obter a igreja do contexto ou da instância atual
            church = None
            
            # Primeiro, tentar obter da instância sendo atualizada
            if self.instance and hasattr(self.instance, 'church'):
                church = self.instance.church
            
            # Se não conseguiu, tentar do contexto do request
            if not church and self.context.get('request'):
                from apps.accounts.models import ChurchUser
                user = self.context['request'].user
                church = ChurchUser.objects.get_active_church_for_user(user)
            
            # Se conseguiu obter a igreja, validar unicidade
            if church:
                existing = Member.objects.filter(
                    church=church,
                    email=value,
                    is_active=True
                ).exclude(pk=self.instance.pk).exists()
                
                if existing:
                    raise serializers.ValidationError("Este e-mail já está cadastrado nesta igreja.")
        
        # Se email é string vazia, retornar None para salvar como NULL no banco
        return value if value and value.strip() else None

    def __init__(self, *args, **kwargs):
        request = kwargs.get('context', {}).get('request') if kwargs.get('context') else None
        super().__init__(*args, **kwargs)
        church = None
        if self.instance:
            church = self.instance.church
        elif request:
            from apps.accounts.models import ChurchUser
            church = ChurchUser.objects.get_active_church_for_user(request.user)

        if church:
            self.fields['branch'].queryset = Branch.objects.filter(church=church, is_active=True)
    


class MemberSummarySerializer(serializers.ModelSerializer):
    """
    Serializer muito resumido para dashboards e listas simples
    """
    
    age = serializers.SerializerMethodField()
    church_name = serializers.CharField(source='church.name', read_only=True)
    
    class Meta:
        model = Member
        fields = [
            'id', 'full_name', 'email', 'phone', 'age', 'church_name',
            'is_active'
        ]
    
    def get_age(self, obj):
        """Calcula a idade"""
        if obj.birth_date:
            today = date.today()
            return today.year - obj.birth_date.year - ((today.month, today.day) < (obj.birth_date.month, obj.birth_date.day))
        return None


# =====================================
# SERIALIZERS PARA AUDITORIA SIMPLES
# =====================================

class MembershipStatusLogSerializer(serializers.ModelSerializer):
    """
    Serializer para histórico de mudanças de status - SIMPLES E EFICIENTE
    """
    
    member_name = serializers.CharField(source='member.full_name', read_only=True)
    changed_by_name = serializers.CharField(source='changed_by.full_name', read_only=True)
    old_status_display = serializers.CharField(source='get_old_status_display', read_only=True)
    new_status_display = serializers.CharField(source='get_new_status_display', read_only=True)
    
    class Meta:
        model = MembershipStatusLog
        fields = [
            'id', 'member', 'member_name',
            'old_status', 'old_status_display',
            'new_status', 'new_status_display', 
            'reason', 'changed_by', 'changed_by_name',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class MembershipStatusSerializer(serializers.ModelSerializer):
    """
    Serializer para status de membresia separado
    """
    
    member_name = serializers.CharField(source='member.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    # Novos aliases para datas de ordenação
    ordination_start_date = serializers.DateField(source='effective_date', required=False, allow_null=True)
    ordination_end_date = serializers.DateField(source='end_date', required=False, allow_null=True)
    
    class Meta:
        model = MembershipStatus
        fields = [
            'id', 'member', 'member_name', 'branch', 'status', 'status_display',
            'effective_date', 'end_date', 'ordination_start_date', 'ordination_end_date',
            'observation', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'member_name', 'status_display', 'created_at', 'updated_at']
    
    def validate(self, attrs):
        """Validações específicas"""
        # Compat: aceitar ordination_* e mapear para effective_date/end_date
        initial = getattr(self, 'initial_data', {}) or {}
        if 'ordination_start_date' in initial and 'effective_date' not in attrs:
            attrs['effective_date'] = initial.get('ordination_start_date')
        if 'ordination_end_date' in initial and 'end_date' not in attrs:
            attrs['end_date'] = initial.get('ordination_end_date')

        effective_date = attrs.get('effective_date')
        end_date = attrs.get('end_date')
        
        if end_date and effective_date and end_date <= effective_date:
            raise serializers.ValidationError(
                "Data de término deve ser posterior à data de ordenação"
            )
        
        # Definir branch padrão quando não informado: usar branch do membro
        if attrs.get('branch') is None:
            member = attrs.get('member') or getattr(self.instance, 'member', None)
            if member and getattr(member, 'branch', None):
                attrs['branch'] = member.branch
        
        # Coerência church ↔ branch do status
        member = attrs.get('member') or getattr(self.instance, 'member', None)
        branch = attrs.get('branch') or getattr(self.instance, 'branch', None)
        if member and branch and member.church_id != branch.church_id:
            raise serializers.ValidationError({'branch': 'Filial do status deve pertencer à mesma igreja do membro.'})

        # Validar unicidade de status atual (sem end_date)
        if not attrs.get('end_date'):
            from .models import MembershipStatus
            member = attrs.get('member') or getattr(self.instance, 'member', None)
            if member:
                qs = MembershipStatus.objects.filter(member=member, end_date__isnull=True)
                if self.instance:
                    qs = qs.exclude(pk=self.instance.pk)
                if qs.exists():
                    raise serializers.ValidationError(
                        "Já existe um status atual para este membro. Finalize o status atual antes de criar outro."
                    )

        # Secretary branch-aware para escrita
        request = self.context.get('request')
        if request and request.method in ('POST', 'PUT', 'PATCH') and branch:
            if not self._user_can_write_branch(request.user, branch):
                raise serializers.ValidationError({'branch': 'Sem permissão para alterar status nesta filial.'})

        return attrs

    def _user_can_write_branch(self, user, branch):
        if not branch or not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        try:
            for cu in user.church_users.filter(is_active=True):
                if cu.can_manage_church(branch.church):
                    return True
            cu = user.church_users.filter(church=branch.church, is_active=True).first()
            if cu and cu.can_manage_members:
                if not cu.managed_branches.exists():
                    return True
                return cu.managed_branches.filter(pk=branch.pk).exists()
        except Exception:
            pass
        return False


class MinisterialFunctionHistorySerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.full_name', read_only=True)
    function_display = serializers.CharField(source='get_function_display', read_only=True)
    is_current = serializers.ReadOnlyField()

    class Meta:
        model = MinisterialFunctionHistory
        fields = [
            'id', 'member', 'member_name', 'function', 'function_display', 
            'start_date', 'end_date', 'is_current', 'notes'
        ]
        read_only_fields = ['id', 'member_name', 'function_display', 'is_current']

    def create(self, validated_data):
        member = validated_data['member']
        new_function = validated_data['function']
        start_date = validated_data['start_date']
        from datetime import timedelta
        # Encerrar atual se existir
        current = member.ministerial_function_history.filter(end_date__isnull=True).first()
        if current:
            end_date = start_date - timedelta(days=1)
            if end_date <= current.start_date:
                end_date = current.start_date
            current.end_date = end_date
            current.save(update_fields=['end_date', 'updated_at'])

        # Criar novo
        obj = super().create(validated_data)

        # Sincronizar com campo do Member
        if member.ministerial_function != new_function:
            member.ministerial_function = new_function
            member.save(update_fields=['ministerial_function', 'updated_at'])
        return obj


class MemberStatusChangeSerializer(serializers.Serializer):
    """
    Serializer para alteração de status de membro
    """
    new_status = serializers.ChoiceField(
        choices=MembershipStatusChoices.choices,
        required=True,
        help_text="Novo status de membresia"
    )
    reason = serializers.CharField(
        max_length=500,
        required=False,
        allow_blank=True,
        help_text="Motivo da alteração de status"
    )


# Constantes para facilitar o uso nos filtros
MEMBERSHIP_STATUS_CHOICES = MembershipStatusChoices.choices
MINISTERIAL_FUNCTION_CHOICES = MinisterialFunctionChoices.choices
