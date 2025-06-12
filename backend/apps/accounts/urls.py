"""
URLs do app accounts - autenticação e usuários
"""

from django.urls import path
from rest_framework.routers import DefaultRouter

router = DefaultRouter()

# TODO: Adicionar viewsets quando criados
# router.register(r'users', ChurchUserViewSet)

urlpatterns = router.urls 