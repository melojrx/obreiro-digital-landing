"""
Serializers para o app Denominations
Gerencia serialização de denominações
"""

from rest_framework import serializers
from .models import Denomination


class DenominationSerializer(serializers.ModelSerializer):
    """Serializer para Denomination"""
    
    administrator_name = serializers.CharField(source='administrator.get_full_name', read_only=True)
    display_name = serializers.ReadOnlyField()
    churches_count = serializers.ReadOnlyField()
    total_members_count = serializers.ReadOnlyField()
    
    class Meta:
        model = Denomination
        fields = [
            'id', 'name', 'short_name', 'description', 'administrator',
            'administrator_name', 'email', 'phone', 'website',
            'headquarters_address', 'headquarters_city', 'headquarters_state',
            'headquarters_zipcode', 'cnpj', 'logo',
            # Assinatura/limites
            'subscription_plan', 'subscription_status', 'subscription_start_date',
            'subscription_end_date', 'trial_end_date', 'max_members', 'max_churches',
            'max_branches',
            # Agregados
            'total_churches', 'total_members', 'total_visitors',
            'total_visitors_registered', 'allows_visitor_registration',
            # Read-only derivados
            'display_name', 'churches_count', 'total_members_count',
            'created_at', 'updated_at', 'is_active'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'administrator_name',
            'display_name', 'churches_count', 'total_members_count',
            'total_churches', 'total_members', 'total_visitors',
            'total_visitors_registered'
        ]


class DenominationCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de Denomination"""
    
    class Meta:
        model = Denomination
        fields = [
            'name', 'short_name', 'description', 'email', 'phone',
            'website', 'headquarters_address', 'headquarters_city',
            'headquarters_state', 'headquarters_zipcode', 'cnpj', 'logo'
        ]
    
    def create(self, validated_data):
        # O administrador deve ser passado no contexto
        administrator = self.context['request'].user
        return Denomination.objects.create(administrator=administrator, **validated_data)


class DenominationSummarySerializer(serializers.ModelSerializer):
    """Serializer resumido para listagens"""
    
    display_name = serializers.ReadOnlyField()
    churches_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Denomination
        fields = [
            'id', 'name', 'short_name', 'display_name', 'headquarters_city',
            'headquarters_state', 'churches_count', 'is_active'
        ]

    def get_churches_count(self, obj):
        """
        Calcula a contagem de igrejas ativas para a denominação.
        """
        # Usar o método count() do manager relacionado é mais eficiente
        return obj.churches.filter(is_active=True).count()


class DenominationStatsSerializer(serializers.ModelSerializer):
    """Serializer para estatísticas da denominação"""
    
    churches_count = serializers.ReadOnlyField()
    total_members_count = serializers.ReadOnlyField()
    
    class Meta:
        model = Denomination
        fields = [
            'id', 'name', 'total_churches', 'total_members', 
            'churches_count', 'total_members_count'
        ] 
