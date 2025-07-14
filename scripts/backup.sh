#!/bin/bash

# =================================
# OBREIRO DIGITAL - SCRIPT DE BACKUP
# =================================

set -e

# Configurações
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
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

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se o container do banco está rodando
if ! docker ps | grep -q $DB_CONTAINER; then
    log_error "Container do PostgreSQL ($DB_CONTAINER) não está rodando!"
    exit 1
fi

# Criar diretório de backup se não existir
mkdir -p $BACKUP_DIR

log_info "Iniciando backup do banco de dados..."

# Backup do banco de dados
BACKUP_FILE="$BACKUP_DIR/obreiro_backup_$DATE.sql"
docker exec $DB_CONTAINER pg_dump -U $DB_USER -d $DB_NAME > $BACKUP_FILE

if [ $? -eq 0 ]; then
    log_success "Backup do banco criado: $BACKUP_FILE"
else
    log_error "Falha ao criar backup do banco!"
    exit 1
fi

# Backup dos arquivos de media
log_info "Fazendo backup dos arquivos de media..."
MEDIA_BACKUP="$BACKUP_DIR/media_backup_$DATE.tar.gz"
docker run --rm -v obreiro-digital-landing_media_prod:/media -v $(pwd)/$BACKUP_DIR:/backup alpine tar czf /backup/media_backup_$DATE.tar.gz -C /media .

if [ $? -eq 0 ]; then
    log_success "Backup dos arquivos de media criado: $MEDIA_BACKUP"
else
    log_error "Falha ao criar backup dos arquivos de media!"
fi

# Comprimir backup do banco
log_info "Comprimindo backup do banco..."
gzip $BACKUP_FILE
COMPRESSED_BACKUP="$BACKUP_FILE.gz"

# Estatísticas do backup
log_info "Estatísticas do backup:"
echo "- Backup do banco: $(ls -lh $COMPRESSED_BACKUP | awk '{print $5}')"
echo "- Backup dos arquivos: $(ls -lh $MEDIA_BACKUP | awk '{print $5}' 2>/dev/null || echo 'N/A')"

# Limpeza de backups antigos (manter apenas os últimos 7 dias)
log_info "Limpando backups antigos (mantendo últimos 7 dias)..."
find $BACKUP_DIR -name "obreiro_backup_*.sql.gz" -mtime +7 -delete
find $BACKUP_DIR -name "media_backup_*.tar.gz" -mtime +7 -delete

log_success "Backup concluído com sucesso!"

# Verificar integridade do backup
log_info "Verificando integridade do backup..."
if gzip -t $COMPRESSED_BACKUP; then
    log_success "Backup do banco está íntegro!"
else
    log_error "Backup do banco está corrompido!"
    exit 1
fi