from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ChurchViewSet, DenominationChurchViewSet

# Router principal para igrejas (já incluído no api_urls.py principal)
# Endpoints aninhados específicos para denominação
denomination_router = DefaultRouter()
denomination_router.register(
    r'denominations/(?P<denomination_pk>[^/.]+)/churches', 
    DenominationChurchViewSet, 
    basename='denomination-churches'
)

urlpatterns = [
    # Endpoints aninhados para denominação
    path('', include(denomination_router.urls)),
]

# URLs resultantes:
# GET /api/churches/ - Listar todas as igrejas (com filtros e permissões)
# POST /api/churches/ - Criar nova igreja
# GET /api/churches/{id}/ - Detalhes da igreja
# PUT /api/churches/{id}/ - Atualizar igreja completa
# PATCH /api/churches/{id}/ - Atualizar igreja parcial
# DELETE /api/churches/{id}/ - Soft delete da igreja

# GET /api/churches/my-churches/ - Igrejas do usuário atual
# GET /api/churches/by-denomination/{denomination_id}/ - Igrejas por denominação
# POST /api/churches/bulk-create/ - Criar múltiplas igrejas

# GET /api/churches/{id}/statistics/ - Estatísticas da igreja
# GET /api/churches/{id}/branches/ - Filiais da igreja
# GET /api/churches/{id}/subscription/ - Dados da assinatura
# PUT /api/churches/{id}/subscription/ - Atualizar assinatura
# POST /api/churches/{id}/assign-admin/ - Atribuir administrador
# POST /api/churches/{id}/remove-admin/ - Remover administrador
# POST /api/churches/{id}/update-statistics/ - Atualizar estatísticas

# GET /api/denominations/{id}/churches/ - Igrejas da denominação
# POST /api/denominations/{id}/churches/ - Criar igreja na denominação 