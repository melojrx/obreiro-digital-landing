"""
Serializers para o app Members
Gerencia serialização de membros
"""

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

User = get_user_model()


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
            'membership_date', 'membership_years', 'previous_church', 
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
            'is_active', 'created_at', 'updated_at'
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
            'membership_date',
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
            (RoleChoices.PASTOR, 'Pastor'),
            (RoleChoices.SECRETARY, 'Secretário(a)'),
            (RoleChoices.LEADER, 'Líder'),
            (RoleChoices.MEMBER, 'Membro'),
        ],
        required=False,
        write_only=True
    )
    user_email = serializers.EmailField(required=False, write_only=True)
    user_password = serializers.CharField(min_length=8, required=False, write_only=True)
    
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
            'membership_status', 
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
            'create_system_user', 'system_role', 'user_email', 'user_password'
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
        return value

    def __init__(self, *args, **kwargs):
        request = kwargs.get('context', {}).get('request') if kwargs.get('context') else None
        super().__init__(*args, **kwargs)
        if request:
            from apps.accounts.models import ChurchUser
            church = ChurchUser.objects.get_active_church_for_user(request.user)
            if church:
                self.fields['branch'].queryset = Branch.objects.filter(church=church, is_active=True)
    
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
        # Validar idade mínima
        if attrs.get('birth_date'):
            today = date.today()
            age = today.year - attrs['birth_date'].year - ((today.month, today.day) < (attrs['birth_date'].month, attrs['birth_date'].day))
            if age > 120:
                raise serializers.ValidationError("Data de nascimento inválida - idade muito avançada.")
        
        # Validações para criação de usuário do sistema
        if attrs.get('create_system_user'):
            if not attrs.get('system_role'):
                raise serializers.ValidationError("Papel do sistema é obrigatório quando criar usuário do sistema está marcado.")
            
            if not attrs.get('user_email'):
                raise serializers.ValidationError("E-mail para login é obrigatório quando criar usuário do sistema está marcado.")
            
            if not attrs.get('user_password'):
                raise serializers.ValidationError("Senha inicial é obrigatória quando criar usuário do sistema está marcado.")
            
            # Validar se o e-mail já existe (apenas usuários ativos)
            if User.objects.filter(email=attrs['user_email'], is_active=True).exists():
                raise serializers.ValidationError("Este e-mail já está sendo usado por outro usuário ativo do sistema.")
            
            # Validar senha
            try:
                validate_password(attrs['user_password'])
            except DjangoValidationError as e:
                raise serializers.ValidationError({"user_password": list(e.messages)})
        
        return attrs
    
    def create(self, validated_data):
        """Criar membro e opcionalmente usuário do sistema"""
        # Extrair dados do usuário do sistema
        create_system_user = validated_data.pop('create_system_user', False)
        system_role = validated_data.pop('system_role', None)
        user_email = validated_data.pop('user_email', None)
        user_password = validated_data.pop('user_password', None)
        
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
        if create_system_user and system_role and user_email and user_password:
            try:
                # Criar usuário
                user = User.objects.create_user(
                    email=user_email,
                    password=user_password,
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
                
            except Exception as e:
                # Se houver erro na criação do usuário, deletar o membro criado
                member.delete()
                raise serializers.ValidationError(f"Erro ao criar usuário do sistema: {str(e)}")
        
        return member


class MemberUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para atualização de membros
    """

    branch = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.none(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Member
        fields = [
            # Não permitir alteração de church e campos críticos
            'full_name', 'cpf', 'rg', 'birth_date', 'gender', 'marital_status',
            'email', 'phone', 'phone_secondary', 'address', 'number', 'complement', 'neighborhood', 
            'city', 'state', 'zipcode', 
            'membership_status', 'previous_church', 'transfer_letter', 
            'ministerial_function', 'spouse', 'children_count', 'responsible', 'profession', 'education_level', 
            'photo', 'notes', 'accept_sms', 'accept_email', 'accept_whatsapp',
            'branch'
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

    def update(self, instance, validated_data):
        """Atualiza membro e sincroniza histórico de função quando função muda"""
        old_function = instance.ministerial_function
        new_function = validated_data.get('ministerial_function', old_function)
        old_status = instance.membership_status
        new_status = validated_data.get('membership_status', old_status)
        member = super().update(instance, validated_data)
        
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
        # Log de mudança de status de membresia
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
        return member
        return value
    
    def validate_phone(self, value):
        """Validação de telefone na atualização"""
        if not value:
            raise serializers.ValidationError("Telefone é obrigatório.")
        return value

    def validate_branch(self, value):
        """Validação da filial na atualização"""
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
        return value
    
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
    
    class Meta:
        model = MembershipStatus
        fields = [
            'id', 'member', 'member_name', 'status', 'status_display',
            'effective_date', 'end_date', 'observation',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'member_name', 'status_display', 'created_at', 'updated_at']
    
    def validate(self, attrs):
        """Validações específicas"""
        effective_date = attrs.get('effective_date')
        end_date = attrs.get('end_date')
        
        if end_date and effective_date and end_date <= effective_date:
            raise serializers.ValidationError(
                "Data de término deve ser posterior à data de ordenação"
            )
        
        return attrs


class MinisterialFunctionHistorySerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.full_name', read_only=True)
    is_current = serializers.ReadOnlyField()

    class Meta:
        model = MinisterialFunctionHistory
        fields = [
            'id', 'member', 'member_name', 'function', 'start_date', 'end_date', 'is_current', 'notes'
        ]
        read_only_fields = ['id', 'member_name', 'is_current']

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
