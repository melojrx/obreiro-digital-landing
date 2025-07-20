#!/bin/bash

# =================================
# SCRIPT PÓS-DEPLOY - OBREIRO DIGITAL
# =================================
# 
# Script para ser executado após deploy em produção
# Realiza tarefas de manutenção e configuração necessárias
#
# Uso: ./scripts/post-deploy.sh
#

set -e  # Parar em caso de erro

echo "🚀 Iniciando tarefas pós-deploy do Obreiro Digital..."

# Definir arquivo docker-compose baseado no ambiente
if [ "$1" = "dev" ]; then
    COMPOSE_FILE="docker-compose.dev.yml"
    echo "📍 Ambiente: DESENVOLVIMENTO"
else
    COMPOSE_FILE="docker-compose.prod.yml"
    echo "📍 Ambiente: PRODUÇÃO"
fi

# Verificar se arquivo existe
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ Arquivo $COMPOSE_FILE não encontrado!"
    exit 1
fi

echo "📄 Usando arquivo: $COMPOSE_FILE"

# =================================
# 1. VERIFICAR STATUS DOS CONTAINERS
# =================================
echo ""
echo "1️⃣ Verificando status dos containers..."
docker compose -f "$COMPOSE_FILE" ps

# =================================
# 2. AGUARDAR BACKEND ESTAR READY
# =================================
echo ""
echo "2️⃣ Aguardando backend estar pronto..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if docker compose -f "$COMPOSE_FILE" exec backend python manage.py check --quiet 2>/dev/null; then
        echo "✅ Backend está pronto!"
        break
    else
        echo "⏳ Tentativa $attempt/$max_attempts - Aguardando backend..."
        sleep 5
        attempt=$((attempt + 1))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ Backend não ficou pronto dentro do tempo esperado"
    exit 1
fi

# =================================
# 3. EXECUTAR MIGRAÇÕES
# =================================
echo ""
echo "3️⃣ Executando migrações do banco de dados..."
docker compose -f "$COMPOSE_FILE" exec backend python manage.py migrate

# =================================
# 4. COLETAR ARQUIVOS ESTÁTICOS
# =================================
echo ""
echo "4️⃣ Coletando arquivos estáticos..."
docker compose -f "$COMPOSE_FILE" exec backend python manage.py collectstatic --noinput

# =================================
# 5. REGENERAR QR CODES
# =================================
echo ""
echo "5️⃣ Regenerando QR codes com FRONTEND_URL correto..."
docker compose -f "$COMPOSE_FILE" exec backend python manage.py regenerate_qr_codes --force

# =================================
# 6. VERIFICAR SAÚDE DA APLICAÇÃO
# =================================
echo ""
echo "6️⃣ Verificando saúde da aplicação..."

# Verificar API
if [ "$1" = "dev" ]; then
    API_URL="http://localhost:8000/api/v1/"
else
    API_URL="https://obreirovirtual.com/api/v1/"
fi

echo "🔍 Testando API: $API_URL"
if curl -f -s "$API_URL" > /dev/null; then
    echo "✅ API está respondendo!"
else
    echo "⚠️ API não está respondendo em $API_URL"
fi

# =================================
# 7. LIMPEZA OPCIONAL
# =================================
echo ""
echo "7️⃣ Limpeza de dados temporários..."

# Limpar cache Django
docker compose -f "$COMPOSE_FILE" exec backend python manage.py clear_cache || echo "⚠️ Cache já estava limpo"

# Limpar sessões expiradas
docker compose -f "$COMPOSE_FILE" exec backend python manage.py clearsessions || echo "⚠️ Nenhuma sessão expirada"

# =================================
# 8. RELATÓRIO FINAL
# =================================
echo ""
echo "📊 RELATÓRIO FINAL DO PÓS-DEPLOY"
echo "=================================="

# Status dos containers
echo "📦 Status dos containers:"
docker compose -f "$COMPOSE_FILE" ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

# Informações do banco
echo ""
echo "🗄️ Informações do banco de dados:"
docker compose -f "$COMPOSE_FILE" exec backend python manage.py showmigrations --format=json | jq -r '.[] | "\(.app): \(.migrations | length) migrações"' 2>/dev/null || echo "ℹ️ Não foi possível obter informações detalhadas"

# Contagem de filiais e QR codes
echo ""
echo "📱 QR Codes atualizados:"
docker compose -f "$COMPOSE_FILE" exec backend python manage.py shell -c "
from apps.branches.models import Branch
from django.conf import settings
branches = Branch.objects.filter(is_active=True)
print(f'Total de filiais ativas: {branches.count()}')
print(f'FRONTEND_URL configurado: {settings.FRONTEND_URL}')
for branch in branches[:3]:  # Mostrar apenas 3 primeiros
    print(f'- {branch.church.short_name} - {branch.name}: {branch.visitor_registration_url}')
if branches.count() > 3:
    print(f'... e mais {branches.count() - 3} filiais')
"

echo ""
echo "🎉 PÓS-DEPLOY CONCLUÍDO COM SUCESSO!"
echo ""
echo "🔗 URLs importantes:"
if [ "$1" = "dev" ]; then
    echo "   Frontend: http://localhost:5173"
    echo "   Backend API: http://localhost:8000/api/v1/"
    echo "   Admin: http://localhost:8000/admin/"
else
    echo "   Frontend: https://obreirovirtual.com"
    echo "   Backend API: https://obreirovirtual.com/api/v1/"
    echo "   Admin: https://obreirovirtual.com/admin/"
fi
echo ""
echo "📝 Logs importantes:"
echo "   docker compose -f $COMPOSE_FILE logs -f backend"
echo "   docker compose -f $COMPOSE_FILE logs -f nginx"
echo ""