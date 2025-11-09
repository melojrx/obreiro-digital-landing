"""
Serializers para o app Visitors
Sistema de QR Code para registro de visitantes
"""

from rest_framework import serializers
from .models import Visitor
from apps.branches.models import Branch


class VisitorPublicRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer para registro público de visitantes via QR Code
    Usado na página pública de registro
    """
    
    class Meta:
        model = Visitor
        fields = [
            'full_name', 'email', 'phone', 'birth_date', 'gender', 'cpf',
            'zipcode', 'address', 'city', 'state', 'neighborhood', 'marital_status',
            'ministry_interest', 'first_visit', 'wants_prayer', 
            'wants_growth_group', 'observations'
        ]
        
    def validate(self, data):
        """Validações customizadas para registro público"""
        # Validar se é primeira visita mas não tem dados básicos
        if data.get('first_visit') and not data.get('full_name'):
            raise serializers.ValidationError("Nome é obrigatório para primeira visita")
            
        # Validar campos obrigatórios básicos
        required_fields = ['full_name', 'email', 'city', 'state']
        for field in required_fields:
            if not data.get(field):
                raise serializers.ValidationError(f"Campo {field} é obrigatório")
                
        return data


class VisitorSerializer(serializers.ModelSerializer):
    """
    Serializer completo para administração de visitantes
    """
    
    church_name = serializers.CharField(source='church.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    age = serializers.ReadOnlyField()
    converted_member_name = serializers.CharField(
        source='converted_member.full_name', 
        read_only=True
    )
    follow_up_status_display = serializers.CharField(
        source='get_follow_up_status_display', 
        read_only=True
    )
    
    # Campos obrigatórios com valores padrão
    full_name = serializers.CharField(required=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    city = serializers.CharField(required=False, allow_blank=True)  # Tornado opcional
    state = serializers.CharField(required=False, allow_blank=True, max_length=2)  # Tornado opcional
    
    # Campos opcionais que podem ser vazios
    phone = serializers.CharField(required=False, allow_blank=True)
    cpf = serializers.CharField(required=False, allow_blank=True)
    zipcode = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    neighborhood = serializers.CharField(required=False, allow_blank=True)
    ministry_interest = serializers.CharField(required=False, allow_blank=True)
    observations = serializers.CharField(required=False, allow_blank=True)
    birth_date = serializers.DateField(required=False, allow_null=True, input_formats=['%Y-%m-%d', 'iso-8601'], default=None)
    gender = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    
    # Campos booleanos com valores padrão
    first_visit = serializers.BooleanField(required=False, default=True)
    wants_prayer = serializers.BooleanField(required=False, default=False)
    wants_growth_group = serializers.BooleanField(required=False, default=False)
    
    # Campos de relacionamento
    church = serializers.PrimaryKeyRelatedField(required=False, allow_null=True, read_only=True)
    branch = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.filter(is_active=True),
        required=False,
        allow_null=True
    )
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            church = getattr(request, 'church', None)
            if church is None:
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
            # ChurchAdmin (igreja/denom)
            for cu in user.church_users.filter(is_active=True):
                if cu.can_manage_church(branch.church):
                    return True
            # Secretary/gestor com permissão de membros
            cu = user.church_users.filter(church=branch.church, is_active=True).first()
            if cu and cu.can_manage_members:
                if not cu.managed_branches.exists():
                    return True
                return cu.managed_branches.filter(pk=branch.pk).exists()
        except Exception:
            pass
        return False

    def validate(self, attrs):
        if not attrs and not self.partial:
            raise serializers.ValidationError("Nenhum dado foi enviado para atualização")

        if 'birth_date' in attrs and attrs['birth_date'] == '':
            attrs['birth_date'] = None

        if not self.instance and not attrs.get('branch'):
            request = self.context.get('request')
            fallback_branch = None
            if request and request.user and request.user.is_authenticated:
                from apps.accounts.models import ChurchUser  # noqa: WPS433
                fallback_branch = ChurchUser.objects.get_active_branch_for_user(request.user)

            if fallback_branch:
                attrs['branch'] = fallback_branch
            else:
                raise serializers.ValidationError({
                    'branch': (
                        "Nenhuma filial ativa encontrada. "
                        "Selecione uma filial na barra superior ou configure a Matriz em Gestão de Filiais."
                    )
                })

        if not self.instance and not attrs.get('full_name'):
            raise serializers.ValidationError("Campo 'full_name' é obrigatório")

        # Normalização de registration_source (opcional): lower/underscore
        rs = attrs.get('registration_source') or getattr(self.instance, 'registration_source', None)
        if rs:
            attrs['registration_source'] = str(rs).strip().lower().replace(' ', '_')

        attrs = super().validate(attrs)
        branch = attrs.get('branch') or getattr(self.instance, 'branch', None)
        if branch:
            request = self.context.get('request')
            church = getattr(request, 'church', None) if request else None
            if church is None and request and request.user.is_authenticated:
                from apps.accounts.models import ChurchUser
                church = ChurchUser.objects.get_active_church_for_user(request.user)
            if church and branch.church_id != church.id:
                raise serializers.ValidationError({'branch': 'Filial selecionada não pertence à igreja ativa.'})
            # Secretary write guard
            if request and request.method in ('POST', 'PUT', 'PATCH'):
                if not self._user_can_write_branch(request.user, branch):
                    raise serializers.ValidationError({'branch': 'Sem permissão para escrever nesta filial.'})
            attrs['church'] = branch.church
        return attrs
    
    class Meta:
        model = Visitor
        fields = [
            'id', 'uuid', 'church', 'church_name', 'branch', 'branch_name',
            'full_name', 'email', 'phone', 'birth_date', 'age', 'gender', 'cpf',
            'zipcode', 'address', 'city', 'state', 'neighborhood', 'marital_status', 'ministry_interest',
            'first_visit', 'wants_prayer', 'wants_growth_group', 'observations',
            'qr_code_used', 'registration_source', 'user_agent', 'ip_address',
            'converted_to_member', 'converted_member', 'converted_member_name',
            'conversion_date', 'conversion_notes', 'contact_attempts',
            'last_contact_date', 'follow_up_status', 'follow_up_status_display',
            'created_at', 'updated_at', 'is_active'
        ]
        read_only_fields = [
            'id', 'uuid', 'church', 'church_name', 'branch_name', 'age', 
            'converted_member_name', 'follow_up_status_display',
            'qr_code_used', 'registration_source', 'user_agent', 'ip_address',
            'created_at', 'updated_at'
        ]


class VisitorListSerializer(serializers.ModelSerializer):
    """
    Serializer resumido para listagens administrativas
    """
    
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    age = serializers.ReadOnlyField()
    follow_up_status_display = serializers.CharField(
        source='get_follow_up_status_display', 
        read_only=True
    )
    
    class Meta:
        model = Visitor
        fields = [
            'id', 'full_name', 'email', 'phone', 'age', 'branch_name',
            'city', 'state', 'first_visit', 'converted_to_member', 
            'follow_up_status', 'follow_up_status_display', 
            'contact_attempts', 'last_contact_date', 'created_at',
            'wants_prayer', 'wants_growth_group', 'ministry_interest', 'marital_status', 'gender'
        ]


class VisitorStatsSerializer(serializers.Serializer):
    """
    Serializer para estatísticas de visitantes
    """
    
    total = serializers.IntegerField()
    last_30_days = serializers.IntegerField()
    last_7_days = serializers.IntegerField()
    pending_conversion = serializers.IntegerField()
    converted_to_members = serializers.IntegerField()
    conversion_rate = serializers.FloatField()
    follow_up_needed = serializers.IntegerField()
    first_time_visitors = serializers.IntegerField()


class VisitorFollowUpSerializer(serializers.ModelSerializer):
    """
    Serializer para follow-up de visitantes
    """
    
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = Visitor
        fields = [
            'id', 'full_name', 'email', 'phone', 'contact_attempts',
            'last_contact_date', 'follow_up_status', 'conversion_notes'
        ]


class VisitorConversionSerializer(serializers.ModelSerializer):
    """Serializer para conversão de visitante em membro (aceita dados complementares)."""

    conversion_notes = serializers.CharField(required=False, allow_blank=True)
    # Dados complementares opcionais para completar antes da conversão
    birth_date = serializers.DateField(required=False, allow_null=True, input_formats=['%Y-%m-%d', 'iso-8601'])
    phone = serializers.CharField(required=False, allow_blank=True)
    gender = serializers.CharField(required=False, allow_blank=True)
    marital_status = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Visitor
        fields = ['conversion_notes', 'birth_date', 'phone', 'gender', 'marital_status']

    def validate(self, attrs):
        instance = self.instance

        # Validar igreja vinculada
        if not instance.church:
            raise serializers.ValidationError("Visitante deve ter uma igreja associada para ser convertido")

        # birth_date pode vir no payload; exigir que exista no final
        final_birth_date = attrs.get('birth_date') or instance.birth_date
        if not final_birth_date:
            raise serializers.ValidationError(
                "Data de nascimento é obrigatória para conversão. Informe a data ao converter ou edite o visitante."
            )

        # Nome completo obrigatório
        if not instance.full_name or not instance.full_name.strip():
            raise serializers.ValidationError("Nome completo é obrigatório para conversão")

        # Telefone: Member exige telefone; aceitar via payload ou já salvo
        final_phone = attrs.get('phone') or instance.phone
        if not final_phone or not str(final_phone).strip():
            raise serializers.ValidationError("Telefone é obrigatório para conversão. Informe o telefone ao converter ou edite o visitante.")

        # Verificar CPF duplicado se existir e não for vazio
        if instance.cpf and instance.cpf.strip():
            from apps.members.models import Member
            existing = Member.objects.filter(
                cpf=instance.cpf.strip(),
                church=instance.church
            ).first()
            if existing:
                raise serializers.ValidationError(
                    f"CPF {instance.cpf} já está cadastrado para o membro: {existing.full_name}. "
                    f"Remova ou corrija o CPF do visitante antes de converter."
                )

        return attrs

    def update(self, instance, validated_data):
        """Atualiza dados complementares (se enviados) e converte o visitante em membro."""
        # Atualizar campos complementares antes da conversão
        updated = False
        for field in ['birth_date', 'phone', 'gender', 'marital_status']:
            if field in validated_data and validated_data[field] not in (None, ''):
                setattr(instance, field, validated_data[field])
                updated = True
        if updated:
            instance.save(update_fields=[f for f in ['birth_date', 'phone', 'gender', 'marital_status'] if f in validated_data])
            # Garantir que a instância tem os dados atualizados do banco antes da conversão
            instance.refresh_from_db()

        notes = validated_data.get('conversion_notes', '')
        instance.convert_to_member(notes=notes)
        return instance


class BranchVisitorStatsSerializer(serializers.Serializer):
    """
    Serializer para estatísticas de visitantes por filial
    """
    
    branch_id = serializers.IntegerField()
    branch_name = serializers.CharField()
    total_visitors = serializers.IntegerField()
    last_30_days = serializers.IntegerField()
    conversion_rate = serializers.FloatField()
    pending_follow_up = serializers.IntegerField()


class VisitorBulkActionSerializer(serializers.Serializer):
    """
    Serializer para ações em lote com visitantes
    """
    
    visitor_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1
    )
    action = serializers.ChoiceField(choices=[
        ('update_status', 'Atualizar Status'),
        ('bulk_follow_up', 'Follow-up em Lote'),
        ('export', 'Exportar'),
    ])
    follow_up_status = serializers.ChoiceField(
        choices=[
            ('pending', 'Pendente'),
            ('contacted', 'Contatado'),
            ('interested', 'Interessado'),
            ('not_interested', 'Não Interessado'),
        ],
        required=False
    )
    notes = serializers.CharField(required=False, allow_blank=True)


class QRCodeValidationSerializer(serializers.Serializer):
    """
    Serializer para validação de QR Code
    """
    
    qr_code_uuid = serializers.UUIDField()
    
    def validate_qr_code_uuid(self, value):
        """Valida se o QR Code existe e está ativo"""
        try:
            branch = Branch.objects.get(
                qr_code_uuid=value,
                qr_code_active=True,
                allows_visitor_registration=True,
                is_active=True
            )
            return value
        except Branch.DoesNotExist:
            raise serializers.ValidationError("QR Code inválido ou inativo")
