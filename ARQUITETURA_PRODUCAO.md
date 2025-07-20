# 🏗️ Arquitetura de Produção - Obreiro Digital

## 📋 Visão Geral

Esta documentação descreve a arquitetura completa e funcional do sistema Obreiro Digital em produção, incluindo toda a configuração, containers, volumes, rede e procedimentos de deployment.

## 🌐 Informações do Ambiente

### Domínio e SSL
- **Domínio Principal**: `obreirovirtual.com`
- **Domínio Alternativo**: `www.obreirovirtual.com`
- **SSL**: Let's Encrypt (certificados automáticos)
- **Protocolo**: HTTPS obrigatório com redirect automático

### Servidor
- **VPS**: Servidor Linux com Docker
- **Localização**: `/root/obreiro-digital-landing/`
- **Sistema**: Ubuntu/Debian com Docker Engine + Docker Compose v2

## 🏛️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    INTERNET (HTTPS)                        │
│                 obreirovirtual.com                          │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                   NGINX (Port 80/443)                      │
│   ┌─────────────────┐  ┌─────────────────┐                 │
│   │   Frontend      │  │   API Proxy     │                 │
│   │   React SPA     │  │   /api/* →      │                 │
│   │   Static Files  │  │   Backend       │                 │
│   └─────────────────┘  └─────────────────┘                 │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│               DOCKER COMPOSE NETWORK                       │
│                   obreiro_prod_network                     │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Backend   │  │ PostgreSQL  │  │    Redis    │        │
│  │  Django API │  │  Database   │  │    Cache    │        │
│  │  Gunicorn   │  │             │  │             │        │
│  │  Port 8000  │  │  Port 5432  │  │  Port 6379  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│         │                                                  │
│  ┌─────────────┐  ┌─────────────┐                         │
│  │   Celery    │  │ Celery Beat │                         │
│  │   Worker    │  │  Scheduler  │                         │
│  │             │  │             │                         │
│  └─────────────┘  └─────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

## 🐳 Containers em Produção

### 1. **nginx** - Proxy Reverso e SSL
```yaml
Container: obreiro_nginx_prod
Image: nginx:alpine
Ports: 80:80, 443:443
Volumes:
  - ./docker/nginx/prod.conf:/etc/nginx/conf.d/default.conf
  - ./static_prod:/var/www/html/static
  - ./media_prod:/var/www/html/media
  - ./frontend_build:/var/www/html
  - /etc/letsencrypt:/etc/letsencrypt:ro
  - ./logs/nginx:/var/log/nginx
```

### 2. **backend** - Django API
```yaml
Container: obreiro_backend_prod
Image: obreiro-digital-landing-backend
Port: 8000 (interno)
Command: gunicorn --bind 0.0.0.0:8000 --workers 3 --timeout 120 config.wsgi:application
Volumes:
  - ./media_prod:/app/media
  - ./static_prod:/app/staticfiles
  - ./logs/backend:/var/log/obreiro
Environment: .env_prod
```

### 3. **postgres** - Banco de Dados
```yaml
Container: obreiro_postgres_prod
Image: postgres:15-alpine
Port: 5432 (interno)
Database: obreiro_prod
User: obreiro_prod
Volumes:
  - postgres_prod_data:/var/lib/postgresql/data
  - ./backups:/backups
```

### 4. **redis** - Cache e Broker
```yaml
Container: obreiro_redis_prod
Image: redis:7-alpine
Port: 6379 (interno)
Volumes:
  - redis_prod_data:/var/lib/redis/data
```

### 5. **celery** - Worker Assíncrono
```yaml
Container: obreiro_celery_prod
Image: obreiro-digital-landing-celery
Command: celery -A config worker -l info --concurrency=2
Volumes:
  - ./media_prod:/app/media
  - ./logs/backend:/var/log/obreiro
```

### 6. **celery-beat** - Agendador de Tarefas
```yaml
Container: obreiro_celery_beat_prod
Image: obreiro-digital-landing-celery-beat
Command: celery -A config beat -l info
Volumes:
  - ./media_prod:/app/media
  - ./logs/backend:/var/log/obreiro
```

## 📁 Estrutura de Diretórios

```
/root/obreiro-digital-landing/
├── 📄 docker-compose.prod.yml          # Orquestração de produção
├── 📄 .env_prod                        # Variáveis de ambiente
├── 📄 ARQUITETURA_PRODUCAO.md          # Esta documentação
├── 📄 CLAUDE.md                        # Instruções para Claude Code
│
├── 📂 backend/                         # Código Django
│   ├── 📂 apps/                        # Apps Django
│   ├── 📂 config/                      # Configurações
│   └── 📄 requirements.txt             # Dependências Python
│
├── 📂 frontend/                        # Código React
│   ├── 📂 src/                         # Código fonte
│   ├── 📄 package.json                 # Dependências Node.js
│   └── 📄 vite.config.ts               # Configuração Vite
│
├── 📂 docker/                          # Configurações Docker
│   ├── 📂 backend/
│   │   ├── 📄 Dockerfile               # Multi-stage build
│   │   └── 📄 entrypoint.sh            # Script de inicialização
│   ├── 📂 frontend/
│   │   └── 📄 Dockerfile               # Build React
│   └── 📂 nginx/
│       └── 📄 prod.conf                # Configuração Nginx
│
├── 📂 scripts/
│   └── 📄 setup-production.sh          # Script de setup VPS
│
├── 📂 static_prod/                     # Arquivos estáticos Django
├── 📂 media_prod/                      # Uploads de usuários
├── 📂 frontend_build/                  # Build React compilado
├── 📂 logs/
│   ├── 📂 backend/                     # Logs Django/Gunicorn
│   └── 📂 nginx/                       # Logs Nginx
└── 📂 backups/                         # Backups banco de dados
```

## ⚙️ Configurações Críticas

### Variáveis de Ambiente (.env_prod)
```env
# Django Core
DJANGO_SETTINGS_MODULE=config.settings.prod
DJANGO_SECRET_KEY=uZ/W1toWTFHsDVZY8wtfdxWM45aaHESGzYIDwaGaPriotlricoRpCFA0x/eMOq38nf8=
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=obreirovirtual.com,www.obreirovirtual.com,localhost,127.0.0.1,backend

# Database PostgreSQL
POSTGRES_PASSWORD=obreiro_prod_2024
DATABASE_URL=postgres://obreiro_prod:obreiro_prod_2024@postgres:5432/obreiro_prod

# Redis Cache & Celery
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/2
CELERY_RESULT_BACKEND=redis://redis:6379/3

# CORS Production
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=https://obreirovirtual.com,https://www.obreirovirtual.com

# Email Backend
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=noreply@obreirovirtual.com
EMAIL_HOST_PASSWORD=temp_password_will_configure_later

# Superuser
DJANGO_SUPERUSER_EMAIL=admin@obreirovirtual.com
DJANGO_SUPERUSER_PASSWORD=ObreiroAdmin2024!

# SSL/TLS
USE_HTTPS=True
SECURE_SSL_REDIRECT=True

# Logging
DJANGO_LOG_LEVEL=INFO
```

### Nginx - Configuração de Produção
```nginx
upstream backend {
    server backend:8000;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name obreirovirtual.com www.obreirovirtual.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name obreirovirtual.com www.obreirovirtual.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/obreirovirtual.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/obreirovirtual.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # API Routes
    location /api/ {
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

## 🚀 Procedimentos de Deploy

### 1. Setup Inicial da VPS
```bash
# Executar como root
sudo ./scripts/setup-production.sh

# O script configura:
# - Diretórios necessários
# - Permissões corretas
# - Logrotate
# - Systemd service (opcional)
```

### 2. Deploy da Aplicação
```bash
# Parar containers existentes
docker compose -f docker-compose.prod.yml down

# Rebuild e iniciar
docker compose -f docker-compose.prod.yml up -d --build

# Verificar status
docker compose -f docker-compose.prod.yml ps
```

### 3. Comandos de Manutenção
```bash
# Ver logs
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f nginx

# Backup do banco
docker exec obreiro_postgres_prod pg_dump -U obreiro_prod obreiro_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Criar usuários de teste (apenas desenvolvimento)
docker exec obreiro_backend_prod python manage.py create_test_users

# Limpar usuários de teste
docker exec obreiro_backend_prod python manage.py create_test_users --clean

# Restart de serviços específicos
docker compose -f docker-compose.prod.yml restart backend
docker compose -f docker-compose.prod.yml restart nginx
```

## 👥 Usuários de Teste (Desenvolvimento)

**Senha padrão**: `teste123`

| Email | Papel | Descrição |
|-------|--------|-----------|
| `denominacao.admin@teste.com` | DENOMINATION_ADMIN | Administrador da denominação |
| `igreja.admin@teste.com` | CHURCH_ADMIN | Administrador da igreja sede |
| `igreja.filha.admin@teste.com` | CHURCH_ADMIN | Administrador da igreja filha |
| `pastor@teste.com` | PASTOR | Pastor da igreja |
| `secretario@teste.com` | SECRETARY | Secretário da igreja |
| `lider@teste.com` | LEADER | Líder de filial |
| `membro@teste.com` | MEMBER | Membro comum |
| `readonly@teste.com` | READ_ONLY | Somente leitura |

## 🔒 Segurança

### Headers de Segurança
- HSTS (Strict Transport Security)
- X-Frame-Options: SAMEORIGIN
- X-XSS-Protection: 1; mode=block
- X-Content-Type-Options: nosniff
- Referrer-Policy: no-referrer-when-downgrade

### SSL/TLS
- Certificados Let's Encrypt automáticos
- Protocolos: TLSv1.2, TLSv1.3
- Redirect HTTP → HTTPS obrigatório

### Django Security
- DEBUG=False em produção
- ALLOWED_HOSTS configurado corretamente
- CORS restrito aos domínios de produção
- SECRET_KEY único e seguro

## 📊 Monitoramento

### Health Checks
- **Nginx**: `curl https://obreirovirtual.com/health`
- **Backend**: `curl https://obreirovirtual.com/api/v1/`
- **Containers**: `docker compose -f docker-compose.prod.yml ps`

### Logs
- **Nginx**: `./logs/nginx/access.log`, `./logs/nginx/error.log`
- **Django**: `./logs/backend/django.log`
- **Container Logs**: `docker compose -f docker-compose.prod.yml logs <service>`

### Backup
- **Banco de Dados**: Volume persistente + backups manuais em `./backups/`
- **Media Files**: Volume local em `./media_prod/`
- **Static Files**: Regenerados automaticamente em `./static_prod/`

## 🛠️ Troubleshooting

### Problemas Comuns

#### 1. Backend não inicia
```bash
# Verificar logs
docker compose -f docker-compose.prod.yml logs backend

# Problemas comuns:
# - Permissões dos volumes (logs, media, static)
# - ALLOWED_HOSTS incorreto
# - Conexão com PostgreSQL
# - Gunicorn não instalado
```

#### 2. API retorna 400/500
```bash
# Verificar ALLOWED_HOSTS no .env_prod
# Deve incluir: obreirovirtual.com,www.obreirovirtual.com,backend

# Verificar se Django aceita o hostname
docker exec obreiro_backend_prod curl -H "Host: obreirovirtual.com" http://localhost:8000/api/v1/
```

#### 3. Frontend não carrega
```bash
# Verificar se build foi criado
ls -la frontend_build/

# Recriar build
docker compose -f docker-compose.prod.yml up frontend-build
```

#### 4. SSL não funciona
```bash
# Verificar certificados
sudo certbot certificates

# Renovar se necessário
sudo certbot renew
```

## 📈 Performance

### Configurações Otimizadas
- **Gunicorn**: 3 workers, timeout 120s
- **Nginx**: Gzip compression, cache headers
- **PostgreSQL**: Configuração otimizada para produção
- **Redis**: Cache para sessões e dados temporários

### Monitoramento de Resources
```bash
# CPU e Memória dos containers
docker stats

# Espaço em disco
df -h
du -sh ./media_prod ./static_prod ./logs
```

## 🔄 Atualizações

### Deploy de Novas Versões
1. **Pull do código**: `git pull origin main`
2. **Rebuild containers**: `docker compose -f docker-compose.prod.yml up -d --build`
3. **Verificar saúde**: `docker compose -f docker-compose.prod.yml ps`
4. **Testar funcionalidade**: Acessar `https://obreirovirtual.com`

### Rollback
```bash
# Em caso de problemas, voltar para última versão funcionando
git checkout <commit-anterior>
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 📞 Contatos e Suporte

Esta arquitetura foi configurada e testada em **Julho de 2025** e está totalmente funcional.

Para questões técnicas, consulte:
- Este documento para arquitetura
- `CLAUDE.md` para comandos de desenvolvimento
- Logs do sistema em `./logs/`

**Status**: ✅ **PRODUÇÃO FUNCIONAL**
**URL**: https://obreirovirtual.com
**Última atualização**: Julho 2025