"""
Views para o app Churches
Gerencia endpoints de igrejas
"""

import logging
from django.db.models import Q, Count, Prefetch
from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters import rest_framework as filters

from .models import Church
from .serializers import (
    ChurchSerializer, ChurchCreateSerializer, ChurchSummarySerializer,
    ChurchStatsSerializer, ChurchSubscriptionSerializer,
    ChurchListSerializer, ChurchUpdateSerializer, ChurchStatisticsSerializer,
    ChurchDetailSerializer
)
from apps.core.permissions import (
    IsChurchAdmin, IsPlatformAdmin,
    CanCreateChurches, CanManageChurchAdmins
)
from apps.core.models import MembershipStatusChoices
from apps.accounts.models import LEGACY_DENOMINATION_ROLE

# Setup logging
logger = logging.getLogger(__name__)


class ChurchFilter(filters.FilterSet):
    """Filtros avançados para igrejas"""
    
    # Filtros básicos
    denomination = filters.NumberFilter(field_name='denomination__id')
    state = filters.CharFilter(field_name='state', lookup_expr='iexact')
    city = filters.CharFilter(field_name='city', lookup_expr='icontains')
    subscription_plan = filters.ChoiceFilter(field_name='subscription_plan')
    subscription_status = filters.ChoiceFilter(field_name='subscription_status')
    
    # Filtros por range
    total_members_min = filters.NumberFilter(field_name='total_members', lookup_expr='gte')
    total_members_max = filters.NumberFilter(field_name='total_members', lookup_expr='lte')
    
    # Filtros por data
    created_after = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    
    # Filtros booleanos
    has_cnpj = filters.BooleanFilter(method='filter_has_cnpj')
    has_main_pastor = filters.BooleanFilter(method='filter_has_main_pastor')
    subscription_expired = filters.BooleanFilter(method='filter_subscription_expired')
    
    class Meta:
        model = Church
        fields = [
            'denomination', 'state', 'city', 'subscription_plan', 
            'subscription_status', 'is_active'
        ]
    
    def filter_has_cnpj(self, queryset, name, value):
        if value:
            return queryset.exclude(cnpj__isnull=True).exclude(cnpj='')
        return queryset.filter(Q(cnpj__isnull=True) | Q(cnpj=''))
    
    def filter_has_main_pastor(self, queryset, name, value):
        if value:
            return queryset.exclude(main_pastor__isnull=True)
        return queryset.filter(main_pastor__isnull=True)
    
    def filter_subscription_expired(self, queryset, name, value):
        now = timezone.now()
        if value:
            return queryset.filter(subscription_end_date__lt=now)
        return queryset.filter(subscription_end_date__gte=now)


class ChurchViewSet(viewsets.ModelViewSet):
    """
    ViewSet completo para gerenciamento de igrejas
    
    Endpoints disponíveis:
    - GET /api/churches/ - Listar igrejas
    - POST /api/churches/ - Criar nova igreja
    - GET /api/churches/{id}/ - Detalhes da igreja
    - PUT /api/churches/{id}/ - Atualizar igreja completa
    - PATCH /api/churches/{id}/ - Atualizar igreja parcial
    - DELETE /api/churches/{id}/ - Soft delete da igreja
    """
    
    serializer_class = ChurchSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ChurchFilter
    search_fields = ['name', 'short_name', 'city', 'state', 'email']
    ordering_fields = ['name', 'city', 'created_at', 'total_members', 'subscription_end_date']
    ordering = ['name']
    
    def get_queryset(self):
        """
        Filtrar igrejas baseado no usuário com otimizações de performance
        """
        user = self.request.user
        
        # Queryset base otimizado
        queryset = Church.objects.select_related(
            'denomination', 'main_pastor'
        ).prefetch_related(
            'branches'
        ).annotate(
            members_count=Count(
                'members',
                filter=Q(
                    members__is_active=True,
                    members__membership_status=MembershipStatusChoices.ACTIVE
                ),
                distinct=True
            ),
            branches_count=Count(
                'branches',
                filter=Q(branches__is_active=True, branches__is_main=False),
                distinct=True
            ),
            visitors_count=Count(
                'visitors',
                filter=Q(visitors__is_active=True),
                distinct=True
            )
        )
        
        # Superuser vê tudo
        if user.is_superuser:
            logger.info(f"Superuser {user.email} acessando todas as igrejas")
            return queryset
        
        # Platform admins veem tudo
        if user.church_users.filter(
            role='super_admin', is_active=True
        ).exists():
            logger.info(f"Platform admin {user.email} acessando todas as igrejas")
            return queryset
        
        # Administradores de denominação veem suas igrejas
        if user.administered_denominations.exists():
            denomination_ids = user.administered_denominations.values_list('id', flat=True)
            logger.info(f"Denomination admin {user.email} acessando igrejas das denominações {list(denomination_ids)}")
            return queryset.filter(denomination_id__in=denomination_ids)
        
    # Verificar se há papéis legados de denominação via ChurchUser
        denomination_admin_churches = user.church_users.filter(
            role=LEGACY_DENOMINATION_ROLE,
            is_active=True
        ).values_list('church__denomination_id', flat=True).distinct()
        
        if denomination_admin_churches:
            logger.info(f"Denomination admin via ChurchUser {user.email} acessando igrejas das denominações {list(denomination_admin_churches)}")
            return queryset.filter(denomination_id__in=denomination_admin_churches)
        
        # Administradores de igreja veem igrejas onde são admins
        admin_church_ids = user.church_users.filter(
            role__in=[LEGACY_DENOMINATION_ROLE, 'church_admin'],
            is_active=True
        ).values_list('church_id', flat=True)
        
        if admin_church_ids:
            logger.info(f"Church admin {user.email} acessando igrejas onde é admin: {list(admin_church_ids)}")
            return queryset.filter(id__in=admin_church_ids)
        
        # Usuários regulares veem apenas suas igrejas
        church_ids = user.church_users.filter(is_active=True).values_list('church_id', flat=True)
        logger.info(f"Regular user {user.email} acessando suas igrejas: {list(church_ids)}")
        return queryset.filter(id__in=church_ids)
    
    def get_permissions(self):
        """Permissões específicas por ação"""
        if self.action == 'create':
            permission_classes = [permissions.IsAuthenticated, CanCreateChurches]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [permissions.IsAuthenticated, IsChurchAdmin]
        elif self.action == 'destroy':
            # Apenas Church Admins podem deletar igrejas
            permission_classes = [permissions.IsAuthenticated, IsChurchAdmin]
        elif self.action in ['assign_admin', 'remove_admin']:
            permission_classes = [permissions.IsAuthenticated, CanManageChurchAdmins]
        else:
            permission_classes = [permissions.IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        """Serializer específico por ação"""
        if self.action == 'create':
            return ChurchCreateSerializer
        elif self.action == 'list':
            return ChurchListSerializer
        elif self.action == 'retrieve':
            return ChurchDetailSerializer
        elif self.action in ['update', 'partial_update']:
            return ChurchUpdateSerializer
        elif self.action == 'statistics':
            return ChurchStatisticsSerializer
        elif self.action == 'subscription':
            return ChurchSubscriptionSerializer
        return ChurchSerializer
    
    def perform_create(self, serializer):
        """Ações ao criar uma igreja"""
        user = self.request.user
        church = serializer.save()
        
        logger.info(f"Igreja '{church.name}' criada por {user.email}")
        
        # Atualizar estatísticas da denominação se aplicável
        if church.denomination:
            church.denomination.update_statistics()
    
    def perform_update(self, serializer):
        """Ações ao atualizar uma igreja"""
        user = self.request.user
        church = serializer.save()
        
        logger.info(f"Igreja '{church.name}' atualizada por {user.email}")
    
    def perform_destroy(self, instance):
        """Soft delete - marcar como inativa ao invés de deletar"""
        user = self.request.user
        instance.is_active = False
        instance.save()
        
        logger.warning(f"Igreja '{instance.name}' marcada como inativa por {user.email}")
        
        # Atualizar estatísticas da denominação se aplicável
        if instance.denomination:
            instance.denomination.update_statistics()

    # ==============================
    # Compat: QR Code via Church → Branch principal
    # ==============================
    def _get_main_branch(self, church):
        try:
            from apps.branches.models import Branch
            branch = church.branches.filter(is_active=True, is_main=True).first()
            if not branch:
                branch = church.branches.filter(is_active=True).first()
            return branch
        except Exception:
            return None

    @action(detail=True, methods=['get'])
    def qr_code(self, request, pk=None):
        """Retorna dados de QR da filial principal (compat)."""
        church = self.get_object()
        branch = self._get_main_branch(church)
        if not branch:
            return Response({'error': 'Igreja não possui filial principal para QR.'}, status=status.HTTP_404_NOT_FOUND)
        from apps.branches.serializers import BranchQRCodeSerializer
        serializer = BranchQRCodeSerializer(branch, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def regenerate_qr_code(self, request, pk=None):
        """Regenera QR da filial principal (compat)."""
        church = self.get_object()
        branch = self._get_main_branch(church)
        if not branch:
            return Response({'error': 'Igreja não possui filial principal para QR.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            branch.regenerate_qr_code()
            from apps.branches.serializers import BranchQRCodeSerializer
            serializer = BranchQRCodeSerializer(branch, context={'request': request})
            return Response({'message': 'QR code regenerado com sucesso', 'data': serializer.data})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def toggle_qr_code(self, request, pk=None):
        """Ativa/desativa QR da filial principal (compat)."""
        church = self.get_object()
        branch = self._get_main_branch(church)
        if not branch:
            return Response({'error': 'Igreja não possui filial principal para QR.'}, status=status.HTTP_404_NOT_FOUND)
        branch.qr_code_active = not branch.qr_code_active
        branch.save(update_fields=['qr_code_active', 'updated_at'])
        status_text = 'ativado' if branch.qr_code_active else 'desativado'
        from apps.branches.serializers import BranchQRCodeSerializer
        serializer = BranchQRCodeSerializer(branch, context={'request': request})
        return Response({'message': f'QR code {status_text} com sucesso', 'data': serializer.data})
    
    # ============================================
    # CUSTOM ACTIONS - ESTATÍSTICAS E RELATÓRIOS
    # ============================================
    
    @action(detail=False, methods=['post'], url_path='create-first-church', permission_classes=[permissions.IsAuthenticated])
    def create_first_church(self, request):
        """
        Cria a primeira igreja para um usuário CHURCH_ADMIN recém-cadastrado.
        Este endpoint é usado no onboarding após o cadastro.
        Também cria automaticamente uma filial matriz com QR Code.
        """
        from .serializers import FirstChurchSerializer, ChurchDetailSerializer
        from apps.branches.models import Branch
        user = request.user
        
        # Verificar se o usuário tem papel pretendido válido para criar igreja
        allowed_roles = {'church_admin', LEGACY_DENOMINATION_ROLE}  # legado convertido posteriormente
        if not (hasattr(user, 'profile') and user.profile.intended_role in allowed_roles):
            return Response(
                {'error': 'Este endpoint é apenas para usuários Church Admin sem igreja cadastrada'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Usar o serializer para validar e criar
        serializer = FirstChurchSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            church = serializer.save()
            logger.info(f"✅ Primeira igreja '{church.name}' criada para {user.email} via onboarding")
            
            # Criar filial matriz automaticamente com QR Code
            main_branch = None
            try:
                main_branch = Branch.objects.create(
                    church=church,
                    name=f"{church.name} - Matriz",
                    short_name=church.short_name or "Matriz",
                    address=church.address,
                    number=request.data.get('number', ''),
                    complement=request.data.get('complement', ''),
                    neighborhood=request.data.get('neighborhood', ''),
                    city=church.city,
                    state=church.state,
                    zipcode=church.zipcode,
                    phone=church.phone,
                    email=church.email,
                    qr_code_active=True,  # QR Code ativo por padrão
                    is_active=True,
                    is_main=True
                )
                logger.info(f"✅ Filial matriz criada com QR Code para igreja '{church.name}'")
                logger.info(f"   QR Code UUID: {main_branch.qr_code_uuid}")
                logger.info(f"   URL de registro: {main_branch.get_visitor_registration_url()}")

                # Atualizar vínculo do usuário para apontar filial ativa
                from apps.accounts.models import ChurchUser
                ChurchUser.objects.filter(user=user, church=church).update(active_branch=main_branch)
            
            except Exception as branch_error:
                logger.warning(f"⚠️ Erro ao criar filial matriz: {str(branch_error)}")
                # Não falhar a criação da igreja se houver erro na filial
                # O admin pode criar a filial manualmente depois
            
            # Retornar dados completos da igreja criada
            response_serializer = ChurchDetailSerializer(church)
            branch_payload = None
            if main_branch:
                try:
                    from apps.branches.serializers import BranchSerializer
                    branch_payload = BranchSerializer(main_branch).data
                except Exception:
                    branch_payload = None
            
            return Response({
                'message': 'Igreja criada com sucesso! Bem-vindo ao Obreiro Virtual.',
                'church': response_serializer.data,
                'onboarding_completed': True,
                'main_branch_created': branch_payload is not None,
                'branch': branch_payload,
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            logger.error(f"❌ Erro ao criar primeira igreja para {user.email}:")
            logger.error(f"   Mensagem: {str(e)}")
            logger.error(f"   Tipo: {type(e).__name__}")
            logger.error(f"   Traceback:\n{error_trace}")
            return Response(
                {'error': f'Erro ao criar igreja: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """Estatísticas detalhadas da igreja"""
        church = self.get_object()
        serializer = ChurchStatisticsSerializer(church)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def branches(self, request, pk=None):
        """Listar filiais da igreja"""
        church = self.get_object()
        
        # Assumindo que existe um modelo Branch relacionado
        try:
            branches = church.branches.filter(is_active=True, is_main=False)
            # Usar serializer básico para evitar circular import
            branches_data = []
            for branch in branches:
                branches_data.append({
                    'id': branch.id,
                    'name': branch.name,
                    'address': branch.address,
                    'city': branch.city,
                    'state': branch.state,
                    'phone': getattr(branch, 'phone', ''),
                    'is_active': branch.is_active,
                    'created_at': branch.created_at
                })
            
            return Response({
                'count': len(branches_data),
                'branches': branches_data
            })
        except AttributeError:
            # Se o modelo Branch ainda não existir
            return Response({
                'count': 0,
                'branches': [],
                'message': 'Sistema de filiais não implementado ainda'
            })
    
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
        
        logger.info(f"Assinatura da igreja '{church.name}' atualizada por {request.user.email}")
        return Response(serializer.data)
    
    # ============================================
    # CUSTOM ACTIONS - GESTÃO DE ADMINISTRADORES
    # ============================================
    
    @action(detail=True, methods=['post'])
    def assign_admin(self, request, pk=None):
        """
        Atribuir administrador à igreja
        
        VALIDAÇÕES DE SEGURANÇA:
        - Usuário NÃO pode se auto-atribuir roles
        - Apenas Church Admin ou superior pode atribuir roles
        """
        church = self.get_object()
        user_id = request.data.get('user_id')
        role = request.data.get('role', 'church_admin')
        
        if not user_id:
            return Response(
                {'error': 'user_id é obrigatório'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # VALIDAÇÃO CRÍTICA: Usuário não pode se auto-atribuir roles
        if str(user_id) == str(request.user.id):
            logger.warning(
                f"SECURITY ALERT: User {request.user.id} ({request.user.email}) "
                f"tentou se auto-atribuir role {role} na igreja {church.id}"
            )
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied(
                "Você não pode atribuir permissões a si mesmo"
            )
        
        try:
            from django.contrib.auth import get_user_model
            from apps.accounts.models import ChurchUser, RoleChoices
            
            User = get_user_model()
            user = User.objects.get(id=user_id)
            
            # Verificar se role é válido
            valid_roles = [choice[0] for choice in RoleChoices.choices]
            if role not in valid_roles:
                return Response(
                    {'error': f'Role inválido. Opções: {valid_roles}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Criar ou atualizar ChurchUser
            church_user, created = ChurchUser.objects.get_or_create(
                user=user,
                church=church,
                defaults={
                    'role': role,
                    'is_active': True
                }
            )
            
            old_role = None
            if not created:
                old_role = church_user.role
                church_user.role = role
                church_user.is_active = True
                church_user.save()
            
            # Log de auditoria
            action = 'criado' if created else f'atualizado de {old_role} para'
            logger.info(
                f"ROLE_ASSIGNMENT: Usuário {user.email} {action} {role} "
                f"na igreja {church.name} por {request.user.email}"
            )
            
            return Response({
                'message': f'Usuário {user.email} atribuído como {role}',
                'user_id': user.id,
                'user_email': user.email,
                'role': role,
                'created': created
            })
            
        except User.DoesNotExist:
            return Response(
                {'error': 'Usuário não encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Erro ao atribuir admin à igreja {church.name}: {str(e)}")
            return Response(
                {'error': f'Erro interno: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def remove_admin(self, request, pk=None):
        """Remover administrador da igreja"""
        church = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response(
                {'error': 'user_id é obrigatório'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from django.contrib.auth import get_user_model
            from apps.accounts.models import ChurchUser
            
            User = get_user_model()
            user = User.objects.get(id=user_id)
            
            church_user = ChurchUser.objects.get(
                user=user,
                church=church,
                is_active=True
            )
            
            church_user.is_active = False
            church_user.save()
            
            logger.info(f"Usuário {user.email} removido como admin da igreja {church.name} por {request.user.email}")
            
            return Response({
                'message': f'Usuário {user.email} removido como administrador',
                'user_id': user.id,
                'user_email': user.email
            })
            
        except User.DoesNotExist:
            return Response(
                {'error': 'Usuário não encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except ChurchUser.DoesNotExist:
            return Response(
                {'error': 'Usuário não é administrador desta igreja'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Erro ao remover admin da igreja {church.name}: {str(e)}")
            return Response(
                {'error': f'Erro interno: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def update_statistics(self, request, pk=None):
        """Atualizar estatísticas da igreja"""
        church = self.get_object()
        church.update_statistics()
        
        logger.info(f"Estatísticas da igreja '{church.name}' atualizadas por {request.user.email}")
        
        return Response({
            'message': 'Estatísticas atualizadas com sucesso',
            'total_members': church.total_members,
            'total_visitors': church.total_visitors,
            'updated_at': church.updated_at
        })
    
    # ============================================
    # CUSTOM ACTIONS - ENDPOINTS PARA DENOMINAÇÃO
    # ============================================
    
    @action(detail=False, methods=['get'])
    def my_churches(self, request):
        """Igrejas do usuário atual com filtros otimizados"""
        user = request.user
        
        # Usar o mesmo queryset otimizado do get_queryset
        churches = self.get_queryset()
        
        # Aplicar paginação se necessário
        page = self.paginate_queryset(churches)
        if page is not None:
            serializer = ChurchListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = ChurchListSerializer(churches, many=True)
        return Response({
            'count': churches.count(),
            'results': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='by-denomination/(?P<denomination_id>[^/.]+)')
    def by_denomination(self, request, denomination_id=None):
        """Listar igrejas de uma denominação específica"""
        if not denomination_id:
            return Response(
                {'error': 'denomination_id é obrigatório'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Filtrar igrejas pela denominação
        churches = self.get_queryset().filter(
            denomination_id=denomination_id,
            is_active=True
        )
        
        # Aplicar filtros adicionais se fornecidos
        filtered_churches = self.filter_queryset(churches)
        
        # Paginação
        page = self.paginate_queryset(filtered_churches)
        if page is not None:
            serializer = ChurchListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = ChurchListSerializer(filtered_churches, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], url_path='bulk-create')
    def bulk_create(self, request):
        """Criar múltiplas igrejas em lote (para denominações)"""
        churches_data = request.data.get('churches', [])
        
        if not churches_data or not isinstance(churches_data, list):
            return Response(
                {'error': 'Lista de igrejas é obrigatória'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        created_churches = []
        errors = []
        
        for idx, church_data in enumerate(churches_data):
            serializer = ChurchCreateSerializer(data=church_data)
            if serializer.is_valid():
                try:
                    church = serializer.save()
                    created_churches.append({
                        'id': church.id,
                        'name': church.name,
                        'city': church.city
                    })
                    logger.info(f"Igreja '{church.name}' criada em lote por {request.user.email}")
                except Exception as e:
                    errors.append({
                        'index': idx,
                        'error': f'Erro ao criar igreja: {str(e)}'
                    })
            else:
                errors.append({
                    'index': idx,
                    'errors': serializer.errors
                })
        
        return Response({
            'created_count': len(created_churches),
            'created_churches': created_churches,
            'errors_count': len(errors),
            'errors': errors
        }, status=status.HTTP_201_CREATED if created_churches else status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], url_path='main-dashboard')
    def main_dashboard(self, request):
        """
        Retorna os dados consolidados para o dashboard principal
        da igreja do usuário logado.
        """
        # Buscar a igreja ativa do usuário atual
        try:
            from apps.accounts.models import ChurchUser
            
            print(f"🏢 Dashboard: Buscando igreja ativa para usuário {request.user.email}")
            
            church = ChurchUser.objects.get_active_church_for_user(request.user)
            
            if not church:
                print(f"❌ Dashboard: Usuário {request.user.email} não tem igreja ativa configurada")
                return Response(
                    {"error": "Usuário não tem igreja ativa configurada."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            print(f"✅ Dashboard: Igreja ativa encontrada: {church.name} (ID: {church.id})")
            
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

            # Métricas atuais (priorizar dados reais, fallback para campos da igreja)
            try:
                real_members = Member.objects.filter(church=church, is_active=True).count()
                total_members = real_members if real_members > 0 else (church.total_members or 0)
            except:
                total_members = church.total_members or 0
                
            try:
                # Contar todos os visitantes da igreja (card mostra total, não apenas do mês)
                real_visitors_total = Visitor.objects.filter(church=church, is_active=True).count()
                # Visitantes do mês atual para cálculo de variação
                real_visitors_this_month = Visitor.objects.filter(
                    church=church, 
                    is_active=True,
                    created_at__gte=start_of_this_month
                ).count()
                print(f"📊 Dashboard Visitantes - Total: {real_visitors_total}, Este mês: {real_visitors_this_month}")
                # Mostrar total geral de visitantes
                total_visitors_display = real_visitors_total
            except Exception as e:
                print(f"❌ Erro ao contar visitantes: {e}")
                total_visitors_display = church.total_visitors or 0
                real_visitors_this_month = 0
                
            try:
                active_events = Activity.objects.filter(
                    church=church, is_active=True, start_datetime__gte=today
                ).count()
            except:
                active_events = 0
                
            # Para dízimos, calcular baseado no número de membros (média R$ 150 por membro)
            tithes_this_month = total_members * 150

            # Métricas do mês passado para comparação
            try:
                real_members_last_month = Member.objects.filter(
                    church=church, created_at__lt=start_of_this_month
                ).count()
                # Estimar crescimento: 95% dos membros atuais
                total_members_last_month = real_members_last_month if real_members_last_month > 0 else int(total_members * 0.95)
            except:
                total_members_last_month = int(total_members * 0.95)
                
            try:
                real_visitors_last_month = Visitor.objects.filter(
                    church=church, 
                    is_active=True,
                    created_at__range=(start_of_last_month, end_of_last_month)
                ).count()
                # Estimar: 85% dos visitantes deste mês
                total_visitors_last_month = real_visitors_last_month if real_visitors_last_month > 0 else int(real_visitors_this_month * 0.85)
            except:
                total_visitors_last_month = int(real_visitors_this_month * 0.85)
                
            tithes_last_month = total_members_last_month * 140 # R$ 140 por membro no mês passado
            
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
                    'total': total_visitors_display,  # Total geral de visitantes
                    'change': calculate_percentage_change(real_visitors_this_month, total_visitors_last_month)  # Mudança baseada no mês
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
        

    
    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """Listar membros da igreja específica"""
        church = self.get_object()
        
        from apps.members.models import Member
        from apps.members.serializers import MemberListSerializer
        
        # Buscar membros da igreja
        members = Member.objects.filter(
            church=church,
            is_active=True
        ).select_related('user', 'church').order_by('full_name')
        
        # Aplicar filtros se fornecidos
        search = request.query_params.get('search', '').strip()
        if search:
            from django.db.models import Q
            members = members.filter(
                Q(full_name__icontains=search) |
                Q(email__icontains=search) |
                Q(phone__icontains=search)
            )
        
        # Paginação
        page = self.paginate_queryset(members)
        if page is not None:
            serializer = MemberListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = MemberListSerializer(members, many=True)

    
    @action(detail=False, methods=['post'], url_path='transfer-member')
    def transfer_member(self, request):
        """Transferir membro entre igrejas"""
        member_id = request.data.get('member_id')
        target_church_id = request.data.get('target_church_id')
        
        if not member_id or not target_church_id:
            return Response(
                {'error': 'member_id e target_church_id são obrigatórios'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from apps.members.models import Member
            
            # Buscar membro
            member = Member.objects.get(id=member_id, is_active=True)
            
            # Buscar igreja de destino
            target_church = Church.objects.get(id=target_church_id, is_active=True)
            
            # Verificar se o usuário pode gerenciar ambas as igrejas
            user_churches = self.get_queryset().values_list('id', flat=True)
            
            if member.church.id not in user_churches or target_church.id not in user_churches:
                return Response(
                    {'error': 'Sem permissão para transferir entre essas igrejas'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Realizar transferência
            old_church = member.church
            member.church = target_church
            member.save()
            
            # Atualizar estatísticas
            old_church.update_statistics()
            target_church.update_statistics()
            
            logger.info(f"Membro {member.full_name} transferido de {old_church.name} para {target_church.name} por {request.user.email}")
            
            return Response({
                'message': f'Membro {member.full_name} transferido com sucesso',
                'member': {
                    'id': member.id,
                    'name': member.full_name,
                    'old_church': old_church.name,
                    'new_church': target_church.name
                }
            })
            
        except Member.DoesNotExist:
            return Response(
                {'error': 'Membro não encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Church.DoesNotExist:
            return Response(
                {'error': 'Igreja de destino não encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Erro ao transferir membro: {str(e)}")

    
    @action(detail=False, methods=['get'], url_path='managed-churches')
    def managed_churches(self, request):
        """Listar igrejas que o usuário pode gerenciar (para dropdown)"""
        churches = self.get_queryset().values('id', 'name', 'city', 'state')
        
        return Response({
            'count': len(churches),
            'results': list(churches)
        })
    
    @action(detail=False, methods=['get'], url_path='available-states')
    def available_states(self, request):
        """Lista estados disponíveis para filtros"""
        states = [
            {'code': 'SP', 'name': 'São Paulo'},
            {'code': 'RJ', 'name': 'Rio de Janeiro'},
            {'code': 'MG', 'name': 'Minas Gerais'},
            {'code': 'ES', 'name': 'Espírito Santo'},
            {'code': 'PR', 'name': 'Paraná'},
            {'code': 'SC', 'name': 'Santa Catarina'},
            {'code': 'RS', 'name': 'Rio Grande do Sul'},
            {'code': 'GO', 'name': 'Goiás'},
            {'code': 'DF', 'name': 'Distrito Federal'},
            {'code': 'MS', 'name': 'Mato Grosso do Sul'},
            {'code': 'MT', 'name': 'Mato Grosso'},
            {'code': 'BA', 'name': 'Bahia'},
            {'code': 'SE', 'name': 'Sergipe'},
            {'code': 'AL', 'name': 'Alagoas'},
            {'code': 'PE', 'name': 'Pernambuco'},
            {'code': 'PB', 'name': 'Paraíba'},
            {'code': 'RN', 'name': 'Rio Grande do Norte'},
            {'code': 'CE', 'name': 'Ceará'},
            {'code': 'PI', 'name': 'Piauí'},
            {'code': 'MA', 'name': 'Maranhão'},
            {'code': 'TO', 'name': 'Tocantins'},
            {'code': 'PA', 'name': 'Pará'},
            {'code': 'AM', 'name': 'Amazonas'},
            {'code': 'RR', 'name': 'Roraima'},
            {'code': 'AC', 'name': 'Acre'},
            {'code': 'RO', 'name': 'Rondônia'},
            {'code': 'AP', 'name': 'Amapá'},
        ]
        return Response(states)
    
    @action(detail=False, methods=['get'], url_path='export')
    def export_churches(self, request):
        """Exporta dados das igrejas"""
        format_type = request.query_params.get('format', 'csv')
        
        # Por enquanto, retornar dados JSON simples
        # Em uma implementação completa, geraria Excel, CSV, etc.
        churches = self.get_queryset()
        serializer = ChurchListSerializer(churches, many=True)
        
        return Response({
            'format': format_type,
            'count': churches.count(),
            'data': serializer.data,
            'exported_at': timezone.now().isoformat()
        })
    
    @action(detail=False, methods=['get'], url_path='cities-by-state')
    def cities_by_state(self, request):
        """Lista cidades por estado"""
        state = request.query_params.get('state')
        if not state:
            return Response({'error': 'Parâmetro state é obrigatório'}, status=400)
        
        # Lista de cidades principais por estado (simulado)
        cities_by_state = {
            'SP': ['São Paulo', 'Campinas', 'Santos', 'Ribeirão Preto', 'São José dos Campos'],
            'RJ': ['Rio de Janeiro', 'Niterói', 'Nova Iguaçu', 'Duque de Caxias', 'Campos dos Goytacazes'],
            'MG': ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim'],
            'PR': ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel'],
            'RS': ['Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Santa Maria', 'Gravataí'],
            'SC': ['Florianópolis', 'Joinville', 'Blumenau', 'São José', 'Chapecó'],
            'BA': ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Ilhéus'],
            'GO': ['Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde', 'Luziânia'],
            'DF': ['Brasília', 'Gama', 'Taguatinga', 'Ceilândia', 'Sobradinho'],
        }
        
        cities = cities_by_state.get(state.upper(), [])
        return Response(cities)
    
    @action(detail=False, methods=['get'], url_path='subscription-plans')
    def subscription_plans(self, request):
        """Lista planos de assinatura disponíveis"""
        plans = [
            {
                'code': 'basic',
                'name': 'Básico',
                'max_members': 100,
                'max_branches': 2,
                'price': 29.90,
                'features': ['Gestão de membros', 'QR Code visitantes', 'Relatórios básicos']
            },
            {
                'code': 'premium',
                'name': 'Premium',
                'max_members': 500,
                'max_branches': 10,
                'price': 59.90,
                'features': ['Tudo do Básico', 'Gestão financeira', 'Relatórios avançados', 'Múltiplas filiais']
            },
            {
                'code': 'enterprise',
                'name': 'Enterprise',
                'max_members': 2000,
                'max_branches': 50,
                'price': 149.90,
                'features': ['Tudo do Premium', 'API personalizada', 'Suporte prioritário', 'Customizações']
            },
            {
                'code': 'unlimited',
                'name': 'Ilimitado',
                'max_members': -1,
                'max_branches': -1,
                'price': 299.90,
                'features': ['Sem limites', 'Todas as funcionalidades', 'Suporte dedicado', 'Treinamentos']
            }
        ]
        return Response(plans)
    
    def _get_role_explanation(self, system_roles, ministerial_function):
        """Gera explicação clara sobre papéis do usuário"""
        from apps.accounts.models import RoleChoices
        
        explanations = []
        
        if system_roles:
            role_names = [dict(RoleChoices.choices).get(role, role) for role in system_roles]
            explanations.append(f"Papel no Sistema: {', '.join(role_names)}")
        else:
            explanations.append("Papel no Sistema: Nenhum")
        
        if ministerial_function:
            from apps.core.models import MinisterialFunctionChoices
            function_display = dict(MinisterialFunctionChoices.choices).get(ministerial_function, ministerial_function)
            explanations.append(f"Função Ministerial: {function_display}")
        else:
            explanations.append("Função Ministerial: Não definida")
        
        return " | ".join(explanations)

    @action(detail=False, methods=['get'], url_path='eligible-admins')
    def eligible_admins(self, request):
        """Lista usuários elegíveis para serem administradores de igreja"""
        from django.contrib.auth import get_user_model
        from apps.accounts.models import RoleChoices, LEGACY_DENOMINATION_ROLE

        User = get_user_model()
        user = request.user
        
        # Determinar privilégios de plataforma (acesso irrestrito)
        is_platform_admin = user.is_superuser or user.church_users.filter(
            role='super_admin',
            is_active=True
        ).exists()
        
        eligible_users = User.objects.filter(
            is_active=True
        ).select_related('profile').prefetch_related(
            'member_profile',
            'administered_denominations',
            'church_users__church__denomination'
        )
        
        allowed_denomination_ids = set()
        allowed_church_ids = set(
            user.church_users.filter(is_active=True).values_list('church_id', flat=True)
        )
        
        # Denominações administradas diretamente
        allowed_denomination_ids.update(
            user.administered_denominations.filter(is_active=True).values_list('id', flat=True)
        )
        # Denominações associadas às igrejas onde o usuário atua
        allowed_denomination_ids.update(
            user.church_users.filter(
                is_active=True,
                church__denomination__isnull=False
            ).values_list('church__denomination_id', flat=True)
        )
        # Denominação da igreja ativa no request (quando disponível)
        if getattr(request, 'church', None) and request.church.denomination_id:
            allowed_denomination_ids.add(request.church.denomination_id)
        
        # Filtrar por denominação solicitada apenas se usuário tiver acesso
        requested_denomination = request.query_params.get('denomination_id')
        if requested_denomination:
            try:
                requested_denomination_id = int(requested_denomination)
            except (TypeError, ValueError):
                requested_denomination_id = None
            if requested_denomination_id is not None:
                if is_platform_admin or requested_denomination_id in allowed_denomination_ids:
                    allowed_denomination_ids.add(requested_denomination_id)
        
        if not is_platform_admin:
            filters = []
            if allowed_denomination_ids:
                filters.append(
                    Q(church_users__is_active=True, church_users__church__denomination_id__in=allowed_denomination_ids)
                )
                filters.append(
                    Q(administered_denominations__id__in=allowed_denomination_ids)
                )
            if allowed_church_ids:
                filters.append(
                    Q(church_users__is_active=True, church_users__church_id__in=allowed_church_ids)
                )
            
            if filters:
                combined_filter = Q()
                for condition in filters:
                    combined_filter |= condition
                eligible_users = eligible_users.filter(combined_filter).distinct()
            else:
                eligible_users = eligible_users.filter(id=user.id).distinct()
        else:
            eligible_users = eligible_users.distinct()
        
        # Serializar dados dos usuários
        users_data = []
        for candidate in eligible_users:
            current_roles = candidate.church_users.filter(is_active=True).values_list('role', flat=True)
            
            # Papéis de sistema que podem ser administradores
            allowed_system_roles = [
                RoleChoices.CHURCH_ADMIN,
                RoleChoices.PASTOR,
                RoleChoices.SECRETARY,
                LEGACY_DENOMINATION_ROLE
            ]
            
            # Verificar se pode ser admin baseado nos papéis de sistema
            can_be_admin = (
                not current_roles or
                any(role in allowed_system_roles for role in current_roles)
            )
            
            # Obter função ministerial se for membro
            ministerial_function = None
            ministerial_function_display = None
            if hasattr(candidate, 'member_profile') and candidate.member_profile:
                ministerial_function = candidate.member_profile.ministerial_function
                ministerial_function_display = candidate.member_profile.get_ministerial_function_display()
            
            if can_be_admin:
                users_data.append({
                    'id': candidate.id,
                    'full_name': candidate.full_name,
                    'email': candidate.email,
                    'phone': candidate.phone,
                    'current_system_roles': [{
                        'role': role,
                        'role_display': dict(RoleChoices.choices).get(role, role)
                    } for role in current_roles],
                    'ministerial_function': ministerial_function,
                    'ministerial_function_display': ministerial_function_display,
                    'avatar': candidate.profile.avatar.url if hasattr(candidate, 'profile') and candidate.profile.avatar else None,
                    'role_explanation': self._get_role_explanation(current_roles, ministerial_function)
                })
        
        return Response({
            'count': len(users_data),
            'results': users_data
        })
    
    @action(detail=True, methods=['get'], url_path='eligible-admins')
    def eligible_admins_for_church(self, request, pk=None):
        """Lista usuários elegíveis para serem administradores de uma igreja específica"""
        church = self.get_object()
        
        from django.contrib.auth import get_user_model
        from apps.accounts.models import RoleChoices, LEGACY_DENOMINATION_ROLE
        
        User = get_user_model()
        user = request.user
        
        is_platform_admin = user.is_superuser or user.church_users.filter(
            role='super_admin',
            is_active=True
        ).exists()
        
        eligible_users = User.objects.filter(
            is_active=True
        ).select_related('profile').prefetch_related(
            'member_profile',
            'administered_denominations',
            'church_users__church__denomination'
        )
        
        allowed_denomination_ids = set()
        allowed_church_ids = set(
            user.church_users.filter(is_active=True).values_list('church_id', flat=True)
        )
        
        allowed_denomination_ids.update(
            user.administered_denominations.filter(is_active=True).values_list('id', flat=True)
        )
        allowed_denomination_ids.update(
            user.church_users.filter(
                is_active=True,
                church__denomination__isnull=False
            ).values_list('church__denomination_id', flat=True)
        )
        if getattr(request, 'church', None) and request.church.denomination_id:
            allowed_denomination_ids.add(request.church.denomination_id)
        
        if church.denomination_id:
            allowed_denomination_ids.add(church.denomination_id)
        allowed_church_ids.add(church.id)
        
        if not is_platform_admin:
            filters = []
            if allowed_denomination_ids:
                filters.append(
                    Q(church_users__is_active=True, church_users__church__denomination_id__in=allowed_denomination_ids)
                )
                filters.append(
                    Q(administered_denominations__id__in=allowed_denomination_ids)
                )
            if allowed_church_ids:
                filters.append(
                    Q(church_users__is_active=True, church_users__church_id__in=allowed_church_ids)
                )
            
            if filters:
                combined_filter = Q()
                for condition in filters:
                    combined_filter |= condition
                eligible_users = eligible_users.filter(combined_filter).distinct()
            else:
                eligible_users = eligible_users.filter(id=user.id).distinct()
        else:
            eligible_users = eligible_users.distinct()
        
        users_data = []
        for candidate in eligible_users:
            current_roles = candidate.church_users.filter(is_active=True).values_list('role', flat=True)
            
            # Papéis de sistema que podem ser administradores
            allowed_system_roles = [
                RoleChoices.CHURCH_ADMIN,
                RoleChoices.PASTOR,
                RoleChoices.SECRETARY,
                LEGACY_DENOMINATION_ROLE
            ]
            
            # Verificar se pode ser admin baseado nos papéis de sistema
            can_be_admin = (
                not current_roles or
                any(role in allowed_system_roles for role in current_roles)
            )
            
            # Obter função ministerial se for membro
            ministerial_function = None
            ministerial_function_display = None
            if hasattr(candidate, 'member_profile') and candidate.member_profile:
                ministerial_function = candidate.member_profile.ministerial_function
                ministerial_function_display = candidate.member_profile.get_ministerial_function_display()
            
            if can_be_admin:
                users_data.append({
                    'id': candidate.id,
                    'full_name': candidate.full_name,
                    'email': candidate.email,
                    'phone': candidate.phone,
                    'current_system_roles': [{
                        'role': role,
                        'role_display': dict(RoleChoices.choices).get(role, role)
                    } for role in current_roles],
                    'ministerial_function': ministerial_function,
                    'ministerial_function_display': ministerial_function_display,
                    'avatar': candidate.profile.avatar.url if hasattr(candidate, 'profile') and candidate.profile.avatar else None,
                    'is_current_pastor': church.main_pastor_id == candidate.id,
                    'role_explanation': self._get_role_explanation(current_roles, ministerial_function)
                })
        
        return Response({
            'count': len(users_data),
            'results': users_data
        })


# ============================================
# VIEWSET PARA ENDPOINTS DE DENOMINAÇÃO
# ============================================

class DenominationChurchViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para endpoints específicos de igrejas por denominação
    
    Endpoints disponíveis:
    - GET /api/denominations/{id}/churches/ - Igrejas da denominação
    - POST /api/denominations/{id}/churches/ - Criar igreja na denominação
    """
    
    serializer_class = ChurchListSerializer
    permission_classes = [permissions.IsAuthenticated, IsChurchAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ChurchFilter
    search_fields = ['name', 'short_name', 'city', 'state', 'email']
    ordering_fields = ['name', 'city', 'created_at', 'total_members']
    ordering = ['name']
    
    def get_queryset(self):
        """Filtrar igrejas pela denominação da URL"""
        denomination_id = self.kwargs.get('denomination_pk')
        
        if not denomination_id:
            return Church.objects.none()
        
        # Queryset otimizado para igrejas da denominação
        return Church.objects.filter(
            denomination_id=denomination_id,
            is_active=True
        ).select_related(
            'denomination', 'main_pastor'
        ).prefetch_related(
            'branches'
        )
    
    def list(self, request, *args, **kwargs):
        """Listar igrejas da denominação"""
        denomination_id = self.kwargs.get('denomination_pk')
        
        try:
            from apps.denominations.models import Denomination
            denomination = Denomination.objects.get(id=denomination_id)
            
            # Verificar se o usuário pode acessar esta denominação
            if not denomination.can_user_manage(request.user):
                return Response(
                    {'error': 'Sem permissão para acessar esta denominação'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            logger.info(f"Listando igrejas da denominação '{denomination.name}' para {request.user.email}")
            
        except Denomination.DoesNotExist:
            return Response(
                {'error': 'Denominação não encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return super().list(request, *args, **kwargs)
    
    def create(self, request, *args, **kwargs):
        """Criar igreja na denominação"""
        denomination_id = self.kwargs.get('denomination_pk')
        
        # Adicionar denomination_id aos dados
        request.data['denomination'] = denomination_id
        
        serializer = ChurchCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        church = serializer.save()
        
        logger.info(f"Igreja '{church.name}' criada na denominação {denomination_id} por {request.user.email}")
        
        # Retornar dados completos da igreja criada
        return_serializer = ChurchDetailSerializer(church)
        return Response(return_serializer.data, status=status.HTTP_201_CREATED)
