"""
Novas views para arquitetura Member + MembershipStatus
Implementa versionamento da API para migração segura
"""

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Count, Q, Prefetch
from django.utils import timezone
from datetime import datetime, timedelta

from .models import Member
from .models_new import MembershipStatus, MinisterialFunction
from .serializers_new import (
    MemberSerializerV2, MemberCreateSerializerV2, MemberSummarySerializerV2,
    MembershipStatusSerializer, MembershipStatusCreateSerializer,
    MinisterialFunctionSerializer, MemberStatusChangeSerializer
)
from apps.core.permissions import (
    IsSuperUser, IsDenominationAdmin, IsChurchAdmin, 
    IsMemberUser, CanManageMembers, IsChurchAdminOrCanManageMembers
)


class MembershipStatusViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestão de status de membresia
    Permite auditoria completa das mudanças
    """
    
    queryset = MembershipStatus.objects.all()
    serializer_class = MembershipStatusSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['member', 'status', 'is_current']
    search_fields = ['member__full_name', 'reason']
    ordering_fields = ['effective_date', 'created_at']
    ordering = ['-effective_date']
    
    def get_permissions(self):
        """Apenas admins podem gerenciar status"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsChurchAdminOrCanManageMembers]
        else:
            permission_classes = [IsMemberUser]
        
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        """Serializer específico para criação"""
        if self.action == 'create':
            return MembershipStatusCreateSerializer
        return MembershipStatusSerializer
    
    def get_queryset(self):
        """Filtra por igreja do usuário"""
        user = self.request.user
        
        if user.is_superuser:
            return MembershipStatus.objects.all()
        
        # Filtra por igrejas do usuário
        user_churches = user.church_users.filter(is_active=True)
        if not user_churches.exists():
            return MembershipStatus.objects.none()
        
        church_ids = user_churches.values_list('church_id', flat=True)
        return MembershipStatus.objects.filter(member__church_id__in=church_ids)
    
    @action(detail=False, methods=['get'])
    def history(self, request):
        """Histórico de mudanças de status"""
        member_id = request.query_params.get('member_id')
        
        if not member_id:
            return Response(
                {'error': 'member_id é obrigatório'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(member_id=member_id)
        serializer = self.get_serializer(queryset, many=True)
        
        return Response({
            'member_id': member_id,
            'status_history': serializer.data,
            'total_changes': queryset.count()
        })
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Analytics de mudanças de status"""
        queryset = self.get_queryset()
        
        # Mudanças por período
        period = request.query_params.get('period', '30')  # dias
        start_date = timezone.now().date() - timedelta(days=int(period))
        
        recent_changes = queryset.filter(created_at__gte=start_date)
        
        # Estatísticas por status
        status_changes = recent_changes.values('status').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Mudanças por dia
        daily_changes = []
        for i in range(int(period)):
            day = start_date + timedelta(days=i)
            count = recent_changes.filter(
                created_at__date=day
            ).count()
            
            daily_changes.append({
                'date': day.isoformat(),
                'changes': count
            })
        
        return Response({
            'period_days': period,
            'total_changes': recent_changes.count(),
            'status_distribution': list(status_changes),
            'daily_changes': daily_changes,
            'most_common_reasons': list(
                recent_changes.exclude(reason='').values('reason').annotate(
                    count=Count('id')
                ).order_by('-count')[:5]
            )
        })


class MinisterialFunctionViewSet(viewsets.ModelViewSet):
    """ViewSet para funções ministeriais"""
    
    queryset = MinisterialFunction.objects.all()
    serializer_class = MinisterialFunctionSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'code', 'description']
    filterset_fields = ['requires_ordination', 'hierarchy_level']
    ordering = ['hierarchy_level', 'name']
    
    def get_permissions(self):
        """Apenas admins podem gerenciar funções"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsChurchAdmin]
        else:
            permission_classes = [IsMemberUser]
        
        return [permission() for permission in permission_classes]


class MemberViewSetV2(viewsets.ModelViewSet):
    """
    ViewSet V2 com nova arquitetura de status
    Mantém compatibilidade com versão anterior
    """
    
    queryset = Member.objects.all()
    serializer_class = MemberSerializerV2
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['full_name', 'email', 'phone', 'cpf']
    ordering_fields = ['full_name', 'membership_date', 'birth_date', 'created_at']
    ordering = ['full_name']
    
    # Filtros incluindo novos campos de status
    def get_filterset_fields(self):
        """Filtros dinâmicos baseados na versão da API"""
        base_filters = [
            'church', 'is_active', 'gender', 'marital_status', 'ministerial_function'
        ]
        
        # Para compatibilidade, mantém filtro por membership_status
        # mas internamente usa a nova tabela
        return base_filters + ['membership_status']
    
    def get_permissions(self):
        """Sistema de permissões igual ao original"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsChurchAdminOrCanManageMembers]
        elif self.action in ['dashboard', 'statistics']:
            permission_classes = [IsChurchAdmin]
        else:
            permission_classes = [IsMemberUser]
        
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Queryset otimizado com prefetch da nova tabela
        Aplica filtros de status via nova tabela
        """
        user = self.request.user
        
        # Base queryset com prefetch otimizado
        base_qs = Member.objects.select_related('church').prefetch_related(
            Prefetch(
                'membership_statuses',
                queryset=MembershipStatus.objects.filter(is_current=True),
                to_attr='current_status_list'
            )
        )
        
        # Filtros de permissão (igual ao original)
        if user.is_superuser:
            queryset = base_qs
        else:
            user_churches = user.church_users.filter(is_active=True)
            if not user_churches.exists():
                return Member.objects.none()
            
            church_ids = user_churches.values_list('church_id', flat=True)
            queryset = base_qs.filter(church_id__in=church_ids)
        
        # Filtro por status via nova tabela
        membership_status_filter = self.request.query_params.get('membership_status')
        if membership_status_filter:
            queryset = queryset.filter(
                membership_statuses__status=membership_status_filter,
                membership_statuses__is_current=True
            )
        
        return queryset
    
    def get_serializer_class(self):
        """Serializers V2"""
        if self.action == 'create':
            return MemberCreateSerializerV2
        elif self.action == 'list':
            return MemberSummarySerializerV2
        return MemberSerializerV2
    
    @action(detail=True, methods=['patch'])
    def change_status(self, request, pk=None):
        """
        Endpoint para mudança de status via nova arquitetura
        Substitui o update_status original
        """
        member = self.get_object()
        serializer = MemberStatusChangeSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            new_status_obj = MembershipStatus.create_status_change(
                member=member,
                new_status=serializer.validated_data['status'],
                reason=serializer.validated_data.get('reason', ''),
                changed_by=request.user
            )
            
            # Atualiza data efetiva se fornecida
            effective_date = serializer.validated_data.get('effective_date')
            if effective_date:
                new_status_obj.effective_date = effective_date
                new_status_obj.save()
            
            return Response({
                'message': 'Status atualizado com sucesso',
                'previous_status': new_status_obj.member.membership_status if hasattr(new_status_obj.member, 'membership_status') else 'unknown',
                'new_status': new_status_obj.get_status_display(),
                'effective_date': new_status_obj.effective_date,
                'status_id': new_status_obj.id
            })
            
        except Exception as e:
            return Response(
                {'error': f'Erro ao atualizar status: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'])
    def status_history(self, request, pk=None):
        """Histórico completo de status do membro"""
        member = self.get_object()
        
        statuses = MembershipStatus.objects.filter(member=member).order_by('-effective_date')
        serializer = MembershipStatusSerializer(statuses, many=True)
        
        return Response({
            'member_id': member.id,
            'member_name': member.full_name,
            'current_status': MembershipStatus.get_current_status(member).status if MembershipStatus.get_current_status(member) else 'unknown',
            'status_history': serializer.data,
            'total_changes': statuses.count()
        })
    
    @action(detail=False, methods=['get'])
    def dashboard_v2(self, request):
        """
        Dashboard V2 com métricas da nova arquitetura
        """
        queryset = self.get_queryset()
        
        # Estatísticas por status atual (via nova tabela)
        current_statuses = MembershipStatus.objects.filter(
            member__in=queryset,
            is_current=True
        ).values('status').annotate(
            count=Count('id')
        ).order_by('status')
        
        # Mudanças de status recentes (30 dias)
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        recent_changes = MembershipStatus.objects.filter(
            member__in=queryset,
            created_at__gte=thirty_days_ago
        ).count()
        
        # Status mais comuns
        most_common_statuses = list(current_statuses.order_by('-count')[:5])
        
        # Taxa de retenção (membros que mudaram para inativo)
        inactive_changes = MembershipStatus.objects.filter(
            member__in=queryset,
            status='inactive',
            created_at__gte=thirty_days_ago
        ).count()
        
        total_members = queryset.count()
        retention_rate = ((total_members - inactive_changes) / total_members * 100) if total_members > 0 else 100
        
        return Response({
            'total_members': total_members,
            'status_distribution': list(current_statuses),
            'most_common_statuses': most_common_statuses,
            'recent_status_changes': recent_changes,
            'retention_rate': round(retention_rate, 2),
            'inactive_this_month': inactive_changes,
            'analytics_period': '30 days'
        })
    
    # Mantém métodos originais para compatibilidade
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Dashboard original (deprecated, use dashboard_v2)"""
        # Redireciona para nova versão mas mantém formato de resposta
        return self.dashboard_v2(request)
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Método original (deprecated, use change_status)"""
        return self.change_status(request, pk)