"""
URLs da API do ObreiroVirtual
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import (
    SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
)

# Importar ViewSets que existem
from apps.denominations.views import DenominationViewSet
from apps.churches.views import ChurchViewSet
from apps.branches.views import BranchViewSet
from apps.members.views import MemberViewSet, MinisterialFunctionHistoryViewSet, MembershipStatusViewSet
from apps.visitors.views import VisitorViewSet
from apps.activities.views import ActivityViewSet, MinistryViewSet

# Views de usuários removidas - usar sistema de cadastro existente

# Router para ViewSets
router = DefaultRouter()

# Registrar ViewSets que existem
router.register(r'denominations', DenominationViewSet, basename='denomination')
router.register(r'churches', ChurchViewSet, basename='church')
router.register(r'branches', BranchViewSet, basename='branch')
router.register(r'members', MemberViewSet, basename='member')
router.register(r'ministerial-function-history', MinisterialFunctionHistoryViewSet, basename='ministerial-function-history')
router.register(r'membership-status', MembershipStatusViewSet, basename='membership-status')
router.register(r'visitors', VisitorViewSet, basename='visitor')
router.register(r'activities', ActivityViewSet, basename='activity')
router.register(r'ministries', MinistryViewSet, basename='ministry')

# Importar views necessárias
from apps.accounts.views import me, my_church, upload_avatar, update_personal_data, update_church_data

# URL patterns
urlpatterns = [
    # Autenticação
    path('auth/', include('apps.accounts.urls')),
    
    # Usuários
    path('users/me/', me, name='user-me'),
    path('users/my_church/', my_church, name='user-my-church'),
    path('users/upload-avatar/', upload_avatar, name='user-upload-avatar'),
    path('users/update_personal_data/', update_personal_data, name='user-update-personal-data'),
    path('users/update_church_data/', update_church_data, name='user-update-church-data'),
    
    # Core (health check, etc)
    path('core/', include('apps.core.urls')),
    
    # Visitantes (inclui endpoints públicos e administrativos)
    path('visitors/', include('apps.visitors.urls')),
    
    # Igrejas (endpoints específicos de denominação)
    path('', include('apps.churches.urls')),
    
    # Pedidos de Oração
    path('', include('apps.prayers.urls')),
    
    # Atividades e Ministérios (endpoints customizados)
    path('activities/', include('apps.activities.urls')),
    
    # ViewSets registrados no router
    path('', include(router.urls)),
    
    # Rotas para documentação da API (Swagger/Redoc)
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
