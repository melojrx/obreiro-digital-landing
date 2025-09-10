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

from .models import Member, MembershipStatusLog
from .serializers import (
    MemberSerializer, MemberListSerializer, MemberCreateSerializer, 
    MemberUpdateSerializer, MemberSummarySerializer,
    MembershipStatusLogSerializer, MemberStatusChangeSerializer
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
        queryset = Member.objects.select_related('church', 'spouse', 'responsible')
        
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
        male_count = queryset.filter(gender='M').count()
        female_count = queryset.filter(gender='F').count()
        
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
        """Alterar status de membresia - VERSÃO SIMPLIFICADA COM AUDITORIA"""
        member = self.get_object()
        serializer = MemberStatusChangeSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Usar o método melhorado do model que já faz o log
        changed = member.update_membership_status(
            new_status=serializer.validated_data['new_status'],
            reason=serializer.validated_data.get('reason', ''),
            changed_by=request.user
        )
        
        if changed:
            # Retornar dados atualizados
            member_serializer = self.get_serializer(member)
            return Response({
                'message': 'Status de membresia alterado com sucesso',
                'member': member_serializer.data,
                'logged': True  # Confirma que foi logado
            })
        else:
            return Response({
                'message': 'Nenhuma alteração necessária - status já é o mesmo',
                'logged': False
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
    
    @action(detail=True, methods=['get'])
    def status_history(self, request, pk=None):
        """Histórico de mudanças de status - ENDPOINT SIMPLES E EFICIENTE"""
        member = self.get_object()
        
        # Buscar histórico ordenado por data
        history = MembershipStatusLog.objects.filter(member=member).order_by('-created_at')
        
        # Paginação opcional
        page = self.paginate_queryset(history)
        if page is not None:
            serializer = MembershipStatusLogSerializer(page, many=True)
            return self.get_paginated_response({
                'member_name': member.full_name,
                'current_status': member.membership_status,
                'current_status_display': member.get_membership_status_display(),
                'history': serializer.data,
                'total_changes': history.count()
            })
        
        # Sem paginação
        serializer = MembershipStatusLogSerializer(history, many=True)
        return Response({
            'member_name': member.full_name,
            'current_status': member.membership_status,
            'current_status_display': member.get_membership_status_display(),
            'history': serializer.data,
            'total_changes': history.count()
        })
    

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

    @action(detail=False, methods=['get'])
    def available_for_spouse(self, request):
        """
        Buscar membros disponíveis para vinculação de cônjuge.
        Exclui o próprio membro e membros já vinculados a outros cônjuges.
        """
        queryset = self.get_queryset()
        
        # Excluir o próprio membro (se ID for fornecido)
        member_id = request.query_params.get('exclude_member_id')
        if member_id:
            try:
                queryset = queryset.exclude(id=int(member_id))
            except (ValueError, TypeError):
                pass
        
        # Excluir membros que já são cônjuges de outros membros
        # queryset = queryset.filter(spouse_of__isnull=True)
        
        # Aplicar filtro de busca se fornecido
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(full_name__icontains=search) |
                Q(cpf__icontains=search)
            )
        
        # Ordenar por nome
        queryset = queryset.order_by('full_name')
        
        # Limitar resultados para performance
        queryset = queryset[:50]  # Máximo 50 resultados
        
        # Serializar apenas dados essenciais
        data = [
            {
                'id': member.id,
                'full_name': member.full_name,
                'cpf': member.cpf,
                'birth_date': member.birth_date,
                'age': member.age,
                'gender': member.get_gender_display(),
                'membership_date': member.membership_date,
            }
            for member in queryset
        ]
        
        return Response({
            'count': len(data),
            'results': data
        })

    @action(detail=False, methods=['get'])
    def leaders(self, request):
        """
        Buscar membros que podem ser líderes de ministérios.
        Filtra por funções ministeriais adequadas para liderança.
        """
        # Funções que podem liderar ministérios
        leader_functions = ['leader', 'pastor', 'elder', 'deacon', 'deaconess']
        
        queryset = self.get_queryset().filter(
            ministerial_function__in=leader_functions,
            is_active=True
        )
        
        # Aplicar filtro de busca se fornecido
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(full_name__icontains=search) |
                Q(email__icontains=search)
            )
        
        # Ordenar por nome
        queryset = queryset.order_by('full_name')
        
        # Serializar apenas dados essenciais para o select
        data = [
            {
                'id': member.id,
                'name': member.full_name,
                'role': member.get_ministerial_function_display(),
                'ministerial_function': member.ministerial_function,
                'email': member.email
            }
            for member in queryset
        ]
        
        return Response({
            'count': len(data),
            'results': data
        })