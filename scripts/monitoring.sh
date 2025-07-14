#!/bin/bash

# =================================
# OBREIRO DIGITAL - SCRIPT DE MONITORAMENTO
# =================================

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

log_header() {
    echo -e "${PURPLE}=== $1 ===${NC}"
}

# Função para verificar status de container
check_container() {
    local container=$1
    if docker ps --filter "name=$container" --format "table {{.Names}}\t{{.Status}}" | grep -q "Up"; then
        log_success "$container está rodando"
        return 0
    else
        log_error "$container não está rodando"
        return 1
    fi
}

# Função para verificar health check
check_health() {
    local container=$1
    local health=$(docker inspect --format='{{.State.Health.Status}}' $container 2>/dev/null)
    if [ "$health" = "healthy" ]; then
        log_success "$container está saudável"
        return 0
    elif [ "$health" = "unhealthy" ]; then
        log_error "$container não está saudável"
        return 1
    else
        log_warning "$container sem health check configurado"
        return 0
    fi
}

# Função para verificar uso de recursos
check_resources() {
    local container=$1
    local stats=$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" $container 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo -e "${BLUE}Recursos do $container:${NC}"
        echo "$stats" | tail -n +2
    fi
}

# Função para verificar logs recentes
check_logs() {
    local container=$1
    local errors=$(docker logs $container --since=1h 2>&1 | grep -i "error\|exception\|fail" | wc -l)
    if [ $errors -gt 0 ]; then
        log_warning "$container tem $errors erros na última hora"
    else
        log_success "$container sem erros na última hora"
    fi
}

# Função para verificar conectividade
check_connectivity() {
    log_info "Verificando conectividade..."
    
    # API Health Check
    if curl -f -s http://localhost:8000/api/v1/health/ > /dev/null; then
        log_success "API está respondendo"
    else
        log_error "API não está respondendo"
    fi
    
    # Verificar se o site está acessível
    if curl -f -s http://localhost/health > /dev/null; then
        log_success "Site está acessível"
    else
        log_error "Site não está acessível"
    fi
}

# Função para verificar espaço em disco
check_disk_space() {
    log_info "Verificando espaço em disco..."
    
    # Espaço total
    df -h / | tail -n +2 | while read line; do
        usage=$(echo $line | awk '{print $5}' | sed 's/%//')
        if [ $usage -gt 80 ]; then
            log_warning "Disco está $usage% cheio"
        else
            log_success "Disco está $usage% cheio"
        fi
    done
    
    # Espaço dos volumes Docker
    echo -e "${BLUE}Uso dos volumes:${NC}"
    docker system df --format "table {{.Type}}\t{{.TotalCount}}\t{{.Size}}\t{{.Reclaimable}}"
}

# Função para verificar backup
check_backup() {
    local backup_dir="./backups"
    local latest_backup=$(ls -t $backup_dir/obreiro_backup_*.sql.gz 2>/dev/null | head -n1)
    
    if [ -z "$latest_backup" ]; then
        log_error "Nenhum backup encontrado"
        return 1
    fi
    
    local backup_age=$(find $backup_dir -name "obreiro_backup_*.sql.gz" -mtime -1 | wc -l)
    if [ $backup_age -gt 0 ]; then
        log_success "Backup recente encontrado (últimas 24h)"
    else
        log_warning "Último backup tem mais de 24h"
    fi
    
    echo -e "${BLUE}Último backup:${NC} $(basename $latest_backup)"
    echo -e "${BLUE}Tamanho:${NC} $(ls -lh $latest_backup | awk '{print $5}')"
}

# Menu principal
show_menu() {
    echo -e "${PURPLE}=== OBREIRO DIGITAL - MONITORAMENTO ===${NC}"
    echo "1. Status geral"
    echo "2. Logs em tempo real"
    echo "3. Recursos do sistema"
    echo "4. Verificar backups"
    echo "5. Reiniciar serviço"
    echo "6. Limpar logs"
    echo "7. Sair"
    echo -n "Escolha uma opção: "
}

# Função principal de monitoramento
main_monitoring() {
    log_header "STATUS DOS CONTAINERS"
    
    # Containers a verificar
    containers=("obreiro_postgres_prod" "obreiro_redis_prod" "obreiro_backend_prod" "obreiro_celery_prod" "obreiro_celery_beat_prod" "obreiro_nginx_prod")
    
    for container in "${containers[@]}"; do
        check_container $container
        check_health $container
        check_logs $container
        echo
    done
    
    log_header "CONECTIVIDADE"
    check_connectivity
    echo
    
    log_header "RECURSOS"
    check_disk_space
    echo
    
    log_header "BACKUPS"
    check_backup
}

# Função para mostrar logs em tempo real
show_logs() {
    echo "Escolha o serviço para ver os logs:"
    echo "1. Backend"
    echo "2. Celery"
    echo "3. Nginx"
    echo "4. PostgreSQL"
    echo "5. Redis"
    echo "6. Todos"
    echo -n "Opção: "
    read log_option
    
    case $log_option in
        1) docker-compose -f docker-compose.prod.yml logs -f backend ;;
        2) docker-compose -f docker-compose.prod.yml logs -f celery ;;
        3) docker-compose -f docker-compose.prod.yml logs -f nginx ;;
        4) docker-compose -f docker-compose.prod.yml logs -f postgres ;;
        5) docker-compose -f docker-compose.prod.yml logs -f redis ;;
        6) docker-compose -f docker-compose.prod.yml logs -f ;;
        *) echo "Opção inválida" ;;
    esac
}

# Função para mostrar recursos
show_resources() {
    log_header "RECURSOS DOS CONTAINERS"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
}

# Função para reiniciar serviço
restart_service() {
    echo "Escolha o serviço para reiniciar:"
    echo "1. Backend"
    echo "2. Celery"
    echo "3. Nginx"
    echo "4. Todos"
    echo -n "Opção: "
    read restart_option
    
    case $restart_option in
        1) docker-compose -f docker-compose.prod.yml restart backend ;;
        2) docker-compose -f docker-compose.prod.yml restart celery celery-beat ;;
        3) docker-compose -f docker-compose.prod.yml restart nginx ;;
        4) docker-compose -f docker-compose.prod.yml restart ;;
        *) echo "Opção inválida" ;;
    esac
}

# Função para limpar logs
clean_logs() {
    log_warning "Esta operação irá limpar todos os logs dos containers"
    read -p "Deseja continuar? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker system prune -f
        log_success "Logs limpos com sucesso!"
    fi
}

# Menu interativo
if [ $# -eq 0 ]; then
    while true; do
        show_menu
        read option
        case $option in
            1) main_monitoring ;;
            2) show_logs ;;
            3) show_resources ;;
            4) check_backup ;;
            5) restart_service ;;
            6) clean_logs ;;
            7) exit 0 ;;
            *) echo "Opção inválida" ;;
        esac
        echo
        read -p "Pressione Enter para continuar..."
        clear
    done
else
    # Executar monitoramento direto
    main_monitoring
fi