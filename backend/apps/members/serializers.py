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
from .models import Member, MembershipStatusLog, MembershipStatus, FamilyRelationship
from apps.branches.models import Branch
from apps.core.models import MembershipStatusChoices, MinisterialFunctionChoices, RoleChoices
from apps.accounts.models import ChurchUser, UserProfile
from .models import MinisterialFunctionHistory
from apps.core.services import EmailService
from apps.core.services.email_service import EmailServiceError

User = get_user_model()
logger = logging.getLogger(__name__)


def _sync_user_profile_from_member(user, member):
    """
    Garante que o perfil do usuário receba CPF e dados básicos do membro.
    Bloqueia CPF duplicado entre usuários do sistema.
    """
    profile, _ = UserProfile.objects.get_or_create(user=user)

    cpf_value = getattr(member, 'cpf', None)
    if cpf_value:
        cpf_digits = ''.join(filter(str.isdigit, cpf_value))
        if cpf_digits:
            existing_cpfs = UserProfile.objects.exclude(user=user).filter(
                cpf__isnull=False
            ).values_list('cpf', flat=True)
            if any(''.join(filter(str.isdigit, existing or '')) == cpf_digits for existing in existing_cpfs):
                raise serializers.ValidationError({
                    "cpf": "CPF já cadastrado no sistema. Se você já possui conta, faça login ou recupere sua senha."
                })
        profile.cpf = cpf_value

    # Popular dados complementares apenas se estiverem vazios no perfil
    optional_fields = [
        'birth_date', 'gender', 'address', 'zipcode',
        'number', 'neighborhood', 'city', 'state',
    ]
    for field in optional_fields:
        if getattr(profile, field, None) in (None, '') and hasattr(member, field):
            setattr(profile, field, getattr(member, field))

    profile.save()
    return profile


def _sync_children_relationships(member, child_ids):
    """
    Cria/atualiza vínculos familiares (pai/mãe -> filho).
    child_ids: lista de IDs de membros considerados filhos do member.
    """
    if child_ids is None:
        return

    # Normalizar e deduplicar
    try:
        child_ids = [int(cid) for cid in child_ids if cid is not None]
    except (TypeError, ValueError):
        raise serializers.ValidationError({"children": "IDs de filhos inválidos."})

    child_ids = list(dict.fromkeys(child_ids))

    # Validar pertencimento à mesma igreja e existência
    children_qs = Member.objects.filter(id__in=child_ids, church=member.church, is_active=True)
    found_ids = set(children_qs.values_list('id', flat=True))
    missing = set(child_ids) - found_ids
    if missing:
        raise serializers.ValidationError({"children": f"Filhos inválidos ou fora da igreja: {missing}"})

    # Remover vínculos anteriores (parent/child) para este membro que não estão mais na lista
    FamilyRelationship.objects.filter(
        member=member,
        relation_type=FamilyRelationship.RELATION_CHILD
    ).exclude(related_member_id__in=child_ids).delete()

    FamilyRelationship.objects.filter(
        related_member=member,
        relation_type=FamilyRelationship.RELATION_PARENT
    ).exclude(member_id__in=child_ids).delete()

    # Criar vínculos bidirecionais
    for child in children_qs:
        FamilyRelationship.objects.get_or_create(
            member=member,
            related_member=child,
            relation_type=FamilyRelationship.RELATION_CHILD
        )
        FamilyRelationship.objects.get_or_create(
            member=child,
            related_member=member,
            relation_type=FamilyRelationship.RELATION_PARENT
        )

    # Atualizar contador de filhos, se presente
    try:
        member.children_count = len(child_ids)
        member.save(update_fields=['children_count', 'updated_at'])
    except Exception:
        pass


class MemberBulkUploadSerializer(serializers.Serializer):
    """
    Serializer para upload em lote de membros via CSV.
    """

    file = serializers.FileField(help_text="Arquivo CSV ou TXT com dados dos membros")
    branch_id = serializers.IntegerField(
        required=False, allow_null=True, help_text="ID da filial destino (opcional)"
    )
    skip_duplicates = serializers.BooleanField(
        default=True,
        help_text="Ignora automaticamente registros duplicados por CPF/email",
    )

    def validate(self, attrs):
        request = self.context.get("request")
        church = getattr(request, "church", None) if request else None
        if not church and request and getattr(request, "user", None) and request.user.is_authenticated:
            from apps.accounts.models import ChurchUser
            church = ChurchUser.objects.get_active_church_for_user(request.user)
        branch = None

        branch_id = attrs.pop("branch_id", None)
        if branch_id:
            if not church:
                raise serializers.ValidationError(
                    "Não foi possível determinar a igreja ativa do usuário."
                )
            try:
                branch = Branch.objects.get(
                    id=branch_id, church=church, is_active=True
                )
            except Branch.DoesNotExist:
                raise serializers.ValidationError(
                    {"branch_id": "Filial não encontrada para a igreja selecionada."}
                )
            if not request.user.is_superuser:
                view = self.context.get("view")
                if view and not view._user_can_write_branch(request.user, branch):
                    raise serializers.ValidationError(
                        {"branch_id": "Usuário não possui permissão nesta filial."}
                    )
        attrs["branch"] = branch
        attrs["church"] = church

        uploaded_file = attrs.get("file")
        if uploaded_file:
            if uploaded_file.size == 0:
                raise serializers.ValidationError("Arquivo enviado está vazio.")
        return attrs


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
    children = serializers.SerializerMethodField()
    parents = serializers.SerializerMethodField()
    
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
            'spouse', 'spouse_name', 'children_count', 'children', 'parents', 'responsible',
            
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

    def _serialize_member_brief(self, member):
        return {
            'id': member.id,
            'full_name': member.full_name,
            'age': member.age,
            'gender': member.gender,
            'birth_date': member.birth_date,
        }

    def get_children(self, obj):
        try:
            children = Member.objects.filter(
                family_links__member=obj,
                family_links__relation_type=FamilyRelationship.RELATION_CHILD
            ).distinct()
            return [self._serialize_member_brief(child) for child in children]
        except Exception:
            return []

    def get_parents(self, obj):
        try:
            parents = Member.objects.filter(
                family_links__member=obj,
                family_links__relation_type=FamilyRelationship.RELATION_PARENT
            ).distinct()
            return [self._serialize_member_brief(parent) for parent in parents]
        except Exception:
            return []


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
    children = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True,
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
            'children',
            
            # Dados adicionais
            'profession', 'education_level', 'photo', 'notes',
            
            # Preferências
            'accept_sms', 'accept_email', 'accept_whatsapp',
            
            # Campos para criação de usuário do sistema
            # NOTA: user_password foi removido - senha é gerada automaticamente
            'create_system_user', 'system_role', 'user_email'
        ]
    
    def validate_cpf(self, value):
        """Validação de CPF (opcional) sem bloquear duplicidade para membros."""
        if not value or not str(value).strip():
            return None
        return str(value).strip()

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
            return value.strip()
        # Se email é string vazia, retornar None para salvar como NULL no banco
        return None
    
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

            # Validar se o e-mail já existe globalmente
            user_email = attrs['user_email']
            if User.objects.filter(email=user_email).exists():
                raise serializers.ValidationError({
                    "user_email": "E-mail já cadastrado no sistema. Faça login ou recupere a senha."
                })
            # NOTA: Validação de senha removida - senha será gerada automaticamente
        
        return attrs
    
    def create(self, validated_data):
        """Criar membro e opcionalmente usuário do sistema"""
        # Extrair dados do usuário do sistema
        create_system_user = validated_data.pop('create_system_user', False)
        system_role = validated_data.pop('system_role', None)
        user_email = validated_data.pop('user_email', None)
        children_ids = validated_data.pop('children', None)
        # NOTA: user_password removido - será gerado automaticamente
        
        # Criar o membro
        member = super().create(validated_data)

        # Sincronizar vínculos de filhos (opcional)
        _sync_children_relationships(member, children_ids)
        
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

                # Garantir perfil com CPF e dados básicos
                _sync_user_profile_from_member(user, member)

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
                
            except serializers.ValidationError as e:
                member.delete()
                raise e
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
    revoke_system_access = serializers.BooleanField(required=False, write_only=True)
    children = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True,
        write_only=True
    )

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
            # Campos para conceder/ajustar/revogar acesso ao sistema
            'grant_system_access', 'system_role', 'user_email', 'revoke_system_access',
            # Vínculos familiares
            'children'
        ]
    
    def validate_cpf(self, value):
        """Validação de CPF (opcional) na atualização sem bloquear duplicidade para membros."""
        if not value or not str(value).strip():
            return None
        return str(value).strip()
    
    def validate(self, attrs):
        """Validações gerais incluindo concessão de acesso ao sistema"""
        revoke_access = attrs.get('revoke_system_access')

        if revoke_access and attrs.get('grant_system_access'):
            raise serializers.ValidationError("Não é possível conceder e revogar acesso simultaneamente.")

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

            # Validar se o e-mail já existe globalmente
            user_email = attrs['user_email']
            if User.objects.filter(email=user_email).exists():
                raise serializers.ValidationError({
                    "user_email": "E-mail já cadastrado no sistema. Faça login ou recupere a senha."
                })

        # Validação para ajuste de papel quando já possui acesso
        if attrs.get('system_role') and not attrs.get('grant_system_access'):
            if not self.instance or not self.instance.user:
                raise serializers.ValidationError(
                    "Papel do sistema só pode ser ajustado para membros que já possuem acesso."
                )

        if revoke_access and (not self.instance or not self.instance.user):
            raise serializers.ValidationError("Este membro não possui acesso ao sistema para ser removido.")
        
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
        revoke_system_access = validated_data.pop('revoke_system_access', False)
        children_ids = validated_data.pop('children', None)
        
        old_function = instance.ministerial_function
        new_function = validated_data.get('ministerial_function', old_function)
        old_status = instance.membership_status
        new_status = validated_data.get('membership_status', old_status)
        member = super().update(instance, validated_data)
        _sync_children_relationships(member, children_ids)
        
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
        
        # NOVO: Remover acesso ao sistema, se solicitado
        if revoke_system_access and member.user_id:
            try:
                # Desativar vínculos ChurchUser deste membro na igreja atual
                qs = ChurchUser.objects.filter(user=member.user, church=member.church)
                for cu in qs:
                    cu.is_active = False
                    cu.is_user_active_church = False
                    cu.active_branch = None
                    cu.save(update_fields=['is_active', 'is_user_active_church', 'active_branch', 'updated_at'])

                # Opcional: desativar usuário se não houver mais vínculos ativos
                user = member.user
                has_other_active = ChurchUser.objects.filter(user=user, is_active=True).exists()
                if not has_other_active:
                    user.is_active = False
                    user.save(update_fields=['is_active'])

                # Remover vínculo com o membro
                member.user = None
                member.save(update_fields=['user', 'updated_at'])
            except Exception as e:
                logger.error("Erro ao revogar acesso ao sistema para membro %s: %s", member.id, e, exc_info=True)
                raise serializers.ValidationError("Não foi possível remover o acesso ao sistema. Tente novamente.")
            return member

        # NOVO: Ajustar papel do sistema para membro que já possui acesso
        if system_role and member.user_id and not grant_system_access:
            try:
                church_user = ChurchUser.objects.filter(user=member.user, church=member.church).first()
                if not church_user:
                    church_user = ChurchUser.objects.create(
                        user=member.user,
                        church=member.church,
                        role=system_role,
                        is_active=True
                    )
                else:
                    church_user.role = system_role
                    church_user.is_active = True
                    church_user.save(update_fields=['role', 'is_active', 'updated_at'])
            except Exception as e:
                logger.error("Erro ao ajustar papel do sistema para membro %s: %s", member.id, e, exc_info=True)
                raise serializers.ValidationError("Não foi possível atualizar o papel de acesso ao sistema.")

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

                # Garantir perfil com CPF e dados básicos
                _sync_user_profile_from_member(user, member)
                
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
                
            except serializers.ValidationError as e:
                raise e
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
            return value.strip()
        # Se email é string vazia, retornar None para salvar como NULL no banco
        return None

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
