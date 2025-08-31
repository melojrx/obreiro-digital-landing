"""
Serializers para o app Members
Gerencia serialização de membros
"""

from rest_framework import serializers
from datetime import date
from .models import Member, MembershipStatusLog, MinisterialFunctionLog


class MemberSerializer(serializers.ModelSerializer):
    """
    Serializer completo para Member
    """
    
    # Campos calculados
    age = serializers.SerializerMethodField()
    membership_years = serializers.SerializerMethodField()
    full_address = serializers.SerializerMethodField()
    spouse_member_name = serializers.SerializerMethodField()
    church_name = serializers.CharField(source='church.name', read_only=True)
    ministerial_function_display = serializers.CharField(source='get_ministerial_function_display', read_only=True)
    membership_status_display = serializers.CharField(source='get_membership_status_display', read_only=True)
    
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
            'membership_status', 'membership_status_display', 'conversion_date', 
            'baptism_date', 'membership_date', 'membership_years', 'previous_church', 
            'transfer_letter',
            
            # Dados ministeriais
            'ministerial_function', 'ministerial_function_display', 'ordination_date',
            
            # Dados familiares
            'spouse_name', 'spouse_is_member', 'spouse_member', 'spouse_member_name', 'children_count', 'responsible',
            
            # Dados adicionais
            'profession', 'education_level', 'photo', 'notes',
            
            # Preferências
            'accept_sms', 'accept_email', 'accept_whatsapp',
            
            # Controle
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'church_name', 'age', 'membership_years', 'full_address',
            'ministerial_function_display', 'membership_status_display', 'spouse_member_name',
            'created_at', 'updated_at'
        ]
    
    def get_age(self, obj):
        """Calcula a idade baseada na data de nascimento"""
        if obj.birth_date:
            today = date.today()
            return today.year - obj.birth_date.year - ((today.month, today.day) < (obj.birth_date.month, obj.birth_date.day))
        return None
    
    def get_membership_years(self, obj):
        """Calcula anos de membresia"""
        if obj.membership_date:
            today = date.today()
            return today.year - obj.membership_date.year - ((today.month, today.day) < (obj.membership_date.month, obj.membership_date.day))
        return 0
    
    def get_full_address(self, obj):
        """Retorna endereço completo formatado"""
        parts = []
        if obj.address:
            parts.append(obj.address)
        if obj.neighborhood:
            parts.append(obj.neighborhood)
        if obj.city and obj.state:
            parts.append(f"{obj.city}/{obj.state}")
        elif obj.city:
            parts.append(obj.city)
        return ', '.join(parts) if parts else ''

    def get_spouse_member_name(self, obj):
        """Retorna o nome do cônjuge se ele for membro"""
        if obj.spouse_member:
            return obj.spouse_member.full_name
        return None


class MemberListSerializer(serializers.ModelSerializer):
    """
    Serializer otimizado para listagem de membros
    """
    
    age = serializers.SerializerMethodField()
    church_name = serializers.CharField(source='church.name', read_only=True)
    ministerial_function_display = serializers.CharField(source='get_ministerial_function_display', read_only=True)
    membership_status_display = serializers.CharField(source='get_membership_status_display', read_only=True)
    
    class Meta:
        model = Member
        fields = [
            'id', 'full_name', 'email', 'phone', 'birth_date', 'age',
            'church_name', 'ministerial_function', 'ministerial_function_display',
            'membership_status', 'membership_status_display', 'membership_date',
            'is_active'
        ]
    
    def get_age(self, obj):
        """Calcula a idade baseada na data de nascimento"""
        if obj.birth_date:
            today = date.today()
            return today.year - obj.birth_date.year - ((today.month, today.day) < (obj.birth_date.month, obj.birth_date.day))
        return None


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
            'spouse_name', 'spouse_is_member', 'spouse_member', 'children_count', 'responsible',
            
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
        
        # Validar data de ordenação
        if attrs.get('ordination_date') and attrs.get('birth_date'):
            if attrs['ordination_date'] <= attrs['birth_date']:
                raise serializers.ValidationError("Data de ordenação deve ser posterior à data de nascimento.")
        
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
            'city', 'state', 'zipcode', 'membership_status', 'conversion_date', 
            'baptism_date', 'previous_church', 'transfer_letter', 'ministerial_function', 
            'ordination_date', 'spouse_name', 'spouse_is_member', 'spouse_member', 'children_count', 'responsible', 'profession', 'education_level', 
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
            'membership_status', 'ministerial_function', 'is_active'
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


class MemberStatusChangeSerializer(serializers.Serializer):
    """
    Serializer para mudança de status via API - VALIDAÇÃO SIMPLES
    """
    
    new_status = serializers.ChoiceField(
        choices=Member._meta.get_field('membership_status').choices,
        help_text="Novo status de membresia"
    )
    
    reason = serializers.CharField(
        max_length=500,
        required=False,
        allow_blank=True,
        help_text="Motivo da mudança (opcional)"
    )


class MinisterialFunctionLogSerializer(serializers.ModelSerializer):
    """
    Serializer para histórico de mudanças de função ministerial
    """
    
    member_name = serializers.CharField(source='member.full_name', read_only=True)
    changed_by_name = serializers.CharField(source='changed_by.full_name', read_only=True)
    old_function_display = serializers.CharField(source='get_old_function_display', read_only=True)
    new_function_display = serializers.CharField(source='get_new_function_display', read_only=True)
    
    class Meta:
        model = MinisterialFunctionLog
        fields = [
            'id', 'member', 'member_name',
            'old_function', 'old_function_display',
            'new_function', 'new_function_display',
            'effective_date', 'end_date', 'observations',
            'changed_by', 'changed_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class MinisterialFunctionChangeSerializer(serializers.Serializer):
    """
    Serializer para mudança de função ministerial via API
    """
    
    new_function = serializers.ChoiceField(
        choices=Member._meta.get_field('ministerial_function').choices,
        help_text="Nova função ministerial"
    )
    
    effective_date = serializers.DateField(
        help_text="Data em que a função entra em vigor"
    )
    
    end_date = serializers.DateField(
        required=False,
        allow_null=True,
        help_text="Data final da função (opcional)"
    )
    
    observations = serializers.CharField(
        max_length=1000,
        required=False,
        allow_blank=True,
        help_text="Observações sobre a mudança (opcional)"
    )