"""
URLs específicas para o app Denominations
"""

from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import DenominationViewSet

router = DefaultRouter()
router.register(r'', DenominationViewSet, basename='denomination')

urlpatterns = router.urls 