from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.core.exceptions import ValidationError
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.parsers import MultiPartParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend

from .models import PrayerRequest, PrayerMessage, PrayerResponse
from .serializers import (
    PrayerRequestSerializer,
    PrayerMessageSerializer,
    PrayerResponseSerializer
)


class PrayerRequestPermission(BasePermission):
    """
    Permite acesso a pedidos de oração baseado no perfil do usuário:
    - CHURCH_ADMIN (inclui valor legado): vê todos os pedidos da denominação
    - Outros usuários: apenas da própria igreja
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        # Verifica se é CHURCH_ADMIN (inclui valores legados) através do ChurchUser
        from apps.accounts.models import ChurchUser
        from apps.core.models import RoleChoices

        church_user = ChurchUser.objects.filter(user=request.user).first()
        if church_user and church_user.has_role(RoleChoices.CHURCH_ADMIN):
            return True

        # Para outros usuários, verifica se tem Member associado a uma igreja
        from apps.members.models import Member

        member = Member.objects.filter(user=request.user).first()
        return member and member.church is not None
    
    def has_object_permission(self, request, view, obj):
        # Verifica se o objeto pertence à igreja do usuário ou denominação
        from apps.accounts.models import ChurchUser
        from apps.core.models import RoleChoices
        from apps.members.models import Member
        
        church_user = ChurchUser.objects.filter(user=request.user).first()
        
        # CHURCH_ADMIN pode ver tudo da denominação (mantém compatibilidade com valores legados)
        if church_user and church_user.has_role(RoleChoices.CHURCH_ADMIN):
            if hasattr(obj, 'church') and church_user.church:
                return obj.church.denomination == church_user.church.denomination
            return True

        # Para outros usuários, verifica através do Member
        member = Member.objects.filter(user=request.user).first()
        if hasattr(obj, 'church') and member and member.church:
            return obj.church == member.church
        return True


class PrayerRequestViewSet(viewsets.ModelViewSet):
    """ViewSet para pedidos de oração"""
    
    serializer_class = PrayerRequestSerializer
    permission_classes = [IsAuthenticated, PrayerRequestPermission]
    parser_classes = [MultiPartParser, JSONParser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'status']
    search_fields = ['title', 'content', 'author__full_name', 'author__first_name', 'author__last_name']
    ordering_fields = ['created_at', 'updated_at', 'title']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filtra pedidos por igreja/denominação do usuário"""
        from apps.accounts.models import ChurchUser
        from apps.core.models import RoleChoices
        from apps.members.models import Member
        
        user = self.request.user
        church_user = ChurchUser.objects.filter(user=user).first()
        
        # CHURCH_ADMIN vê todos os pedidos da denominação
        if church_user and church_user.has_role(RoleChoices.CHURCH_ADMIN):
            if church_user.church and church_user.church.denomination:
                return PrayerRequest.objects.filter(
                    church__denomination=church_user.church.denomination,
                    is_active=True
                ).order_by('-created_at')
        
        # Para outros usuários, verifica através do Member
        member = Member.objects.filter(user=user).first()
        if not member or not member.church:
            return PrayerRequest.objects.none()
        
        # Outros usuários veem apenas da própria igreja
        return PrayerRequest.objects.filter(
            church=member.church,
            is_active=True
        ).order_by('-created_at')
    
    def perform_create(self, serializer):
        """Define autor e igreja ao criar pedido"""
        from apps.accounts.models import ChurchUser
        from apps.core.models import RoleChoices
        from apps.members.models import Member
        
        user = self.request.user
        
        # Para CHURCH_ADMIN, pode usar a igreja dele do ChurchUser (mantém legado)
        church_user = ChurchUser.objects.filter(user=user).first()
        if church_user and church_user.has_role(RoleChoices.CHURCH_ADMIN) and church_user.church:
            serializer.save(
                author=user,
                church=church_user.church
            )
            return
        
        # Para outros usuários, verifica através do Member
        member = Member.objects.filter(user=user).first()
        if not member or not member.church:
            raise ValidationError("Usuário deve estar associado a uma igreja")
            
        serializer.save(
            author=user,
            church=member.church
        )
    
    def perform_destroy(self, instance):
        """Soft delete - marca como inativo"""
        instance.is_active = False
        instance.save()
    
    @action(detail=True, methods=['post'])
    def pray(self, request, pk=None):
        """Marca/desmarca que o usuário está orando por este pedido"""
        prayer_request = self.get_object()
        is_praying = request.data.get('is_praying', True)
        
        # Busca ou cria resposta do usuário
        response, created = PrayerResponse.objects.get_or_create(
            prayer_request=prayer_request,
            user=request.user,
            defaults={'is_praying': is_praying}
        )
        
        if not created:
            response.is_praying = is_praying
            response.save()
        
        # Conta total de pessoas orando
        prayers_count = PrayerResponse.objects.filter(
            prayer_request=prayer_request,
            is_praying=True,
            is_active=True
        ).count()
        
        return Response({
            'is_praying': response.is_praying,
            'prayers_count': prayers_count,
            'message': 'Obrigado por orar!' if is_praying else 'Oração removida'
        })
    
    @action(detail=True, methods=['post'])
    def mark_answered(self, request, pk=None):
        """Marca pedido como respondido"""
        prayer_request = self.get_object()
        
        # Verifica permissão - apenas autor
        if prayer_request.author != request.user:
            return Response(
                {'detail': 'Apenas o autor pode marcar como respondido'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        answer_testimony = request.data.get('answer_testimony', '')
        if not answer_testimony:
            return Response(
                {'detail': 'Testemunho da resposta é obrigatório'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Atualiza pedido
        prayer_request.status = 'answered'
        prayer_request.answered_at = timezone.now()
        prayer_request.answer_testimony = answer_testimony
        prayer_request.save()
        
        return Response({
            'message': 'Pedido marcado como respondido!',
            'answered_at': prayer_request.answered_at,
            'answer_testimony': prayer_request.answer_testimony
        })


class PrayerMessageViewSet(viewsets.ModelViewSet):
    """ViewSet para mensagens de apoio"""
    
    serializer_class = PrayerMessageSerializer
    permission_classes = [IsAuthenticated, PrayerRequestPermission]
    
    def get_queryset(self):
        """Filtra mensagens por pedido de oração"""
        request_id = self.kwargs.get('request_pk')
        if not request_id:
            return PrayerMessage.objects.none()
            
        return PrayerMessage.objects.filter(
            prayer_request_id=request_id,
            is_active=True
        ).order_by('created_at')
    
    def perform_create(self, serializer):
        """Define autor e pedido de oração ao criar mensagem"""
        request_id = self.kwargs.get('request_pk')
        prayer_request = get_object_or_404(PrayerRequest, id=request_id)
        
        serializer.save(
            author=self.request.user,
            prayer_request=prayer_request
        )
    
    def perform_destroy(self, instance):
        """Soft delete - marca como inativo"""
        instance.is_active = False
        instance.save()


class PrayerResponseViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para visualizar quem está orando"""
    
    serializer_class = PrayerResponseSerializer
    permission_classes = [IsAuthenticated, PrayerRequestPermission]
    
    def get_queryset(self):
        """Filtra respostas por pedido de oração"""
        request_id = self.kwargs.get('request_pk')
        if not request_id:
            return PrayerResponse.objects.none()
            
        return PrayerResponse.objects.filter(
            prayer_request_id=request_id,
            is_praying=True,
            is_active=True
        ).order_by('-created_at')
