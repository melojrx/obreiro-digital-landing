"""
Views para o app Members
Implementa APIs para gestão de membros
"""

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Count, Q
from datetime import datetime, date

from .models import Member
from .serializers import (
    MemberSerializer, MemberListSerializer, MemberCreateSerializer, 
    MemberUpdateSerializer, MemberSummarySerializer
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
        """QuerySet otimizado com select_related e filtros por igreja"""
        # Filtrar apenas membros da igreja do usuário logado
        queryset = Member.objects.select_related('church', 'spouse_member', 'responsible')
        
        # Se o usuário tiver vínculo com igreja, filtrar por ela
        if hasattr(self.request.user, 'church_users') and self.request.user.church_users.exists():
            church_user = self.request.user.church_users.first()
            queryset = queryset.filter(church=church_user.church)
        
        # Filtrar apenas membros ativos por padrão
        if self.action != 'all':
            queryset = queryset.filter(is_active=True)
        
        return queryset
    
    def perform_create(self, serializer):
        """Ao criar, associar à igreja do usuário"""
        if hasattr(self.request.user, 'church_users') and self.request.user.church_users.exists():
            church_user = self.request.user.church_users.first()
            serializer.save(church=church_user.church)
        else:
            # Se não tiver igreja, usar a primeira disponível (fallback)
            from apps.churches.models import Church
            church = Church.objects.first()
            serializer.save(church=church)
    
    def get_serializer_class(self):
        """Retorna o serializer apropriado para cada ação"""
        if self.action == 'list':
            return MemberListSerializer
        elif self.action == 'create':
            return MemberCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return MemberUpdateSerializer
        elif self.action == 'dashboard':
            return MemberSummarySerializer
        return MemberSerializer
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        Endpoint para dados do dashboard de membros
        """
        queryset = self.get_queryset()
        
        # Estatísticas básicas
        total_members = queryset.count()
        active_members = queryset.filter(membership_status='active').count()
        
        # Estatísticas por gênero
        male_count = queryset.filter(gender='male').count()
        female_count = queryset.filter(gender='female').count()
        
        # Estatísticas por faixa etária (aproximada)
        from datetime import date, timedelta
        today = date.today()
        
        # Jovens (até 30 anos)
        young_date = today - timedelta(days=30*365)
        young_count = queryset.filter(birth_date__gte=young_date).count()
        
        # Adultos (31-60 anos)
        adult_min_date = today - timedelta(days=60*365)
        adult_max_date = today - timedelta(days=30*365)
        adult_count = queryset.filter(
            birth_date__gte=adult_min_date,
            birth_date__lt=adult_max_date
        ).count()
        
        # Idosos (acima de 60 anos)
        elderly_date = today - timedelta(days=60*365)
        elderly_count = queryset.filter(birth_date__lt=elderly_date).count()
        
        data = {
            'total_members': total_members,
            'active_members': active_members,
            'statistics': {
                'by_gender': {
                    'male': male_count,
                    'female': female_count
                },
                'by_age': {
                    'young': young_count,
                    'adult': adult_count,
                    'elderly': elderly_count
                }
            }
        }
        
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def all(self, request):
        """Lista todos os membros, incluindo inativos"""
        queryset = self.get_queryset().filter(is_active__in=[True, False])
        
        # Aplicar filtros se fornecidos
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(full_name__icontains=search) |
                Q(email__icontains=search) |
                Q(cpf__icontains=search)
            )
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = MemberListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = MemberListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def toggle_status(self, request, pk=None):
        """Ativar/desativar membro"""
        member = self.get_object()
        member.is_active = not member.is_active
        member.save()
        
        serializer = self.get_serializer(member)
        return Response({
            'message': f'Membro {"ativado" if member.is_active else "desativado"} com sucesso',
            'member': serializer.data
        })
    
    @action(detail=True, methods=['patch'])
    def change_status(self, request, pk=None):
        """Alterar status de membresia"""
        member = self.get_object()
        new_status = request.data.get('membership_status')
        
        if not new_status:
            return Response(
                {'error': 'Status de membresia é obrigatório'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar se o status é válido
        valid_statuses = [choice[0] for choice in member._meta.get_field('membership_status').choices]
        if new_status not in valid_statuses:
            return Response(
                {'error': 'Status de membresia inválido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        member.membership_status = new_status
        member.save()
        
        serializer = self.get_serializer(member)
        return Response({
            'message': 'Status de membresia alterado com sucesso',
            'member': serializer.data
        })
    
    @action(detail=True, methods=['get'])
    def profile(self, request, pk=None):
        """Obter perfil completo do membro com família e ministérios"""
        member = self.get_object()
        
        # Serializar dados do membro
        serializer = self.get_serializer(member)
        member_data = serializer.data
        
        # Adicionar membros da família
        family_members = member.get_family_members()
        family_serializer = MemberListSerializer(family_members, many=True)
        member_data['family_members'] = family_serializer.data
        
        # Adicionar lista de ministérios
        member_data['ministries_list'] = member.get_ministries_list()
        
        return Response(member_data)

    @action(detail=False, methods=['get'])
    def export(self, request):
        """Exportar dados dos membros (CSV/Excel)"""
        queryset = self.get_queryset()
        
        # Aplicar filtros se fornecidos
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(full_name__icontains=search) |
                Q(email__icontains=search) |
                Q(cpf__icontains=search)
            )
        
        # Serializar dados
        serializer = MemberSerializer(queryset, many=True)
        
        return Response({
            'count': queryset.count(),
            'exported_at': datetime.now().isoformat(),
            'members': serializer.data
        })