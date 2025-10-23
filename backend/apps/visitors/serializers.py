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

    def validate(self, attrs):
        if not attrs and not self.partial:
            raise serializers.ValidationError("Nenhum dado foi enviado para atualização")

        if 'birth_date' in attrs and attrs['birth_date'] == '':
            attrs['birth_date'] = None

        if not self.instance and not attrs.get('branch'):
            raise serializers.ValidationError({'branch': "Filial é obrigatória para criar visitante"})
        if not self.instance and not attrs.get('full_name'):
            raise serializers.ValidationError("Campo 'full_name' é obrigatório")

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
            'contact_attempts', 'last_contact_date', 'created_at'
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
    """
    Serializer para conversão de visitante em membro com validações robustas
    """
    
    conversion_notes = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Visitor
        fields = ['conversion_notes']
        
    def validate(self, attrs):
        """Validações antes da conversão"""
        instance = self.instance
        
        # Validações básicas
        if not instance.church:
            raise serializers.ValidationError("Visitante deve ter uma igreja associada para ser convertido")
            
        if not instance.birth_date:
            raise serializers.ValidationError(
                "Data de nascimento é obrigatória para conversão. "
                "Por favor, edite o visitante e adicione a data de nascimento antes de converter."
            )
            
        if not instance.full_name or not instance.full_name.strip():
            raise serializers.ValidationError("Nome completo é obrigatório para conversão")
        
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
        """Converte visitante em membro"""
        notes = validated_data.get('conversion_notes', '')
        member = instance.convert_to_member(notes=notes)
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
