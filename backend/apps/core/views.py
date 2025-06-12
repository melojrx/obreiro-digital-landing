"""
Views básicas para o app Core
Endpoints de teste e utilitários
"""

from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings


@api_view(['GET'])
@permission_classes([AllowAny])
def api_status(request):
    """
    Endpoint para verificar status da API
    """
    return Response({
        'status': 'OK',
        'message': 'ObreiroVirtual API está funcionando!',
        'version': '1.0.0',
        'user': request.user.username if request.user.is_authenticated else 'Anonymous'
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    Estatísticas gerais do sistema para dashboard
    """
    user = request.user
    
    # Estatísticas básicas
    stats = {
        'total_users': User.objects.count(),
        'user_authenticated': user.is_authenticated,
        'user_is_superuser': user.is_superuser,
        'username': user.username,
    }
    
    return Response(stats)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check para monitoramento
    """
    try:
        # Testar conexão com banco
        user_count = User.objects.count()
        
        return Response({
            'status': 'healthy',
            'database': 'connected',
            'user_count': user_count,
            'timestamp': '2025-06-11T22:50:00Z'
        })
    except Exception as e:
        return Response({
            'status': 'unhealthy',
            'error': str(e)
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
