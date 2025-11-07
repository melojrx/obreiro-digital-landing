#!/bin/bash
# Script de teste do sistema de notificações
# Testa integração completa backend + frontend

echo "🧪 TESTE COMPLETO DO SISTEMA DE NOTIFICAÇÕES"
echo "=============================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Verificar se containers estão rodando
echo -e "${BLUE}1. Verificando containers...${NC}"
if docker compose -f docker-compose.dev.yml ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Containers rodando${NC}"
else
    echo -e "${RED}❌ Containers não estão rodando${NC}"
    exit 1
fi
echo ""

# 2. Verificar backend (API)
echo -e "${BLUE}2. Testando API de notificações...${NC}"
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/v1/notifications/)
if [ "$response" = "401" ] || [ "$response" = "403" ]; then
    echo -e "${GREEN}✅ Endpoint de notificações existe (requer autenticação)${NC}"
elif [ "$response" = "200" ]; then
    echo -e "${GREEN}✅ Endpoint de notificações funcionando${NC}"
else
    echo -e "${RED}❌ Erro ao acessar endpoint: HTTP $response${NC}"
fi
echo ""

# 3. Verificar tabela no banco
echo -e "${BLUE}3. Verificando tabela no banco de dados...${NC}"
docker compose -f docker-compose.dev.yml exec -T backend python manage.py shell -c "
from apps.notifications.models import Notification
count = Notification.objects.count()
print(f'✅ Tabela encontrada com {count} notificações')
" 2>/dev/null
echo ""

# 4. Criar notificação de teste
echo -e "${BLUE}4. Criando notificação de teste...${NC}"
docker compose -f docker-compose.dev.yml exec -T backend python manage.py shell -c "
from apps.notifications.services import NotificationService
from apps.accounts.models import CustomUser
from apps.churches.models import Church

user = CustomUser.objects.first()
church = Church.objects.first()

if user and church:
    notif = NotificationService.create_notification(
        user=user,
        church=church,
        notification_type='system_alert',
        title='🧪 Teste Automático - Sistema Funcionando',
        message='Esta notificação foi criada pelo script de teste automático',
        priority='high'
    )
    print(f'✅ Notificação criada: ID {notif.id}')
else:
    print('❌ Não há usuários ou igrejas no sistema')
" 2>/dev/null
echo ""

# 5. Verificar contagem de não lidas
echo -e "${BLUE}5. Verificando contagem de não lidas...${NC}"
docker compose -f docker-compose.dev.yml exec -T backend python manage.py shell -c "
from apps.notifications.models import Notification
unread = Notification.objects.filter(is_read=False).count()
total = Notification.objects.count()
print(f'✅ Total: {total} | Não lidas: {unread}')
" 2>/dev/null
echo ""

# 6. Verificar frontend
echo -e "${BLUE}6. Verificando frontend...${NC}"
frontend_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173)
if [ "$frontend_response" = "200" ]; then
    echo -e "${GREEN}✅ Frontend rodando em http://localhost:5173${NC}"
else
    echo -e "${RED}❌ Frontend não está respondendo${NC}"
fi
echo ""

# 7. Testar signal de visitante
echo -e "${BLUE}7. Testando signal de visitante...${NC}"
docker compose -f docker-compose.dev.yml exec -T backend python manage.py shell -c "
from apps.visitors.models import Visitor
from apps.churches.models import Church
from apps.notifications.models import Notification
from datetime import datetime

church = Church.objects.first()
count_before = Notification.objects.count()

visitor = Visitor.objects.create(
    church=church,
    full_name='Teste Automático Signal ' + datetime.now().strftime('%H:%M:%S'),
    email=f'teste.auto.{datetime.now().timestamp()}@example.com',
    phone='11987654321',
    wants_prayer=True,
    first_visit=True
)

count_after = Notification.objects.count()
new_count = count_after - count_before

if new_count >= 1:
    print(f'✅ Signal funcionando: {new_count} notificação(ões) criada(s)')
else:
    print('⚠️  Signal não criou notificações')
" 2>/dev/null
echo ""

# Resumo final
echo ""
echo "=============================================="
echo -e "${GREEN}✅ TESTE COMPLETO FINALIZADO${NC}"
echo "=============================================="
echo ""
echo "📊 Resumo:"
docker compose -f docker-compose.dev.yml exec -T backend python manage.py shell -c "
from apps.notifications.models import Notification
from django.db.models import Count

total = Notification.objects.count()
unread = Notification.objects.filter(is_read=False).count()

print(f'  📧 Total de notificações: {total}')
print(f'  📬 Não lidas: {unread}')
print(f'  ✅ Lidas: {total - unread}')

by_type = Notification.objects.values('notification_type').annotate(
    count=Count('id')
).order_by('-count')[:3]

print('\n  🏆 Top 3 tipos:')
for item in by_type:
    print(f'    - {item[\"notification_type\"]}: {item[\"count\"]}')
" 2>/dev/null

echo ""
echo "🌐 URLs de Teste:"
echo "  Backend API: http://localhost:8000/api/v1/notifications/"
echo "  Frontend:    http://localhost:5173"
echo "  Frontend (Notificações): http://localhost:5173/notifications"
echo ""
