# Deploy e Containerização - Obreiro Digital
## Guia Completo para VPS Ubuntu com Docker Compose

### 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura do Deploy](#arquitetura-do-deploy)
3. [Estrutura de Ambientes](#estrutura-de-ambientes)
4. [Configuração dos Serviços](#configuração-dos-serviços)
5. [Arquivos de Configuração](#arquivos-de-configuração)
6. [Processo de Deploy](#processo-de-deploy)
7. [Monitoramento e Manutenção](#monitoramento-e-manutenção)
8. [Troubleshooting](#troubleshooting)

---

## 🏗️ Visão Geral

Este documento detalha a implementação completa do deploy do sistema **Obreiro Digital** em ambiente de produção usando:

- **VPS Ubuntu 22.04 LTS**
- **Docker & Docker Compose**
- **NGINX** (Proxy reverso + Arquivos estáticos)
- **Gunicorn** (Servidor WSGI para Django)
- **PostgreSQL** (Banco de dados)
- **Redis** (Cache + Broker Celery)

### 🎯 Objetivos
- Deploy automatizado com zero downtime
- Separação clara entre ambientes DEV e PROD
- Segurança e performance otimizadas
- Backup automático e recovery
- Monitoramento e logs centralizados

---

## 🏛️ Arquitetura do Deploy

```
Internet (443/80)
       ↓
   NGINX (Container)
       ↓
┌─────────────────┬─────────────────┐
│  Static Files   │   API Requests  │
│   (React App)   │   (/api/v1/*)   │
└─────────────────┴─────────────────┘
                         ↓
                  Gunicorn (Container)
                    Django Backend
                         ↓
               ┌─────────┴─────────┐
               ↓                   ↓
        PostgreSQL            Redis
        (Container)         (Container)
               ↓                   ↓
         [Volume Data]      [Celery Worker]
```

### 🔧 Componentes

| Serviço | Responsabilidade | Porta | Volume |
|---------|------------------|-------|---------|
| **nginx** | Proxy reverso, SSL, arquivos estáticos | 80, 443 | `/var/www/html` |
| **backend** | API Django + Gunicorn | 8000 (interno) | `/app/media`, `/app/staticfiles` |
| **postgres** | Banco de dados principal | 5432 (interno) | `/var/lib/postgresql/data` |
| **redis** | Cache + Broker Celery | 6379 (interno) | `/data` |
| **celery** | Processamento assíncrono | - | - |

---

## 🌍 Estrutura de Ambientes

### 📁 Organização de Arquivos

```
obreiro-digital-landing/
├── .env_dev                    # Variáveis de desenvolvimento
├── .env_prod                   # Variáveis de produção
├── docker-compose.dev.yml      # Compose para desenvolvimento
├── docker-compose.prod.yml     # Compose para produção
├── docker/
│   ├── nginx/
│   │   ├── dev.conf            # Config NGINX dev
│   │   ├── prod.conf           # Config NGINX prod
│   │   └── ssl/                # Certificados SSL
│   ├── backend/
│   │   ├── Dockerfile          # Dockerfile do Django
│   │   └── entrypoint.sh       # Script de inicialização
│   └── frontend/
│       └── Dockerfile          # Dockerfile do React
├── scripts/
│   ├── deploy_dev.sh           # Script deploy desenvolvimento
│   ├── deploy_prod.sh          # Script deploy produção
│   ├── backup.sh               # Script de backup
│   └── restore.sh              # Script de restore
└── backend/
    └── config/
        └── settings/
            ├── dev.py          # Settings desenvolvimento
            └── prod.py         # Settings produção
```

### 🔐 Variáveis de Ambiente

#### `.env_dev` (Desenvolvimento)
```bash
# Django
DJANGO_SETTINGS_MODULE=config.settings.dev
DJANGO_SECRET_KEY=dev-secret-key-change-in-production
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0

# Database
DATABASE_URL=postgres://dev_user:dev_pass@postgres:5432/obreiro_dev

# Redis
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/2
CELERY_RESULT_BACKEND=redis://redis:6379/3

# CORS
CORS_ALLOW_ALL_ORIGINS=True

# Email (desenvolvimento)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

#### `.env_prod` (Produção)
```bash
# Django
DJANGO_SETTINGS_MODULE=config.settings.prod
DJANGO_SECRET_KEY=${GENERATE_SECURE_KEY}
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=obreiro.digital,www.obreiro.digital

# Database
DATABASE_URL=postgres://prod_user:${SECURE_DB_PASSWORD}@postgres:5432/obreiro_prod

# Redis
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/2
CELERY_RESULT_BACKEND=redis://redis:6379/3

# CORS
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=https://obreiro.digital,https://www.obreiro.digital

# Email (produção)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=${EMAIL_USER}
EMAIL_HOST_PASSWORD=${EMAIL_PASSWORD}

# SSL
SSL_CERT_PATH=/etc/letsencrypt/live/obreiro.digital/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/obreiro.digital/privkey.pem
```

---

## ⚙️ Configuração dos Serviços

### 🐳 Docker Compose - Desenvolvimento

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: obreiro_dev
      POSTGRES_USER: dev_user
      POSTGRES_PASSWORD: dev_pass
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    volumes:
      - redis_dev_data:/data
    ports:
      - "6379:6379"

  backend:
    build:
      context: .
      dockerfile: docker/backend/Dockerfile
    env_file: .env_dev
    volumes:
      - ./backend:/app
      - media_dev:/app/media
      - staticfiles_dev:/app/staticfiles
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis
    command: python manage.py runserver 0.0.0.0:8000

  frontend:
    build:
      context: .
      dockerfile: docker/frontend/Dockerfile
      target: development
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "5173:5173"
    command: npm run dev -- --host 0.0.0.0

volumes:
  postgres_dev_data:
  redis_dev_data:
  media_dev:
  staticfiles_dev:
```

### 🚀 Docker Compose - Produção

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/prod.conf:/etc/nginx/conf.d/default.conf
      - staticfiles_prod:/var/www/html/static
      - media_prod:/var/www/html/media
      - frontend_build:/var/www/html
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    build:
      context: .
      dockerfile: docker/backend/Dockerfile
      target: production
    env_file: .env_prod
    volumes:
      - media_prod:/app/media
      - staticfiles_prod:/app/staticfiles
    expose:
      - "8000"
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/v1/health/"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:15-alpine
    env_file: .env_prod
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
      - ./backups:/backups
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $POSTGRES_USER -d $POSTGRES_DB"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    volumes:
      - redis_prod_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  celery:
    build:
      context: .
      dockerfile: docker/backend/Dockerfile
      target: production
    env_file: .env_prod
    volumes:
      - media_prod:/app/media
    depends_on:
      - postgres
      - redis
    command: celery -A config worker -l info
    restart: unless-stopped

volumes:
  postgres_prod_data:
  redis_prod_data:
  media_prod:
  staticfiles_prod:
  frontend_build:
```

---

## 📄 Arquivos de Configuração

### 🔧 NGINX - Produção

```nginx
# docker/nginx/prod.conf
upstream backend {
    server backend:8000;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name obreiro.digital www.obreiro.digital;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name obreiro.digital www.obreiro.digital;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/obreiro.digital/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/obreiro.digital/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    # API Routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Auth Routes (stricter rate limiting)
    location /api/v1/auth/ {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Admin
    location /admin/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static Files
    location /static/ {
        alias /var/www/html/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Media Files
    location /media/ {
        alias /var/www/html/media/;
        expires 1M;
        add_header Cache-Control "public";
    }

    # Frontend (React App)
    location / {
        root /var/www/html;
        index index.html;
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public";
    }

    # Health Check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### 🐍 Dockerfile - Backend

```dockerfile
# docker/backend/Dockerfile
FROM python:3.11-slim as base

# Configurações do sistema
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instalar dependências Python
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Desenvolvimento
FROM base as development
COPY backend/ .
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# Produção
FROM base as production
COPY backend/ .
COPY docker/backend/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Criar usuário não-root
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8000
ENTRYPOINT ["/entrypoint.sh"]
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120", "config.wsgi:application"]
```

### 🚀 Script de Inicialização

```bash
#!/bin/bash
# docker/backend/entrypoint.sh

set -e

echo "Starting Obreiro Digital Backend..."

# Aguardar banco de dados
echo "Waiting for database..."
while ! python manage.py check --database default; do
    sleep 1
done

# Migrations
echo "Running migrations..."
python manage.py migrate --noinput

# Coletar arquivos estáticos
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Criar superuser se não existir
echo "Creating superuser if not exists..."
python manage.py shell -c "
from django.contrib.auth import get_user_model;
User = get_user_model();
User.objects.filter(email='admin@obreiro.digital').exists() or \
User.objects.create_superuser('admin@obreiro.digital', 'admin@123')
"

# Popular denominações
echo "Populating denominations..."
python manage.py populate_denominations

echo "Backend ready!"
exec "$@"
```

---

## 🚀 Processo de Deploy

### 📋 Checklist Pré-Deploy

- [ ] VPS configurado com Ubuntu 22.04 LTS
- [ ] Docker e Docker Compose instalados
- [ ] Domínio apontando para o servidor
- [ ] Firewall configurado (80, 443, 22)
- [ ] Certificados SSL (Let's Encrypt)
- [ ] Backup do banco atual (se aplicável)

### 🛠️ Scripts de Deploy

#### Script de Deploy Produção
```bash
#!/bin/bash
# scripts/deploy_prod.sh

set -e

echo "🚀 Iniciando deploy de produção..."

# Backup antes do deploy
echo "📦 Criando backup..."
./scripts/backup.sh

# Pull das últimas mudanças
echo "📥 Atualizando código..."
git pull origin main

# Build das imagens
echo "🔨 Construindo imagens..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Deploy com zero downtime
echo "🚀 Executando deploy..."
docker-compose -f docker-compose.prod.yml up -d

# Verificar saúde dos serviços
echo "🏥 Verificando saúde dos serviços..."
sleep 30
docker-compose -f docker-compose.prod.yml ps

# Limpar imagens antigas
echo "🧹 Limpando imagens antigas..."
docker image prune -f

echo "✅ Deploy concluído com sucesso!"
echo "🌐 Site disponível em: https://obreiro.digital"
```

#### Script de Backup
```bash
#!/bin/bash
# scripts/backup.sh

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="backup_${TIMESTAMP}.sql"

echo "📦 Iniciando backup..."

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Backup do banco
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > "$BACKUP_DIR/$BACKUP_FILE"

# Backup dos arquivos de média
tar -czf "$BACKUP_DIR/media_${TIMESTAMP}.tar.gz" -C docker/volumes media_prod

# Manter apenas os últimos 7 backups
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "media_*.tar.gz" -mtime +7 -delete

echo "✅ Backup salvo em: $BACKUP_DIR/$BACKUP_FILE"
```

---

## 📊 Monitoramento e Manutenção

### 🔍 Health Checks

```python
# backend/apps/core/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db import connection
from django.core.cache import cache

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    status = {}
    
    # Check database
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        status['database'] = 'healthy'
    except Exception as e:
        status['database'] = f'error: {str(e)}'
    
    # Check cache
    try:
        cache.set('health_check', 'ok', 30)
        if cache.get('health_check') == 'ok':
            status['cache'] = 'healthy'
        else:
            status['cache'] = 'error'
    except Exception as e:
        status['cache'] = f'error: {str(e)}'
    
    return Response(status)
```

### 📈 Logs e Monitoramento

```bash
# Visualizar logs em tempo real
docker-compose -f docker-compose.prod.yml logs -f

# Logs específicos de um serviço
docker-compose -f docker-compose.prod.yml logs -f backend

# Monitorar recursos
docker stats

# Verificar saúde dos containers
docker-compose -f docker-compose.prod.yml ps
```

---

## 🔧 Troubleshooting

### 🚨 Problemas Comuns

#### 1. Container não inicia
```bash
# Verificar logs
docker-compose -f docker-compose.prod.yml logs [service]

# Verificar recursos
df -h
free -h
docker system df
```

#### 2. Banco de dados não conecta
```bash
# Testar conexão
docker-compose -f docker-compose.prod.yml exec backend python manage.py check --database default

# Verificar status do PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres pg_isready
```

#### 3. NGINX não serve arquivos
```bash
# Verificar configuração
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# Recarregar configuração
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

### 🔄 Comandos de Manutenção

```bash
# Reiniciar serviços
docker-compose -f docker-compose.prod.yml restart

# Atualizar apenas um serviço
docker-compose -f docker-compose.prod.yml up -d --no-deps backend

# Limpar sistema
docker system prune -f
docker volume prune -f

# Restaurar backup
./scripts/restore.sh backup_20231215_143000.sql
```

---

## 📋 Checklist Final

### ✅ Desenvolvimento
- [ ] Containers sobem corretamente
- [ ] Hot reload funcionando
- [ ] Banco de dados acessível
- [ ] API respondendo
- [ ] Frontend carregando

### ✅ Produção
- [ ] SSL configurado
- [ ] Domínio funcionando
- [ ] Health checks passando
- [ ] Backups automáticos
- [ ] Logs sendo gerados
- [ ] Performance otimizada

---

**Criado em:** {data_atual}  
**Versão:** 1.0  
**Mantenedor:** Equipe Obreiro Digital