"""
Serializers para o app Members
Gerencia serialização de membros
"""

from rest_framework import serializers
from .models import Member, MembershipStatus


class MembershipStatusSerializer(serializers.ModelSerializer):
    """
    Serializer para MembershipStatus
    Baseado na estrutura real do modelo
    """
    
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    member_name = serializers.CharField(source='id_member.full_name', read_only=True)
    
    class Meta:
        model = MembershipStatus
        fields = [
            'id', 'id_member', 'member_name', 'status', 'status_display',
            'ordination_date', 'termination_date', 'observation', 
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'member_name', 'status_display',
            'created_at', 'updated_at'
        ]
    
    def validate(self, attrs):
        """Validações customizadas"""
        ordination_date = attrs.get('ordination_date')
        termination_date = attrs.get('termination_date')
        
        # Validar se data final é posterior à data de ordenação
        if termination_date and ordination_date and termination_date <= ordination_date:
            raise serializers.ValidationError(
                "Data de término deve ser posterior à data de ordenação"
            )
        
        return attrs


class MemberSerializer(serializers.ModelSerializer):
    """
    Serializer para Member com inclusão dos status ministeriais
    """
    
    # Status ministeriais relacionados
    membership_statuses = MembershipStatusSerializer(many=True, read_only=True)
    current_ministerial_function = serializers.SerializerMethodField()
    current_status_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Member
        fields = [
            'id', 'full_name', 'cpf', 'email', 'phone', 'birth_date',
            'gender', 'marital_status', 'address', 'city', 'state',
            'membership_date', 'baptism_date', 'profession',
            'ministerial_function', 'ordination_date',  # Campos antigos mantidos
            'membership_statuses', 'current_ministerial_function', 'current_status_display',
            'is_active', 'created_at', 'updated_at'
        ]
    
    def get_current_ministerial_function(self, obj):
        """Retorna a função ministerial atual (nova estrutura ou fallback)"""
        current_status = obj.membership_statuses.filter(is_active=True).first()
        if current_status:
            return current_status.status
        # Fallback para campo antigo
        return obj.ministerial_function or 'member'
    
    def get_current_status_display(self, obj):
        """Retorna o display da função ministerial atual"""
        current_status = obj.membership_statuses.filter(is_active=True).first()
        if current_status:
            return current_status.get_status_display()
        # Fallback para campo antigo
        if obj.ministerial_function:
            choices = dict(obj._meta.get_field('ministerial_function').choices)
            return choices.get(obj.ministerial_function, 'Membro')
        return 'Membro'


class MemberListSerializer(serializers.ModelSerializer):
    """
    Serializer otimizado para listagem de membros
    """
    
    current_ministerial_function = serializers.SerializerMethodField()
    age = serializers.SerializerMethodField()
    
    class Meta:
        model = Member
        fields = [
            'id', 'full_name', 'email', 'phone', 'birth_date', 'age',
            'current_ministerial_function', 'membership_date',
            'is_active'
        ]
    
    def get_current_ministerial_function(self, obj):
        """Retorna a função ministerial atual"""
        current_status = obj.membership_statuses.filter(is_active=True).first()
        if current_status:
            return current_status.get_status_display()
        # Fallback
        if obj.ministerial_function:
            choices = dict(obj._meta.get_field('ministerial_function').choices)
            return choices.get(obj.ministerial_function, 'Membro')
        return 'Membro'
    
    def get_age(self, obj):
        """Calcula idade"""
        return obj.age