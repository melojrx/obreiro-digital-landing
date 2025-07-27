#!/bin/bash
# ============================================
# OBREIRO DIGITAL - SAFE PULL SCRIPT
# ============================================

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERRO]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCESSO]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

# Verificar se está no diretório correto
if [ ! -f "docker-compose.prod.yml" ]; then
    error "Execute este script no diretório raiz do projeto"
fi

log "🚀 Iniciando processo de atualização segura..."

# 1. Fazer backup das configurações atuais
log "📦 Criando backup das configurações..."
BACKUP_DIR="backups/$(date +'%Y%m%d_%H%M%S')"
mkdir -p "$BACKUP_DIR"
cp .env_prod "$BACKUP_DIR/.env_prod.backup" 2>/dev/null || warning "Arquivo .env_prod não encontrado"
cp frontend/.env.prod "$BACKUP_DIR/frontend.env.prod.backup" 2>/dev/null || true

# 2. Verificar e corrigir variáveis de ambiente
log "🔧 Verificando variáveis de ambiente..."

# Verificar se .env_prod existe
if [ ! -f ".env_prod" ]; then
    error "Arquivo .env_prod não encontrado! Copie .env_prod.example e configure."
fi

# Garantir que FRONTEND_URL está correto no .env_prod
if ! grep -q "FRONTEND_URL=https://www.obreirovirtual.com" .env_prod; then
    warning "FRONTEND_URL incorreto ou ausente no .env_prod"
    
    # Remover linha antiga se existir
    sed -i '/^FRONTEND_URL=/d' .env_prod
    
    # Adicionar linha correta
    echo "FRONTEND_URL=https://www.obreirovirtual.com" >> .env_prod
    success "FRONTEND_URL corrigido no .env_prod"
fi

# 3. Garantir que frontend/.env.prod está correto
log "🔧 Verificando configuração do frontend..."
mkdir -p frontend
cat > frontend/.env.prod << 'EOF'
# Configuração produção - API HTTPS
VITE_API_URL=https://www.obreirovirtual.com/api/v1
VITE_SERVER_URL=https://www.obreirovirtual.com
EOF
success "Arquivo frontend/.env.prod atualizado"

# 4. Carregar variáveis de ambiente
log "📥 Carregando variáveis de ambiente..."
set -a
source .env_prod
set +a

# 5. Fazer pull do código
log "📥 Baixando atualizações do GitHub..."
git pull origin main || error "Falha ao fazer pull do GitHub"

# 6. Parar containers específicos
log "🛑 Parando containers para atualização..."
docker compose -f docker-compose.prod.yml stop backend frontend-build nginx

# 7. Limpar build antigo do frontend
log "🧹 Limpando build antigo do frontend..."
rm -rf frontend_build/*

# 8. Rebuild do frontend com variáveis corretas
log "🔨 Reconstruindo frontend com configurações atualizadas..."
docker compose -f docker-compose.prod.yml build --no-cache frontend-build

# 9. Executar frontend-build
log "📦 Gerando novo build do frontend..."
docker compose -f docker-compose.prod.yml up frontend-build

# Aguardar build completar
sleep 5

# Verificar se build foi criado
if [ ! -f "frontend_build/index.html" ]; then
    error "Build do frontend falhou! Verifique os logs."
fi

# 10. Rebuild do backend (se necessário)
log "🔨 Reconstruindo backend..."
docker compose -f docker-compose.prod.yml build backend

# 11. Aplicar migrações
log "🗄️ Aplicando migrações do banco de dados..."
docker compose -f docker-compose.prod.yml run --rm backend python manage.py migrate --noinput

# 12. Coletar arquivos estáticos
log "📂 Coletando arquivos estáticos..."
docker compose -f docker-compose.prod.yml run --rm backend python manage.py collectstatic --noinput

# 13. Reiniciar todos os serviços
log "🚀 Reiniciando todos os serviços..."
docker compose -f docker-compose.prod.yml up -d

# 14. Aguardar serviços ficarem saudáveis
log "⏳ Aguardando serviços ficarem prontos..."
sleep 10

# 15. Verificar saúde dos containers
log "🏥 Verificando saúde dos serviços..."
docker compose -f docker-compose.prod.yml ps

# 16. Limpar cache do NGINX
log "🧹 Limpando cache do NGINX..."
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload

# 17. Verificar se a API está respondendo
log "🔍 Testando resposta da API..."
sleep 5
if curl -f -s -o /dev/null "https://obreirovirtual.com/api/v1/"; then
    success "API está respondendo corretamente!"
else
    warning "API pode não estar respondendo. Verifique os logs."
fi

# 18. Limpar imagens antigas do Docker
log "🧹 Limpando imagens Docker antigas..."
docker image prune -f

# 19. Corrigir permissões do diretório media
log "🔧 Corrigindo permissões do diretório media..."
chown -R 999:999 media_prod/
chmod -R 755 media_prod/
success "Permissões do diretório media corrigidas"

success "✅ Atualização concluída com sucesso!"
echo ""
log "📝 Próximos passos:"
echo "   1. Teste o login em: https://obreirovirtual.com"
echo "   2. Verifique os logs: docker compose -f docker-compose.prod.yml logs -f"
echo "   3. Em caso de problemas, restaure o backup em: $BACKUP_DIR"
echo ""
warning "💡 Dica: Use 'docker compose -f docker-compose.prod.yml logs -f backend' para ver logs em tempo real"
