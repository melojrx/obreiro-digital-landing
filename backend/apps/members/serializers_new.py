"""
Novos serializers para arquitetura Member + MembershipStatus
Mantém retrocompatibilidade durante migração
"""

from rest_framework import serializers
from .models import Member
from .models_new import MembershipStatus, MinisterialFunction


class MembershipStatusSerializer(serializers.ModelSerializer):
    """Serializer para MembershipStatus"""
    
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    changed_by_name = serializers.CharField(source='changed_by.get_full_name', read_only=True)
    
    class Meta:
        model = MembershipStatus
        fields = [
            'id', 'status', 'status_display', 'effective_date', 'end_date',
            'reason', 'changed_by', 'changed_by_name', 'is_current',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'status_display', 'changed_by_name']


class MembershipStatusCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de status"""
    
    class Meta:
        model = MembershipStatus
        fields = ['member', 'status', 'effective_date', 'reason']
    
    def create(self, validated_data):
        """Cria novo status usando método helper"""
        member = validated_data['member']
        status = validated_data['status']
        reason = validated_data.get('reason', '')
        effective_date = validated_data.get('effective_date')
        
        # Usa método da classe para garantir consistência
        status_obj = MembershipStatus.create_status_change(
            member=member,
            new_status=status,
            reason=reason,
            changed_by=self.context['request'].user if 'request' in self.context else None
        )
        
        if effective_date and effective_date != status_obj.effective_date:
            status_obj.effective_date = effective_date
            status_obj.save()
        
        return status_obj


class MinisterialFunctionSerializer(serializers.ModelSerializer):
    """Serializer para funções ministeriais"""
    
    class Meta:
        model = MinisterialFunction
        fields = [
            'id', 'name', 'code', 'description', 'hierarchy_level',
            'requires_ordination', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class MemberSerializerV2(serializers.ModelSerializer):
    """
    Serializer aprimorado do Member com novo relacionamento
    Versão 2 para manter compatibilidade
    """
    
    # Campos legados (para compatibilidade)
    church_name = serializers.CharField(source='church.name', read_only=True)
    age = serializers.ReadOnlyField()
    membership_years = serializers.ReadOnlyField()
    full_address = serializers.ReadOnlyField()
    
    # Novos campos usando relacionamento
    current_status = serializers.SerializerMethodField()
    current_status_display = serializers.SerializerMethodField()
    status_history = MembershipStatusSerializer(source='membership_statuses', many=True, read_only=True)
    
    # Campo de compatibilidade (deprecated)
    membership_status = serializers.SerializerMethodField()
    membership_status_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Member
        fields = [
            # Campos originais
            'id', 'church', 'church_name', 'full_name', 'cpf', 'rg',
            'birth_date', 'age', 'gender', 'marital_status', 'email', 'phone',
            'phone_secondary', 'address', 'neighborhood', 'city', 'state', 'zipcode',
            'full_address', 'membership_date', 'membership_years', 'baptism_date', 
            'conversion_date', 'previous_church', 'transfer_letter', 'ministerial_function',
            'ordination_date', 'profession', 'education_level', 'photo', 'notes',
            'accept_sms', 'accept_email', 'accept_whatsapp', 'created_at', 'updated_at',
            'is_active',
            
            # Novos campos de status
            'current_status', 'current_status_display', 'status_history',
            
            # Campos de compatibilidade (deprecated)
            'membership_status', 'membership_status_display'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'church_name', 'age', 
            'membership_years', 'full_address', 'current_status', 'current_status_display',
            'status_history', 'membership_status', 'membership_status_display'
        ]
    
    def get_current_status(self, obj):
        """Retorna status atual via nova tabela"""
        current = MembershipStatus.get_current_status(obj)
        return current.status if current else obj.membership_status
    
    def get_current_status_display(self, obj):
        """Display do status atual"""
        current = MembershipStatus.get_current_status(obj)
        return current.get_status_display() if current else obj.get_membership_status_display()
    
    # Métodos de compatibilidade (deprecated)
    def get_membership_status(self, obj):
        """DEPRECATED: Use current_status"""
        return self.get_current_status(obj)
    
    def get_membership_status_display(self, obj):
        """DEPRECATED: Use current_status_display"""
        return self.get_current_status_display(obj)


class MemberCreateSerializerV2(serializers.ModelSerializer):
    """
    Serializer para criação com novo sistema de status
    """
    
    # Campo opcional para status inicial
    initial_status = serializers.ChoiceField(
        choices=MembershipStatusChoices.choices,
        default=MembershipStatusChoices.ACTIVE,
        write_only=True,
        required=False
    )
    
    initial_status_reason = serializers.CharField(
        max_length=500,
        write_only=True,
        required=False,
        allow_blank=True
    )
    
    class Meta:
        model = Member
        fields = [
            'church', 'full_name', 'cpf', 'rg', 'birth_date', 'gender',
            'marital_status', 'email', 'phone', 'phone_secondary', 'address',
            'neighborhood', 'city', 'state', 'zipcode', 'baptism_date', 
            'conversion_date', 'previous_church', 'transfer_letter',
            'ministerial_function', 'ordination_date', 'profession', 'education_level',
            'photo', 'notes', 'accept_sms', 'accept_email', 'accept_whatsapp',
            'initial_status', 'initial_status_reason'
        ]
    
    def create(self, validated_data):
        """Cria membro e status inicial"""
        # Remove campos específicos do status
        initial_status = validated_data.pop('initial_status', MembershipStatusChoices.ACTIVE)
        initial_status_reason = validated_data.pop('initial_status_reason', 'Membro criado')
        
        # Cria o membro sem o campo membership_status (será removido na migração)
        member = Member.objects.create(**validated_data)
        
        # Cria status inicial na nova tabela
        MembershipStatus.create_status_change(
            member=member,
            new_status=initial_status,
            reason=initial_status_reason,
            changed_by=self.context['request'].user if 'request' in self.context else None
        )
        
        return member


class MemberSummarySerializerV2(serializers.ModelSerializer):
    """Serializer resumido v2"""
    
    church_name = serializers.CharField(source='church.name', read_only=True)
    age = serializers.ReadOnlyField()
    current_status = serializers.SerializerMethodField()
    current_status_display = serializers.SerializerMethodField()
    
    # Compatibilidade
    membership_status = serializers.SerializerMethodField()
    membership_status_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Member
        fields = [
            'id', 'full_name', 'email', 'phone', 'age', 'church_name',
            'current_status', 'current_status_display', 'membership_date',
            'is_active', 'membership_status', 'membership_status_display'
        ]
    
    def get_current_status(self, obj):
        current = MembershipStatus.get_current_status(obj)
        return current.status if current else obj.membership_status
    
    def get_current_status_display(self, obj):
        current = MembershipStatus.get_current_status(obj)
        return current.get_status_display() if current else obj.get_membership_status_display()
    
    def get_membership_status(self, obj):
        return self.get_current_status(obj)
    
    def get_membership_status_display(self, obj):
        return self.get_current_status_display(obj)


class MemberStatusChangeSerializer(serializers.Serializer):
    """Serializer para mudança de status via endpoint"""
    
    status = serializers.ChoiceField(choices=MembershipStatusChoices.choices)
    reason = serializers.CharField(max_length=500, required=False, allow_blank=True)
    effective_date = serializers.DateField(required=False)
    
    def validate_effective_date(self, value):
        """Valida se a data não é no passado"""
        if value and value < timezone.now().date():
            raise serializers.ValidationError("Data efetiva não pode ser no passado")
        return value