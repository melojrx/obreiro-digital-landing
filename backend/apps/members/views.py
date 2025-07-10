"""
Views para o app Members
Gerencia endpoints de membros
"""

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Member
from .serializers import MemberSerializer, MemberCreateSerializer, MemberSummarySerializer


class MemberViewSet(viewsets.ModelViewSet):
    """
    ViewSet para membros
    """
    
    queryset = Member.objects.all()
    serializer_class = MemberSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['full_name', 'email', 'phone', 'cpf']
    filterset_fields = ['church', 'is_active', 'membership_status', 'gender', 'marital_status']
    ordering_fields = ['full_name', 'membership_date', 'birth_date', 'created_at']
    ordering = ['full_name']
    
    def get_queryset(self):
        """
        Filtra o queryset de membros.
        - O TenantManager já filtra por `church`.
        - Adiciona filtro por `branch` se o usuário não for admin/pastor.
        """
        user = self.request.user
        
        if user.is_superuser:
            return Member.objects.all_for_church(self.request.church)

        # O TenantManager já aplicou o filtro por request.church
        queryset = Member.objects.all() 

        # Busca o vínculo do usuário para verificar o papel e a filial
        church_user = user.church_users.filter(church=self.request.church).first()

        if church_user and church_user.branch and church_user.role not in ['church_admin', 'pastor']:
            # Se o usuário está associado a uma filial e não é admin/pastor da igreja,
            # restringe a visão para apenas os membros da sua filial.
            queryset = queryset.filter(branch=church_user.branch)
            
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'create':
            return MemberCreateSerializer
        elif self.action == 'list':
            return MemberSummarySerializer
        return MemberSerializer
    
    @action(detail=False, methods=['get'])
    def my_members(self, request):
        """Membros das igrejas do usuário atual"""
        user = request.user
        
        if user.is_superuser:
            members = Member.objects.all()
        else:
            members = Member.objects.all()  # Simplificado para teste
        
        serializer = MemberSummarySerializer(members, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def profile(self, request, pk=None):
        """Perfil completo do membro"""
        member = self.get_object()
        serializer = MemberSerializer(member)
        return Response(serializer.data)
