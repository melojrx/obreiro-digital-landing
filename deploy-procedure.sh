#!/bin/bash
# ============================================
# OBREIRO DIGITAL - PROCEDIMENTO DE DEPLOY SEGURO
# ============================================
# Este script implementa um procedimento completo e seguro
# para atualizar o sistema em produção com zero downtime

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

# Função para verificar saúde do sistema
check_system_health() {
    log "🏥 Verificando saúde do sistema..."
    
    # Verificar se todos os containers estão rodando
    if ! docker compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        error "Alguns containers não estão rodando!"
    fi
    
    # Verificar resposta da API (401 é esperado para endpoints protegidos)
    API_CODE=$(curl -s -w "%{http_code}" -o /dev/null "https://www.obreirovirtual.com/api/v1/")
    if [ "$API_CODE" = "401" ] || [ "$API_CODE" = "200" ]; then
        success "API respondendo corretamente (código: $API_CODE)"
    else
        error "API não está respondendo! (código: $API_CODE)"
    fi
    
    # Verificar resposta do frontend
    if curl -f -s -o /dev/null "https://www.obreirovirtual.com/"; then
        success "Frontend respondendo corretamente"
    else
        error "Frontend não está respondendo!"
    fi
}

# Função para criar backup completo
create_full_backup() {
    log "💾 Criando backup completo..."
    
    BACKUP_DIR="backups/deploy_$(date +'%Y%m%d_%H%M%S')"
    mkdir -p "$BACKUP_DIR"
    
    # Backup de configurações
    cp .env_prod "$BACKUP_DIR/.env_prod.backup" 2>/dev/null || warning ".env_prod não encontrado"
    cp frontend/.env.prod "$BACKUP_DIR/frontend.env.prod.backup" 2>/dev/null || true
    cp docker-compose.prod.yml "$BACKUP_DIR/docker-compose.prod.yml.backup"
    
    # Backup do banco de dados
    log "Fazendo backup do banco de dados..."
    docker exec obreiro_postgres_prod pg_dump -U obreiro_prod obreiro_prod > "$BACKUP_DIR/database_backup.sql"
    
    # Salvar commit atual
    git rev-parse HEAD > "$BACKUP_DIR/git_commit.txt"
    
    # Salvar lista de imagens Docker atuais
    docker images | grep obreiro > "$BACKUP_DIR/docker_images.txt"
    
    success "Backup completo criado em: $BACKUP_DIR"
    echo "$BACKUP_DIR" > /tmp/last_backup_dir.txt
}

# Função para validar alterações
validate_changes() {
    log "🔍 Analisando alterações pendentes..."
    
    # Mostrar commits que serão aplicados
    info "Commits a serem aplicados:"
    git log --oneline HEAD..origin/main
    
    # Verificar se há conflitos
    if ! git merge-tree $(git merge-base HEAD origin/main) HEAD origin/main | grep -q "<<<<<<< "; then
        success "Nenhum conflito detectado"
    else
        error "Conflitos detectados! Resolva manualmente antes de continuar."
    fi
    
    # Perguntar confirmação
    echo ""
    warning "⚠️  ATENÇÃO: Você está prestes a atualizar o sistema em PRODUÇÃO!"
    echo -e "${YELLOW}Deseja continuar? (s/N)${NC}"
    read -r response
    if [[ ! "$response" =~ ^[Ss]$ ]]; then
        warning "Deploy cancelado pelo usuário"
        exit 0
    fi
}

# Função para aplicar atualizações com zero downtime
apply_updates_zero_downtime() {
    log "🚀 Iniciando atualização com zero downtime..."
    
    # 1. Garantir variáveis de ambiente corretas
    log "Verificando variáveis de ambiente..."
    if ! grep -q "FRONTEND_URL=https://www.obreirovirtual.com" .env_prod; then
        sed -i '/^FRONTEND_URL=/d' .env_prod
        echo "FRONTEND_URL=https://www.obreirovirtual.com" >> .env_prod
        success "FRONTEND_URL corrigido"
    fi
    
    # 2. Pull do código
    log "Baixando código do GitHub..."
    git pull origin main || error "Falha ao fazer pull"
    
    # 3. Build do novo backend (sem parar o atual)
    log "Construindo nova imagem do backend..."
    docker compose -f docker-compose.prod.yml build backend
    
    # 4. Build do novo frontend
    log "Construindo novo frontend..."
    docker compose -f docker-compose.prod.yml build frontend-build
    docker compose -f docker-compose.prod.yml run --rm frontend-build
    
    # 5. Aplicar migrações (se houver)
    log "Aplicando migrações do banco..."
    docker compose -f docker-compose.prod.yml run --rm backend python manage.py migrate --noinput
    
    # 6. Coletar arquivos estáticos
    log "Coletando arquivos estáticos..."
    docker compose -f docker-compose.prod.yml run --rm backend python manage.py collectstatic --noinput
    
    # 7. Atualizar containers com estratégia rolling
    log "Atualizando containers..."
    
    # Backend - Rolling update
    docker compose -f docker-compose.prod.yml up -d --no-deps --scale backend=2 backend
    sleep 10  # Aguardar novo container ficar saudável
    docker compose -f docker-compose.prod.yml up -d --no-deps --scale backend=1 backend
    
    # Celery workers
    docker compose -f docker-compose.prod.yml up -d --no-deps celery celery-beat
    
    # Nginx (última atualização)
    docker compose -f docker-compose.prod.yml up -d --no-deps nginx
    
    # 8. Corrigir permissões
    log "Corrigindo permissões..."
    chown -R 999:999 media_prod/
    chmod -R 755 media_prod/
    
    # 9. Limpar cache
    log "Limpando cache..."
    docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
    
    # 10. Limpar recursos antigos
    log "Limpando recursos antigos..."
    docker image prune -f
}

# Função para validação pós-deploy
post_deploy_validation() {
    log "✅ Executando validações pós-deploy..."
    
    sleep 10  # Aguardar estabilização
    
    # Verificar saúde novamente
    check_system_health
    
    # Verificar logs por erros
    log "Verificando logs por erros..."
    if docker compose -f docker-compose.prod.yml logs --tail=50 backend | grep -i error; then
        warning "Erros encontrados nos logs do backend"
    fi
    
    # Testar funcionalidades críticas
    log "Testando funcionalidades críticas..."
    
    # Teste de login (simulado)
    if curl -s -X POST "https://www.obreirovirtual.com/api/v1/auth/login/" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@test.com","password":"test"}' | grep -q "email"; then
        success "Endpoint de login respondendo"
    else
        warning "Verificar manualmente o endpoint de login"
    fi
    
    # Verificar novos arquivos estáticos
    if [ -f "frontend_build/index.html" ]; then
        success "Build do frontend criado com sucesso"
    else
        error "Build do frontend não encontrado!"
    fi
}

# Função para rollback
rollback() {
    error "Iniciando processo de rollback..."
    
    if [ -f "/tmp/last_backup_dir.txt" ]; then
        BACKUP_DIR=$(cat /tmp/last_backup_dir.txt)
        
        # Voltar ao commit anterior
        if [ -f "$BACKUP_DIR/git_commit.txt" ]; then
            PREVIOUS_COMMIT=$(cat "$BACKUP_DIR/git_commit.txt")
            git checkout "$PREVIOUS_COMMIT"
        fi
        
        # Restaurar configurações
        cp "$BACKUP_DIR/.env_prod.backup" .env_prod 2>/dev/null || true
        cp "$BACKUP_DIR/frontend.env.prod.backup" frontend/.env.prod 2>/dev/null || true
        
        # Rebuild com versão anterior
        docker compose -f docker-compose.prod.yml up -d --build
        
        warning "Rollback executado. Verifique o sistema!"
    else
        error "Backup não encontrado para rollback!"
    fi
}

# Função principal
main() {
    clear
    echo "============================================"
    echo "   OBREIRO DIGITAL - DEPLOY EM PRODUÇÃO    "
    echo "============================================"
    echo ""
    
    # Verificar se está no diretório correto
    if [ ! -f "docker-compose.prod.yml" ]; then
        error "Execute este script no diretório raiz do projeto"
    fi
    
    # Etapa 1: Verificação inicial
    info "📊 ETAPA 1/6: Verificação inicial do sistema"
    check_system_health
    
    # Etapa 2: Backup
    info "💾 ETAPA 2/6: Criando backup completo"
    create_full_backup
    
    # Etapa 3: Validação
    info "🔍 ETAPA 3/6: Validando alterações"
    validate_changes
    
    # Etapa 4: Aplicar atualizações
    info "🚀 ETAPA 4/6: Aplicando atualizações"
    apply_updates_zero_downtime || rollback
    
    # Etapa 5: Validação pós-deploy
    info "✅ ETAPA 5/6: Validação pós-deploy"
    post_deploy_validation
    
    # Etapa 6: Relatório final
    info "📋 ETAPA 6/6: Relatório final"
    echo ""
    success "🎉 Deploy concluído com sucesso!"
    echo ""
    log "📝 Resumo do deploy:"
    echo "   - Backup salvo em: $(cat /tmp/last_backup_dir.txt)"
    echo "   - Commit atual: $(git rev-parse --short HEAD)"
    echo "   - URL: https://www.obreirovirtual.com"
    echo ""
    log "🔍 Próximos passos:"
    echo "   1. Monitore os logs: docker compose -f docker-compose.prod.yml logs -f"
    echo "   2. Teste as novas funcionalidades"
    echo "   3. Verifique métricas de performance"
    echo ""
    warning "Em caso de problemas, execute: ./deploy-procedure.sh rollback"
}

# Verificar se foi solicitado rollback
if [ "$1" == "rollback" ]; then
    rollback
else
    main
fi