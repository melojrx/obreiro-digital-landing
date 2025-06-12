"""
Serializers para o app Members
Gerencia serialização de membros
"""

from rest_framework import serializers
from .models import Member


class MemberSerializer(serializers.ModelSerializer):
    """Serializer para Member"""
    
    church_name = serializers.CharField(source='church.name', read_only=True)
    age = serializers.ReadOnlyField()
    membership_years = serializers.ReadOnlyField()
    full_address = serializers.ReadOnlyField()
    membership_status_display = serializers.CharField(source='get_membership_status_display', read_only=True)
    
    class Meta:
        model = Member
        fields = [
            'id', 'church', 'church_name', 'full_name', 'cpf', 'rg',
            'birth_date', 'age', 'gender', 'marital_status', 'email', 'phone',
            'phone_secondary', 'address', 'neighborhood', 'city', 'state', 'zipcode',
            'full_address', 'membership_status', 'membership_status_display',
            'membership_date', 'membership_years', 'baptism_date', 'conversion_date',
            'previous_church', 'transfer_letter', 'ministerial_function',
            'ordination_date', 'profession', 'education_level', 'photo', 'notes',
            'accept_sms', 'accept_email', 'accept_whatsapp', 'created_at', 'updated_at',
            'is_active'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'church_name', 'age', 
            'membership_years', 'full_address', 'membership_status_display'
        ]


class MemberCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de Member"""
    
    class Meta:
        model = Member
        fields = [
            'church', 'full_name', 'cpf', 'rg', 'birth_date', 'gender',
            'marital_status', 'email', 'phone', 'phone_secondary', 'address',
            'neighborhood', 'city', 'state', 'zipcode', 'membership_status',
            'baptism_date', 'conversion_date', 'previous_church', 'transfer_letter',
            'ministerial_function', 'ordination_date', 'profession', 'education_level',
            'photo', 'notes', 'accept_sms', 'accept_email', 'accept_whatsapp'
        ]


class MemberSummarySerializer(serializers.ModelSerializer):
    """Serializer resumido para listagens"""
    
    church_name = serializers.CharField(source='church.name', read_only=True)
    age = serializers.ReadOnlyField()
    membership_status_display = serializers.CharField(source='get_membership_status_display', read_only=True)
    
    class Meta:
        model = Member
        fields = [
            'id', 'full_name', 'email', 'phone', 'age', 'church_name',
            'membership_status', 'membership_status_display', 'membership_date',
            'is_active'
        ]


class MemberStatsSerializer(serializers.ModelSerializer):
    """Serializer para estatísticas do membro"""
    
    profile_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = Member
        fields = [
            'id', 'full_name', 'membership_status', 'membership_date',
            'baptism_date', 'age', 'profile_summary'
        ]
    
    def get_profile_summary(self, obj):
        return {
            'full_name': obj.full_name,
            'age': obj.age,
            'membership_years': obj.membership_years,
            'is_baptized': bool(obj.baptism_date),
            'is_converted': bool(obj.conversion_date),
            'status': obj.get_membership_status_display(),
        }


class MemberBulkCreateSerializer(serializers.Serializer):
    """Serializer para criação em lote de membros"""
    
    members = MemberCreateSerializer(many=True)
    
    def create(self, validated_data):
        members_data = validated_data['members']
        members = []
        
        for member_data in members_data:
            member = Member.objects.create(**member_data)
            members.append(member)
        
        return {'members': members, 'count': len(members)} 