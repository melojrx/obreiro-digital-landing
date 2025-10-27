"""
Views para o app Branches
Sistema de gestão de filiais com QR codes
"""

from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Branch
from .serializers import BranchSerializer, BranchQRCodeSerializer
from apps.churches.models import Church
from apps.core.permissions import IsMemberUser


class BranchViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de filiais
    Inclui funcionalidades de QR Code
    """
    serializer_class = BranchSerializer
    permission_classes = [IsAuthenticated, IsMemberUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'short_name', 'city', 'state']
    filterset_fields = ['church', 'state', 'city', 'qr_code_active', 'is_active']
    ordering_fields = ['name', 'created_at', 'total_visitors_registered']
    ordering = ['name']
    
    def get_queryset(self):
        """
        Filtra filiais baseado no papel do usuário:
        - CHURCH_ADMIN: vê todas as filiais da denominação (se houver) ou apenas sua igreja
        - BRANCH_MANAGER: vê apenas filiais onde é gestor (através de ChurchUser.branches)
        - PASTOR, SECRETARY, LEADER, MEMBER: vêem filiais de sua igreja
        """
        user = self.request.user
        
        print(f"\n🔍 === GET QUERYSET BRANCHES ===")
        print(f"📧 User: {user.email}")
        print(f"🔐 Is Superuser: {user.is_superuser}")
        
        if user.is_superuser:
            return Branch.objects.all()
        
        # Buscar todas as relações do usuário com igrejas
        try:
            from apps.accounts.models import ChurchUser, RoleChoices
            church_users = ChurchUser.objects.filter(user=user, is_active=True)
            
            print(f"👥 Total ChurchUsers: {church_users.count()}")
            for cu in church_users:
                print(f"  - Church: {cu.church.name if cu.church else 'None'}, Role: {cu.role}")
            
            if not church_users.exists():
                print("❌ Nenhum ChurchUser encontrado")
                return Branch.objects.none()
            
            # Coletar todas as filiais acessíveis
            accessible_branch_ids = set()
            accessible_church_ids = set()
            
            for church_user in church_users:
                if not church_user.church:
                    continue
                
                print(f"\n🏛️ Processando ChurchUser: Role={church_user.role}, Church={church_user.church.name}")
                
                # CHURCH_ADMIN: vê filiais de todas as igrejas da denominação
                if church_user.role == RoleChoices.CHURCH_ADMIN:
                    print(f"  ✅ É CHURCH_ADMIN")
                    if church_user.church.denomination:
                        from apps.churches.models import Church
                        denomination_churches = Church.objects.filter(
                            denomination=church_user.church.denomination,
                            is_active=True
                        )
                        church_ids = list(denomination_churches.values_list('id', flat=True))
                        accessible_church_ids.update(church_ids)
                        print(f"  📋 Denominação encontrada, churches: {church_ids}")
                    else:
                        accessible_church_ids.add(church_user.church.id)
                        print(f"  📋 Sem denominação, church_id: {church_user.church.id}")
                
                # BRANCH_MANAGER: vê apenas filiais específicas atribuídas
                elif church_user.role == 'branch_manager':  # RoleChoices não tem BRANCH_MANAGER ainda
                    print(f"  ✅ É BRANCH_MANAGER")
                    if hasattr(church_user, 'branches') and church_user.branches.exists():
                        # Se tem filiais específicas atribuídas
                        branch_ids = list(church_user.branches.filter(is_active=True).values_list('id', flat=True))
                        accessible_branch_ids.update(branch_ids)
                        print(f"  📋 Branches atribuídas: {branch_ids}")
                    else:
                        # Se não tem filiais atribuídas, vê filiais da igreja
                        accessible_church_ids.add(church_user.church.id)
                        print(f"  📋 Sem branches atribuídas, usando church_id: {church_user.church.id}")
                
                # Outros papéis: vêem filiais de sua igreja
                else:
                    accessible_church_ids.add(church_user.church.id)
                    print(f"  📋 Outro papel, usando church_id: {church_user.church.id}")
            
            print(f"\n🎯 Resumo de acessos:")
            print(f"  - accessible_branch_ids: {accessible_branch_ids}")
            print(f"  - accessible_church_ids: {accessible_church_ids}")
            
            # Construir queryset final
            queryset = Branch.objects.filter(is_active=True)
            print(f"  - Total branches ativas no banco: {queryset.count()}")
            
            # Filtrar por filiais específicas OU por igrejas
            if accessible_branch_ids:
                queryset = queryset.filter(
                    Q(id__in=accessible_branch_ids) | 
                    Q(church_id__in=accessible_church_ids)
                )
            elif accessible_church_ids:
                queryset = queryset.filter(church_id__in=accessible_church_ids)
            else:
                print("❌ Nenhum acesso definido")
                return Branch.objects.none()
            
            print(f"  - Branches após filtro: {queryset.count()}")
            for branch in queryset:
                print(f"    * {branch.name} (Church: {branch.church.name})")
            
            return queryset.distinct()
                
        except Exception as e:
            print(f"❌ Erro ao filtrar filiais por papel do usuário: {e}")
            import traceback
            traceback.print_exc()
            return Branch.objects.none()
    
    def get_serializer_class(self):
        """Retorna serializer específico para QR Code em algumas actions"""
        if self.action in ['qr_codes', 'regenerate_qr_code', 'toggle_qr_code']:
            return BranchQRCodeSerializer
        return super().get_serializer_class()

    def perform_create(self, serializer):
        """Ao criar, herdar defaults da Church quando campo não vier informado."""
        branch = serializer.save()
        try:
            # Se não foi explicitamente enviado, herdar da igreja
            if 'allows_visitor_registration' not in serializer.validated_data and branch.church:
                branch.allows_visitor_registration = getattr(branch.church, 'allows_visitor_registration', True)
                branch.save(update_fields=['allows_visitor_registration', 'updated_at'])
        except Exception:
            pass

    @action(detail=False, methods=['get'], url_path='check-create-availability')
    def check_create_availability(self, request):
        """Verifica se a igreja pode criar novas filiais com base no plano vigente"""
        church_id = request.query_params.get('church_id')
        if not church_id:
            return Response(
                {'error': 'Parâmetro church_id é obrigatório'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            church_id = int(church_id)
        except (TypeError, ValueError):
            return Response(
                {'error': 'Parâmetro church_id inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            church = Church.objects.get(id=church_id, is_active=True)
        except Church.DoesNotExist:
            return Response(
                {'error': 'Igreja não encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )

        user = request.user
        has_access = (
            user.is_superuser
            or church.users.filter(user=user, is_active=True).exists()
            or (church.denomination and church.denomination.administrator_id == user.id)
        )

        if not has_access:
            return Response(
                {'error': 'Você não tem permissão para gerenciar esta igreja'},
                status=status.HTTP_403_FORBIDDEN
            )

        return Response({
            'can_create': True,
            'remaining_slots': None,
            'max_allowed': None,
            'current_count': church.branches.filter(is_active=True, is_main=False).count(),
            'subscription_plan': church.subscription_plan,
            'subscription_plan_display': church.get_subscription_plan_display(),
            'message': None,
            'limits_enforced': False,
        })
    
    @action(detail=False, methods=['get'])
    def qr_codes(self, request):
        """Lista todas as filiais com informações de QR Code"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def regenerate_qr_code(self, request, pk=None):
        """Regenera QR code com novo UUID"""
        branch = self.get_object()
        
        try:
            # Usar o método já existente no modelo
            branch.regenerate_qr_code()
            
            serializer = self.get_serializer(branch)
            return Response({
                'message': 'QR code regenerado com sucesso',
                'data': serializer.data
            })
        except Exception as e:
            return Response(
                {'error': f'Erro ao regenerar QR code: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def toggle_qr_code(self, request, pk=None):
        """Ativa/desativa QR code"""
        branch = self.get_object()
        branch.qr_code_active = not branch.qr_code_active
        branch.save(update_fields=['qr_code_active', 'updated_at'])
        
        status_text = 'ativado' if branch.qr_code_active else 'desativado'
        serializer = self.get_serializer(branch)
        
        return Response({
            'message': f'QR code {status_text} com sucesso',
            'data': serializer.data
        })
    
    @action(detail=True, methods=['get'])
    def visitor_stats(self, request, pk=None):
        """Retorna estatísticas de visitantes da filial"""
        branch = self.get_object()
        stats = branch.get_visitor_stats()
        
        return Response({
            'branch_id': branch.id,
            'branch_name': branch.name,
            'stats': stats
        })
