"""
Views para o app Members
Implementa APIs para gestão de membros
"""

from rest_framework import viewsets, status, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.parsers import MultiPartParser
from django.db.models import Count, Q
from datetime import datetime, date
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import HttpResponse
import csv

from .models import Member, MembershipStatusLog, MinisterialFunctionHistory, MembershipStatus
from apps.core.mixins import ChurchScopedQuerysetMixin
from .serializers import (
    MemberSerializer, MemberListSerializer, MemberCreateSerializer, 
    MemberUpdateSerializer, MemberSummarySerializer,
    MembershipStatusLogSerializer, MemberStatusChangeSerializer,
    MinisterialFunctionHistorySerializer, MembershipStatusSerializer,
    MemberBulkUploadSerializer
)
from .services import MemberBulkImportService
import logging

# Logger do app Members (usado para auditoria e tracking de ações sensíveis)
logger = logging.getLogger('apps.members')


class MemberViewSet(ChurchScopedQuerysetMixin, viewsets.ModelViewSet):
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
        """QuerySet otimizado + escopo por igreja/branch/secretário."""
        queryset = Member.objects.select_related('church', 'branch', 'spouse', 'responsible')
        scoped = self.filter_queryset_by_scope(self.request, queryset, has_branch=True)
        if self.action != 'all':
            scoped = scoped.filter(is_active=True)
        return scoped

    # ==============================
    # Permissões por ação (P1b)
    # ==============================
    def get_permissions(self):
        # Leitura para autenticados; escrita checada por branch
        if self.action in ['list', 'retrieve', 'dashboard', 'my_membership_status', 'all']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [p() for p in permission_classes]

    def _user_can_manage_church(self, user, church):
        try:
            for cu in user.church_users.filter(is_active=True):
                if cu.can_manage_church(church):
                    return True
        except Exception:
            pass
        return False

    def _user_can_write_branch(self, user, branch):
        if not branch:
            return False
        if user.is_superuser:
            return True
        if self._user_can_manage_church(user, branch.church):
            return True
        try:
            cu = user.church_users.filter(church=branch.church, is_active=True).first()
            if cu and cu.can_manage_members:
                managed = getattr(cu, 'managed_branches', None)
                if managed is None or not managed.exists():
                    return True
                return managed.filter(pk=branch.pk).exists()
        except Exception:
            pass
        return False
    
    def perform_create(self, serializer):
        """Ao criar, associar à igreja ativa do usuário"""
        from apps.accounts.models import ChurchUser
        from django.core.exceptions import ValidationError
        
        active_church = ChurchUser.objects.get_active_church_for_user(self.request.user)
        
        if active_church:
            branch = serializer.validated_data.get('branch')
            if branch and branch.church_id != active_church.id:
                raise ValidationError("A filial selecionada não pertence à igreja ativa.")
            if not branch:
                branch = ChurchUser.objects.get_active_branch_for_user(self.request.user)
            # Checagem de permissão de escrita na branch definida
            if branch and not self._user_can_write_branch(self.request.user, branch):
                raise PermissionDenied('Sem permissão para criar membro nesta filial.')
            serializer.save(church=active_church, branch=branch)
        else:
            raise ValidationError("Usuário não tem igreja ativa configurada")

    def perform_update(self, serializer):
        from django.core.exceptions import ValidationError

        branch = serializer.validated_data.get('branch', serializer.instance.branch)
        if branch and not self._user_can_write_branch(self.request.user, branch):
            raise PermissionDenied('Sem permissão para editar membro desta filial.')
        if branch and branch.church_id != serializer.instance.church_id:
            raise ValidationError("A filial selecionada não pertence à mesma igreja do membro.")

        serializer.save(branch=branch)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.branch and not self._user_can_write_branch(request.user, instance.branch):
            raise PermissionDenied('Sem permissão para excluir membro desta filial.')
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'], url_path='transfer-branch')
    def transfer_branch_admin(self, request, pk=None):
        """Transfere a lotação (branch) de um membro para outra filial da mesma igreja."""
        from datetime import date
        from apps.branches.models import Branch
        from apps.members.models import MembershipStatusLog, BranchTransferLog
        
        try:
            target_branch_id = int(request.data.get('branch_id'))
        except (TypeError, ValueError):
            return Response({'error': 'branch_id inválido ou não informado'}, status=status.HTTP_400_BAD_REQUEST)

        member = self.get_object()

        try:
            target_branch = Branch.objects.get(id=target_branch_id, is_active=True)
        except Branch.DoesNotExist:
            return Response({'error': 'Filial alvo não encontrada'}, status=status.HTTP_404_NOT_FOUND)

        if target_branch.church_id != member.church_id:
            return Response({'error': 'Filial alvo deve pertencer à mesma igreja do membro.'}, status=status.HTTP_400_BAD_REQUEST)

        if not self._user_can_write_branch(request.user, target_branch):
            raise PermissionDenied('Sem permissão para transferir para esta filial.')

        # Validar: não permitir transferência para a mesma branch
        if member.branch_id == target_branch_id:
            return Response({'error': 'Membro já está lotado nesta congregação'}, status=status.HTTP_400_BAD_REQUEST)

        old_branch = member.branch
        old_status = member.membership_status
        old_membership_start_date = member.membership_start_date
        transfer_date = date.today()
        reason = request.data.get('reason', '')

        # FASE 1: Criar log de status - saída da branch antiga
        if old_branch:
            MembershipStatusLog.objects.create(
                member=member,
                old_status=old_status,
                new_status='transferred',
                changed_by=request.user,
                reason=f"Transferido de {old_branch.name} para {target_branch.name}"
            )

        # FASE 2: Criar log de transferência entre branches
        if old_branch:
            # Determinar tipo de transferência
            transfer_type = 'same_church' if target_branch.church_id == old_branch.church_id else 'different_church'
            
            BranchTransferLog.objects.create(
                member=member,
                from_branch=old_branch,
                to_branch=target_branch,
                previous_membership_start_date=old_membership_start_date,
                transfer_date=transfer_date,
                transferred_by=request.user,
                reason=reason,
                transfer_type=transfer_type
            )

        # FASE 1: Atualizar datas de membresia
        # membership_start_date = data de entrada na branch atual
        # membership_end_date = None (membro ativo, sem data de saída)
        member.membership_start_date = transfer_date
        member.membership_end_date = None  # Membro ativo na nova branch (sem data de saída)
        
        # FASE 1: Atualizar status para 'active' na nova branch
        member.membership_status = 'active'
        
        # Atualizar branch
        member.branch = target_branch
        
        member.save(update_fields=['branch', 'membership_status', 'membership_start_date', 'membership_end_date', 'updated_at'])

        return Response({
            'message': 'Membro transferido com sucesso para a filial selecionada',
            'member': MemberSerializer(member, context={'request': request}).data,
            'old_branch': {'id': old_branch.id, 'name': old_branch.name} if old_branch else None,
            'new_branch': {'id': target_branch.id, 'name': target_branch.name},
            'transfer_date': transfer_date.isoformat(),
        })
    
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

    @action(detail=False, methods=['get'], url_path='me/status')
    def my_membership_status(self, request):
        """
        Retorna status de membresia do usuário atual na igreja ativa, sem filtrar por filial.
        Útil para validação no frontend (exibir/ocultar conversão e sugerir transferência).
        """
        from apps.accounts.models import ChurchUser

        active_church = ChurchUser.objects.get_active_church_for_user(request.user)
        if not active_church:
            return Response(
                {"error": "Usuário não tem igreja ativa configurada"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Buscar membro pela associação direta ao usuário (não restringir por filial aqui)
        member = (
            Member.objects.select_related('branch')
            .filter(church=active_church, user=request.user, is_active=True)
            .first()
        )

        active_branch = ChurchUser.objects.get_active_branch_for_user(request.user)

        data = {
            "church_id": active_church.id,
            "is_member": bool(member),
            "member_id": member.id if member else None,
            "branch": {
                "id": member.branch.id,
                "name": member.branch.name,
            } if member and member.branch else None,
            "active_branch": {
                "id": active_branch.id,
                "name": active_branch.name,
            } if active_branch else None,
        }

        # Pode sugerir transferência se houver filial ativa diferente da atual
        if member and active_branch and (member.branch_id != active_branch.id):
            data["can_transfer"] = True
            data["target_branch_id"] = active_branch.id
        else:
            data["can_transfer"] = False
            data["target_branch_id"] = None

        return Response(data)

    @action(detail=False, methods=['post'], url_path='me/transfer-branch')
    def transfer_my_branch(self, request):
        """
        Transfere a lotação (branch) do membro do usuário atual para a filial informada.
        Regras:
        - Usuário deve ser membro da igreja ativa
        - A filial alvo deve pertencer à mesma igreja
        - Atualiza também ChurchUser.active_branch para consistência de navegação
        """
        from apps.accounts.models import ChurchUser
        from apps.branches.models import Branch

        try:
            target_branch_id = int(request.data.get('branch_id'))
        except (TypeError, ValueError):
            return Response(
                {"error": "branch_id inválido ou não informado"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        active_church = ChurchUser.objects.get_active_church_for_user(request.user)
        if not active_church:
            return Response(
                {"error": "Usuário não tem igreja ativa configurada"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Buscar membro do usuário
        member = (
            Member.objects.select_related('branch')
            .filter(church=active_church, user=request.user, is_active=True)
            .first()
        )
        if not member:
            return Response(
                {"error": "Usuário não possui registro de membro nesta igreja"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validar filial alvo
        try:
            target_branch = Branch.objects.get(id=target_branch_id, church=active_church, is_active=True)
        except Branch.DoesNotExist:
            return Response(
                {"error": "Filial inválida para a igreja ativa"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if member.branch_id == target_branch.id:
            return Response(
                {"message": "Membro já está lotado nesta filial", "member": MemberSerializer(member).data}
            )

        # Aplicar transferência
        member.branch = target_branch
        member.save(update_fields=['branch', 'updated_at'])

        # Manter ChurchUser.active_branch sincronizado, se existir o vínculo
        try:
            church_user = ChurchUser.objects.filter(user=request.user, church=active_church, is_active=True).first()
            if church_user and getattr(church_user, 'active_branch_id', None) != target_branch.id:
                church_user.active_branch = target_branch
                church_user.save(update_fields=['active_branch', 'updated_at'])
        except Exception:
            pass

        return Response(
            {
                "message": "Transferência de filial realizada com sucesso",
                "member": MemberSerializer(member).data,
            }
        )
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        Endpoint para dados do dashboard de membros
        """
        queryset = self.get_queryset()
        
        # Importar datetime para cálculos
        from datetime import date, timedelta
        from django.db.models import Count
        
        today = date.today()
        
        # Estatísticas básicas
        total_members = queryset.count()
        active_members = queryset.filter(membership_status='active').count()
        inactive_members = queryset.filter(membership_status='inactive').count()
        
        # Novos membros no último mês (baseado em created_at)
        one_month_ago = today - timedelta(days=30)
        new_members_month = queryset.filter(created_at__gte=one_month_ago).count()
        
        # Calcular taxa de crescimento (comparando com mês anterior)
        two_months_ago = today - timedelta(days=60)
        previous_month_members = queryset.filter(
            created_at__gte=two_months_ago,
            created_at__lt=one_month_ago
        ).count()
        
        if previous_month_members > 0:
            growth_rate = ((new_members_month - previous_month_members) / previous_month_members) * 100
        else:
            growth_rate = 100.0 if new_members_month > 0 else 0.0
        
        # Distribuição por status
        status_distribution = list(queryset.values('membership_status').annotate(
            count=Count('id')
        ).order_by('-count'))
        
        # Distribuição por gênero
        gender_distribution = list(queryset.values('gender').annotate(
            count=Count('id')
        ).order_by('-count'))
        
        # Estatísticas por faixa etária
        # Crianças (0-12 anos)
        children_date = today - timedelta(days=12*365)
        children = queryset.filter(birth_date__gte=children_date).count()
        
        # Jovens (13-30 anos)
        youth_min_date = today - timedelta(days=30*365)
        youth_max_date = children_date
        youth = queryset.filter(
            birth_date__gte=youth_min_date,
            birth_date__lt=youth_max_date
        ).count()
        
        # Adultos (31-60 anos)
        adults_min_date = today - timedelta(days=60*365)
        adults_max_date = youth_min_date
        adults = queryset.filter(
            birth_date__gte=adults_min_date,
            birth_date__lt=adults_max_date
        ).count()
        
        # Idosos (acima de 60 anos)
        elderly_date = adults_min_date
        elderly = queryset.filter(birth_date__lt=elderly_date).count()
        
        data = {
            'total_members': total_members,
            'active_members': active_members,
            'inactive_members': inactive_members,
            'new_members_month': new_members_month,
            'growth_rate': round(growth_rate, 2),
            'status_distribution': status_distribution,
            'gender_distribution': gender_distribution,
            'age_distribution': {
                'children': children,
                'youth': youth,
                'adults': adults,
                'elderly': elderly
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

    @action(
        detail=False,
        methods=['post'],
        url_path='bulk_upload',
        parser_classes=[MultiPartParser],
    )
    def bulk_upload(self, request):
        """
        Upload em lote de membros via arquivo CSV.
        Retorna relatório com sucessos, erros e duplicados ignorados.
        """
        serializer = MemberBulkUploadSerializer(
            data=request.data,
            context={'request': request, 'view': self}
        )
        serializer.is_valid(raise_exception=True)

        branch = serializer.validated_data.get('branch')
        skip_duplicates = serializer.validated_data.get('skip_duplicates', True)
        uploaded_file = serializer.validated_data['file']

        church = serializer.validated_data.get('church') or getattr(request, 'church', None)
        if not church:
            from apps.accounts.models import ChurchUser
            church = ChurchUser.objects.get_active_church_for_user(request.user)

        if not church:
            raise DjangoValidationError("Usuário não possui igreja ativa configurada.")

        service = MemberBulkImportService(
            request=request,
            church=church,
            user=request.user,
            branch=branch,
        )
        report = service.process_csv(
            uploaded_file=uploaded_file,
            skip_duplicates=skip_duplicates
        )
        return Response(report, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """
        Exportar membros em formato CSV com separador ';'
        Respeita os filtros aplicados na listagem (busca, status, função ministerial, branch)
        """
        # Obter queryset com filtros aplicados (incluindo escopo multi-tenant)
        queryset = self.filter_queryset(self.get_queryset())
        
        # Aplicar filtros adicionais
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(full_name__icontains=search) |
                Q(email__icontains=search) |
                Q(cpf__icontains=search) |
                Q(phone__icontains=search) |
                Q(phone_secondary__icontains=search)
            )
        
        membership_status = request.query_params.get('status')
        if membership_status:
            queryset = queryset.filter(membership_status=membership_status)
        
        ministerial_function = request.query_params.get('ministerial_function')
        if ministerial_function:
            queryset = queryset.filter(ministerial_function=ministerial_function)
        
        # Ordenar por nome
        queryset = queryset.select_related('church', 'branch').order_by('full_name')
        
        # Preparar resposta CSV
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        church_name = getattr(request.church, 'short_name', 'igreja').replace(' ', '_')
        filename = f'membros_{church_name}_{timestamp}.csv'
        
        response = HttpResponse(content_type='text/csv; charset=utf-8-sig')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        # Criar writer CSV com separador ";"
        writer = csv.writer(response, delimiter=';', quoting=csv.QUOTE_ALL)
        
        # Cabeçalho do CSV
        header = [
            'ID',
            'Nome Completo',
            'CPF',
            'RG',
            'Data Nascimento',
            'Idade',
            'Gênero',
            'Estado Civil',
            'Email',
            'Telefone',
            'Celular',
            'CEP',
            'Endereço',
            'Número',
            'Complemento',
            'Bairro',
            'Cidade',
            'Estado',
            'Igreja',
            'Congregação',
            'Função Ministerial',
            'Status Membresia',
            'Data Membresia',
            'Data Primeira Membresia',
            'Data Cadastro'
        ]
        writer.writerow(header)
        
        # Mapeamento de choices para exibição
        gender_map = {'M': 'Masculino', 'F': 'Feminino', 'O': 'Outro'}
        marital_status_map = {
            'single': 'Solteiro(a)',
            'married': 'Casado(a)',
            'divorced': 'Divorciado(a)',
            'widowed': 'Viúvo(a)'
        }
        membership_status_map = {
            'active': 'Ativo',
            'inactive': 'Inativo',
            'transferred': 'Transferido',
            'disciplined': 'Disciplinado',
            'deceased': 'Falecido'
        }
        ministerial_function_map = {
            'member': 'Membro',
            'deacon': 'Diácono',
            'deaconess': 'Diaconisa',
            'elder': 'Presbítero',
            'evangelist': 'Evangelista',
            'pastor': 'Pastor',
            'missionary': 'Missionário',
            'leader': 'Líder',
            'cooperator': 'Cooperador',
            'auxiliary': 'Auxiliar'
        }
        
        # Escrever dados dos membros
        for member in queryset:
            # Formatar data de nascimento
            birth_date_str = member.birth_date.strftime('%d/%m/%Y') if member.birth_date else ''
            
            # Calcular idade
            age = ''
            if member.birth_date:
                today = date.today()
                age = today.year - member.birth_date.year - (
                    (today.month, today.day) < (member.birth_date.month, member.birth_date.day)
                )
            
            # Formatar datas
            membership_date_str = ''
            if hasattr(member, 'membership_start_date') and member.membership_start_date:
                membership_date_str = member.membership_start_date.strftime('%d/%m/%Y')
            elif hasattr(member, 'membership_date') and member.membership_date:
                membership_date_str = member.membership_date.strftime('%d/%m/%Y')
            
            first_membership_str = ''
            if hasattr(member, 'first_membership_date') and member.first_membership_date:
                first_membership_str = member.first_membership_date.strftime('%d/%m/%Y')
            
            created_at_str = member.created_at.strftime('%d/%m/%Y %H:%M') if member.created_at else ''
            
            row = [
                member.id,
                member.full_name,
                member.cpf or '',
                member.rg or '',
                birth_date_str,
                age,
                gender_map.get(member.gender, member.gender or ''),
                marital_status_map.get(member.marital_status, member.marital_status or ''),
                member.email or '',
                member.phone or '',
                member.phone_secondary or '',
                member.zipcode or '',
                member.address or '',
                member.number or '',
                member.complement or '',
                member.neighborhood or '',
                member.city or '',
                member.state or '',
                member.church.name if member.church else '',
                member.branch.name if member.branch else 'Matriz',
                ministerial_function_map.get(member.ministerial_function, member.ministerial_function or 'Membro'),
                membership_status_map.get(member.membership_status, member.membership_status or ''),
                membership_date_str,
                first_membership_str,
                created_at_str
            ]
            writer.writerow(row)
        
        return response

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
        Buscar todos os membros da igreja que podem ser líderes de ministérios.
        Qualquer membro pode ser líder de ministério.
        """
        from apps.accounts.models import ChurchUser
        
        # Obter igreja ativa do usuário
        active_church = ChurchUser.objects.get_active_church_for_user(request.user)
        if not active_church:
            return Response({'error': 'Usuário não tem igreja ativa configurada'}, status=400)
        
        church = active_church
        
        # Buscar todos os membros ativos da igreja que têm User associado
        members_queryset = self.get_queryset().filter(
            is_active=True,
            church=church,
            user__isnull=False  # Apenas membros com User associado
        )
        
        # Aplicar filtro de busca se fornecido
        search = request.query_params.get('search', '').strip()
        if search:
            members_queryset = members_queryset.filter(
                Q(full_name__icontains=search) |
                Q(email__icontains=search)
            )
        
        # Preparar dados
        data = []
        for member in members_queryset.order_by('full_name'):
            data.append({
                'id': member.user.id,  # User ID para o campo leader do Ministry
                'name': member.full_name,
                'role': member.get_ministerial_function_display() or 'Membro',
                'type': 'member',
                'email': member.email,
                'source': 'Member',
                'member_id': member.id
            })
        
        return Response({
            'count': len(data),
            'results': data
        })
    
    @action(detail=False, methods=['post'], url_path='convert-admin-to-member')
    def convert_admin_to_member(self, request):
        """
        Converte o Church Admin (usuário titular) em Membro da igreja.
        
        FORMULÁRIO SIMPLIFICADO: Apenas 2 campos obrigatórios:
        - ministerial_function (função ministerial)
        - marital_status (estado civil)
        
        Todos os outros dados são puxados automaticamente do CustomUser e UserProfile.
        """
        from apps.accounts.models import ChurchUser, UserProfile
        from apps.core.models import validate_cpf, GenderChoices, phone_validator
        from django.core.exceptions import ValidationError as DjangoValidationError
        from django.db import transaction
        from django.utils.dateparse import parse_date
        import logging
        
        logger = logging.getLogger('apps.members')
        logger.info(f"🔄 convert_admin_to_member iniciado para usuário: {request.user.email}")
        logger.info(f"📦 Dados recebidos: {request.data}")
        
        # Obter igreja ativa do usuário
        active_church = ChurchUser.objects.get_active_church_for_user(request.user)
        if not active_church:
            logger.error(f"❌ Igreja ativa não encontrada para {request.user.email}")
            return Response(
                {'error': 'Usuário não tem igreja ativa configurada'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar se o usuário já é membro
        existing_member = Member.objects.filter(
            user=request.user,
            church=active_church,
            is_active=True
        ).first()
        
        if existing_member:
            return Response(
                {
                    'error': 'Usuário já possui um registro de membro nesta igreja',
                    'member_id': existing_member.id
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar campos obrigatórios do formulário
        ministerial_function = request.data.get('ministerial_function', 'member')
        marital_status = request.data.get('marital_status', 'single')
        
        if not ministerial_function:
            return Response(
                {'error': 'Função ministerial é obrigatória'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not marital_status:
            return Response(
                {'error': 'Estado civil é obrigatório'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Buscar dados do perfil do usuário (criar se não existir)
        user_profile = getattr(request.user, 'profile', None)
        if not user_profile:
            user_profile = UserProfile.objects.create(user=request.user)

        # Atualizar dados obrigatórios do perfil caso fornecidos
        profile_update_fields = set()
        user_update_fields = set()

        phone_input = request.data.get('phone')
        if phone_input:
            phone_digits = ''.join(filter(str.isdigit, str(phone_input)))
            if len(phone_digits) not in (10, 11):
                return Response(
                    {'error': 'Telefone inválido. Informe DDD e número com 10 ou 11 dígitos.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if len(phone_digits) == 11:
                formatted_phone = f"({phone_digits[:2]}) {phone_digits[2:7]}-{phone_digits[7:]}"
            else:
                formatted_phone = f"({phone_digits[:2]}) {phone_digits[2:6]}-{phone_digits[6:]}"
            try:
                phone_validator(formatted_phone)
            except DjangoValidationError as exc:
                return Response(
                    {'error': 'Telefone inválido.', 'details': exc.messages},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if formatted_phone != request.user.phone:
                request.user.phone = formatted_phone
                user_update_fields.add('phone')

        formatted_cpf = None  # garantir definição para evitar UnboundLocalError
        cpf_input = request.data.get('cpf')
        if cpf_input:
            cpf_digits = ''.join(filter(str.isdigit, str(cpf_input)))
            try:
                validate_cpf(cpf_digits)
            except DjangoValidationError as exc:
                return Response(
                    {'error': 'CPF inválido.', 'details': exc.messages},
                    status=status.HTTP_400_BAD_REQUEST
                )
            formatted_cpf = f"{cpf_digits[:3]}.{cpf_digits[3:6]}.{cpf_digits[6:9]}-{cpf_digits[9:]}"
        # Verificar duplicidade de CPF apenas no escopo da denominação (ou igreja se não houver denom)
        duplicate_in_scope = False
        if formatted_cpf:
            if active_church and active_church.denomination_id:
                duplicate_in_scope = Member.objects.filter(
                    cpf=formatted_cpf,
                    is_active=True,
                    church__denomination_id=active_church.denomination_id
                ).exists()
            elif active_church:
                duplicate_in_scope = Member.objects.filter(
                    cpf=formatted_cpf,
                    is_active=True,
                    church=active_church
                ).exists()
        if duplicate_in_scope:
            return Response(
                {'error': 'CPF já cadastrado nesta denominação.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if formatted_cpf and formatted_cpf != getattr(user_profile, 'cpf', None):
            user_profile.cpf = formatted_cpf
            profile_update_fields.add('cpf')

        birth_date_input = request.data.get('birth_date')
        if birth_date_input:
            birth_date = parse_date(str(birth_date_input))
            if not birth_date:
                return Response(
                    {'error': 'Data de nascimento inválida. Use o formato AAAA-MM-DD.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            today = date.today()
            age = today.year - birth_date.year - (
                (today.month, today.day) < (birth_date.month, birth_date.day)
            )
            if age < 18:
                return Response(
                    {'error': 'Usuário deve ter pelo menos 18 anos para tornar-se membro como administrador.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if birth_date != getattr(user_profile, 'birth_date', None):
                user_profile.birth_date = birth_date
                profile_update_fields.add('birth_date')

        gender_input = request.data.get('gender')
        if gender_input:
            gender_value = str(gender_input).upper()
            if gender_value not in GenderChoices.values:
                valid_choices = ', '.join(GenderChoices.values)
                return Response(
                    {'error': f'Gênero inválido. Utilize um dos valores: {valid_choices}.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if gender_value != getattr(user_profile, 'gender', None):
                user_profile.gender = gender_value
                profile_update_fields.add('gender')

        if profile_update_fields:
            profile_update_fields.add('updated_at')
            user_profile.save(update_fields=list(profile_update_fields))

        if user_update_fields:
            request.user.save(update_fields=list(user_update_fields))

        # Verificar se os dados obrigatórios estão preenchidos após possíveis atualizações
        missing_fields = []
        if not request.user.phone:
            missing_fields.append('telefone do perfil')
        if not user_profile or not getattr(user_profile, 'cpf', None):
            missing_fields.append('CPF no perfil')
        if not user_profile or not getattr(user_profile, 'birth_date', None):
            missing_fields.append('data de nascimento no perfil')
        if not user_profile or not getattr(user_profile, 'gender', None):
            missing_fields.append('gênero no perfil')

        if missing_fields:
            logger.warning(
                "❌ Perfil incompleto para conversão de admin: campos faltando %s",
                missing_fields
            )
            return Response(
                {
                    'error': 'Complete seu perfil antes de virar membro.',
                    'missing_fields': missing_fields,
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not request.user.is_profile_complete:
            request.user.is_profile_complete = True
            request.user.save(update_fields=['is_profile_complete'])
        
        # Verificar se já existe um membro com o mesmo CPF ou e-mail (vinculado ou não ao user)
        cpf = user_profile.cpf
        email = request.user.email
        
        existing_by_cpf = Member.objects.filter(
            church=active_church,
            cpf=cpf,
            is_active=True
        ).first()
        
        existing_by_email = Member.objects.filter(
            church=active_church,
            email=email,
            is_active=True
        ).first()
        
        # Se existe membro com mesmo CPF ou e-mail, vincular ao usuário ao invés de criar novo
        if existing_by_cpf or existing_by_email:
            existing = existing_by_cpf or existing_by_email
            
            # Se já está vinculado a este usuário, retornar erro
            if existing.user == request.user:
                return Response(
                    {
                        'error': 'Você já possui um registro de membro nesta igreja',
                        'member_id': existing.id
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Se o membro existe mas não está vinculado a nenhum usuário, vincular
            if not existing.user:
                logger.info(
                    f"🔗 Vinculando membro existente (ID: {existing.id}) ao usuário {request.user.email}"
                )
                existing.user = request.user
                
                # Atualizar dados do membro com os do perfil
                existing.full_name = request.user.full_name
                existing.email = request.user.email
                existing.phone = request.user.phone
                existing.ministerial_function = ministerial_function
                existing.marital_status = marital_status
                existing.save()
                
                return Response(
                    {
                        'message': 'Seu registro de membro foi vinculado à sua conta!',
                        'member': MemberSerializer(existing).data
                    },
                    status=status.HTTP_200_OK
                )
            
            # Se o membro está vinculado a OUTRO usuário, retornar erro
            return Response(
                {
                    'error': f'Já existe um membro cadastrado com {"este CPF" if existing_by_cpf else "este e-mail"} vinculado a outra conta',
                    'member_id': existing.id
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Dados do membro: puxar tudo automaticamente do perfil
        # Determinar filial para vincular o membro (preferir filial ativa do usuário; senão matriz)
        active_branch = ChurchUser.objects.get_active_branch_for_user(request.user)
        if not active_branch:
            try:
                from apps.branches.models import Branch
                active_branch = Branch.objects.filter(church=active_church, is_main=True).first()
            except Exception:
                active_branch = None

        member_data = {
            'church': active_church.id,
            'branch': active_branch.id if active_branch else None,
            'user': request.user.id,
            'full_name': request.user.full_name,
            'email': request.user.email,
            'phone': request.user.phone or '',
            'membership_status': 'active',
            'membership_date': date.today(),
            
            # Campos do formulário (obrigatórios)
            'ministerial_function': ministerial_function,
            'marital_status': marital_status,
            
            # Campos puxados automaticamente do UserProfile
            'cpf': user_profile.cpf,
            'birth_date': user_profile.birth_date,
            'gender': user_profile.gender,
            'address': getattr(user_profile, 'address', '') or '',
            'zipcode': getattr(user_profile, 'zipcode', '') or '',
            
            # Campos opcionais vazios (podem ser editados depois)
            'rg': '',
            'city': '',
            'state': '',
            'notes': 'Membro criado automaticamente via conversão de Church Admin'
        }
        
        # Validar e criar o membro (passar o contexto do request)
        serializer = MemberCreateSerializer(
            data=member_data,
            context={
                'request': request,
                # Evitar bloquear auto-conversão por CPF duplicado em outras igrejas/denominações
                'skip_cpf_uniqueness': True,
            },
        )
        # Auditoria: registrar quando o fluxo pula a validação de unicidade de CPF
        try:
            if serializer.context.get('skip_cpf_uniqueness'):
                logger.warning(
                    "skip_cpf_uniqueness=True usado em MemberViewSet.create - user_id=%s email=%s church_id=%s cpf=%s",
                    getattr(request.user, 'id', None),
                    getattr(request.user, 'email', None),
                    getattr(active_church, 'id', None) if 'active_church' in locals() else None,
                    member_data.get('cpf')
                )
        except Exception:
            # Garantir que problemas de logging não interrompam o fluxo principal
            logger.exception('Falha ao registrar auditoria skip_cpf_uniqueness')
        
        if not serializer.is_valid():
            logger.error(
                "❌ Erro de validação ao converter admin em membro: %s",
                serializer.errors
            )
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                # Garantir que ChurchUser.active_branch esteja setado (se vazio)
                try:
                    church_user = ChurchUser.objects.filter(user=request.user, church=active_church, is_active=True).first()
                    if church_user and not church_user.active_branch:
                        if not active_branch:
                            from apps.branches.models import Branch
                            active_branch = Branch.objects.filter(church=active_church, is_main=True).first()
                        if active_branch:
                            church_user.active_branch = active_branch
                            church_user.save(update_fields=['active_branch'])
                except Exception:
                    pass
                # Criar o registro de membro
                member = serializer.save()
                
                # Log da conversão
                import logging
                logger = logging.getLogger('apps.members')
                logger.info(
                    f"Church Admin convertido em membro: {request.user.email} "
                    f"→ Member ID {member.id} na igreja {active_church.name}"
                )
                
                # Retornar dados do membro criado
                return Response(
                    {
                        'message': 'Você agora é um membro da igreja!',
                        'member': MemberSerializer(member).data
                    },
                    status=status.HTTP_201_CREATED
                )
                
        except Exception as e:
            return Response(
                {'error': f'Erro ao criar registro de membro: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MinisterialFunctionHistoryViewSet(viewsets.ModelViewSet):
    """Gerencia histórico de função ministerial"""
    serializer_class = MinisterialFunctionHistorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['member__full_name', 'function', 'notes']
    filterset_fields = ['member', 'function', 'is_active']
    ordering_fields = ['start_date', 'end_date', 'created_at']
    ordering = ['-start_date']

    def get_queryset(self):
        qs = MinisterialFunctionHistory.objects.select_related('member')
        member_id = self.request.query_params.get('member')
        if member_id:
            qs = qs.filter(member_id=member_id)
        return qs

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['patch'])
    def end_period(self, request, pk=None):
        from datetime import date
        obj = self.get_object()
        end_date_str = request.data.get('end_date')
        if end_date_str:
            try:
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({'error': 'Formato de data inválido. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            end_date = date.today()
        obj.end_date = end_date
        try:
            obj.full_clean()
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        obj.save(update_fields=['end_date', 'updated_at'])
        return Response(self.get_serializer(obj).data)


class MembershipStatusViewSet(viewsets.ModelViewSet):
    """CRUD de status de membresia (ordenações) com escopo por igrejas do usuário."""
    serializer_class = MembershipStatusSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['member', 'status']
    ordering_fields = ['effective_date', 'created_at']
    ordering = ['-effective_date']

    def get_queryset(self):
        qs = MembershipStatus.objects.select_related('member', 'branch')
        user = self.request.user
        if user.is_superuser:
            return qs
        # Escopo pelas igrejas onde o usuário possui vínculo ativo
        from apps.accounts.models import ChurchUser
        church_ids = ChurchUser.objects.filter(user=user, is_active=True).values_list('church_id', flat=True)
        if not church_ids:
            return qs.none()
        qs = qs.filter(member__church_id__in=list(church_ids))

        # Filtro por is_current (end_date nula)
        is_current = self.request.query_params.get('is_current')
        if is_current is not None:
            val = str(is_current).lower() in ('1', 'true', 't', 'yes', 'y')
            if val:
                qs = qs.filter(end_date__isnull=True)
            else:
                qs = qs.filter(end_date__isnull=False)
        return qs

    def perform_create(self, serializer):
        # Serializer já faz fallback de branch para member.branch e valida status atual único
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()
