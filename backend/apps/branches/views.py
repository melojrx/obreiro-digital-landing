"""
Views para o app Branches
Sistema de gestão de filiais com QR codes
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Branch
from .serializers import BranchSerializer, BranchQRCodeSerializer
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
        """Filtra filiais pela igreja do usuário"""
        user = self.request.user
        
        if user.is_superuser:
            return Branch.objects.all()
        
        # Filtrar por igreja do usuário
        return Branch.objects.filter(is_active=True)
    
    def get_serializer_class(self):
        """Retorna serializer específico para QR Code em algumas actions"""
        if self.action in ['qr_codes', 'regenerate_qr_code', 'toggle_qr_code']:
            return BranchQRCodeSerializer
        return super().get_serializer_class()
    
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
