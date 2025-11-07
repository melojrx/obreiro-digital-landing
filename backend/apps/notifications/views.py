"""
Views para o sistema de notificações
"""
import json
import time
from django.http import StreamingHttpResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter

from .models import Notification
from .serializers import (
    NotificationSerializer,
    NotificationListSerializer,
    MarkAsReadSerializer,
    UnreadCountSerializer,
    BulkMarkAsReadSerializer
)
from .services import NotificationService


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de notificações
    
    Endpoints:
    - GET /notifications/ - Listar notificações do usuário
    - GET /notifications/{id}/ - Detalhar notificação
    - POST /notifications/{id}/mark_read/ - Marcar como lida
    - POST /notifications/mark_all_read/ - Marcar todas como lidas
    - DELETE /notifications/{id}/ - Deletar notificação
    - POST /notifications/clear_all/ - Limpar todas
    - GET /notifications/unread_count/ - Contagem de não lidas
    """
    
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['is_read', 'notification_type', 'priority']
    ordering_fields = ['created_at', 'priority', 'is_read']
    ordering = ['-created_at']  # Mais recentes primeiro
    
    def get_queryset(self):
        """
        Retorna apenas notificações do usuário logado
        Filtrado pela igreja ativa (multi-tenant)
        """
        user = self.request.user
        
        # Pegar igreja ativa do header ou da sessão
        active_church_id = self.request.headers.get('X-Church')
        if not active_church_id:
            active_church_id = self.request.session.get('active_church')
        
        queryset = Notification.objects.filter(user=user)
        
        # Filtrar por igreja ativa se especificada
        if active_church_id:
            queryset = queryset.filter(church_id=active_church_id)
        
        return queryset.select_related('user', 'church')
    
    def get_serializer_class(self):
        """
        Retorna o serializer apropriado para cada action
        """
        if self.action == 'list':
            return NotificationListSerializer
        return NotificationSerializer
    
    def destroy(self, request, *args, **kwargs):
        """
        Permite que usuário delete suas próprias notificações
        """
        instance = self.get_object()
        
        # Validar ownership
        if instance.user != request.user:
            return Response(
                {'error': 'Você não tem permissão para deletar esta notificação'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """
        Marca uma notificação específica como lida
        
        POST /notifications/{id}/mark_read/
        """
        notification = self.get_object()
        
        # Validar ownership
        if notification.user != request.user:
            return Response(
                {'error': 'Você não tem permissão para marcar esta notificação'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = MarkAsReadSerializer(notification, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(
            NotificationSerializer(notification).data,
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """
        Marca todas as notificações do usuário como lidas
        
        POST /notifications/mark_all_read/
        """
        user = request.user
        
        # Pegar igreja ativa
        active_church_id = request.headers.get('X-Church')
        if not active_church_id:
            return Response(
                {'error': 'Igreja ativa não especificada'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from apps.churches.models import Church
            church = Church.objects.get(id=active_church_id)
        except Church.DoesNotExist:
            return Response(
                {'error': 'Igreja não encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        count = NotificationService.mark_all_as_read(user, church)
        
        return Response(
            {
                'message': f'{count} notificações marcadas como lidas',
                'count': count
            },
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['post'])
    def bulk_mark_read(self, request):
        """
        Marca múltiplas notificações como lidas
        
        POST /notifications/bulk_mark_read/
        Body: { "notification_ids": [1, 2, 3] }
        """
        serializer = BulkMarkAsReadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        notification_ids = serializer.validated_data['notification_ids']
        
        # Buscar notificações do usuário
        notifications = Notification.objects.filter(
            id__in=notification_ids,
            user=request.user
        )
        
        count = 0
        for notification in notifications:
            notification.mark_as_read()
            count += 1
        
        return Response(
            {
                'message': f'{count} notificações marcadas como lidas',
                'count': count
            },
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """
        Retorna a contagem de notificações não lidas
        
        GET /notifications/unread_count/
        """
        user = request.user
        
        # Pegar igreja ativa
        active_church_id = request.headers.get('X-Church')
        if not active_church_id:
            # Se não especificada, contar todas as igrejas
            count = Notification.objects.filter(
                user=user,
                is_read=False
            ).count()
        else:
            try:
                from apps.churches.models import Church
                church = Church.objects.get(id=active_church_id)
                count = NotificationService.get_unread_count(user, church)
            except Church.DoesNotExist:
                count = 0
        
        serializer = UnreadCountSerializer({'count': count})
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'])
    def clear_all(self, request):
        """
        Remove todas as notificações do usuário (lidas e não lidas)
        
        POST /notifications/clear_all/
        """
        user = request.user
        
        # Pegar igreja ativa
        active_church_id = request.headers.get('X-Church')
        
        if active_church_id:
            count = Notification.objects.filter(
                user=user,
                church_id=active_church_id
            ).delete()[0]
        else:
            count = Notification.objects.filter(user=user).delete()[0]
        
        return Response(
            {
                'message': f'{count} notificações removidas',
                'count': count
            },
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """
        Retorna notificações recentes (últimos 7 dias)
        
        GET /notifications/recent/
        """
        queryset = self.get_queryset().recent()
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


# =====================================
# SERVER-SENT EVENTS (SSE)
# =====================================

@login_required
@require_http_methods(["GET"])
def notification_stream(request):
    """
    Server-Sent Events (SSE) endpoint para notificações em tempo real
    
    ⚠️ ATENÇÃO: SSE está DESABILITADO EM PRODUÇÃO
    Requer servidor ASGI ou Gunicorn+Gevent para funcionar corretamente.
    Ver settings.ENABLE_SSE e docs/SSE_PRODUCTION_REQUIREMENTS.md
    
    Mantém conexão HTTP aberta e envia eventos quando há notificações novas.
    Muito mais eficiente que polling e mais simples que WebSockets.
    
    GET /api/v1/notifications/stream/
    
    Headers necessários:
    - Cookie: sessionid (autenticação)
    - X-Church: ID da igreja ativa (multi-tenant)
    
    Eventos enviados:
    - notification_count: Contagem de notificações não lidas
    - new_notification: Dados de notificação nova (futuro)
    - heartbeat: Mantém conexão viva
    
    Exemplo de uso no frontend:
    ```javascript
    const eventSource = new EventSource('/api/v1/notifications/stream/');
    
    eventSource.addEventListener('notification_count', (event) => {
        const data = JSON.parse(event.data);
        console.log('Não lidas:', data.count);
    });
    ```
    """
    
    # Verificar se SSE está habilitado
    from django.conf import settings
    if not getattr(settings, 'ENABLE_SSE', False):
        from django.http import JsonResponse
        return JsonResponse({
            'error': 'SSE está desabilitado neste ambiente',
            'message': 'Use polling para notificações em tempo real',
            'polling_endpoint': '/api/v1/notifications/unread_count/',
            'recommended_interval': getattr(settings, 'NOTIFICATION_POLLING_INTERVAL', 60000),
        }, status=503)  # Service Unavailable
    
    def event_stream():
        """
        Gerador que mantém a conexão aberta e envia eventos SSE
        """
        user = request.user
        
        # Pegar igreja ativa do header
        active_church_id = request.headers.get('X-Church')
        if not active_church_id:
            # Enviar erro e fechar conexão
            yield f"event: error\n"
            yield f"data: {json.dumps({'error': 'Igreja ativa não especificada (header X-Church)'})}\n\n"
            return
        
        try:
            from apps.churches.models import Church
            church = Church.objects.get(id=active_church_id)
        except Church.DoesNotExist:
            yield f"event: error\n"
            yield f"data: {json.dumps({'error': 'Igreja não encontrada'})}\n\n"
            return
        
        # Cache para detectar mudanças
        last_count = None
        last_check = time.time()
        
        # Obter configurações do settings
        from django.conf import settings
        heartbeat_interval = getattr(settings, 'SSE_HEARTBEAT_INTERVAL', 30)
        check_interval = getattr(settings, 'SSE_CHECK_INTERVAL', 3)
        
        # Enviar evento inicial de conexão
        yield f"event: connected\n"
        yield f"data: {json.dumps({'message': 'Conectado ao stream de notificações'})}\n\n"
        
        try:
            while True:
                current_time = time.time()
                
                # Verificar se é hora de enviar heartbeat
                if current_time - last_check >= heartbeat_interval:
                    yield f"event: heartbeat\n"
                    yield f"data: {json.dumps({'timestamp': int(current_time)})}\n\n"
                    last_check = current_time
                
                # Buscar contagem atual de notificações não lidas
                current_count = Notification.objects.filter(
                    user=user,
                    church=church,
                    is_read=False
                ).count()
                
                # Se mudou, enviar evento
                if current_count != last_count:
                    yield f"event: notification_count\n"
                    yield f"data: {json.dumps({'count': current_count, 'timestamp': int(current_time)})}\n\n"
                    last_count = current_count
                
                # Aguardar antes da próxima verificação
                # ⚠️ ATENÇÃO: time.sleep() BLOQUEIA O WORKER WSGI!
                # Isso é aceitável em dev (runserver), mas problemático em produção (Gunicorn WSGI)
                # Soluções para produção:
                # - Gunicorn com worker gevent: pip install gevent && gunicorn -k gevent
                # - Servidor ASGI: Uvicorn/Daphne com Django Channels
                time.sleep(check_interval)
                
        except GeneratorExit:
            # Cliente desconectou - normal, não é erro
            pass
        except Exception as e:
            # Log do erro mas não quebra o servidor
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erro no SSE stream para usuário {user.id}: {e}")
            
            yield f"event: error\n"
            yield f"data: {json.dumps({'error': 'Erro interno no servidor'})}\n\n"
    
    # Retornar StreamingHttpResponse com headers SSE
    response = StreamingHttpResponse(
        event_stream(),
        content_type='text/event-stream'
    )
    
    # Headers necessários para SSE funcionar
    response['Cache-Control'] = 'no-cache'  # Não cachear eventos
    response['X-Accel-Buffering'] = 'no'  # Desabilitar buffering do NGINX
    
    return response
