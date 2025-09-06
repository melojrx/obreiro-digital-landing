from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.parsers import MultiPartParser, JSONParser

from .models import PrayerRequest, PrayerMessage, PrayerResponse
from .serializers import (
    PrayerRequestSerializer,
    PrayerMessageSerializer,
    PrayerResponseSerializer
)


class ChurchMemberPermission(BasePermission):
    """
    Permite acesso apenas a usuários da mesma igreja
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'church') and 
            request.user.church is not None
        )
    
    def has_object_permission(self, request, view, obj):
        # Verifica se o objeto pertence à igreja do usuário
        if hasattr(obj, 'church'):
            return obj.church == request.user.church
        return True


class PrayerRequestViewSet(viewsets.ModelViewSet):
    """ViewSet para pedidos de oração"""
    
    serializer_class = PrayerRequestSerializer
    permission_classes = [IsAuthenticated, ChurchMemberPermission]
    parser_classes = [MultiPartParser, JSONParser]
    
    def get_queryset(self):
        """Filtra pedidos por igreja do usuário"""
        user = self.request.user
        
        if not hasattr(user, 'church') or not user.church:
            return PrayerRequest.objects.none()
        
        return PrayerRequest.objects.filter(
            church=user.church,
            is_active=True
        ).order_by('-created_at')
    
    def perform_create(self, serializer):
        """Define autor e igreja ao criar pedido"""
        serializer.save(
            author=self.request.user,
            church=self.request.user.church
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
    permission_classes = [IsAuthenticated, ChurchMemberPermission]
    
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
    permission_classes = [IsAuthenticated, ChurchMemberPermission]
    
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
