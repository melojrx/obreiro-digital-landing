"""
Serializers para o app Branches
Gerencia serialização de filiais
"""

from rest_framework import serializers
from .models import Branch


class BranchSerializer(serializers.ModelSerializer):
    """Serializer para Branch"""
    
    church_name = serializers.CharField(source='church.name', read_only=True)
    full_address = serializers.ReadOnlyField()
    visitor_registration_url = serializers.ReadOnlyField()
    
    # Alias para compatibilidade no front: expor is_headquarters como is_main
    is_headquarters = serializers.BooleanField(source='is_main', read_only=True)

    class Meta:
        model = Branch
        fields = [
            'id', 'church', 'church_name', 'name', 'short_name', 'description', 
            'address', 'neighborhood', 'city', 'state', 'zipcode', 'phone', 'email',
            'latitude', 'longitude', 'pastor', 'full_address',
            # Campos de QR Code
            'qr_code_uuid', 'qr_code_image', 'qr_code_active',
            'visitor_registration_url', 'allows_visitor_registration',
            'requires_visitor_approval', 'total_visitors_registered',
            # Estatísticas
            'total_visitors', 'total_activities',
            # Identificadores de matriz
            'is_main', 'is_headquarters',
            # Timestamps
            'created_at', 'updated_at', 'is_active'
        ]
        read_only_fields = [
            'id', 'qr_code_uuid', 'visitor_registration_url', 'full_address',
            'total_visitors', 'total_activities', 'created_at', 'updated_at'
        ]


class BranchCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de Branch"""
    # Compatibilidade: aceitar is_headquarters mapeando para is_main
    is_headquarters = serializers.BooleanField(source='is_main', required=False)

    class Meta:
        model = Branch
        fields = [
            'church', 'name', 'description', 'address', 'city', 'state',
            'zipcode', 'phone', 'email', 'capacity', 'is_headquarters', 'is_main',
            'latitude', 'longitude'
        ]


class BranchSummarySerializer(serializers.ModelSerializer):
    """Serializer resumido para listagens"""
    
    church_name = serializers.CharField(source='church.name', read_only=True)
    members_count = serializers.ReadOnlyField()
    # Compatibilidade: expor is_headquarters como alias de is_main
    is_headquarters = serializers.BooleanField(source='is_main', read_only=True)
    
    class Meta:
        model = Branch
        fields = [
            'id', 'name', 'city', 'state', 'church_name', 'capacity',
            'members_count', 'is_headquarters', 'is_main', 'is_active'
        ]


class BranchStatsSerializer(serializers.ModelSerializer):
    """Serializer para estatísticas da filial"""
    
    statistics = serializers.SerializerMethodField()
    
    class Meta:
        model = Branch
        fields = [
            'id', 'name', 'total_visitors', 'total_activities',
            'total_visitors_registered', 'statistics'
        ]
    
    def get_statistics(self, obj):
        return obj.get_visitor_stats()


class BranchQRCodeSerializer(serializers.ModelSerializer):
    """Serializer específico para gestão de QR Codes"""
    
    church_name = serializers.CharField(source='church.name', read_only=True)
    visitor_registration_url = serializers.ReadOnlyField()
    qr_code_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Branch
        fields = [
            'id', 'name', 'church_name',
            'qr_code_uuid', 'qr_code_image', 'qr_code_active',
            'qr_code_url', 'visitor_registration_url',
            'allows_visitor_registration', 'total_visitors_registered'
        ]
        read_only_fields = [
            'id', 'qr_code_uuid', 'qr_code_url', 
            'visitor_registration_url', 'total_visitors_registered'
        ]
    
    def get_qr_code_url(self, obj):
        """Retorna URL completa da imagem do QR Code"""
        if obj.qr_code_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.qr_code_image.url)
            return obj.qr_code_image.url
        return None 
