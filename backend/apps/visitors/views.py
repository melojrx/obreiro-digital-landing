"""
Views para o app Visitors
Gerencia endpoints de visitantes
"""

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Visitor
from .serializers import VisitorSerializer, VisitorCreateSerializer, VisitorSummarySerializer


class VisitorViewSet(viewsets.ModelViewSet):
    """
    ViewSet para visitantes
    """
    
    queryset = Visitor.objects.all()
    serializer_class = VisitorSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['full_name', 'email', 'phone']
    filterset_fields = ['church', 'branch', 'is_active', 'status', 'gender', 'converted_to_member']
    ordering_fields = ['full_name', 'last_visit_date', 'created_at']
    ordering = ['-last_visit_date']
    
    def get_queryset(self):
        """
        Filtra o queryset de visitantes.
        - O TenantManager já filtra por `church`.
        - Adiciona filtro por `branch` se o usuário não for admin/pastor.
        """
        user = self.request.user
        
        if user.is_superuser:
            return Visitor.objects.all_for_church(self.request.church)

        queryset = Visitor.objects.all() 

        church_user = user.church_users.filter(church=self.request.church).first()

        if church_user and church_user.branch and church_user.role not in ['church_admin', 'pastor']:
            queryset = queryset.filter(branch=church_user.branch)
            
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'create':
            return VisitorCreateSerializer
        elif self.action == 'list':
            return VisitorSummarySerializer
        return VisitorSerializer
    
    @action(detail=False, methods=['get'])
    def recent_visitors(self, request):
        """Visitantes recentes"""
        visitors = Visitor.objects.filter(is_active=True).order_by('-last_visit_date')[:10]
        serializer = VisitorSummarySerializer(visitors, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def convert_to_member(self, request, pk=None):
        """Converter visitante em membro"""
        visitor = self.get_object()
        
        # Aqui seria implementada a lógica de conversão
        # Por enquanto, apenas retorna uma mensagem
        return Response({
            'message': f'Visitante {visitor.full_name} marcado para conversão em membro',
            'visitor_id': visitor.id
        })
    
    @action(detail=True, methods=['post'])
    def mark_follow_up(self, request, pk=None):
        """Marcar para follow-up"""
        visitor = self.get_object()
        
        return Response({
            'message': f'Follow-up marcado para {visitor.full_name}',
            'visitor_id': visitor.id
        })
