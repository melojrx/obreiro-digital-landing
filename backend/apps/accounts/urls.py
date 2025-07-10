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
] + router.urls 