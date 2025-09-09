"""
Serializers para o app Members
Gerencia serialização de membros
"""

from rest_framework import serializers
from datetime import date
from .models import Member, MembershipStatusLog, MembershipStatus
from apps.core.models import MembershipStatusChoices, MinisterialFunctionChoices


class MemberSerializer(serializers.ModelSerializer):
    """
    Serializer completo para Member
    """
    
    # Campos calculados
    age = serializers.SerializerMethodField()
    conversion_age = serializers.SerializerMethodField()
    membership_years = serializers.SerializerMethodField()
    full_address = serializers.SerializerMethodField()
    spouse_name = serializers.SerializerMethodField()
    church_name = serializers.CharField(source='church.name', read_only=True)
    membership_status_display = serializers.CharField(source='get_membership_status_display', read_only=True)
    ministerial_function_display = serializers.CharField(source='get_ministerial_function_display', read_only=True)
    
    class Meta:
        model = Member
        fields = [
            # Identificação
            'id', 'church', 'church_name', 'user',
            
            # Dados pessoais
            'full_name', 'cpf', 'rg', 'birth_date', 'age', 'gender', 'marital_status',
            
            # Contato
            'email', 'phone', 'phone_secondary',
            
            # Endereço
            'address', 'number', 'complement', 'neighborhood', 'city', 'state', 'zipcode', 'full_address',
            
            # Dados eclesiásticos 
            'membership_status', 'membership_status_display', 'conversion_date', 'conversion_age',
            'baptism_date', 'membership_date', 'membership_years', 'previous_church', 
            'transfer_letter',
            
            # Dados ministeriais
            'ministerial_function', 'ministerial_function_display', 'ordination_date',
            
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
            'id', 'church_name', 'age', 'conversion_age', 'membership_years', 'full_address',
            'spouse_name', 'membership_status_display', 'ministerial_function_display',
            'created_at', 'updated_at'
        ]
    
    def get_age(self, obj):
        """Calcula a idade baseada na data de nascimento"""
        return obj.age
    
    def get_conversion_age(self, obj):
        """Idade na conversão"""
        return obj.conversion_age
    
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
    ministerial_function_display = serializers.CharField(source='get_ministerial_function_display', read_only=True)
    
    class Meta:
        model = Member
        fields = [
            'id', 'full_name', 'email', 'phone', 'birth_date', 'age',
            'church_name', 'membership_status', 'membership_status_display',
            'ministerial_function', 'ministerial_function_display',
            'membership_date',
            'is_active'
        ]
    
    def get_age(self, obj):
        """Calcula a idade baseada na data de nascimento"""
        return obj.age


class MemberCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para criação de membros
    """
    
    class Meta:
        model = Member
        fields = [
            # Campos obrigatórios e principais
            'church', 'full_name', 'birth_date',
            
            # Documentos
            'cpf', 'rg',
            
            # Dados pessoais
            'gender', 'marital_status',
            
            # Contato
            'email', 'phone', 'phone_secondary',
            
            # Endereço
            'address', 'number', 'complement', 'neighborhood', 'city', 'state', 'zipcode',
            
            # Dados eclesiásticos
            'membership_status', 'conversion_date', 'baptism_date', 
            'previous_church', 'transfer_letter',
            
            # Dados ministeriais
            'ministerial_function', 'ordination_date',
            
            # Dados familiares
            'spouse', 'children_count', 'responsible',
            
            # Dados adicionais
            'profession', 'education_level', 'photo', 'notes',
            
            # Preferências
            'accept_sms', 'accept_email', 'accept_whatsapp'
        ]
    
    def validate_cpf(self, value):
        """Validação de CPF"""
        if value and Member.objects.filter(cpf=value).exists():
            raise serializers.ValidationError("Este CPF já está cadastrado.")
        return value
    
    def validate_email(self, value):
        """Validação de email"""
        if value and Member.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este e-mail já está cadastrado.")
        return value
    
    def validate(self, attrs):
        """Validações gerais"""
        # Validar idade mínima
        if attrs.get('birth_date'):
            today = date.today()
            age = today.year - attrs['birth_date'].year - ((today.month, today.day) < (attrs['birth_date'].month, attrs['birth_date'].day))
            if age > 120:
                raise serializers.ValidationError("Data de nascimento inválida - idade muito avançada.")
        
        
        return attrs


class MemberUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para atualização de membros
    """
    
    class Meta:
        model = Member
        fields = [
            # Não permitir alteração de church e campos críticos
            'full_name', 'cpf', 'rg', 'birth_date', 'gender', 'marital_status',
            'email', 'phone', 'phone_secondary', 'address', 'number', 'complement', 'neighborhood', 
            'city', 'state', 'zipcode', 
            'membership_status', 'conversion_date', 'baptism_date', 'previous_church', 'transfer_letter', 
            'ministerial_function', 'ordination_date', 'spouse', 'children_count', 'responsible', 'education_level', 
            'photo', 'notes', 'accept_sms', 'accept_email', 'accept_whatsapp'
        ]
    
    def validate_cpf(self, value):
        """Validação de CPF na atualização"""
        if value and Member.objects.filter(cpf=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError("Este CPF já está cadastrado.")
        return value
    
    def validate_email(self, value):
        """Validação de email na atualização"""
        if value and Member.objects.filter(email=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError("Este e-mail já está cadastrado.")
        return value


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
            'ordination_date', 'termination_date', 'observation',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'member_name', 'status_display', 'created_at', 'updated_at']
    
    def validate(self, attrs):
        """Validações específicas"""
        ordination_date = attrs.get('ordination_date')
        termination_date = attrs.get('termination_date')
        
        if termination_date and ordination_date and termination_date <= ordination_date:
            raise serializers.ValidationError(
                "Data de término deve ser posterior à data de ordenação"
            )
        
        return attrs


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




