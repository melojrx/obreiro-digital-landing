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
from django.utils import timezone
from datetime import datetime, timedelta

from .models import Ministry, Activity
from .serializers import (
    MinistrySerializer, MinistryCreateSerializer, MinistryStatsSerializer,
    ActivitySerializer, ActivityCreateSerializer, ActivitySummarySerializer,
    PublicMinistrySerializer, PublicActivitySerializer
)
from apps.core.permissions import IsChurchAdmin, IsMemberUser


class MinistryViewSet(viewsets.ModelViewSet):
    """
    ViewSet para ministérios
    """
    
    queryset = Ministry.objects.all()
    serializer_class = MinistrySerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'description']
    filterset_fields = ['church', 'is_active']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_permissions(self):
        """
        Define as permissões por ação
        """
        if self.action == 'public':
            permission_classes = [permissions.AllowAny]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsChurchAdmin]
        else:
            permission_classes = [IsMemberUser]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Filtra o queryset de ministérios usando a igreja ativa do usuário.
        """
        user = self.request.user
        
        if user.is_superuser:
            return Ministry.objects.all()

        # Obter igreja ativa do usuário
        from apps.accounts.models import ChurchUser
        active_church = ChurchUser.objects.get_active_church_for_user(user)
        
        if active_church:
            return Ministry.objects.filter(church=active_church)
        else:
            return Ministry.objects.none()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return MinistryCreateSerializer
        elif self.action == 'stats':
            return MinistryStatsSerializer
        return MinistrySerializer
    
    def perform_create(self, serializer):
        """Ao criar ministério, associar à igreja ativa do usuário"""
        from apps.accounts.models import ChurchUser
        from django.core.exceptions import ValidationError
        
        active_church = ChurchUser.objects.get_active_church_for_user(self.request.user)
        
        if active_church:
            serializer.save(church=active_church)
        else:
            raise ValidationError("Usuário não tem igreja ativa configurada")
    
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
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def public(self, request):
        """Ministérios públicos para o calendário público"""
        church_id = request.GET.get('church_id')
        if not church_id:
            return Response({'error': 'church_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        ministries = Ministry.objects.filter(
            church_id=church_id,
            is_active=True,
            is_public=True
        )
        
        serializer = PublicMinistrySerializer(ministries, many=True)
        return Response(serializer.data)


class ActivityViewSet(viewsets.ModelViewSet):
    """
    ViewSet para atividades
    """
    
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'description']
    filterset_fields = ['church', 'ministry', 'is_active', 'activity_type']
    ordering_fields = ['name', 'start_datetime', 'created_at']
    ordering = ['-start_datetime']
    
    def get_permissions(self):
        """
        Define as permissões por ação
        """
        if self.action == 'public_calendar':
            permission_classes = [permissions.AllowAny]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsChurchAdmin]
        else:
            permission_classes = [IsMemberUser]
        return [permission() for permission in permission_classes]
    
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

        church_user = user.church_users.filter(church=self.request.church).select_related('active_branch').first()

        if church_user and church_user.active_branch and church_user.role not in ['church_admin', 'pastor']:
            queryset = queryset.filter(branch=church_user.active_branch)
            
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
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def public_calendar(self, request):
        """Calendário público de atividades"""
        church_id = request.GET.get('church_id')
        if not church_id:
            return Response({'error': 'church_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Filtros opcionais
        ministry_id = request.GET.get('ministry_id')
        branch_id = request.GET.get('branch_id')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        
        # Query base: apenas atividades públicas e ativas
        activities = Activity.objects.filter(
            church_id=church_id,
            is_active=True,
            is_public=True
        )
        
        # Aplicar filtros opcionais
        if ministry_id:
            activities = activities.filter(ministry_id=ministry_id)
            
        if branch_id:
            activities = activities.filter(branch_id=branch_id)
            
        if start_date:
            try:
                start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                activities = activities.filter(start_datetime__gte=start_date)
            except (ValueError, TypeError):
                pass
                
        if end_date:
            try:
                end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                activities = activities.filter(start_datetime__lte=end_date)
            except (ValueError, TypeError):
                pass
        
        # Limitar resultados e ordenar
        activities = activities.order_by('start_datetime')[:100]
        
        serializer = PublicActivitySerializer(activities, many=True)
        return Response(serializer.data)
