#!/bin/bash

# =================================
# OBREIRO DIGITAL - VALIDADOR DE GITIGNORE
# =================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

log_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Contador de problemas
ISSUES=0

log_header "VALIDAÇÃO DO GITIGNORE"

# 1. Verificar se arquivos sensíveis estão sendo ignorados
log_info "Verificando arquivos sensíveis..."

SENSITIVE_FILES=(
    ".env"
    ".env_dev"
    ".env_prod"
    ".env.local"
    "secrets.json"
    "credentials.json"
    "local_settings.py"
)

for file in "${SENSITIVE_FILES[@]}"; do
    if [ -f "$file" ]; then
        if git check-ignore "$file" > /dev/null 2>&1; then
            log_success "$file está sendo ignorado corretamente"
        else
            log_error "$file EXISTE mas NÃO está sendo ignorado!"
            ((ISSUES++))
        fi
    fi
done

# 2. Verificar se diretórios de build estão sendo ignorados
log_info "Verificando diretórios de build..."

BUILD_DIRS=(
    "frontend/node_modules"
    "frontend/dist"
    "backend/__pycache__"
    "backend/media"
    "backend/staticfiles"
    "backups"
)

for dir in "${BUILD_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        if git check-ignore "$dir" > /dev/null 2>&1; then
            log_success "$dir está sendo ignorado corretamente"
        else
            log_error "$dir EXISTE mas NÃO está sendo ignorado!"
            ((ISSUES++))
        fi
    fi
done

# 3. Verificar se não há arquivos sensíveis commitados
log_info "Verificando histórico por arquivos sensíveis..."

SENSITIVE_PATTERNS=(
    "password"
    "secret"
    "key"
    "token"
    "credentials"
    "SECRET_KEY"
    "DATABASE_URL"
    "POSTGRES_PASSWORD"
)

for pattern in "${SENSITIVE_PATTERNS[@]}"; do
    if git log --all --grep="$pattern" --oneline | grep -qi "$pattern"; then
        log_warning "Possível referência a '$pattern' encontrada no histórico de commits"
    fi
done

# 4. Verificar se arquivos de exemplo existem
log_info "Verificando arquivos de exemplo..."

EXAMPLE_FILES=(
    ".env_dev.example"
    ".env_prod.example"
)

for file in "${EXAMPLE_FILES[@]}"; do
    if [ -f "$file" ]; then
        if git check-ignore "$file" > /dev/null 2>&1; then
            log_error "$file deveria estar no repositório, mas está sendo ignorado!"
            ((ISSUES++))
        else
            log_success "$file está presente e será versionado"
        fi
    else
        log_warning "$file não existe - considere criar um template"
    fi
done

# 5. Verificar tamanho do repositório
log_info "Verificando tamanho do repositório..."

REPO_SIZE=$(du -sh .git 2>/dev/null | cut -f1)
log_info "Tamanho do repositório: $REPO_SIZE"

# 6. Verificar se há arquivos grandes não ignorados
log_info "Verificando arquivos grandes..."

LARGE_FILES=$(find . -type f -size +10M -not -path "./.git/*" -not -path "./node_modules/*" -not -path "./backend/media/*" -not -path "./backups/*" 2>/dev/null || true)

if [ -n "$LARGE_FILES" ]; then
    log_warning "Arquivos grandes encontrados:"
    echo "$LARGE_FILES"
    log_warning "Considere adicioná-los ao .gitignore se apropriado"
fi

# 7. Verificar se há logs sendo versionados
log_info "Verificando logs..."

LOG_FILES=$(find . -name "*.log" -not -path "./.git/*" 2>/dev/null || true)

if [ -n "$LOG_FILES" ]; then
    for log_file in $LOG_FILES; do
        if git check-ignore "$log_file" > /dev/null 2>&1; then
            log_success "$log_file está sendo ignorado"
        else
            log_warning "$log_file não está sendo ignorado"
        fi
    done
fi

# 8. Verificar certificados SSL
log_info "Verificando certificados SSL..."

SSL_FILES=$(find . -name "*.crt" -o -name "*.key" -o -name "*.pem" -not -path "./.git/*" 2>/dev/null || true)

if [ -n "$SSL_FILES" ]; then
    for ssl_file in $SSL_FILES; do
        if git check-ignore "$ssl_file" > /dev/null 2>&1; then
            log_success "$ssl_file está sendo ignorado"
        else
            log_error "$ssl_file NÃO está sendo ignorado - RISCO DE SEGURANÇA!"
            ((ISSUES++))
        fi
    done
fi

# 9. Verificar cache de desenvolvimento
log_info "Verificando cache de desenvolvimento..."

CACHE_DIRS=(
    ".cache"
    ".pytest_cache"
    ".mypy_cache"
    ".eslintcache"
    "node_modules/.cache"
)

for dir in "${CACHE_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        if git check-ignore "$dir" > /dev/null 2>&1; then
            log_success "$dir está sendo ignorado"
        else
            log_warning "$dir não está sendo ignorado"
        fi
    fi
done

# Resumo final
log_header "RESUMO"

if [ $ISSUES -eq 0 ]; then
    log_success "✅ Nenhum problema crítico encontrado!"
    log_success "O .gitignore está funcionando corretamente."
else
    log_error "❌ $ISSUES problema(s) crítico(s) encontrado(s)!"
    log_error "Revise o .gitignore e corrija os problemas antes de fazer commit."
    exit 1
fi

log_info "📋 Recomendações:"
echo "- Sempre rode este script antes de fazer commits importantes"
echo "- Revise periodicamente o .gitignore conforme o projeto evolui"
echo "- Mantenha os arquivos .example atualizados"
echo "- Monitore o tamanho do repositório"

log_success "🎉 Validação concluída com sucesso!"