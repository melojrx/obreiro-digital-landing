"""
URLs do app core - utilitários e endpoints auxiliares
"""

from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

# TODO: Adicionar viewsets quando criados
# router.register(r'utils', UtilityViewSet)

urlpatterns = router.urls

# URLs específicas (não CRUD)
urlpatterns += [
    # Health check
    path('health/', views.health_check, name='health-check'),
    path('api-status/', views.api_status, name='api-status'),
    
    # Utilitários
    path('cep/<str:cep>/', views.CEPProxyView.as_view(), name='cep-lookup'),
    path('subscription-plans/', views.SubscriptionPlansView.as_view(), name='subscription-plans'),
    
    # Dashboard
    path('dashboard/charts/', views.dashboard_charts, name='dashboard-charts'),
]