"""
URLs para o sistema de notificações
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, notification_stream


# Router para endpoints RESTful
router = DefaultRouter()
router.register(r'', NotificationViewSet, basename='notification')

app_name = 'notifications'

urlpatterns = [
    # SSE endpoint para notificações em tempo real
    # IMPORTANTE: Deve vir ANTES do router.urls para não ser capturado por ele
    path('stream/', notification_stream, name='notification-stream'),
    
    # Endpoints RESTful
    path('', include(router.urls)),
]
