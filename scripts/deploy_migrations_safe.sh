#!/bin/bash
################################################################################
# Script de Deploy Seguro de Migrações - Obreiro Virtual
#
# Este script realiza deploy de migrações Django em produção com:
# - Backup automático antes do deploy
# - Auditoria do banco de dados
# - Validações de integridade
# - Rollback automático em caso de falha
#
# Uso: ./deploy_migrations_safe.sh
# Ambiente: Produção (VPS)
################################################################################

set -e  # Parar em caso de erro
set -u  # Erro em variáveis não definidas

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
BACKUP_DIR="/root/obreiro-backups"
CONTAINER_BACKEND="obreiro_backend_prod"
CONTAINER_DB="obreiro_postgres_prod"
DB_NAME="obreiro_prod"
DB_USER="obreiro_prod"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_pre_migration_${TIMESTAMP}.sql.gz"

################################################################################
# Funções Auxiliares
################################################################################

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_section() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

pause_for_confirmation() {
    read -p "Pressione ENTER para continuar ou Ctrl+C para cancelar..."
}

################################################################################
# Verificações Pré-Deploy
################################################################################

pre_flight_checks() {
    log_section "VERIFICAÇÕES PRÉ-DEPLOY"

    # Verificar se containers estão rodando
    log_info "Verificando containers..."

    if ! docker ps | grep -q "$CONTAINER_BACKEND"; then
        log_error "Container backend não está rodando: $CONTAINER_BACKEND"
        exit 1
    fi

    if ! docker ps | grep -q "$CONTAINER_DB"; then
        log_error "Container postgres não está rodando: $CONTAINER_DB"
        exit 1
    fi

    log_success "Containers estão rodando"

    # Verificar diretório de backup
    if [ ! -d "$BACKUP_DIR" ]; then
        log_info "Criando diretório de backup..."
        mkdir -p "$BACKUP_DIR"
    fi

    # Verificar espaço em disco
    AVAILABLE_SPACE=$(df -BG "$BACKUP_DIR" | awk 'NR==2 {print $4}' | sed 's/G//')
    if [ "$AVAILABLE_SPACE" -lt 1 ]; then
        log_warning "Pouco espaço em disco: ${AVAILABLE_SPACE}GB disponível"
        log_warning "Recomendado: pelo menos 1GB livre"
        pause_for_confirmation
    fi

    log_success "Verificações pré-deploy OK"
}

################################################################################
# Backup do Banco de Dados
################################################################################

create_backup() {
    log_section "CRIANDO BACKUP DO BANCO"

    log_info "Arquivo: $BACKUP_FILE"
    log_info "Executando pg_dump..."

    if docker exec "$CONTAINER_DB" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"; then
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        log_success "Backup criado com sucesso: $BACKUP_SIZE"
    else
        log_error "Falha ao criar backup!"
        exit 1
    fi
}

################################################################################
# Auditoria do Banco de Dados
################################################################################

audit_database() {
    log_section "AUDITORIA DO BANCO DE DADOS"

    log_info "Executando verificações de integridade..."

    AUDIT_RESULT=$(docker exec "$CONTAINER_BACKEND" python -c "
import sys
import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from django.db import connection

cursor = connection.cursor()
errors = []

# 1. Verificar se tabela membershipstatus existe
cursor.execute('''
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'members_membershipstatus'
    )
''')
if not cursor.fetchone()[0]:
    errors.append('CRITICAL: Tabela members_membershipstatus não existe!')

# 2. Verificar migrações duplicadas 0018
cursor.execute('''
    SELECT name FROM django_migrations
    WHERE app = 'members' AND name LIKE '%0018%'
    ORDER BY name
''')
migrations_0018 = cursor.fetchall()
if len(migrations_0018) > 1:
    errors.append(f'CRITICAL: {len(migrations_0018)} migrações 0018 encontradas:')
    for m in migrations_0018:
        errors.append(f'  - {m[0]}')

# 3. Verificar se migração órfã existe
cursor.execute('''
    SELECT EXISTS (
        SELECT FROM django_migrations
        WHERE app = 'members'
        AND name = '0018_make_cpf_unique_per_church'
    )
''')
if cursor.fetchone()[0]:
    errors.append('WARNING: Migração órfã 0018_make_cpf_unique_per_church encontrada!')

# 4. Verificar colunas da tabela membershipstatus
cursor.execute('''
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'members_membershipstatus'
    ORDER BY ordinal_position
''')
columns = [row[0] for row in cursor.fetchall()]

required_columns = ['id', 'created_at', 'updated_at', 'uuid', 'is_active',
                   'status', 'effective_date', 'end_date', 'observation',
                   'member_id', 'branch_id']

missing_columns = [col for col in required_columns if col not in columns]
if missing_columns:
    errors.append(f'CRITICAL: Colunas faltando em membershipstatus: {missing_columns}')

# Resultado
if errors:
    print('ERRORS:')
    for error in errors:
        print(error)
    sys.exit(1)
else:
    print('OK')
    sys.exit(0)
" 2>&1)

    AUDIT_EXIT_CODE=$?

    if [ $AUDIT_EXIT_CODE -eq 0 ]; then
        log_success "Auditoria OK - Banco de dados está íntegro"
    else
        log_error "Auditoria FALHOU!"
        echo "$AUDIT_RESULT"
        log_error "Abortando deploy. Corrija os problemas encontrados antes de prosseguir."
        exit 1
    fi
}

################################################################################
# Limpar Migrações Órfãs
################################################################################

clean_orphan_migrations() {
    log_section "LIMPEZA DE MIGRAÇÕES ÓRFÃS"

    log_info "Verificando migração órfã 0018_make_cpf_unique_per_church..."

    ORPHAN_EXISTS=$(docker exec "$CONTAINER_BACKEND" python -c "
import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from django.db import connection
cursor = connection.cursor()
cursor.execute(\"\"\"
    SELECT EXISTS (
        SELECT FROM django_migrations
        WHERE app = 'members' AND name = '0018_make_cpf_unique_per_church'
    )
\"\"\")
print('yes' if cursor.fetchone()[0] else 'no')
")

    if [ "$ORPHAN_EXISTS" == "yes" ]; then
        log_warning "Migração órfã encontrada! Removendo..."

        docker exec "$CONTAINER_BACKEND" python -c "
import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from django.db import connection
cursor = connection.cursor()
cursor.execute(\"\"\"
    DELETE FROM django_migrations
    WHERE app = 'members' AND name = '0018_make_cpf_unique_per_church'
\"\"\")
connection.commit()
print('Migração órfã removida')
"
        log_success "Migração órfã removida com sucesso"
    else
        log_info "Nenhuma migração órfã encontrada"
    fi
}

################################################################################
# Aplicar Migrações
################################################################################

apply_migrations() {
    log_section "APLICANDO MIGRAÇÕES"

    log_info "Executando: python manage.py migrate..."

    if docker exec "$CONTAINER_BACKEND" python manage.py migrate --no-input 2>&1 | tee /tmp/migration_output.log; then
        log_success "Migrações aplicadas com sucesso!"
    else
        log_error "ERRO ao aplicar migrações!"
        log_error "Veja o log acima para detalhes"
        return 1
    fi
}

################################################################################
# Validação Pós-Deploy
################################################################################

post_deploy_validation() {
    log_section "VALIDAÇÃO PÓS-DEPLOY"

    log_info "Executando Django checks..."
    if docker exec "$CONTAINER_BACKEND" python manage.py check; then
        log_success "Django checks OK"
    else
        log_warning "Django checks reportaram problemas (pode ser OK)"
    fi

    log_info "Verificando aplicação..."
    if docker exec "$CONTAINER_BACKEND" curl -f -s http://localhost:8000/api/v1/ > /dev/null; then
        log_success "API respondendo corretamente"
    else
        log_warning "API não está respondendo (verificar manualmente)"
    fi

    log_success "Validação pós-deploy concluída"
}

################################################################################
# Rollback
################################################################################

rollback() {
    log_section "EXECUTANDO ROLLBACK"

    log_warning "Restaurando backup: $BACKUP_FILE"

    if gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER_DB" psql -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
        log_success "Backup restaurado com sucesso"
    else
        log_error "ERRO ao restaurar backup!"
        log_error "Restaure manualmente usando:"
        log_error "gunzip -c $BACKUP_FILE | docker exec -i $CONTAINER_DB psql -U $DB_USER -d $DB_NAME"
        exit 1
    fi

    # Reiniciar containers
    log_info "Reiniciando containers..."
    docker restart "$CONTAINER_BACKEND" > /dev/null
    sleep 5

    log_success "Rollback completo!"
    exit 1
}

################################################################################
# Main
################################################################################

main() {
    clear
    log_section "DEPLOY SEGURO DE MIGRAÇÕES - OBREIRO VIRTUAL"
    echo "Timestamp: $TIMESTAMP"
    echo "Backup: $BACKUP_FILE"
    echo ""
    log_warning "Este script irá:"
    echo "  1. Criar backup do banco de dados"
    echo "  2. Auditar integridade do banco"
    echo "  3. Limpar migrações órfãs (se existirem)"
    echo "  4. Aplicar novas migrações"
    echo "  5. Validar aplicação"
    echo "  6. Fazer rollback automático em caso de erro"
    echo ""
    pause_for_confirmation

    # Executar etapas
    pre_flight_checks
    create_backup
    audit_database
    clean_orphan_migrations

    log_section "PRONTO PARA APLICAR MIGRAÇÕES"
    log_warning "ÚLTIMA CHANCE PARA CANCELAR!"
    log_info "Backup está em: $BACKUP_FILE"
    pause_for_confirmation

    if apply_migrations; then
        post_deploy_validation

        log_section "DEPLOY CONCLUÍDO COM SUCESSO! 🎉"
        log_success "Backup mantido em: $BACKUP_FILE"
        log_info "Você pode deletar o backup após validar que tudo está funcionando"
    else
        log_error "ERRO NO DEPLOY!"
        log_warning "Iniciando rollback automático..."
        sleep 3
        rollback
    fi
}

# Executar
main "$@"
