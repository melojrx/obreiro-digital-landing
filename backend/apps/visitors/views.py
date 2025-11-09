"""
Views para o app Visitors
Sistema de QR Code para registro de visitantes
"""

from rest_framework import viewsets, status, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action, api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Count, Q
from django.core.exceptions import ValidationError
from datetime import timedelta

from .models import Visitor
from .serializers import (
    VisitorPublicRegistrationSerializer, VisitorSerializer, VisitorListSerializer,
    VisitorStatsSerializer, VisitorFollowUpSerializer, VisitorConversionSerializer,
    BranchVisitorStatsSerializer, VisitorBulkActionSerializer, QRCodeValidationSerializer
)
from apps.branches.models import Branch
from apps.core.permissions import IsMemberUser
from apps.core.mixins import ChurchScopedQuerysetMixin
from apps.core.throttling import QRCodeAnonRateThrottle, QRCodeUserRateThrottle


# =====================================
# ENDPOINTS PÚBLICOS (Sem autenticação)
# =====================================

@api_view(['GET'])
@permission_classes([AllowAny])
@throttle_classes([QRCodeAnonRateThrottle])
def validate_qr_code(request, qr_code_uuid):
    """
    Valida se o QR Code é válido e retorna informações da filial
    Endpoint público para validação antes do registro
    """
    try:
        branch = Branch.objects.get(
            qr_code_uuid=qr_code_uuid,
            qr_code_active=True,
            allows_visitor_registration=True,
            is_active=True
        )
        
        return Response({
            'valid': True,
            'branch': {
                'id': branch.id,
                'name': branch.name,
                'church_name': branch.church.name,
                'address': branch.full_address,
                'allows_registration': branch.allows_visitor_registration
            }
        })
        
    except Branch.DoesNotExist:
        return Response({
            'valid': False,
            'error': 'QR Code inválido ou inativo'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([QRCodeAnonRateThrottle])
def register_visitor(request, qr_code_uuid):
    """
    Registra um novo visitante via QR Code
    Endpoint público para registro de visitantes
    """
    # Validar QR Code
    try:
        branch = Branch.objects.get(
            qr_code_uuid=qr_code_uuid,
            qr_code_active=True,
            allows_visitor_registration=True,
            is_active=True
        )
    except Branch.DoesNotExist:
        return Response({
            'error': 'QR Code inválido ou inativo'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Serializar dados do visitante
    print(f"\n[DEBUG] Received data: {request.data}")
    print(f"[DEBUG] Data type: {type(request.data)}")
    serializer = VisitorPublicRegistrationSerializer(data=request.data)
    
    if serializer.is_valid():
        # Criar visitante
        visitor = serializer.save(
            church=branch.church,
            branch=branch,
            qr_code_used=qr_code_uuid,
            registration_source='qr_code',
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        # Incrementar contador da filial
        branch.total_visitors_registered += 1
        branch.save(update_fields=['total_visitors_registered'])
        
        return Response({
            'success': True,
            'message': 'Visitante registrado com sucesso!',
            'visitor': {
                'id': visitor.id,
                'full_name': visitor.full_name,
                'branch_name': branch.name,
                'church_name': branch.church.name
            }
        }, status=status.HTTP_201_CREATED)
    
    print(f"[DEBUG] Validation errors: {serializer.errors}")
    return Response({
        'error': 'Dados inválidos',
        'details': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


# =====================================
# ENDPOINTS ADMINISTRATIVOS (Com autenticação)
# =====================================

class VisitorViewSet(ChurchScopedQuerysetMixin, viewsets.ModelViewSet):
    """
    ViewSet para administração de visitantes
    Requer autenticação e permissões de igreja
    """
    
    serializer_class = VisitorSerializer
    permission_classes = [permissions.IsAuthenticated, IsMemberUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['full_name', 'email', 'phone', 'city']
    filterset_fields = [
        'branch', 'gender', 'marital_status', 'first_visit',
        'converted_to_member', 'follow_up_status', 'wants_prayer',
        'wants_growth_group'
    ]
    ordering_fields = ['full_name', 'created_at', 'last_contact_date']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Aplica escopo padronizado (igreja/branch/secretário)."""
        base = Visitor.objects.filter(is_active=True)
        return self.filter_queryset_by_scope(self.request, base, has_branch=True)

    # ==============================
    # Permissões por ação (P1b)
    # ==============================
    def get_permissions(self):
        """Leitura liberada a membros; escrita validada por branch/igreja."""
        if self.action in ['list', 'retrieve', 'stats', 'branch_stats']:
            permission_classes = [permissions.IsAuthenticated, IsMemberUser]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def _user_can_manage_church(self, user, church):
        try:
            for cu in user.church_users.filter(is_active=True):
                if cu.can_manage_church(church):
                    return True
        except Exception:
            pass
        return False

    def _user_can_write_branch(self, user, branch):
        """ChurchAdmin (igreja/denom) ou secretário com branch atribuída."""
        if not branch:
            return False
        if user.is_superuser:
            return True
        if self._user_can_manage_church(user, branch.church):
            return True
        try:
            cu = user.church_users.filter(church=branch.church, is_active=True).first()
            if cu and cu.can_manage_members:
                # Para SECRETARY, se existirem branches atribuídas, precisa estar contida
                managed = getattr(cu, 'managed_branches', None)
                if managed is None or not managed.exists():
                    return True
                return managed.filter(pk=branch.pk).exists()
        except Exception:
            pass
        return False
    
    def get_serializer_class(self):
        """Retorna o serializer apropriado para cada ação"""
        if self.action == 'list':
            return VisitorListSerializer
        return VisitorSerializer
    
    def update(self, request, *args, **kwargs):
        """Override do update para adicionar logging"""
        print(f"[DEBUG] Update visitor - request.data: {request.data}")
        print(f"[DEBUG] Update visitor - kwargs: {kwargs}")
        
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        if not serializer.is_valid():
            print(f"[DEBUG] Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_update(serializer)
        
        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}
            
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        """Override create para adicionar logs e debug"""
        print(f"\n🔍 [DEBUG] Create visitor - request.data: {request.data}")
        print(f"🔍 [DEBUG] Create visitor - user: {request.user.email}")
        
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            print(f"❌ [DEBUG] Validation errors: {serializer.errors}")
            return Response({
                'error': 'Dados inválidos',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Checagem de permissão baseada na branch do payload
        target_branch = serializer.validated_data.get('branch')
        if not self._user_can_write_branch(request.user, target_branch):
            raise PermissionDenied('Sem permissão para cadastrar visitante nesta filial.')

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_create(self, serializer):
        """Associa igreja e filial automaticamente ao criar visitante"""
        branch = serializer.validated_data.get('branch')
        if not branch:
            raise ValidationError({'branch': 'Filial é obrigatória para cadastrar visitante.'})

        serializer.save(
            church=branch.church,
            branch=branch,
            registration_source='admin_manual',
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
            ip_address=self.request.META.get('REMOTE_ADDR')
        )

    def perform_update(self, serializer):
        branch = serializer.validated_data.get('branch', serializer.instance.branch)
        # Checagem de permissão
        if branch and not self._user_can_write_branch(self.request.user, branch):
            raise PermissionDenied('Sem permissão para editar visitante desta filial.')
        if branch and serializer.instance.church_id and branch.church_id != serializer.instance.church_id:
            raise ValidationError({'branch': 'Filial selecionada não pertence à igreja do visitante.'})

        serializer.save(
            church=branch.church if branch else serializer.instance.church,
            branch=branch
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if not self._user_can_write_branch(request.user, instance.branch):
            raise PermissionDenied('Sem permissão para excluir visitante desta filial.')
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Estatísticas gerais de visitantes"""
        queryset = self.get_queryset()
        now = timezone.now()
        last_30_days = now - timedelta(days=30)
        last_7_days = now - timedelta(days=7)
        
        stats = {
            'total': queryset.count(),
            'last_30_days': queryset.filter(created_at__gte=last_30_days).count(),
            'last_7_days': queryset.filter(created_at__gte=last_7_days).count(),
            'pending_conversion': queryset.filter(converted_to_member=False).count(),
            'converted_to_members': queryset.filter(converted_to_member=True).count(),
            'follow_up_needed': queryset.filter(follow_up_status='pending').count(),
            'first_time_visitors': queryset.filter(first_visit=True).count(),
        }
        
        # Calcular taxa de conversão
        total = stats['total']
        converted = stats['converted_to_members']
        stats['conversion_rate'] = round((converted / total) * 100, 2) if total > 0 else 0.0
        
        serializer = VisitorStatsSerializer(data=stats)
        serializer.is_valid()
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_branch(self, request):
        """Estatísticas de visitantes por filial"""
        queryset = self.get_queryset()
        
        # Agrupar por filial
        branch_stats = []
        branches = Branch.objects.filter(church=request.church, is_active=True)
        
        for branch in branches:
            branch_visitors = queryset.filter(branch=branch)
            total = branch_visitors.count()
            converted = branch_visitors.filter(converted_to_member=True).count()
            
            last_30_days = branch_visitors.filter(
                created_at__gte=timezone.now() - timedelta(days=30)
            ).count()
            
            pending_follow_up = branch_visitors.filter(
                follow_up_status='pending'
            ).count()
            
            conversion_rate = round((converted / total) * 100, 2) if total > 0 else 0.0
            
            branch_stats.append({
                'branch_id': branch.id,
                'branch_name': branch.name,
                'total_visitors': total,
                'last_30_days': last_30_days,
                'conversion_rate': conversion_rate,
                'pending_follow_up': pending_follow_up
            })
        
        serializer = BranchVisitorStatsSerializer(branch_stats, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending_follow_up(self, request):
        """Lista visitantes que precisam de follow-up"""
        queryset = self.get_queryset().filter(
            follow_up_status='pending',
            converted_to_member=False
        ).order_by('created_at')
        
        serializer = VisitorFollowUpSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def convert_to_member(self, request, pk=None):
        """Converte visitante em membro com validações melhoradas"""
        import logging
        from django.db import IntegrityError
        from django.core.exceptions import ValidationError
        
        logger = logging.getLogger(__name__)
        visitor = self.get_object()
        
        if visitor.converted_to_member:
            return Response({
                'error': 'Visitante já foi convertido em membro',
                'converted_member_id': visitor.converted_member.id if visitor.converted_member else None
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = VisitorConversionSerializer(visitor, data=request.data, partial=True)
        
        if serializer.is_valid():
            try:
                logger.info(f"Tentando converter visitante {visitor.id} ({visitor.full_name}) em membro")
                
                updated_visitor = serializer.save()
                visitor.refresh_from_db()
                
                return Response({
                    'success': True,
                    'message': f'Visitante {visitor.full_name} convertido em membro com sucesso',
                    'member_id': visitor.converted_member.id if visitor.converted_member else None,
                    'member_name': visitor.converted_member.full_name if visitor.converted_member else None
                })
                
            except ValueError as e:
                # Erros de validação de negócio
                logger.warning(f"Erro de validação ao converter visitante {visitor.id}: {e}")
                return Response({
                    'error': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
                
            except IntegrityError as e:
                # Erros de integridade do banco
                logger.error(f"IntegrityError ao converter visitante {visitor.id}: {e}")
                error_msg = str(e).lower()
                if 'cpf' in error_msg and 'unique' in error_msg:
                    return Response({
                        'error': 'CPF já cadastrado para outro membro. Verifique os dados do visitante.'
                    }, status=status.HTTP_400_BAD_REQUEST)
                elif 'unique' in error_msg:
                    return Response({
                        'error': 'Dados duplicados encontrados. Verifique CPF e outras informações únicas.'
                    }, status=status.HTTP_400_BAD_REQUEST)
                else:
                    return Response({
                        'error': 'Erro de integridade nos dados. Contate o suporte.'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                    
            except ValidationError as e:
                # Erros de validação dos campos
                logger.error(f"ValidationError ao converter visitante {visitor.id}: {e}")
                return Response({
                    'error': f'Dados inválidos: {str(e)}'
                }, status=status.HTTP_400_BAD_REQUEST)
                
            except Exception as e:
                # Log completo do erro para debug
                logger.error(f"Erro inesperado ao converter visitante {visitor.id}: {e}", exc_info=True)
                return Response({
                    'error': 'Erro interno do servidor. Contate o suporte técnico.',
                    'details': 'Verifique se todos os dados obrigatórios estão preenchidos corretamente.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'error': 'Dados inválidos fornecidos',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['patch'])
    def update_follow_up(self, request, pk=None):
        """Atualiza status de follow-up de um visitante"""
        visitor = self.get_object()
        
        follow_up_status = request.data.get('follow_up_status')
        conversion_notes = request.data.get('conversion_notes', '')
        
        if follow_up_status:
            visitor.follow_up_status = follow_up_status
            visitor.last_contact_date = timezone.now()
            visitor.contact_attempts += 1
            
            if conversion_notes:
                visitor.conversion_notes = conversion_notes
            
            visitor.save()
            
            serializer = VisitorFollowUpSerializer(visitor)
            return Response(serializer.data)
        
        return Response({
            'error': 'Status de follow-up é obrigatório'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def bulk_action(self, request):
        """Executa ações em lote com visitantes"""
        serializer = VisitorBulkActionSerializer(data=request.data)
        
        if serializer.is_valid():
            visitor_ids = serializer.validated_data['visitor_ids']
            action = serializer.validated_data['action']
            
            visitors = self.get_queryset().filter(id__in=visitor_ids)
            
            if action == 'update_status':
                follow_up_status = serializer.validated_data.get('follow_up_status')
                if follow_up_status:
                    visitors.update(
                        follow_up_status=follow_up_status,
                        last_contact_date=timezone.now()
                    )
                    return Response({
                        'success': True,
                        'message': f'Status atualizado para {visitors.count()} visitantes'
                    })
            
            elif action == 'bulk_follow_up':
                notes = serializer.validated_data.get('notes', '')
                visitors.update(
                    follow_up_status='contacted',
                    last_contact_date=timezone.now(),
                    conversion_notes=notes
                )
                return Response({
                    'success': True,
                    'message': f'Follow-up realizado para {visitors.count()} visitantes'
                })
            
            elif action == 'export':
                # Aqui seria implementada a exportação
                return Response({
                    'success': True,
                    'message': f'Exportação de {visitors.count()} visitantes iniciada'
                })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# =====================================
# ENDPOINTS ESPECÍFICOS
# =====================================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsMemberUser])
def recent_visitors(request):
    """Lista dos visitantes mais recentes"""
    visitors = Visitor.objects.filter(
        is_active=True
    ).order_by('-created_at')[:10]
    
    serializer = VisitorListSerializer(visitors, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsMemberUser])
def dashboard_stats(request):
    """
    Estatísticas para dashboard - Multi-tenant scoped
    Retorna apenas visitantes da igreja do usuário logado
    """
    from apps.accounts.models import ChurchUser
    
    # Obter igreja do usuário logado (isolamento multi-tenant)
    church = ChurchUser.objects.get_active_church_for_user(request.user)
    
    if not church:
        return Response({
            'error': 'Usuário não está vinculado a nenhuma igreja ativa'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Aplicar filtro por igreja (multi-tenant)
    queryset = Visitor.objects.filter(is_active=True, church=church)
    
    # Aplicar filtro por branch se usuário for Secretary (permissão granular)
    user_church_user = request.user.church_users.filter(church=church, is_active=True).first()
    if user_church_user and user_church_user.role_effective == 'secretary':
        # Secretary vê apenas visitantes de sua branch
        if user_church_user.active_branch:
            queryset = queryset.filter(branch=user_church_user.active_branch)
    
    now = timezone.now()
    
    # Estatísticas básicas
    total_visitors = queryset.count()
    this_month = queryset.filter(created_at__month=now.month, created_at__year=now.year).count()
    pending_follow_up = queryset.filter(follow_up_status='pending').count()
    converted = queryset.filter(converted_to_member=True).count()
    
    # Visitantes por mês (últimos 6 meses)
    monthly_data = []
    for i in range(6):
        month_date = now - timedelta(days=30 * i)
        month_visitors = queryset.filter(
            created_at__month=month_date.month,
            created_at__year=month_date.year
        ).count()
        monthly_data.append({
            'month': month_date.strftime('%Y-%m'),
            'visitors': month_visitors
        })
    
    return Response({
        'total_visitors': total_visitors,
        'this_month': this_month,
        'pending_follow_up': pending_follow_up,
        'converted_to_members': converted,
        'conversion_rate': round((converted / total_visitors) * 100, 2) if total_visitors > 0 else 0,
        'monthly_data': monthly_data[::-1]  # Ordem cronológica
    })
