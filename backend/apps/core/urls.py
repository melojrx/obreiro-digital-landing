"""
URLs do app core - utilitários e endpoints auxiliares
"""

from django.urls import path
from rest_framework.routers import DefaultRouter

router = DefaultRouter()

# TODO: Adicionar viewsets quando criados
# router.register(r'utils', UtilityViewSet)

urlpatterns = router.urls

# URLs específicas (não CRUD)
urlpatterns += [
    # TODO: Adicionar endpoints específicos
    # path('health/', HealthCheckView.as_view(), name='health-check'),
] 