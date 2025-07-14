#!/bin/bash

# =================================
# OBREIRO DIGITAL - SCRIPT DE RESTORE
# =================================

set -e

# Configurações
BACKUP_DIR="./backups"
DB_CONTAINER="obreiro_postgres_prod"
DB_NAME="obreiro_prod"
DB_USER="obreiro_prod"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Verificar se o script está sendo executado com parâmetros
if [ $# -eq 0 ]; then
    echo "Uso: $0 <backup_file.sql.gz> [media_backup.tar.gz]"
    echo
    echo "Backups disponíveis:"
    ls -la $BACKUP_DIR/obreiro_backup_*.sql.gz 2>/dev/null || echo "Nenhum backup encontrado"
    exit 1
fi

BACKUP_FILE="$1"
MEDIA_BACKUP="$2"

# Verificar se o arquivo de backup existe
if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Arquivo de backup não encontrado: $BACKUP_FILE"
    exit 1
fi

# Verificar se o container do banco está rodando
if ! docker ps | grep -q $DB_CONTAINER; then
    log_error "Container do PostgreSQL ($DB_CONTAINER) não está rodando!"
    exit 1
fi

# Confirmar operação
log_warning "ATENÇÃO: Esta operação irá substituir todos os dados atuais!"
read -p "Deseja continuar? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Operação cancelada."
    exit 0
fi

# Parar aplicação
log_info "Parando aplicação..."
docker-compose -f docker-compose.prod.yml stop backend celery celery-beat nginx

# Fazer backup atual antes do restore
log_info "Criando backup de segurança dos dados atuais..."
SAFETY_BACKUP="$BACKUP_DIR/safety_backup_$(date +%Y%m%d_%H%M%S).sql"
docker exec $DB_CONTAINER pg_dump -U $DB_USER -d $DB_NAME > $SAFETY_BACKUP
gzip $SAFETY_BACKUP
log_success "Backup de segurança criado: $SAFETY_BACKUP.gz"

# Restaurar banco de dados
log_info "Restaurando banco de dados..."

# Descomprimir backup se necessário
if [[ $BACKUP_FILE == *.gz ]]; then
    TEMP_SQL="/tmp/restore_temp.sql"
    gunzip -c $BACKUP_FILE > $TEMP_SQL
else
    TEMP_SQL=$BACKUP_FILE
fi

# Dropar e recriar banco
docker exec $DB_CONTAINER psql -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
docker exec $DB_CONTAINER psql -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;"

# Restaurar dados
docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME < $TEMP_SQL

if [ $? -eq 0 ]; then
    log_success "Banco de dados restaurado com sucesso!"
else
    log_error "Falha ao restaurar banco de dados!"
    exit 1
fi

# Limpar arquivo temporário
if [[ $BACKUP_FILE == *.gz ]]; then
    rm -f $TEMP_SQL
fi

# Restaurar arquivos de media se fornecido
if [ ! -z "$MEDIA_BACKUP" ] && [ -f "$MEDIA_BACKUP" ]; then
    log_info "Restaurando arquivos de media..."
    
    # Limpar volume de media atual
    docker volume rm obreiro-digital-landing_media_prod 2>/dev/null || true
    docker volume create obreiro-digital-landing_media_prod
    
    # Restaurar arquivos
    docker run --rm -v obreiro-digital-landing_media_prod:/media -v $(pwd)/$BACKUP_DIR:/backup alpine tar xzf /backup/$(basename $MEDIA_BACKUP) -C /media
    
    if [ $? -eq 0 ]; then
        log_success "Arquivos de media restaurados com sucesso!"
    else
        log_error "Falha ao restaurar arquivos de media!"
    fi
else
    log_warning "Backup de media não fornecido ou não encontrado."
fi

# Reiniciar aplicação
log_info "Reiniciando aplicação..."
docker-compose -f docker-compose.prod.yml up -d

# Aguardar aplicação ficar pronta
log_info "Aguardando aplicação ficar pronta..."
sleep 30

# Verificar se tudo está funcionando
log_info "Verificando aplicação..."
if docker-compose -f docker-compose.prod.yml exec backend curl -f http://localhost:8000/api/v1/health/ > /dev/null 2>&1; then
    log_success "Aplicação está funcionando!"
else
    log_error "Aplicação não está respondendo!"
    log_info "Verificando logs:"
    docker-compose -f docker-compose.prod.yml logs backend
    exit 1
fi

log_success "Restore concluído com sucesso!"
log_info "Backup de segurança mantido em: $SAFETY_BACKUP.gz"