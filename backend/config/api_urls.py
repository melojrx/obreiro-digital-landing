"""
URLs da API do ObreiroVirtual - Ativando ViewSets Completos
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import (
    SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
)
from apps.core.views import api_status, dashboard_stats, health_check

# Importar todos os ViewSets
from apps.denominations.views import DenominationViewSet
from apps.churches.views import ChurchViewSet
from apps.members.views import MemberViewSet
from apps.visitors.views import VisitorViewSet
from apps.activities.views import MinistryViewSet, ActivityViewSet
from apps.accounts.views import (
    CustomAuthToken, UserRegistrationViewSet, UserViewSet,
    UserProfileViewSet, ChurchUserViewSet
)

# Router principal
router = DefaultRouter()

# Registrar todos os ViewSets
router.register(r'denominations', DenominationViewSet)
router.register(r'churches', ChurchViewSet)
router.register(r'members', MemberViewSet)
router.register(r'visitors', VisitorViewSet)
router.register(r'ministries', MinistryViewSet)
router.register(r'activities', ActivityViewSet)

# Registrar ViewSets de usuários
router.register(r'auth/register', UserRegistrationViewSet, basename='user-registration')
router.register(r'users', UserViewSet)
router.register(r'profiles', UserProfileViewSet)
router.register(r'church-users', ChurchUserViewSet)

# URLs da API v1
urlpatterns = [
    # Endpoints de teste
    path('status/', api_status, name='api_status'),
    path('health/', health_check, name='health_check'),
    path('dashboard/', dashboard_stats, name='dashboard_stats'),
    
    # Autenticação personalizada
    path('auth/login/', CustomAuthToken.as_view(), name='auth_login'),
    path('auth/token/', CustomAuthToken.as_view(), name='api_token_auth'),
    
    # Documentação da API
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # Endpoints principais
    path('v1/', include(router.urls)),
    
    # Endpoints específicos por app (se necessário)
    # path('v1/accounts/', include('apps.accounts.urls')),
    # path('v1/branches/', include('apps.branches.urls')),
] 