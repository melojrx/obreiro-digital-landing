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

    @action(detail=False, methods=['get'], url_path='dashboard-test')
    def dashboard_test(self, request):
        """Teste simples para verificar se a API está funcionando"""
        return Response({
            'status': 'ok',
            'user': request.user.email,
            'message': 'API funcionando corretamente'
        })
    
    @action(detail=False, methods=['get'], url_path='main-dashboard')
    def main_dashboard(self, request):
        """
        Retorna os dados consolidados para o dashboard principal
        da igreja do usuário logado.
        """
        # Buscar a igreja do usuário atual de forma mais robusta
        try:
            from apps.accounts.models import ChurchUser
            
            print(f"🏢 Dashboard: Buscando igreja para usuário {request.user.email}")
            
            church_user = ChurchUser.objects.filter(
                user=request.user, 
                is_active=True
            ).first()
            
            if not church_user:
                print(f"❌ Dashboard: Usuário {request.user.email} não tem igreja associada")
                return Response(
                    {"error": "Usuário não está associado a nenhuma igreja."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            church = church_user.church
            print(f"✅ Dashboard: Igreja encontrada: {church.name} (ID: {church.id})")
            
        except Exception as e:
            print(f"💥 Dashboard: Erro ao buscar igreja: {e}")
            return Response(
                {"error": f"Erro ao buscar dados da igreja: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        try:
            from django.db.models import Sum, Count
            from django.utils import timezone
            from datetime import timedelta
            from apps.members.models import Member
            from apps.visitors.models import Visitor
            from apps.activities.models import Activity

            today = timezone.now().date()
            start_of_this_month = today.replace(day=1)
            start_of_last_month = (start_of_this_month - timedelta(days=1)).replace(day=1)
            end_of_last_month = start_of_this_month - timedelta(days=1)

            # Métricas atuais (com try-catch para cada consulta)
            try:
                total_members = Member.objects.filter(church=church).count()
            except:
                total_members = 0
                
            try:
                total_visitors_this_month = Visitor.objects.filter(
                    church=church, created_at__gte=start_of_this_month
                ).count()
            except:
                total_visitors_this_month = 0
                
            try:
                active_events = Activity.objects.filter(
                    church=church, is_active=True, start_datetime__gte=today
                ).count()
            except:
                active_events = 0
                
            # Para dízimos, vamos precisar de um model Financeiro (simulando por enquanto)
            tithes_this_month = 1000 * church.id # Simulação

            # Métricas do mês passado para comparação
            try:
                total_members_last_month = Member.objects.filter(
                    church=church, created_at__lt=start_of_this_month
                ).count()
            except:
                total_members_last_month = 0
                
            try:
                total_visitors_last_month = Visitor.objects.filter(
                    church=church, created_at__range=(start_of_last_month, end_of_last_month)
                ).count()
            except:
                total_visitors_last_month = 0
                
            tithes_last_month = 850 * church.id # Simulação
            
            def calculate_percentage_change(current, previous):
                if previous == 0:
                    return 100 if current > 0 else 0
                return round(((current - previous) / previous) * 100)

            data = {
                'members': {
                    'total': total_members,
                    'change': calculate_percentage_change(total_members, total_members_last_month)
                },
                'visitors': {
                    'total': total_visitors_this_month,
                    'change': calculate_percentage_change(total_visitors_this_month, total_visitors_last_month)
                },
                'events': {
                    'total': active_events,
                    'change': 0 # Sem métrica de comparação por enquanto
                },
                'tithes': {
                    'total': tithes_this_month,
                    'change': calculate_percentage_change(tithes_this_month, tithes_last_month)
                }
            }
            
            return Response(data)
            
        except Exception as e:
            # Se algo der errado, retornar dados zerados
            print(f"Erro ao buscar métricas do dashboard: {e}")
            fallback_data = {
                'members': {'total': 0, 'change': 0},
                'visitors': {'total': 0, 'change': 0},
                'events': {'total': 0, 'change': 0},
                'tithes': {'total': 0, 'change': 0}
            }
            return Response(fallback_data)

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
