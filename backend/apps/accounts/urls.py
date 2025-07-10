"""
URLs do app accounts - autenticação e usuários
"""

from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

urlpatterns = [
    # Autenticação
    path('login/', views.UserLoginView.as_view(), name='user-login'),
    
    # Papéis e hierarquia
    path('available-roles/', views.available_roles_view, name='available-roles'),
    
    # Dados auxiliares
    path('available-churches/', views.available_churches_view, name='available-churches'),
    path('available-denominations/', views.available_denominations_view, name='available-denominations'),
    path('user-church/', views.user_church_view, name='user-church'),
    
    # Perfil do usuário
    path('me/', views.user_me_view, name='user-me'),
    path('update_personal_data/', views.update_personal_data_view, name='update-personal-data'),
    path('update_church_data/', views.update_church_data_view, name='update-church-data'),
    path('upload-avatar/', views.upload_avatar_view, name='upload-avatar'),
    path('delete-account/', views.delete_account_view, name='delete-account'),
] + router.urls 