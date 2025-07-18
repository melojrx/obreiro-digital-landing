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

# Importar views de usuários
from apps.accounts import views

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
    
    # Endpoints de registro de usuários
    path('users/register/', views.UserRegistrationView.as_view(), name='users-register'),
    path('users/complete_profile/', views.CompleteProfileView.as_view(), name='users-complete-profile'),
    
    # Usuários (endpoints de perfil) - URLs diretas
    path('users/me/', views.user_me_view, name='users-me'),
    path('users/update_personal_data/', views.update_personal_data_view, name='users-update-personal-data'),
    path('users/update_church_data/', views.update_church_data_view, name='users-update-church-data'),
    path('users/upload-avatar/', views.upload_avatar_view, name='users-upload-avatar'),
    path('users/delete-account/', views.delete_account_view, name='users-delete-account'),
    path('users/my_church/', views.user_church_view, name='users-my-church'),
    
    # Core (health check, etc)
    path('core/', include('apps.core.urls')),
    
    # ViewSets registrados no router
    path('', include(router.urls)),
    
    # Rotas para documentação da API (Swagger/Redoc)
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]