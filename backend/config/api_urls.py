"""
URLs da API do ObreiroVirtual - Ativando ViewSets Completos
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import (
    SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
)
from apps.accounts.views import (
    UserRegistrationViewSet, 
    UserViewSet, 
    UserProfileViewSet, 
    ChurchUserViewSet, 
    CustomAuthToken
)
from apps.denominations.views import DenominationViewSet
from apps.churches.views import ChurchViewSet
from apps.members.views import MemberViewSet
from apps.visitors.views import VisitorViewSet
from apps.activities.views import MinistryViewSet, ActivityViewSet
from apps.core.views import health_check, CEPProxyView, SubscriptionPlansView

# ==============================================================================
# ROUTER CONFIGURATION
# ==============================================================================
# O DefaultRouter do DRF cria automaticamente as URLs para os ViewSets.
# ex: /api/v1/users/, /api/v1/users/{id}/, etc.
# As actions customizadas também são mapeadas, 
# ex: /api/v1/users/register/register/
# ==============================================================================
router = DefaultRouter()

# Core Apps
router.register(r'users/register', UserRegistrationViewSet, basename='user-registration')
router.register(r'users', UserViewSet, basename='user')
router.register(r'profiles', UserProfileViewSet, basename='user-profile')
router.register(r'church-users', ChurchUserViewSet, basename='church-user')
router.register(r'denominations', DenominationViewSet, basename='denomination')
router.register(r'churches', ChurchViewSet, basename='church')
router.register(r'members', MemberViewSet, basename='member')
router.register(r'visitors', VisitorViewSet, basename='visitor')
router.register(r'ministries', MinistryViewSet, basename='ministry')
router.register(r'activities', ActivityViewSet, basename='activity')


# ==============================================================================
# URL PATTERNS
# ==============================================================================
# A lista de urlpatterns combina rotas manuais com as rotas geradas pelo router.
# ==============================================================================
urlpatterns = [
    # Rotas de Autenticação Manual (se necessário, como login)
    path('auth/login/', CustomAuthToken.as_view(), name='auth-login'),

    # Inclui todas as rotas geradas pelo router
    path('', include(router.urls)),
    
    # Rotas de utilidades manuais
    path('health/', health_check, name='health-check'),
    path('utils/cep/<str:cep>/', CEPProxyView.as_view(), name='cep-proxy'),
    path('utils/subscription-plans/', SubscriptionPlansView.as_view(), name='subscription-plans'),
] 