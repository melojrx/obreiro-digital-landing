"""
Views para o app Denominations
Gerencia endpoints de denominações
"""

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Denomination
from .serializers import (
    DenominationSerializer, DenominationCreateSerializer, 
    DenominationSummarySerializer, DenominationStatsSerializer
)
from apps.core.permissions import IsDenominationAdmin


class DenominationViewSet(viewsets.ModelViewSet):
    """
    ViewSet para denominações
    """
    
    queryset = Denomination.objects.all()
    serializer_class = DenominationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'short_name', 'headquarters_city', 'headquarters_state']
    filterset_fields = ['headquarters_state', 'is_active']
    ordering_fields = ['name', 'headquarters_city', 'total_churches', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        """Filtrar denominações baseado no usuário"""
        user = self.request.user
        
        if user.is_superuser:
            return Denomination.objects.all()
        
        # Administradores veem suas denominações
        return user.administered_denominations.all()
    
    def get_permissions(self):
        """Permissões específicas por ação"""
        if self.action == 'create':
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, IsDenominationAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return DenominationCreateSerializer
        elif self.action == 'list':
            return DenominationSummarySerializer
        elif self.action == 'stats':
            return DenominationStatsSerializer
        return DenominationSerializer
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Estatísticas da denominação"""
        denomination = self.get_object()
        serializer = DenominationStatsSerializer(denomination)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def update_statistics(self, request, pk=None):
        """Atualizar estatísticas da denominação"""
        denomination = self.get_object()
        denomination.update_statistics()
        
        return Response({
            'message': 'Estatísticas atualizadas',
            'total_churches': denomination.total_churches,
            'total_members': denomination.total_members
        })
    
    @action(detail=False, methods=['get'])
    def my_denominations(self, request):
        """Denominações do usuário atual"""
        user = request.user
        
        if user.is_superuser:
            denominations = Denomination.objects.all()
        else:
            denominations = user.administered_denominations.all()
        
        serializer = DenominationSummarySerializer(denominations, many=True)
        return Response(serializer.data)
