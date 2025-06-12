"""
URL configuration for Obreiro Virtual project.
Configuração principal de rotas da API.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

# =================================
# URL PATTERNS PRINCIPAIS
# =================================

urlpatterns = [
    # Admin Django
    path("admin/", admin.site.urls),
    
    # API v1
    path("api/v1/", include("config.api_urls")),
    
    # Documentação API
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    
    # Auth endpoints (DRF)
    path("api-auth/", include("rest_framework.urls")),
]

# =================================
# MEDIA FILES (desenvolvimento)
# =================================

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# =================================
# ADMIN CUSTOMIZATION
# =================================

admin.site.site_header = "Obreiro Virtual Admin"
admin.site.site_title = "Obreiro Virtual"
admin.site.index_title = "Painel de Administração"
