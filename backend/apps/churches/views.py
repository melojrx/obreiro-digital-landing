"""
Views para o app Churches
Gerencia endpoints de igrejas
"""

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Church
from .serializers import (
    ChurchSerializer, ChurchCreateSerializer, ChurchSummarySerializer,
    ChurchStatsSerializer, ChurchSubscriptionSerializer
)
from apps.core.permissions import IsChurchAdmin, IsDenominationAdmin


class ChurchViewSet(viewsets.ModelViewSet):
    """
    ViewSet para igrejas
    """
    
    queryset = Church.objects.all()
    serializer_class = ChurchSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'short_name', 'city', 'state']
    filterset_fields = [
        'denomination', 'state', 'subscription_plan', 
        'subscription_status', 'is_active'
    ]
    ordering_fields = ['name', 'city', 'created_at', 'total_members']
    ordering = ['name']
    
    def get_queryset(self):
        """Filtrar igrejas baseado no usuário"""
        user = self.request.user
        
        if user.is_superuser:
            return Church.objects.all()
        
        # Administradores de denominação veem suas igrejas
        if user.administered_denominations.exists():
            denomination_ids = user.administered_denominations.values_list('id', flat=True)
            return Church.objects.filter(denomination_id__in=denomination_ids)
        
        # Usuários de igreja veem apenas suas igrejas
        church_ids = user.church_users.filter(is_active=True).values_list('church_id', flat=True)
        return Church.objects.filter(id__in=church_ids)
    
    def get_permissions(self):
        """Permissões específicas por ação"""
        if self.action == 'create':
            permission_classes = [permissions.IsAuthenticated, IsDenominationAdmin]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, IsChurchAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ChurchCreateSerializer
        elif self.action == 'list':
            return ChurchSummarySerializer
        elif self.action == 'stats':
            return ChurchStatsSerializer
        elif self.action == 'subscription':
            return ChurchSubscriptionSerializer
        return ChurchSerializer
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Estatísticas da igreja"""
        church = self.get_object()
        serializer = ChurchStatsSerializer(church)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get', 'put', 'patch'])
    def subscription(self, request, pk=None):
        """Gerenciar assinatura da igreja"""
        church = self.get_object()
        
        if request.method == 'GET':
            serializer = ChurchSubscriptionSerializer(church)
            return Response(serializer.data)
        
        # PUT/PATCH
        serializer = ChurchSubscriptionSerializer(
            church, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def update_statistics(self, request, pk=None):
        """Atualizar estatísticas da igreja"""
        church = self.get_object()
        church.update_statistics()
        
        return Response({
            'message': 'Estatísticas atualizadas',
            'total_members': church.total_members,
            'total_visitors': church.total_visitors
        })
    
    @action(detail=False, methods=['get'])
    def my_churches(self, request):
        """Igrejas do usuário atual"""
        user = request.user
        
        if user.is_superuser:
            churches = Church.objects.all()
        elif user.administered_denominations.exists():
            denomination_ids = user.administered_denominations.values_list('id', flat=True)
            churches = Church.objects.filter(denomination_id__in=denomination_ids)
        else:
            church_ids = user.church_users.filter(is_active=True).values_list('church_id', flat=True)
            churches = Church.objects.filter(id__in=church_ids)
        
        serializer = ChurchSummarySerializer(churches, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def dashboard(self, request, pk=None):
        """Dashboard da igreja com métricas principais"""
        church = self.get_object()
        
        # Calcular métricas
        from apps.members.models import Member
        from apps.visitors.models import Visitor
        from apps.activities.models import Activity
        from datetime import datetime, timedelta
        
        today = datetime.now().date()
        last_month = today - timedelta(days=30)
        
        dashboard_data = {
            'church': ChurchSummarySerializer(church).data,
            'metrics': {
                'total_members': church.total_members,
                'total_visitors': church.total_visitors,
                'new_members_last_month': Member.objects.filter(
                    church=church, 
                    membership_date__gte=last_month
                ).count(),
                'new_visitors_last_month': Visitor.objects.filter(
                    church=church,
                    first_visit_date__gte=last_month
                ).count(),
                'upcoming_activities': Activity.objects.filter(
                    church=church,
                    start_datetime__gte=datetime.now(),
                    is_active=True
                ).count()[:5],
            },
            'subscription': {
                'plan': church.subscription_plan,
                'status': church.subscription_status,
                'days_until_expiration': church.days_until_expiration,
                'can_add_members': church.can_add_members,
                'can_add_branches': church.can_add_branches,
            }
        }
        
        return Response(dashboard_data)
