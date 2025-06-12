"""
Serializers para o app Churches
Gerencia serialização de igrejas
"""

from rest_framework import serializers
from .models import Church


class ChurchSerializer(serializers.ModelSerializer):
    """Serializer para Church"""
    
    denomination_name = serializers.CharField(source='denomination.name', read_only=True)
    main_pastor_name = serializers.CharField(source='main_pastor.get_full_name', read_only=True)
    display_name = serializers.ReadOnlyField()
    full_address = serializers.ReadOnlyField()
    is_subscription_active = serializers.ReadOnlyField()
    is_trial_active = serializers.ReadOnlyField()
    days_until_expiration = serializers.ReadOnlyField()
    subscription_expired = serializers.ReadOnlyField()
    can_add_members = serializers.ReadOnlyField()
    can_add_branches = serializers.ReadOnlyField()
    
    class Meta:
        model = Church
        fields = [
            'id', 'denomination', 'denomination_name', 'name', 'short_name',
            'description', 'email', 'phone', 'website', 'address', 'city',
            'state', 'zipcode', 'cnpj', 'main_pastor', 'main_pastor_name',
            'logo', 'cover_image', 'subscription_plan', 'subscription_status',
            'subscription_start_date', 'subscription_end_date', 'trial_end_date',
            'max_members', 'max_branches', 'total_members', 'total_visitors',
            'display_name', 'full_address', 'is_subscription_active',
            'is_trial_active', 'days_until_expiration', 'subscription_expired',
            'can_add_members', 'can_add_branches', 'created_at', 'updated_at',
            'is_active'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'denomination_name',
            'main_pastor_name', 'display_name', 'full_address',
            'is_subscription_active', 'is_trial_active', 'days_until_expiration',
            'subscription_expired', 'can_add_members', 'can_add_branches',
            'total_members', 'total_visitors'
        ]


class ChurchCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de Church"""
    
    class Meta:
        model = Church
        fields = [
            'denomination', 'name', 'short_name', 'description', 'email',
            'phone', 'website', 'address', 'city', 'state', 'zipcode',
            'cnpj', 'main_pastor', 'logo', 'cover_image', 'subscription_plan'
        ]


class ChurchSummarySerializer(serializers.ModelSerializer):
    """Serializer resumido para listagens"""
    
    denomination_name = serializers.CharField(source='denomination.name', read_only=True)
    display_name = serializers.ReadOnlyField()
    subscription_status_display = serializers.CharField(source='get_subscription_status_display', read_only=True)
    
    class Meta:
        model = Church
        fields = [
            'id', 'name', 'display_name', 'city', 'state', 'denomination_name',
            'subscription_plan', 'subscription_status', 'subscription_status_display',
            'total_members', 'is_active'
        ]


class ChurchStatsSerializer(serializers.ModelSerializer):
    """Serializer para estatísticas da igreja"""
    
    plan_features = serializers.SerializerMethodField()
    subscription_limits = serializers.SerializerMethodField()
    
    class Meta:
        model = Church
        fields = [
            'id', 'name', 'subscription_plan', 'subscription_status',
            'max_members', 'max_branches', 'total_members', 'total_visitors',
            'plan_features', 'subscription_limits'
        ]
    
    def get_plan_features(self, obj):
        return obj.get_plan_features()
    
    def get_subscription_limits(self, obj):
        return obj.check_subscription_limits()


class ChurchSubscriptionSerializer(serializers.ModelSerializer):
    """Serializer para gerenciar assinatura"""
    
    class Meta:
        model = Church
        fields = [
            'subscription_plan', 'subscription_status', 'subscription_end_date',
            'trial_end_date', 'max_members', 'max_branches'
        ]
    
    def update(self, instance, validated_data):
        # Atualizar limites baseado no plano
        instance = super().update(instance, validated_data)
        instance.set_plan_limits()
        return instance 