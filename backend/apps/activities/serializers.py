"""
Serializers para o app Activities
Gerencia serialização de ministérios e atividades
"""

from rest_framework import serializers
from .models import Ministry, Activity, ActivityParticipant, ActivityResource


class MinistrySerializer(serializers.ModelSerializer):
    """Serializer para Ministry"""
    
    church_name = serializers.CharField(source='church.name', read_only=True)
    leader_name = serializers.CharField(source='leader.get_full_name', read_only=True)
    
    class Meta:
        model = Ministry
        fields = [
            'id', 'church', 'church_name', 'name', 'description', 'leader',
            'leader_name', 'color', 'is_public', 'total_members', 'total_activities',
            'created_at', 'updated_at', 'is_active'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'church_name', 'leader_name',
            'total_members', 'total_activities'
        ]


class ActivitySerializer(serializers.ModelSerializer):
    """Serializer para Activity"""
    
    church_name = serializers.CharField(source='church.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    ministry_name = serializers.CharField(source='ministry.name', read_only=True)
    responsible_name = serializers.CharField(source='responsible.get_full_name', read_only=True)
    activity_type_display = serializers.CharField(source='get_activity_type_display', read_only=True)
    duration_hours = serializers.ReadOnlyField()
    
    class Meta:
        model = Activity
        fields = [
            'id', 'church', 'church_name', 'branch', 'branch_name',
            'ministry', 'ministry_name', 'name', 'description',
            'activity_type', 'activity_type_display', 'start_datetime',
            'end_datetime', 'duration_hours', 'location', 'max_participants',
            'participants_count', 'requires_registration', 'is_public',
            'responsible', 'responsible_name', 'is_recurring', 'recurrence_pattern',
            'recurrence_end_date', 'notes', 'created_at', 'updated_at', 'is_active'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'church_name', 'branch_name',
            'ministry_name', 'responsible_name', 'activity_type_display',
            'participants_count', 'duration_hours'
        ]


class ActivityParticipantSerializer(serializers.ModelSerializer):
    """Serializer para ActivityParticipant"""
    
    activity_name = serializers.CharField(source='activity.name', read_only=True)
    participant_name = serializers.CharField(source='participant_name', read_only=True)
    participant_type = serializers.CharField(source='participant_type', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = ActivityParticipant
        fields = [
            'id', 'activity', 'activity_name', 'member', 'visitor',
            'participant_name', 'participant_type', 'status', 'status_display',
            'registration_date', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'activity_name', 'participant_name',
            'participant_type', 'status_display', 'registration_date'
        ]


class ActivityResourceSerializer(serializers.ModelSerializer):
    """Serializer para ActivityResource"""
    
    church_name = serializers.CharField(source='church.name', read_only=True)
    resource_type_display = serializers.CharField(source='get_resource_type_display', read_only=True)
    responsible_name = serializers.CharField(source='responsible.get_full_name', read_only=True)
    
    class Meta:
        model = ActivityResource
        fields = [
            'id', 'church', 'church_name', 'name', 'description',
            'resource_type', 'resource_type_display', 'quantity_available',
            'responsible', 'responsible_name', 'notes', 'created_at', 
            'updated_at', 'is_active'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'church_name', 'resource_type_display',
            'responsible_name'
        ]


# Serializers para criação
class MinistryCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de Ministry"""
    
    class Meta:
        model = Ministry
        fields = [
            'id', 'church', 'name', 'description', 'leader', 'color', 'is_public'
        ]
        read_only_fields = ['id', 'church']  # church será definido automaticamente


class ActivityCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de Activity"""
    
    class Meta:
        model = Activity
        fields = [
            'id', 'church', 'branch', 'ministry', 'name', 'description',
            'activity_type', 'start_datetime', 'end_datetime', 'location',
            'max_participants', 'requires_registration', 'is_public',
            'responsible', 'is_recurring', 'recurrence_pattern',
            'recurrence_end_date', 'notes'
        ]
        read_only_fields = ['id']


# Serializers resumidos
class MinistrySummarySerializer(serializers.ModelSerializer):
    """Serializer resumido para Ministry"""
    
    leader_name = serializers.CharField(source='leader.get_full_name', read_only=True)
    
    class Meta:
        model = Ministry
        fields = [
            'id', 'name', 'leader_name', 'total_members', 'total_activities',
            'color', 'is_active'
        ]


class PublicMinistrySerializer(serializers.ModelSerializer):
    """Serializer público para Ministry - apenas campos essenciais"""
    
    class Meta:
        model = Ministry
        fields = [
            'id', 'name', 'color'
        ]


class PublicActivitySerializer(serializers.ModelSerializer):
    """Serializer público para Activity - apenas campos essenciais"""
    
    ministry_name = serializers.CharField(source='ministry.name', read_only=True)
    ministry_color = serializers.CharField(source='ministry.color', read_only=True)
    activity_type_display = serializers.CharField(source='get_activity_type_display', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    
    class Meta:
        model = Activity
        fields = [
            'id', 'name', 'description', 'ministry_name', 'ministry_color',
            'activity_type', 'activity_type_display', 'start_datetime',
            'end_datetime', 'location', 'branch_name'
        ]


class ActivitySummarySerializer(serializers.ModelSerializer):
    """Serializer resumido para Activity"""
    
    ministry_name = serializers.CharField(source='ministry.name', read_only=True)
    activity_type_display = serializers.CharField(source='get_activity_type_display', read_only=True)
    
    class Meta:
        model = Activity
        fields = [
            'id', 'name', 'ministry_name', 'activity_type', 'activity_type_display',
            'start_datetime', 'participants_count', 'max_participants', 'is_active'
        ]


# Serializers para estatísticas
class MinistryStatsSerializer(serializers.ModelSerializer):
    """Serializer para estatísticas do ministério"""
    
    statistics = serializers.SerializerMethodField()
    
    class Meta:
        model = Ministry
        fields = [
            'id', 'name', 'total_members', 'total_activities', 'statistics'
        ]
    
    def get_statistics(self, obj):
        return {
            'total_members': obj.total_members,
            'total_activities': obj.total_activities,
            'has_leader': bool(obj.leader),
            'is_public': obj.is_public,
            'color': obj.color,
        }


class ActivityStatsSerializer(serializers.ModelSerializer):
    """Serializer para estatísticas da atividade"""
    
    statistics = serializers.SerializerMethodField()
    
    class Meta:
        model = Activity
        fields = [
            'id', 'name', 'participants_count', 'max_participants', 'statistics'
        ]
    
    def get_statistics(self, obj):
        return {
            'participants_registered': obj.participants_count,
            'duration_hours': obj.duration_hours,
            'is_recurring': obj.is_recurring,
            'is_public': obj.is_public,
            'requires_registration': obj.requires_registration,
        } 