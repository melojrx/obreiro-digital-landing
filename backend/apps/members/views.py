"""
Views para o app Members
Gerencia endpoints de membros com sistema completo de permissões
"""

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Count, Q
from django.utils import timezone
from datetime import datetime, timedelta

from .models import Member
from .serializers import (
    MemberSerializer, MemberCreateSerializer, MemberSummarySerializer,
    MemberStatsSerializer, MemberDashboardSerializer
)
from apps.core.permissions import (
    IsSuperUser, IsDenominationAdmin, IsChurchAdmin, 
    IsMemberUser, CanManageMembers, IsChurchAdminOrCanManageMembers
)
from apps.accounts.models import RoleChoices


class MemberViewSet(viewsets.ModelViewSet):
    """
    ViewSet completo para gestão de membros
    Implementa sistema de permissões por papel do usuário
    """
    
    queryset = Member.objects.all()
    serializer_class = MemberSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['full_name', 'email', 'phone', 'cpf']
    filterset_fields = ['church', 'is_active', 'membership_status', 'gender', 'marital_status', 'ministerial_function']
    ordering_fields = ['full_name', 'membership_date', 'birth_date', 'created_at']
    ordering = ['full_name']
    
    def get_permissions(self):
        """
        Define permissões baseadas na ação
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Apenas usuários com permissão de gerenciar membros
            permission_classes = [IsChurchAdminOrCanManageMembers]
        elif self.action in ['dashboard', 'statistics']:
            # Dashboard e estatísticas apenas para admins
            permission_classes = [IsChurchAdmin]
        else:
            # Visualização para qualquer membro da igreja
            permission_classes = [IsMemberUser]
        
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Filtra membros baseado no papel do usuário
        """
        user = self.request.user
        
        # SuperUser vê todos os membros
        if user.is_superuser:
            return Member.objects.all()
        
        # Busca todas as igrejas do usuário
        user_churches = user.church_users.filter(is_active=True)
        
        if not user_churches.exists():
            return Member.objects.none()
        
        # Denomination Admin vê membros de todas as igrejas da denominação
        denomination_admin = user_churches.filter(role=RoleChoices.DENOMINATION_ADMIN).first()
        if denomination_admin:
            denomination = denomination_admin.church.denomination
            return Member.objects.filter(church__denomination=denomination)
        
        # Church Admin vê todos os membros da igreja
        church_admin = user_churches.filter(role=RoleChoices.CHURCH_ADMIN).first()
        if church_admin:
            return Member.objects.filter(church=church_admin.church)
        
        # Outros papéis veem membros conforme suas permissões
        church_user = user_churches.first()
        queryset = Member.objects.filter(church=church_user.church)
        
        # Se tem filiais específicas, filtra por elas
        if church_user.managed_branches.exists():
            # TODO: Implementar filtro por filial quando o modelo Member tiver campo branch
            pass
        
        return queryset
    
    def get_serializer_class(self):
        """
        Retorna serializer apropriado para cada ação
        """
        if self.action == 'create':
            return MemberCreateSerializer
        elif self.action == 'list':
            return MemberSummarySerializer
        elif self.action in ['dashboard', 'statistics']:
            return MemberStatsSerializer
        return MemberSerializer
    
    def get_user_church(self):
        """
        Método auxiliar para obter a igreja do usuário
        """
        church_user = self.request.user.church_users.filter(is_active=True).first()
        return church_user.church if church_user else None
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        Dashboard com KPIs principais dos membros
        """
        queryset = self.get_queryset()
        
        # Estatísticas básicas
        total_members = queryset.count()
        active_members = queryset.filter(
            is_active=True, 
            membership_status='active'
        ).count()
        
        # Novos membros (últimos 30 dias)
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        new_members = queryset.filter(
            membership_date__gte=thirty_days_ago
        ).count()
        
        # Membros por status
        status_stats = queryset.values('membership_status').annotate(
            count=Count('id')
        ).order_by('membership_status')
        
        # Membros por gênero
        gender_stats = queryset.values('gender').annotate(
            count=Count('id')
        ).order_by('gender')
        
        # Membros por faixa etária
        today = timezone.now().date()
        age_stats = {
            'children': queryset.filter(birth_date__gte=today - timedelta(days=12*365)).count(),
            'youth': queryset.filter(
                birth_date__gte=today - timedelta(days=25*365),
                birth_date__lt=today - timedelta(days=12*365)
            ).count(),
            'adults': queryset.filter(
                birth_date__gte=today - timedelta(days=60*365),
                birth_date__lt=today - timedelta(days=25*365)
            ).count(),
            'elderly': queryset.filter(birth_date__lt=today - timedelta(days=60*365)).count(),
        }
        
        return Response({
            'total_members': total_members,
            'active_members': active_members,
            'inactive_members': total_members - active_members,
            'new_members_month': new_members,
            'status_distribution': list(status_stats),
            'gender_distribution': list(gender_stats),
            'age_distribution': age_stats,
            'growth_rate': round((new_members / total_members * 100) if total_members > 0 else 0, 2)
        })
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Estatísticas detalhadas dos membros
        """
        queryset = self.get_queryset()
        
        # Estatísticas por função ministerial
        ministerial_stats = queryset.values('ministerial_function').annotate(
            count=Count('id')
        ).order_by('ministerial_function')
        
        # Estatísticas por estado civil
        marital_stats = queryset.values('marital_status').annotate(
            count=Count('id')
        ).order_by('marital_status')
        
        # Membros batizados vs não batizados
        baptism_stats = {
            'baptized': queryset.filter(baptism_date__isnull=False).count(),
            'not_baptized': queryset.filter(baptism_date__isnull=True).count()
        }
        
        # Crescimento mensal (últimos 12 meses)
        monthly_growth = []
        for i in range(12):
            month_start = (timezone.now().date().replace(day=1) - timedelta(days=i*30))
            month_end = month_start + timedelta(days=30)
            
            month_members = queryset.filter(
                membership_date__gte=month_start,
                membership_date__lt=month_end
            ).count()
            
            monthly_growth.append({
                'month': month_start.strftime('%Y-%m'),
                'count': month_members
            })
        
        return Response({
            'ministerial_distribution': list(ministerial_stats),
            'marital_distribution': list(marital_stats),
            'baptism_stats': baptism_stats,
            'monthly_growth': monthly_growth[::-1]  # Ordem cronológica
        })
    
    @action(detail=True, methods=['get'])
    def profile(self, request, pk=None):
        """
        Perfil completo do membro com informações detalhadas
        """
        member = self.get_object()
        serializer = MemberSerializer(member)
        
        # Adiciona informações extras
        data = serializer.data
        data['family_members'] = member.get_family_members()
        data['ministries_list'] = member.get_ministries_list()
        
        return Response(data)
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """
        Atualiza status de membresia do membro
        """
        member = self.get_object()
        new_status = request.data.get('status')
        reason = request.data.get('reason', '')
        
        if not new_status:
            return Response(
                {'error': 'Status é obrigatório'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            member.update_membership_status(new_status, reason)
            return Response({
                'message': 'Status atualizado com sucesso',
                'new_status': member.get_membership_status_display()
            })
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        """
        Exporta lista de membros (apenas para admins)
        """
        if not IsChurchAdmin().has_permission(request, self):
            return Response(
                {'error': 'Permissão negada'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        queryset = self.get_queryset()
        serializer = MemberSerializer(queryset, many=True)
        
        return Response({
            'members': serializer.data,
            'total': queryset.count(),
            'exported_at': timezone.now().isoformat()
        })
