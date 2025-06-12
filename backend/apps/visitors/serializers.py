"""
Serializers para o app Visitors
Gerencia serialização de visitantes
"""

from rest_framework import serializers
from .models import Visitor


class VisitorSerializer(serializers.ModelSerializer):
    """Serializer para Visitor"""
    
    church_name = serializers.CharField(source='church.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    age = serializers.ReadOnlyField()
    days_since_registration = serializers.ReadOnlyField()
    
    class Meta:
        model = Visitor
        fields = [
            'id', 'church', 'church_name', 'branch', 'branch_name',
            'full_name', 'email', 'phone', 'birth_date', 'age', 'gender', 'cpf',
            'how_found_church', 'interest', 'status', 'converted_to_member',
            'conversion_date', 'conversion_notes', 'visits_count', 'last_visit_date',
            'follow_up_needed', 'last_contact_date', 'next_contact_date',
            'days_since_registration', 'notes', 'accept_email_contact',
            'accept_phone_contact', 'accept_whatsapp_contact',
            'created_at', 'updated_at', 'is_active'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'church_name', 'branch_name',
            'age', 'days_since_registration'
        ]


class VisitorCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de Visitor"""
    
    class Meta:
        model = Visitor
        fields = [
            'church', 'branch', 'full_name', 'email', 'phone', 'birth_date',
            'gender', 'cpf', 'how_found_church', 'interest', 'notes',
            'accept_email_contact', 'accept_phone_contact', 'accept_whatsapp_contact'
        ]


class VisitorSummarySerializer(serializers.ModelSerializer):
    """Serializer resumido para listagens"""
    
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    age = serializers.ReadOnlyField()
    days_since_registration = serializers.ReadOnlyField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Visitor
        fields = [
            'id', 'full_name', 'email', 'phone', 'age', 'branch_name',
            'last_visit_date', 'days_since_registration', 'visits_count',
            'status', 'status_display', 'converted_to_member', 'is_active'
        ]


class VisitorStatsSerializer(serializers.ModelSerializer):
    """Serializer para estatísticas do visitante"""
    
    profile_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = Visitor
        fields = [
            'id', 'full_name', 'last_visit_date', 'visits_count',
            'status', 'profile_summary'
        ]
    
    def get_profile_summary(self, obj):
        return {
            'full_name': obj.full_name,
            'age': obj.age,
            'days_since_registration': obj.days_since_registration,
            'total_visits': obj.visits_count,
            'last_visit': obj.last_visit_date,
            'follow_up_needed': obj.follow_up_needed,
            'converted_to_member': obj.converted_to_member,
            'status': obj.status,
        }


class VisitorFollowUpSerializer(serializers.ModelSerializer):
    """Serializer para follow-up de visitantes"""
    
    class Meta:
        model = Visitor
        fields = [
            'id', 'follow_up_needed', 'last_contact_date',
            'next_contact_date', 'notes'
        ]


class VisitorBulkCreateSerializer(serializers.Serializer):
    """Serializer para criação em lote de visitantes"""
    
    visitors = VisitorCreateSerializer(many=True)
    
    def create(self, validated_data):
        visitors_data = validated_data['visitors']
        visitors = []
        
        for visitor_data in visitors_data:
            visitor = Visitor.objects.create(**visitor_data)
            visitors.append(visitor)
        
        return {'visitors': visitors, 'count': len(visitors)} 