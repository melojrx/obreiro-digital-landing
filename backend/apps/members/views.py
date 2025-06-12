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
        """Filtrar membros baseado no usuário"""
        user = self.request.user
        
        if user.is_superuser:
            return Member.objects.all()
        
        # Por enquanto, retorna todos os membros para teste
        return Member.objects.all()
    
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
