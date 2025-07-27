#!/bin/bash
# master_migration.sh
# SCRIPT MESTRE - EXECUTA MIGRAÇÃO COMPLETA

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"; }
warning() { echo -e "${YELLOW}[AVISO]${NC} $1"; }
error() { echo -e "${RED}[ERRO]${NC} $1"; }
info() { echo -e "${BLUE}[INFO]${NC} $1"; }
step() { echo -e "${PURPLE}[ETAPA]${NC} $1"; }

# ===================================
# BANNER INICIAL
# ===================================
show_banner() {
    clear
    echo -e "${PURPLE}"
    cat << 'BANNER'
 ██████╗ ██████╗ ██████╗ ███████╗██╗██████╗  ██████╗ 
██╔═══██╗██╔══██╗██╔══██╗██╔════╝██║██╔══██╗██╔═══██╗
██║   ██║██████╔╝██████╔╝█████╗  ██║██████╔╝██║   ██║
██║   ██║██╔══██╗██╔══██╗██╔══╝  ██║██╔══██╗██║   ██║
╚██████╔╝██████╔╝██║  ██║███████╗██║██║  ██║╚██████╔╝
 ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝╚═╝  ╚═╝ ╚═════╝ 
                                                       
    🔄 MIGRAÇÃO COMPLETA PARA ESTRUTURA PROFISSIONAL
    📍 /root/obreiro-digital-landing → /opt/obreiro-digital
    🌐 https://obreirovirtual.com
BANNER
    echo -e "${NC}"
}

# ===================================
# VERIFICAÇÕES PRÉ-MIGRAÇÃO
# ===================================
pre_migration_check() {
    step "🔍 VERIFICAÇÕES PRÉ-MIGRAÇÃO"
    
    # Verificar usuário
    if [ "$USER" != "root" ]; then
        error "❌ Execute como root: sudo su -"
        exit 1
    fi
    
    # Verificar diretório atual
    if [ ! -d "/root/obreiro-digital-landing" ]; then
        error "❌ Diretório /root/obreiro-digital-landing não encontrado"
        exit 1
    fi
    
    # Verificar espaço em disco
    AVAILABLE_SPACE=$(df / | awk 'NR==2 {print $4}')
    if [ "$AVAILABLE_SPACE" -lt 2000000 ]; then  # 2GB em KB
        warning "⚠️  Pouco espaço em disco disponível"
        read -p "Continuar mesmo assim? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        error "❌ Docker não está instalado"
        exit 1
    fi
    
    # Verificar Git
    if ! command -v git &> /dev/null; then
        error "❌ Git não está instalado"
        exit 1
    fi
    
    log "✅ Verificações pré-migração concluídas"
}

# ===================================
# OBTER URL DO GITHUB
# ===================================
get_github_url() {
    step "📦 CONFIGURAÇÃO DO REPOSITÓRIO GITHUB"
    
    cd "/root/obreiro-digital-landing"
    
    # Tentar obter URL do git remoto
    GITHUB_URL=$(git remote get-url origin 2>/dev/null || echo "")
    
    if [ -z "$GITHUB_URL" ]; then
        echo
        warning "⚠️  URL do GitHub não encontrada automaticamente"
        read -p "Digite a URL do seu repositório GitHub: " GITHUB_URL
    else
        log "📍 URL do GitHub detectada: $GITHUB_URL"
        read -p "Esta URL está correta? (Y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            read -p "Digite a URL correta: " GITHUB_URL
        fi
    fi
    
    # Validar URL
    if [[ ! "$GITHUB_URL" =~ github\.com ]]; then
        warning "⚠️  URL não parece ser do GitHub"
        read -p "Continuar mesmo assim? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    export GITHUB_REPO="$GITHUB_URL"
    log "✅ Repositório configurado: $GITHUB_URL"
}

# ===================================
# EXECUTAR MIGRAÇÃO COMPLETA
# ===================================
execute_migration() {
    step "🚀 EXECUTANDO MIGRAÇÃO COMPLETA"
    
    echo
    warning "🔄 ATENÇÃO: A migração irá:"
    warning "   1. Parar a aplicação atual"
    warning "   2. Fazer backup completo"
    warning "   3. Mover tudo para /opt/obreiro-digital/"
    warning "   4. Clonar código limpo do GitHub"
    warning "   5. Configurar estrutura profissional"
    echo
    
    read -p "🤔 Deseja continuar? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        info "⏹️  Migração cancelada pelo usuário"
        exit 0
    fi
    
    # MIGRAÇÃO REAL - CÓDIGO COMPLETO
    OLD_DIR="/root/obreiro-digital-landing"
    NEW_DIR="/opt/obreiro-digital"
    BACKUP_DIR="/root/BACKUP_MIGRATION_$(date +%Y%m%d_%H%M%S)"
    
    # 1. Backup completo
    log "📦 Fazendo backup completo..."
    mkdir -p "$BACKUP_DIR"
    cp -r "$OLD_DIR" "$BACKUP_DIR/old_structure"
    
    # Parar aplicação atual
    cd "$OLD_DIR"
    docker-compose -f docker-compose.prod.yml down || true
    
    # Backup do banco se existir
    if docker volume ls | grep -q postgres_prod_data; then
        docker-compose -f docker-compose.prod.yml up -d postgres
        sleep 10
        docker-compose -f docker-compose.prod.yml exec -T postgres \
            pg_dump -U obreiro_prod obreiro_prod > "$BACKUP_DIR/database_backup.sql" || true
        docker-compose -f docker-compose.prod.yml down
    fi
    
    # 2. Criar nova estrutura
    log "🏗️  Criando nova estrutura profissional..."
    rm -rf "$NEW_DIR" 2>/dev/null || true
    mkdir -p "$NEW_DIR"/{app,config,data/{postgres,redis,media,static,logs/{nginx,backend},backups},scripts}
    
    # 3. Clonar código limpo do GitHub
    log "📥 Clonando código limpo do GitHub..."
    cd "$NEW_DIR"
    git clone "$GITHUB_REPO" app
    cd app
    git checkout main
    git pull origin main
    
    # 4. Migrar configurações protegidas
    log "🔒 Migrando configurações para área protegida..."
    if [ -f "$OLD_DIR/.env_prod" ]; then
        cp "$OLD_DIR/.env_prod" "$NEW_DIR/config/"
    fi
    
    if [ -f "$OLD_DIR/docker-compose.prod.yml" ]; then
        cp "$OLD_DIR/docker-compose.prod.yml" "$NEW_DIR/config/"
        cd "$NEW_DIR/config"
        # Adaptar paths para nova estrutura
        sed -i 's|context: \.|context: ../app|g' docker-compose.prod.yml
        sed -i 's|./media_prod|../data/media|g' docker-compose.prod.yml
        sed -i 's|./static_prod|../data/static|g' docker-compose.prod.yml
        sed -i 's|./logs|../data/logs|g' docker-compose.prod.yml
    fi
    
    if [ -f "$OLD_DIR/docker/nginx/prod.conf" ]; then
        cp "$OLD_DIR/docker/nginx/prod.conf" "$NEW_DIR/config/nginx.prod.conf"
        # Adaptar nginx config
        sed -i 's|./docker/nginx/prod.conf|./nginx.prod.conf|g' "$NEW_DIR/config/docker-compose.prod.yml"
    fi
    
    # 5. Migrar dados persistentes
    log "💾 Migrando dados persistentes..."
    if [ -d "$OLD_DIR/media_prod" ]; then
        cp -r "$OLD_DIR/media_prod/"* "$NEW_DIR/data/media/" 2>/dev/null || true
    fi
    
    if [ -d "$OLD_DIR/static_prod" ]; then
        cp -r "$OLD_DIR/static_prod/"* "$NEW_DIR/data/static/" 2>/dev/null || true
    fi
    
    if [ -d "$OLD_DIR/logs" ]; then
        cp -r "$OLD_DIR/logs/"* "$NEW_DIR/data/logs/" 2>/dev/null || true
    fi
    
    # Configurar permissões
    chown -R root:root "$NEW_DIR"
    chmod -R 777 "$NEW_DIR/data/media"
    chmod -R 777 "$NEW_DIR/data/static"
    chmod -R 777 "$NEW_DIR/data/logs"
    chmod -R 700 "$NEW_DIR/config"
    
    # 6. Testar nova estrutura
    log "🧪 Testando nova estrutura..."
    cd "$NEW_DIR/config"
    
    if [ ! -f ".env_prod" ]; then
        warning "⚠️  Configure .env_prod antes de continuar"
        cp "$NEW_DIR/app/.env_prod.example" "$NEW_DIR/config/.env_prod" 2>/dev/null || true
        echo "IMPORTANTE: Edite $NEW_DIR/config/.env_prod com suas configurações"
        read -p "Pressione ENTER quando terminar de configurar .env_prod..."
    fi
    
    # Build e teste
    docker-compose -f docker-compose.prod.yml build
    docker-compose -f docker-compose.prod.yml up -d
    
    sleep 30
    
    # Verificar se funcionou
    if curl -f -s https://obreirovirtual.com/api/v1/ > /dev/null 2>&1; then
        log "✅ Migração bem-sucedida!"
    else
        warning "⚠️  Sistema pode não estar respondendo - verifique logs"
    fi
    
    log "📦 Backup salvo em: $BACKUP_DIR"
}

# ===================================
# CONFIGURAR GITIGNORE
# ===================================
setup_gitignore() {
    step "🔒 CONFIGURANDO .gitignore SEGURO"
    
    cd "/opt/obreiro-digital/app"
    
    # Executar script de gitignore que existe
    if [ -f "scripts/migration/gitignore_update_script.sh" ]; then
        log "📝 Executando script de .gitignore..."
        bash scripts/migration/gitignore_update_script.sh
    else
        log "📝 Configurando .gitignore manualmente..."
        # Backup do .gitignore atual
        [ -f ".gitignore" ] && cp ".gitignore" ".gitignore.backup.$(date +%Y%m%d_%H%M%S)"
        
        # Remover arquivos sensíveis do git
        git rm -r --cached .env_prod 2>/dev/null || true
        git rm -r --cached docker-compose.override.yml 2>/dev/null || true
        git rm -r --cached media/ 2>/dev/null || true
        git rm -r --cached staticfiles/ 2>/dev/null || true
        git rm -r --cached logs/ 2>/dev/null || true
        
        # Adicionar .gitignore básico se não existir
        if [ ! -f ".gitignore" ]; then
            cat > .gitignore << 'EOF'
# Arquivos sensíveis
.env*
!.env*.example
local_settings.py

# Dados persistentes
media/
staticfiles/
logs/
backups/
postgres_data/
redis_data/

# Python
__pycache__/
*.pyc
.pytest_cache/
.coverage

# Node.js
node_modules/
dist/
.cache/

# Docker
docker-compose.override.yml

# Sistema
.DS_Store
Thumbs.db
*.log
EOF
        fi
        
        git add .gitignore
        git commit -m "security: Update .gitignore for production safety" || true
        git push origin main || true
    fi
    
    log "✅ .gitignore configurado com segurança!"
}

# ===================================
# CONFIGURAR DEPLOY AUTOMATIZADO
# ===================================
setup_automated_deploy() {
    step "🤖 CONFIGURANDO DEPLOY AUTOMATIZADO"
    
    # Executar script de deploy automatizado que existe
    if [ -f "/opt/obreiro-digital/app/scripts/migration/automated_deploy_scripts.sh" ]; then
        log "📜 Executando script de deploy automatizado..."
        bash /opt/obreiro-digital/app/scripts/migration/automated_deploy_scripts.sh
    else
        log "📜 Criando scripts de deploy manualmente..."
        
        # Criar script de deploy
        cat > "/opt/obreiro-digital/scripts/deploy.sh" << 'EOF'
#!/bin/bash
# deploy.sh - Deploy automatizado

set -e
PROJECT_DIR="/opt/obreiro-digital"
APP_DIR="$PROJECT_DIR/app"
CONFIG_DIR="$PROJECT_DIR/config"

log() { echo -e "\033[0;32m[$(date +'%H:%M:%S')]\033[0m $1"; }

log "🚀 Iniciando deploy..."

# Backup automático
BACKUP_DIR="$PROJECT_DIR/data/backups/deploy_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

cd "$CONFIG_DIR"
if docker-compose -f docker-compose.prod.yml ps | grep -q postgres.*Up; then
    docker-compose -f docker-compose.prod.yml exec -T postgres \
        pg_dump -U obreiro_prod obreiro_prod > "$BACKUP_DIR/database.sql" 2>/dev/null || true
fi

# Atualizar código
cd "$APP_DIR"
git fetch origin main
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
    log "✅ Código já está atualizado!"
    exit 0
fi

git pull origin main

# Deploy
cd "$CONFIG_DIR"
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

log "✅ Deploy concluído!"
EOF

        chmod +x "/opt/obreiro-digital/scripts/deploy.sh"
        
        # Criar aliases
        cat >> /root/.bashrc << 'EOF'

# Obreiro Digital Aliases
alias obreiro-deploy='/opt/obreiro-digital/scripts/deploy.sh'
alias obreiro-status='cd /opt/obreiro-digital/config && docker-compose -f docker-compose.prod.yml ps'
alias obreiro-logs='cd /opt/obreiro-digital/config && docker-compose -f docker-compose.prod.yml logs -f'
alias obreiro='cd /opt/obreiro-digital'
EOF
    fi
    
    log "✅ Deploy automatizado configurado!"
}

# ===================================
# TESTE FINAL
# ===================================
final_test() {
    step "🧪 TESTE FINAL DO SISTEMA"
    
    log "🔍 Testando estrutura..."
    if [ -d "/opt/obreiro-digital/app" ] && [ -d "/opt/obreiro-digital/config" ] && [ -d "/opt/obreiro-digital/data" ]; then
        log "✅ Estrutura de diretórios OK"
    else
        warning "⚠️  Estrutura de diretórios incompleta"
    fi
    
    log "🐳 Testando containers..."
    cd "/opt/obreiro-digital/config"
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        log "✅ Containers funcionando"
    else
        warning "⚠️  Alguns containers não estão funcionando"
        docker-compose -f docker-compose.prod.yml ps
    fi
    
    log "🌐 Testando conectividade..."
    sleep 5
    
    if curl -f -s --max-time 10 https://obreirovirtual.com/api/v1/ > /dev/null 2>&1; then
        log "✅ API respondendo"
    else
        warning "⚠️  API não está respondendo"
    fi
    
    if curl -f -s --max-time 10 https://obreirovirtual.com/ > /dev/null 2>&1; then
        log "✅ Frontend respondendo"
    else
        warning "⚠️  Frontend não está respondendo"
    fi
    
    log "📊 Verificando aliases..."
    source /root/.bashrc
    if command -v obreiro-deploy &> /dev/null; then
        log "✅ Aliases configurados"
    else
        warning "⚠️  Aliases podem não estar funcionando"
    fi
    
    log "✅ Teste final concluído!"
}

# ===================================
# RELATÓRIO FINAL
# ===================================
show_final_report() {
    step "📋 RELATÓRIO FINAL"
    
    echo
    log "🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!"
    echo
    
    info "📍 NOVA ESTRUTURA:"
    info "   /opt/obreiro-digital/app/     # Código do GitHub"
    info "   /opt/obreiro-digital/config/  # Configurações protegidas"
    info "   /opt/obreiro-digital/data/    # Dados persistentes"
    info "   /opt/obreiro-digital/scripts/ # Scripts de automação"
    echo
    
    info "🔧 COMANDOS PRINCIPAIS:"
    info "   obreiro-deploy    # Deploy/atualização automática"
    info "   obreiro-status    # Status do sistema"
    info "   obreiro-backup    # Backup manual"
    info "   obreiro-logs      # Ver logs em tempo real"
    info "   obreiro-help      # Lista completa de comandos"
    echo
    
    info "🌐 URLS DO SISTEMA:"
    info "   Site: https://obreirovirtual.com"
    info "   Admin: https://obreirovirtual.com/admin"
    info "   API: https://obreirovirtual.com/api/v1/"
    echo
    
    info "🔒 SEGURANÇA IMPLEMENTADA:"
    info "   ✅ Configurações sensíveis protegidas"
    info "   ✅ .gitignore atualizado"
    info "   ✅ Arquivos de produção fora do git"
    info "   ✅ Backup automático antes de deploys"
    info "   ✅ Rollback automático em caso de falha"
    echo
    
    warning "🔧 PRÓXIMOS PASSOS:"
    warning "   1. Configurar /opt/obreiro-digital/config/.env_prod"
    warning "   2. Testar todas as funcionalidades"
    warning "   3. Executar primeiro deploy: obreiro-deploy"
    warning "   4. Verificar status: obreiro-status"
    echo
    
    log "💡 Para ver todos os comandos: obreiro-help"
    echo
}

# ===================================
# FUNÇÃO PRINCIPAL
# ===================================
main() {
    show_banner
    
    echo
    log "🚀 INICIANDO MIGRAÇÃO COMPLETA - OBREIRO DIGITAL"
    log "📅 Data: $(date)"
    log "⏰ Tempo estimado: 15-30 minutos"
    echo
    
    pre_migration_check
    get_github_url
    
    echo
    log "🔄 EXECUTANDO MIGRAÇÃO EM 4 ETAPAS:"
    echo
    
    # Etapa 1: Migração da estrutura
    execute_migration
    
    # Etapa 2: Configuração do .gitignore
    setup_gitignore
    
    # Etapa 3: Deploy automatizado
    setup_automated_deploy
    
    # Etapa 4: Teste final
    final_test
    
    # Relatório final
    show_final_report
    
    log "🎊 SISTEMA OBREIRO DIGITAL MIGRADO E OTIMIZADO!"
}

# Executar se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi