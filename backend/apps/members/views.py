"""
Views para o app Members
Gerencia endpoints de membros
"""

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Count, Q

from .models import Member, MembershipStatus
from .serializers import (
    MemberSerializer, MemberListSerializer, MembershipStatusSerializer
)


class MemberViewSet(viewsets.ModelViewSet):
    """
    ViewSet para CRUD de membros com otimizações
    """
    serializer_class = MemberSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['full_name', 'email', 'cpf']
    filterset_fields = ['gender', 'marital_status', 'ministerial_function']
    ordering_fields = ['full_name', 'membership_date', 'created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """QuerySet otimizado com prefetch dos status ministeriais"""
        return Member.objects.select_related('church').prefetch_related(
            'membership_statuses'
        ).filter(is_active=True)
    
    def get_serializer_class(self):
        """Retorna serializer otimizado para listagem"""
        if self.action == 'list':
            return MemberListSerializer
        return MemberSerializer


class MembershipStatusViewSet(viewsets.ModelViewSet):
    """
    ViewSet para CRUD de status ministeriais
    """
    serializer_class = MembershipStatusSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['id_member', 'status', 'is_active']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """QuerySet com select_related do member"""
        return MembershipStatus.objects.select_related('id_member').all()
    
    @action(detail=False, methods=['get'])
    def current_statuses(self, request):
        """Lista apenas status ativos"""
        queryset = self.get_queryset().filter(is_active=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)