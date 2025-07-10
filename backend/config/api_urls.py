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
from apps.members.views import MemberViewSet
from apps.visitors.views import VisitorViewSet
from apps.activities.views import ActivityViewSet

# Router para ViewSets
router = DefaultRouter()

# Registrar ViewSets que existem
router.register(r'denominations', DenominationViewSet, basename='denomination')
router.register(r'churches', ChurchViewSet, basename='church')
router.register(r'members', MemberViewSet, basename='member')
router.register(r'visitors', VisitorViewSet, basename='visitor')
router.register(r'activities', ActivityViewSet, basename='activity')

# URL patterns
urlpatterns = [
    # Autenticação e usuários (views baseadas em função/classe)
    path('auth/', include('apps.accounts.urls')),
    
    # Core (health check, etc)
    path('core/', include('apps.core.urls')),
    
    # ViewSets registrados no router
    path('', include(router.urls)),
] 