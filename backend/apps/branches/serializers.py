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
    members_count = serializers.ReadOnlyField()
    visitors_count = serializers.ReadOnlyField()
    capacity_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = Branch
        fields = [
            'id', 'church', 'church_name', 'name', 'description', 'address',
            'city', 'state', 'zipcode', 'phone', 'email', 'capacity',
            'is_headquarters', 'latitude', 'longitude', 'qr_code',
            'full_address', 'members_count', 'visitors_count',
            'capacity_percentage', 'created_at', 'updated_at', 'is_active'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'church_name', 'full_address',
            'members_count', 'visitors_count', 'capacity_percentage', 'qr_code'
        ]


class BranchCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de Branch"""
    
    class Meta:
        model = Branch
        fields = [
            'church', 'name', 'description', 'address', 'city', 'state',
            'zipcode', 'phone', 'email', 'capacity', 'is_headquarters',
            'latitude', 'longitude'
        ]


class BranchSummarySerializer(serializers.ModelSerializer):
    """Serializer resumido para listagens"""
    
    church_name = serializers.CharField(source='church.name', read_only=True)
    members_count = serializers.ReadOnlyField()
    
    class Meta:
        model = Branch
        fields = [
            'id', 'name', 'city', 'state', 'church_name', 'capacity',
            'members_count', 'is_headquarters', 'is_active'
        ]


class BranchStatsSerializer(serializers.ModelSerializer):
    """Serializer para estatísticas da filial"""
    
    statistics = serializers.SerializerMethodField()
    
    class Meta:
        model = Branch
        fields = [
            'id', 'name', 'capacity', 'members_count', 'visitors_count',
            'capacity_percentage', 'statistics'
        ]
    
    def get_statistics(self, obj):
        return {
            'total_members': obj.members_count,
            'total_visitors': obj.visitors_count,
            'capacity_used': f"{obj.capacity_percentage}%",
            'available_spots': obj.capacity - obj.members_count if obj.capacity else None,
            'is_headquarters': obj.is_headquarters,
        } 