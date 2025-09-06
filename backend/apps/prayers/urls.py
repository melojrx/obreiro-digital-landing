from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import PrayerRequestViewSet, PrayerMessageViewSet, PrayerResponseViewSet

# Router principal para pedidos de oração
router = DefaultRouter()
router.register(r'prayer-requests', PrayerRequestViewSet, basename='prayerrequest')

app_name = 'prayers'

urlpatterns = [
    # URLs principais
    path('', include(router.urls)),
    
    # URLs para mensagens de pedidos específicos
    path('prayer-requests/<int:request_pk>/messages/', 
         PrayerMessageViewSet.as_view({'get': 'list', 'post': 'create'}), 
         name='prayer-messages-list'),
    path('prayer-requests/<int:request_pk>/messages/<int:pk>/', 
         PrayerMessageViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'delete': 'destroy'}), 
         name='prayer-messages-detail'),
    
    # URLs para respostas de oração (quem está orando)
    path('prayer-requests/<int:request_pk>/responses/', 
         PrayerResponseViewSet.as_view({'get': 'list'}), 
         name='prayer-responses-list'),
]

# URLs resultantes:
# GET/POST    /api/prayers/requests/                           - Lista/Cria pedidos
# GET/PUT     /api/prayers/requests/{id}/                      - Detalha/Atualiza pedido
# DELETE      /api/prayers/requests/{id}/                      - Remove pedido (soft delete)
# POST        /api/prayers/requests/{id}/pray/                 - Marca/desmarca oração
# GET         /api/prayers/requests/{id}/statistics/           - Estatísticas do pedido
# POST        /api/prayers/requests/{id}/mark_answered/        - Marca como respondido
# 
# GET/POST    /api/prayers/requests/{id}/messages/             - Lista/Cria mensagens
# GET/PUT     /api/prayers/requests/{id}/messages/{msg_id}/    - Detalha/Atualiza mensagem
# DELETE      /api/prayers/requests/{id}/messages/{msg_id}/    - Remove mensagem
# 
# GET/POST    /api/prayers/requests/{id}/responses/            - Lista/Cria respostas
