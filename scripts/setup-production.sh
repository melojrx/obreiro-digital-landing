#!/bin/bash
# =================================
# OBREIRO DIGITAL - SETUP PRODUÇÃO
# =================================

set -e

echo "🚀 Configurando VPS para Obreiro Digital..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[SETUP]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se é root
if [ "$EUID" -ne 0 ]; then
    error "Este script deve ser executado como root"
    error "Execute: sudo ./scripts/setup-production.sh"
    exit 1
fi

log "Criando diretórios necessários..."

# Criar diretórios de logs
mkdir -p /var/log/obreiro
mkdir -p /var/log/nginx

# Criar diretórios para backups
mkdir -p /opt/obreiro/backups

# Definir permissões corretas
chown -R 1000:1000 /var/log/obreiro
chmod -R 755 /var/log/obreiro

chown -R 101:101 /var/log/nginx
chmod -R 755 /var/log/nginx

chown -R 1000:1000 /opt/obreiro/backups
chmod -R 755 /opt/obreiro/backups

log "Verificando certificados SSL..."

# Verificar se certificados existem
if [ ! -f "/etc/letsencrypt/live/obreirovirtual.com/fullchain.pem" ]; then
    warn "Certificado SSL para obreirovirtual.com não encontrado!"
    warn "Execute: sudo certbot --nginx -d obreirovirtual.com -d www.obreirovirtual.com"
else
    log "Certificados SSL encontrados ✅"
fi

log "Verificando Docker e Docker Compose..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    error "Docker não está instalado!"
    error "Instale o Docker primeiro: https://docs.docker.com/engine/install/"
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose não está instalado!"
    error "Instale o Docker Compose primeiro"
    exit 1
fi

log "Criando arquivo de environment de produção..."

# Verificar se .env_prod existe
if [ ! -f ".env_prod" ]; then
    warn "Arquivo .env_prod não encontrado!"
    warn "Certifique-se de configurar as variáveis de ambiente antes de subir"
else
    log "Arquivo .env_prod encontrado ✅"
    
    # Verificar se há valores padrão que precisam ser alterados
    if grep -q "CHANGE_THIS" .env_prod; then
        warn "Ainda existem valores 'CHANGE_THIS' no .env_prod!"
        warn "Configure as seguintes variáveis:"
        grep "CHANGE_THIS" .env_prod
        echo ""
    fi
fi

log "Configurando systemd service (opcional)..."

# Criar service do systemd
cat > /etc/systemd/system/obreiro-digital.service << EOF
[Unit]
Description=Obreiro Digital
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/obreiro
ExecStart=/usr/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker-compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

log "Configurando logrotate..."

# Configurar logrotate para os logs
cat > /etc/logrotate.d/obreiro-digital << EOF
/var/log/obreiro/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 1000 1000
}

/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 101 101
    postrotate
        docker exec obreiro_nginx_prod nginx -s reload 2>/dev/null || true
    endscript
}
EOF

log "Setup concluído! ✅"
echo ""
log "Próximos passos:"
echo "1. Configure o .env_prod com valores reais"
echo "2. Se não tiver SSL: sudo certbot --nginx -d obreirovirtual.com -d www.obreirovirtual.com"
echo "3. Execute: docker-compose -f docker-compose.prod.yml up -d"
echo "4. Para auto-start: sudo systemctl enable obreiro-digital"
echo ""
warn "Lembre-se de configurar firewall se necessário:"
echo "sudo ufw allow 80"
echo "sudo ufw allow 443"
echo "sudo ufw allow 22"