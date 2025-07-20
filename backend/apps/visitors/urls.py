"""
URLs para o app Visitors
Sistema de QR Code para registro de visitantes
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Router para ViewSets
router = DefaultRouter()
router.register(r'visitors', views.VisitorViewSet, basename='visitor')

# URLs da aplicação
urlpatterns = [
    # =====================================
    # ENDPOINTS PÚBLICOS (Sem autenticação)
    # =====================================
    
    # Validação de QR Code
    path(
        'public/qr/<uuid:qr_code_uuid>/validate/',
        views.validate_qr_code,
        name='validate-qr-code'
    ),
    
    # Registro público de visitante
    path(
        'public/qr/<uuid:qr_code_uuid>/register/',
        views.register_visitor,
        name='register-visitor'
    ),
    
    # =====================================
    # ENDPOINTS ADMINISTRATIVOS (ViewSets)
    # =====================================
    
    # Rotas do ViewSet (CRUD completo + actions customizadas)
    path('admin/', include(router.urls)),
    
    # =====================================
    # ENDPOINTS ESPECÍFICOS
    # =====================================
    
    # Visitantes recentes
    path(
        'admin/recent/',
        views.recent_visitors,
        name='recent-visitors'
    ),
    
    # Estatísticas para dashboard
    path(
        'admin/dashboard-stats/',
        views.dashboard_stats,
        name='dashboard-stats'
    ),
]

# As rotas do ViewSet ficam disponíveis em:
# GET    /api/v1/visitors/admin/visitors/                    # Listar visitantes
# POST   /api/v1/visitors/admin/visitors/                    # Criar visitante
# GET    /api/v1/visitors/admin/visitors/{id}/               # Detalhar visitante
# PUT    /api/v1/visitors/admin/visitors/{id}/               # Atualizar visitante
# PATCH  /api/v1/visitors/admin/visitors/{id}/               # Atualizar visitante parcial
# DELETE /api/v1/visitors/admin/visitors/{id}/               # Deletar visitante

# Actions customizadas do ViewSet:
# GET    /api/v1/visitors/admin/visitors/stats/              # Estatísticas gerais
# GET    /api/v1/visitors/admin/visitors/by_branch/          # Estatísticas por filial
# GET    /api/v1/visitors/admin/visitors/pending_follow_up/  # Visitantes pendentes
# PATCH  /api/v1/visitors/admin/visitors/{id}/convert_to_member/    # Converter em membro
# PATCH  /api/v1/visitors/admin/visitors/{id}/update_follow_up/     # Atualizar follow-up
# POST   /api/v1/visitors/admin/visitors/bulk_action/        # Ações em lote

# Endpoints públicos:
# GET    /api/v1/visitors/public/qr/{uuid}/validate/         # Validar QR Code
# POST   /api/v1/visitors/public/qr/{uuid}/register/         # Registrar visitante

# Endpoints específicos:
# GET    /api/v1/visitors/admin/recent/                      # Visitantes recentes
# GET    /api/v1/visitors/admin/dashboard-stats/             # Stats do dashboard