"""
Views para o app Activities
Gerencia endpoints de atividades e ministérios
"""

from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Ministry, Activity
from .serializers import (
    MinistrySerializer, MinistryCreateSerializer, MinistryStatsSerializer,
    ActivitySerializer, ActivityCreateSerializer, ActivitySummarySerializer
)


class MinistryViewSet(viewsets.ModelViewSet):
    """
    ViewSet para ministérios
    """
    
    queryset = Ministry.objects.all()
    serializer_class = MinistrySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'description']
    filterset_fields = ['church', 'is_active']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        """
        Filtra o queryset de ministérios.
        - O TenantManager já filtra por `church`.
        """
        user = self.request.user
        
        if user.is_superuser:
            return Ministry.objects.all_for_church(self.request.church)

        # O TenantManager já aplicou o filtro por request.church
        return Ministry.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return MinistryCreateSerializer
        elif self.action == 'stats':
            return MinistryStatsSerializer
        return MinistrySerializer
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Estatísticas do ministério"""
        ministry = self.get_object()
        serializer = MinistryStatsSerializer(ministry)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def activities(self, request, pk=None):
        """Atividades do ministério"""
        ministry = self.get_object()
        activities = ministry.activities.filter(is_active=True)
        serializer = ActivitySummarySerializer(activities, many=True)
        return Response(serializer.data)


class ActivityViewSet(viewsets.ModelViewSet):
    """
    ViewSet para atividades
    """
    
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'description']
    filterset_fields = ['church', 'ministry', 'is_active', 'activity_type']
    ordering_fields = ['name', 'start_datetime', 'created_at']
    ordering = ['-start_datetime']
    
    def get_queryset(self):
        """
        Filtra o queryset de atividades.
        - O TenantManager já filtra por `church`.
        - Adiciona filtro por `branch` se o usuário não for admin/pastor.
        """
        user = self.request.user
        
        if user.is_superuser:
            return Activity.objects.all_for_church(self.request.church)

        queryset = Activity.objects.all()

        church_user = user.church_users.filter(church=self.request.church).first()

        if church_user and church_user.branch and church_user.role not in ['church_admin', 'pastor']:
            queryset = queryset.filter(branch=church_user.branch)
            
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ActivityCreateSerializer
        elif self.action == 'list':
            return ActivitySummarySerializer
        return ActivitySerializer
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Próximas atividades"""
        from datetime import datetime
        activities = Activity.objects.filter(
            start_datetime__gte=datetime.now(),
            is_active=True
        ).order_by('start_datetime')[:10]
        
        serializer = ActivitySummarySerializer(activities, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def register_participant(self, request, pk=None):
        """Registrar participante na atividade"""
        activity = self.get_object()
        
        return Response({
            'message': f'Participante registrado na atividade {activity.name}',
            'activity_id': activity.id
        })
    
    @action(detail=True, methods=['get'])
    def participants(self, request, pk=None):
        """Lista de participantes da atividade"""
        activity = self.get_object()
        
        # Aqui seria implementada a lógica real de participantes
        return Response({
            'activity': activity.name,
            'participants_count': activity.participants_count,
            'participants': []
        })
