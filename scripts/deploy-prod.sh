#!/bin/bash

# =================================
# OBREIRO DIGITAL - SCRIPT DE DEPLOY PRODUÇÃO
# =================================

set -e  # Exit on any error

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de log
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se está no diretório correto
if [ ! -f "docker-compose.prod.yml" ]; then
    log_error "docker-compose.prod.yml não encontrado. Execute este script na raiz do projeto."
    exit 1
fi

# Verificar se o arquivo .env_prod existe
if [ ! -f ".env_prod" ]; then
    log_error "Arquivo .env_prod não encontrado. Crie o arquivo com as configurações de produção."
    exit 1
fi

# Verificar se as senhas foram alteradas
if grep -q "CHANGE_THIS" .env_prod; then
    log_error "Ainda existem senhas padrão no arquivo .env_prod. Altere todas as senhas antes do deploy."
    exit 1
fi

log_info "Iniciando deploy em produção..."

# 1. Criar diretórios necessários
log_info "Criando diretórios necessários..."
sudo mkdir -p /var/log/obreiro
sudo mkdir -p ./backups
sudo chown -R $USER:$USER /var/log/obreiro
sudo chown -R $USER:$USER ./backups

# 2. Parar containers existentes
log_info "Parando containers existentes..."
docker-compose -f docker-compose.prod.yml down --remove-orphans || true

# 3. Limpar volumes antigos se solicitado
read -p "Deseja limpar volumes antigos? Isso apagará todos os dados! (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_warning "Removendo volumes antigos..."
    docker-compose -f docker-compose.prod.yml down -v
    docker volume prune -f
fi

# 4. Build das imagens
log_info "Fazendo build das imagens..."
docker-compose -f docker-compose.prod.yml build --no-cache

# 5. Executar testes de configuração
log_info "Validando configuração..."
docker-compose -f docker-compose.prod.yml config > /dev/null
log_success "Configuração validada com sucesso!"

# 6. Iniciar serviços básicos (database, redis)
log_info "Iniciando serviços básicos..."
docker-compose -f docker-compose.prod.yml up -d postgres redis

# 7. Aguardar serviços ficarem prontos
log_info "Aguardando serviços ficarem prontos..."
sleep 15

# 8. Verificar health dos serviços básicos
log_info "Verificando health dos serviços..."
if ! docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U obreiro_prod -d obreiro_prod; then
    log_error "PostgreSQL não está respondendo!"
    exit 1
fi

if ! docker-compose -f docker-compose.prod.yml exec redis redis-cli ping; then
    log_error "Redis não está respondendo!"
    exit 1
fi

log_success "Serviços básicos funcionando!"

# 9. Iniciar backend e executar migrações
log_info "Iniciando backend..."
docker-compose -f docker-compose.prod.yml up -d backend

# 10. Aguardar backend ficar pronto
log_info "Aguardando backend ficar pronto..."
sleep 20

# 11. Verificar se o backend está funcionando
log_info "Verificando backend..."
for i in {1..30}; do
    if docker-compose -f docker-compose.prod.yml exec backend curl -f http://localhost:8000/api/v1/health/ > /dev/null 2>&1; then
        log_success "Backend está funcionando!"
        break
    fi
    if [ $i -eq 30 ]; then
        log_error "Backend não respondeu após 30 tentativas!"
        docker-compose -f docker-compose.prod.yml logs backend
        exit 1
    fi
    sleep 2
done

# 12. Build do frontend
log_info "Fazendo build do frontend..."
docker-compose -f docker-compose.prod.yml up --no-deps frontend-build
docker-compose -f docker-compose.prod.yml rm -f frontend-build

# 13. Iniciar todos os serviços
log_info "Iniciando todos os serviços..."
docker-compose -f docker-compose.prod.yml up -d

# 14. Verificação final
log_info "Verificando todos os serviços..."
sleep 30

# Verificar se todos os containers estão rodando
CONTAINERS_RUNNING=$(docker-compose -f docker-compose.prod.yml ps --services --filter "status=running" | wc -l)
TOTAL_CONTAINERS=$(docker-compose -f docker-compose.prod.yml ps --services | wc -l)

if [ "$CONTAINERS_RUNNING" -eq "$TOTAL_CONTAINERS" ]; then
    log_success "Todos os containers estão rodando!"
else
    log_warning "Alguns containers podem não estar rodando. Verificando logs..."
    docker-compose -f docker-compose.prod.yml ps
fi

# 15. Instruções finais
log_success "Deploy concluído!"
echo
log_info "Próximos passos:"
echo "1. Configure o SSL com Let's Encrypt:"
echo "   sudo certbot --nginx -d obreiro.digital -d www.obreiro.digital"
echo
echo "2. Configure renovação automática do SSL:"
echo "   sudo crontab -e"
echo "   Adicione: 0 12 * * * /usr/bin/certbot renew --quiet"
echo
echo "3. Configure backup automático:"
echo "   ./scripts/backup.sh"
echo
echo "4. Monitore os logs:"
echo "   docker-compose -f docker-compose.prod.yml logs -f"
echo
log_info "Sistema disponível em:"
echo "- Frontend: https://obreiro.digital"
echo "- API: https://obreiro.digital/api/v1/"
echo "- Admin: https://obreiro.digital/admin/"