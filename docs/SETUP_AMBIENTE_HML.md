# 🚀 Guia Completo: Ambiente de Homologação (HML)

**Sistema:** Obreiro Virtual  
**Ambiente:** Homologação (Staging)  
**URL:** https://hml.obreirovirtual.com  
**Servidor:** VPS Ubuntu com Docker  

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Arquitetura](#arquitetura)
4. [Configuração DNS](#1-configuração-dns)
5. [Estrutura de Diretórios](#2-estrutura-de-diretórios)
6. [Variáveis de Ambiente](#3-variáveis-de-ambiente)
7. [Docker Compose HML](#4-docker-compose-hml)
8. [Configuração NGINX](#5-configuração-nginx)
9. [Certificado SSL](#6-certificado-ssl)
10. [Build e Deploy](#7-build-e-deploy)
11. [Verificações](#8-verificações)
12. [Workflow de Atualização](#9-workflow-de-atualização)
13. [Troubleshooting](#10-troubleshooting)
14. [Manutenção](#11-manutenção)

---

## Visão Geral

### Objetivo
Criar um ambiente de homologação isolado na mesma VPS onde roda a produção, permitindo testar novas funcionalidades antes de deployar em produção.

### Conceito
- **Produção**: `www.obreirovirtual.com` (portas internas: backend 8000, postgres 5432)
- **Homologação**: `hml.obreirovirtual.com` (portas internas: backend 8001, postgres 5433)
- **Isolamento**: Containers separados, banco de dados separado, statics separados
- **NGINX**: Um único NGINX com virtual hosts para ambos ambientes

### Benefícios
✅ Teste seguro de novas features  
✅ Validação antes da produção  
✅ Mesmo servidor (economia de custos)  
✅ Ambiente realista (mesma infraestrutura)  
✅ URLs profissionais com SSL  

---

## Pré-requisitos

### Checklist Inicial

```bash
# 1. Acesso SSH à VPS
ssh root@IP_DA_VPS

# 2. Docker e Docker Compose instalados
docker --version
docker compose version

# 3. Produção rodando e funcionando
docker ps | grep obreiro
curl https://www.obreirovirtual.com/health

# 4. Espaço em disco disponível (mínimo 5GB)
df -h

# 5. NGINX instalado e rodando
systemctl status nginx

# 6. Certbot instalado para SSL
certbot --version
```

**⚠️ IMPORTANTE:** Não prossiga se algum dos itens acima falhar!

---

## Arquitetura

### Estrutura de Portas

| Serviço | Produção | Homologação |
|---------|----------|-------------|
| NGINX | 80, 443 | 80, 443 (virtual host) |
| Backend Django | 8000 | 8001 |
| PostgreSQL | 5432 | 5433 |

### Estrutura de Diretórios

```
/root/
├── obreiro-digital-landing/          # Produção
│   ├── docker-compose.prod.yml
│   ├── .env_prod
│   ├── backend/
│   ├── frontend/
│   └── docker/
│
└── obreiro-hml/                      # Homologação
    ├── docker-compose.hml.yml
    ├── .env_hml
    ├── backend/
    ├── frontend/
    ├── docker/
    ├── staticfiles/                  # Statics do Django
    ├── media/                        # Media files
    └── frontend-build/               # Build do React
```

---

## 1. Configuração DNS

### 1.1 Criar Registro DNS

Acesse o painel do seu provedor de domínio (Registro.br, Hostgator, etc.) e adicione:

```
Tipo: A
Nome: hml
Valor: [IP_DA_SUA_VPS]
TTL: 3600
```

### 1.2 Verificar Propagação

Aguarde 5-15 minutos e teste:

```bash
# Teste de resolução DNS
ping hml.obreirovirtual.com

# Verificar IP
nslookup hml.obreirovirtual.com

# Deve retornar o IP da sua VPS
```

**✅ CHECKPOINT:** DNS deve resolver para o IP da VPS antes de prosseguir.

---

## 2. Estrutura de Diretórios

### 2.1 Criar Diretório Base

```bash
# Conectar à VPS
ssh root@IP_DA_VPS

# Criar diretório para HML
cd /root
mkdir -p obreiro-hml
cd obreiro-hml
```

### 2.2 Clonar Repositório

```bash
# Opção 1: Clonar do GitHub (recomendado)
git clone https://github.com/melojrx/obreiro-digital-landing.git .

# Opção 2: Copiar da produção
# cp -r /root/obreiro-digital-landing/* /root/obreiro-hml/

# Verificar estrutura
ls -la
# Deve mostrar: backend/, frontend/, docker/, README.md, etc.
```

### 2.3 Criar Diretórios Adicionais

```bash
# Criar diretórios necessários
mkdir -p staticfiles media frontend-build logs backups

# Verificar criação
ls -la
```

**✅ CHECKPOINT:** Estrutura de diretórios criada com sucesso.

---

## 3. Variáveis de Ambiente

### 3.1 Gerar SECRET_KEY

```bash
# Gerar nova SECRET_KEY para HML
python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'

# Copie o resultado, você vai precisar dele no próximo passo
```

### 3.2 Criar .env_hml

```bash
# Criar arquivo de variáveis de ambiente
nano /root/obreiro-hml/.env_hml
```

**Conteúdo do arquivo `.env_hml`:**

```bash
# ================================
# AMBIENTE DE HOMOLOGAÇÃO
# ================================

# Django Core
DJANGO_SETTINGS_MODULE=config.settings.prod
DJANGO_SECRET_KEY=COLE_AQUI_A_SECRET_KEY_GERADA_ACIMA
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=hml.obreirovirtual.com

# Database PostgreSQL
DATABASE_URL=postgresql://obreiro_hml:SenhaSeguraHML123!@postgres_hml:5432/obreiro_hml
POSTGRES_DB=obreiro_hml
POSTGRES_USER=obreiro_hml
POSTGRES_PASSWORD=SenhaSeguraHML123!

# CORS e Frontend
FRONTEND_URL=https://hml.obreirovirtual.com
CORS_ALLOWED_ORIGINS=https://hml.obreirovirtual.com
CORS_ALLOW_CREDENTIALS=True

# Email (Gmail App Password)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=suporteobreirovirtual@gmail.com
EMAIL_HOST_PASSWORD=wgrx_obiv_jefb_cjat
DEFAULT_FROM_EMAIL=Obreiro Virtual HML <suporteobreirovirtual@gmail.com>

# Notificações (Polling em HML)
ENABLE_SSE=false
NOTIFICATION_POLLING_INTERVAL=60000
SSE_CHECK_INTERVAL=3
SSE_HEARTBEAT_INTERVAL=30
SSE_MAX_CONNECTIONS_PER_USER=1

# Redis (se necessário)
REDIS_URL=redis://redis_hml:6379/0

# Celery (se necessário)
CELERY_BROKER_URL=redis://redis_hml:6379/0
CELERY_RESULT_BACKEND=redis://redis_hml:6379/0

# Sentry (opcional - criar projeto separado para HML)
SENTRY_DSN=
SENTRY_ENVIRONMENT=homologation

# Timezone
TZ=America/Fortaleza
```

**⚠️ IMPORTANTE:**
- Substitua `SenhaSeguraHML123!` por uma senha forte
- Cole a SECRET_KEY gerada no passo 3.1
- Remova os underscores da senha do email: `wgrxobivjefbcjat`

### 3.3 Proteger Arquivo

```bash
# Definir permissões adequadas
chmod 600 /root/obreiro-hml/.env_hml

# Verificar conteúdo
cat /root/obreiro-hml/.env_hml
```

**✅ CHECKPOINT:** Arquivo .env_hml criado e protegido.

---

## 4. Docker Compose HML

### 4.1 Criar docker-compose.hml.yml

```bash
nano /root/obreiro-hml/docker-compose.hml.yml
```

**Conteúdo do arquivo:**

```yaml
version: '3.8'

# ================================
# OBREIRO VIRTUAL - HOMOLOGAÇÃO
# ================================

services:
  # ================================
  # PostgreSQL - Banco de Dados
  # ================================
  postgres_hml:
    image: postgres:15-alpine
    container_name: obreiro_postgres_hml
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      TZ: America/Fortaleza
    volumes:
      - postgres_data_hml:/var/lib/postgresql/data
    networks:
      - obreiro_network_hml
    restart: unless-stopped
    ports:
      - "5433:5432"  # Porta diferente da produção
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ================================
  # Backend Django + Gunicorn
  # ================================
  backend_hml:
    build:
      context: .
      dockerfile: docker/backend/Dockerfile
      target: production
    container_name: obreiro_backend_hml
    env_file:
      - .env_hml
    volumes:
      - ./staticfiles:/app/staticfiles
      - ./media:/app/media
      - ./logs:/var/log/obreiro
    depends_on:
      postgres_hml:
        condition: service_healthy
    networks:
      - obreiro_network_hml
    restart: unless-stopped
    ports:
      - "8001:8000"  # Porta diferente da produção
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # ================================
  # Frontend React (Build Stage)
  # ================================
  frontend_hml:
    build:
      context: ./frontend
      dockerfile: ../docker/frontend/Dockerfile
      target: production
      args:
        VITE_API_URL: https://hml.obreirovirtual.com/api/v1
        VITE_ENABLE_SSE: "false"
        VITE_NOTIFICATION_POLLING_INTERVAL: "60000"
    container_name: obreiro_frontend_hml
    volumes:
      - frontend_build_hml:/app/dist
    networks:
      - obreiro_network_hml
    command: ["sh", "-c", "echo 'Frontend build completed'"]

  # ================================
  # Redis (opcional, se usar cache)
  # ================================
  # redis_hml:
  #   image: redis:7-alpine
  #   container_name: obreiro_redis_hml
  #   networks:
  #     - obreiro_network_hml
  #   restart: unless-stopped
  #   volumes:
  #     - redis_data_hml:/data

# ================================
# Volumes Persistentes
# ================================
volumes:
  postgres_data_hml:
    name: obreiro_postgres_data_hml
  frontend_build_hml:
    name: obreiro_frontend_build_hml
  # redis_data_hml:
  #   name: obreiro_redis_data_hml

# ================================
# Rede Isolada
# ================================
networks:
  obreiro_network_hml:
    name: obreiro_network_hml
    driver: bridge
```

**✅ CHECKPOINT:** Arquivo docker-compose.hml.yml criado.

---

## 5. Configuração NGINX

### 5.1 Criar Configuração Virtual Host

```bash
# Criar arquivo de configuração do NGINX
sudo nano /etc/nginx/sites-available/hml.obreirovirtual.com
```

**Conteúdo do arquivo:**

```nginx
# ================================
# OBREIRO VIRTUAL - HOMOLOGAÇÃO
# hml.obreirovirtual.com
# ================================

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name hml.obreirovirtual.com;
    
    # ACME Challenge para certificado SSL
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        allow all;
    }
    
    # Redirecionar tudo para HTTPS
    location / {
        return 301 https://hml.obreirovirtual.com$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name hml.obreirovirtual.com;

    # ================================
    # SSL Configuration
    # ================================
    ssl_certificate /etc/letsencrypt/live/hml.obreirovirtual.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hml.obreirovirtual.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # ================================
    # Security Headers
    # ================================
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header X-Environment "Homologation" always;

    # ================================
    # Gzip Compression
    # ================================
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # ================================
    # Client Configuration
    # ================================
    client_max_body_size 50M;
    client_body_timeout 60s;
    client_header_timeout 60s;

    # ================================
    # API Routes (Backend Django)
    # ================================
    location /api/ {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        
        # Timeouts
        proxy_connect_timeout 75s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
        
        # SSE Configuration (caso habilite no futuro)
        proxy_buffering off;
        proxy_cache off;
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding off;
    }

    # ================================
    # Django Admin
    # ================================
    location /admin/ {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ================================
    # Static Files (Django)
    # ================================
    location /static/ {
        alias /root/obreiro-hml/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # ================================
    # Media Files (Uploads)
    # ================================
    location /media/ {
        alias /root/obreiro-hml/media/;
        expires 1M;
        add_header Cache-Control "public";
    }

    # ================================
    # Frontend React (SPA)
    # ================================
    location / {
        root /root/obreiro-hml/frontend-build;
        index index.html;
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }

    # ================================
    # Health Check
    # ================================
    location /health {
        access_log off;
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
    }

    # ================================
    # Logs
    # ================================
    access_log /var/log/nginx/hml.obreirovirtual.com.access.log;
    error_log /var/log/nginx/hml.obreirovirtual.com.error.log warn;
}
```

### 5.2 Ativar Site

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/hml.obreirovirtual.com /etc/nginx/sites-enabled/

# Verificar configuração do NGINX
sudo nginx -t

# Deve retornar:
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

**⚠️ NÃO RECARREGUE O NGINX AINDA!** Precisamos do certificado SSL primeiro.

**✅ CHECKPOINT:** Configuração NGINX criada e testada.

---

## 6. Certificado SSL

### 6.1 Gerar Certificado Let's Encrypt

```bash
# Parar NGINX temporariamente (se necessário)
# sudo systemctl stop nginx

# Gerar certificado para HML
sudo certbot certonly --nginx -d hml.obreirovirtual.com

# Ou use standalone se preferir:
# sudo certbot certonly --standalone -d hml.obreirovirtual.com

# Siga as instruções:
# 1. Digite seu email
# 2. Aceite os termos
# 3. Aguarde validação
```

### 6.2 Verificar Certificado

```bash
# Verificar se certificados foram criados
sudo ls -la /etc/letsencrypt/live/hml.obreirovirtual.com/

# Deve mostrar:
# cert.pem
# chain.pem
# fullchain.pem
# privkey.pem
```

### 6.3 Testar Renovação Automática

```bash
# Testar renovação (dry-run)
sudo certbot renew --dry-run

# Deve retornar: Congratulations, all simulated renewals succeeded
```

### 6.4 Recarregar NGINX

```bash
# Agora sim, recarregar NGINX
sudo systemctl reload nginx

# Verificar status
sudo systemctl status nginx
```

**✅ CHECKPOINT:** Certificado SSL instalado e NGINX recarregado.

---

## 7. Build e Deploy

### 7.1 Carregar Variáveis de Ambiente

```bash
cd /root/obreiro-hml

# Carregar variáveis no shell
set -a
source .env_hml
set +a

# Verificar se carregou
echo $POSTGRES_DB
# Deve retornar: obreiro_hml
```

### 7.2 Build dos Containers

```bash
# Build completo (primeira vez)
docker compose -f docker-compose.hml.yml build --no-cache

# Verificar se builou com sucesso
# Deve mostrar: Successfully built...
```

### 7.3 Subir Containers

```bash
# Subir todos os serviços
docker compose -f docker-compose.hml.yml up -d

# Verificar containers rodando
docker ps | grep hml

# Deve mostrar:
# obreiro_postgres_hml
# obreiro_backend_hml
# obreiro_frontend_hml
```

### 7.4 Verificar Logs

```bash
# Logs do backend
docker compose -f docker-compose.hml.yml logs -f backend_hml

# Aguarde ver:
# ✅ PostgreSQL conectado!
# 🔄 Executando migrações...
# 📦 Coletando arquivos estáticos...
# 🎉 Backend configurado para ambiente: PRODUÇÃO

# Pressione Ctrl+C para sair dos logs
```

### 7.5 Aplicar Migrações (se necessário)

```bash
# Entrar no container do backend
docker exec -it obreiro_backend_hml bash

# Dentro do container:
python manage.py migrate
python manage.py collectstatic --noinput

# Sair do container
exit
```

### 7.6 Copiar Build do Frontend

```bash
# Copiar build do React para o diretório do NGINX
docker cp obreiro_frontend_hml:/app/dist/. /root/obreiro-hml/frontend-build/

# Ajustar permissões
chmod -R 755 /root/obreiro-hml/frontend-build

# Verificar arquivos
ls -la /root/obreiro-hml/frontend-build/
# Deve mostrar: index.html, assets/, vite.svg, etc.
```

### 7.7 Copiar Statics do Backend

```bash
# Copiar statics para o host (se necessário)
docker cp obreiro_backend_hml:/app/staticfiles/. /root/obreiro-hml/staticfiles/

# Ajustar permissões
chmod -R 755 /root/obreiro-hml/staticfiles
```

### 7.8 Criar Superuser (Opcional)

```bash
# Criar superuser para HML
docker exec -it obreiro_backend_hml python manage.py createsuperuser

# Digite:
# Email: seu-email@example.com
# Password: (senha segura)
# Password (again): (repita a senha)
```

**✅ CHECKPOINT:** Containers buildados, subindo e funcionando.

---

## 8. Verificações

### 8.1 Verificar Containers

```bash
# Status dos containers
docker compose -f docker-compose.hml.yml ps

# Todos devem estar "Up" ou "Exit 0" (frontend)
```

### 8.2 Verificar Saúde do Backend

```bash
# Health check
curl http://localhost:8001/health

# Deve retornar: healthy
```

### 8.3 Verificar API

```bash
# Testar API local
curl http://localhost:8001/api/v1/

# Testar API via NGINX (HTTPS)
curl https://hml.obreirovirtual.com/api/v1/

# Deve retornar JSON com info da API
```

### 8.4 Verificar Frontend

```bash
# Testar frontend
curl -I https://hml.obreirovirtual.com/

# Deve retornar:
# HTTP/2 200
# content-type: text/html
```

### 8.5 Verificar SSL

```bash
# Testar certificado SSL
openssl s_client -connect hml.obreirovirtual.com:443 -servername hml.obreirovirtual.com

# Ou use online:
# https://www.ssllabs.com/ssltest/analyze.html?d=hml.obreirovirtual.com
```

### 8.6 Verificar Banco de Dados

```bash
# Conectar ao PostgreSQL
docker exec -it obreiro_postgres_hml psql -U obreiro_hml -d obreiro_hml

# Dentro do psql:
\dt  # Listar tabelas
\q   # Sair
```

### 8.7 Testar no Navegador

Abra em um navegador:

1. **Frontend**: https://hml.obreirovirtual.com
2. **Admin Django**: https://hml.obreirovirtual.com/admin
3. **API**: https://hml.obreirovirtual.com/api/v1/

**✅ CHECKPOINT FINAL:** Tudo funcionando! Ambiente HML está operacional.

---

## 9. Workflow de Atualização

### 9.1 Atualizar Código

```bash
cd /root/obreiro-hml

# Opção 1: Pull do Git
git fetch origin
git pull origin main  # ou branch desejada

# Opção 2: Copiar da produção (apenas código novo)
# rsync -av --exclude='.git' /root/obreiro-digital-landing/backend/ /root/obreiro-hml/backend/
```

### 9.2 Rebuild e Deploy

```bash
# Parar containers
docker compose -f docker-compose.hml.yml down

# Rebuild com novas mudanças
docker compose -f docker-compose.hml.yml build --no-cache

# Subir novamente
docker compose -f docker-compose.hml.yml up -d

# Aguardar inicialização
sleep 10
```

### 9.3 Aplicar Migrações

```bash
# Executar migrações
docker exec obreiro_backend_hml python manage.py migrate

# Coletar statics
docker exec obreiro_backend_hml python manage.py collectstatic --noinput
```

### 9.4 Atualizar Frontend

```bash
# Rebuild frontend e copiar
docker compose -f docker-compose.hml.yml up -d frontend_hml
sleep 5
docker cp obreiro_frontend_hml:/app/dist/. /root/obreiro-hml/frontend-build/
chmod -R 755 /root/obreiro-hml/frontend-build
```

### 9.5 Verificar Atualização

```bash
# Testar API
curl https://hml.obreirovirtual.com/api/v1/

# Testar frontend
curl -I https://hml.obreirovirtual.com/

# Verificar logs
docker compose -f docker-compose.hml.yml logs -f --tail=50 backend_hml
```

---

## 10. Troubleshooting

### Problema: Containers não sobem

```bash
# Verificar logs detalhados
docker compose -f docker-compose.hml.yml logs

# Verificar específico do backend
docker compose -f docker-compose.hml.yml logs backend_hml

# Verificar portas em uso
sudo netstat -tulpn | grep :8001
sudo netstat -tulpn | grep :5433

# Se porta estiver em uso, matar processo:
# sudo kill -9 PID
```

### Problema: Erro de conexão com banco

```bash
# Verificar se postgres está rodando
docker ps | grep postgres_hml

# Verificar logs do postgres
docker logs obreiro_postgres_hml

# Testar conexão manual
docker exec -it obreiro_postgres_hml psql -U obreiro_hml -d obreiro_hml

# Verificar variáveis de ambiente
docker exec obreiro_backend_hml env | grep DATABASE
```

### Problema: 502 Bad Gateway (NGINX)

```bash
# Verificar se backend está respondendo
curl http://localhost:8001/health

# Verificar logs do NGINX
sudo tail -f /var/log/nginx/hml.obreirovirtual.com.error.log

# Verificar configuração NGINX
sudo nginx -t

# Reiniciar NGINX
sudo systemctl restart nginx
```

### Problema: Frontend retorna 404

```bash
# Verificar se arquivos existem
ls -la /root/obreiro-hml/frontend-build/

# Verificar permissões
ls -la /root/obreiro-hml/frontend-build/index.html

# Recopiar build
docker cp obreiro_frontend_hml:/app/dist/. /root/obreiro-hml/frontend-build/
chmod -R 755 /root/obreiro-hml/frontend-build

# Recarregar NGINX
sudo systemctl reload nginx
```

### Problema: Certificado SSL inválido

```bash
# Verificar certificado
sudo certbot certificates

# Renovar certificado
sudo certbot renew

# Recarregar NGINX
sudo systemctl reload nginx
```

### Problema: Migrações falhando

```bash
# Entrar no container
docker exec -it obreiro_backend_hml bash

# Verificar estado das migrações
python manage.py showmigrations

# Fake migrate se necessário (CUIDADO!)
# python manage.py migrate --fake app_name migration_name

# Limpar migrações órfãs (se necessário)
# python manage.py migrate --fake-initial

exit
```

### Problema: Permissões negadas

```bash
# Ajustar permissões dos diretórios
sudo chown -R root:root /root/obreiro-hml
chmod -R 755 /root/obreiro-hml/frontend-build
chmod -R 755 /root/obreiro-hml/staticfiles
chmod -R 777 /root/obreiro-hml/media  # Media precisa write
chmod -R 755 /root/obreiro-hml/logs
```

### Logs Úteis

```bash
# Logs do backend em tempo real
docker compose -f docker-compose.hml.yml logs -f backend_hml

# Logs do NGINX
sudo tail -f /var/log/nginx/hml.obreirovirtual.com.access.log
sudo tail -f /var/log/nginx/hml.obreirovirtual.com.error.log

# Logs do PostgreSQL
docker logs obreiro_postgres_hml

# Logs gerais do Docker
docker compose -f docker-compose.hml.yml logs --tail=100
```

---

## 11. Manutenção

### Backups do Banco HML

```bash
# Criar diretório de backups
mkdir -p /root/obreiro-hml/backups

# Backup manual
docker exec obreiro_postgres_hml pg_dump -U obreiro_hml obreiro_hml | gzip > /root/obreiro-hml/backups/backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Restaurar backup (se necessário)
# gunzip -c /root/obreiro-hml/backups/backup_XXXXXXXX.sql.gz | docker exec -i obreiro_postgres_hml psql -U obreiro_hml -d obreiro_hml
```

### Limpeza de Logs

```bash
# Limpar logs antigos do Docker
docker system prune -a --volumes --filter "until=720h"  # 30 dias

# Limpar logs do NGINX
sudo find /var/log/nginx/ -name "*.log" -type f -mtime +30 -delete

# Limpar logs do backend
find /root/obreiro-hml/logs/ -name "*.log" -type f -mtime +30 -delete
```

### Atualização de Certificados

```bash
# Renovação automática já está configurada pelo certbot
# Testar renovação
sudo certbot renew --dry-run

# Forçar renovação (se necessário)
sudo certbot renew --force-renewal

# Recarregar NGINX
sudo systemctl reload nginx
```

### Monitoramento

```bash
# Ver uso de recursos
docker stats obreiro_backend_hml obreiro_postgres_hml

# Ver tamanho dos volumes
docker system df -v

# Ver logs de erros recentes
docker compose -f docker-compose.hml.yml logs --tail=50 | grep ERROR
sudo tail -n 100 /var/log/nginx/hml.obreirovirtual.com.error.log
```

### Restart Completo

```bash
# Parar tudo
docker compose -f docker-compose.hml.yml down

# Limpar volumes órfãos (CUIDADO! Não use -v para preservar dados)
docker compose -f docker-compose.hml.yml down --remove-orphans

# Subir novamente
docker compose -f docker-compose.hml.yml up -d

# Verificar saúde
docker compose -f docker-compose.hml.yml ps
curl https://hml.obreirovirtual.com/health
```

---

## 📊 Comparação Prod x HML

| Item | Produção | Homologação |
|------|----------|-------------|
| **URL** | www.obreirovirtual.com | hml.obreirovirtual.com |
| **Porta Backend** | 8000 | 8001 |
| **Porta Postgres** | 5432 | 5433 |
| **Banco de Dados** | obreiro_prod | obreiro_hml |
| **Diretório** | /root/obreiro-digital-landing | /root/obreiro-hml |
| **Docker Compose** | docker-compose.prod.yml | docker-compose.hml.yml |
| **Env File** | .env_prod | .env_hml |
| **Container Backend** | obreiro_backend_prod | obreiro_backend_hml |
| **Container Postgres** | obreiro_postgres_prod | obreiro_postgres_hml |
| **Network** | obreiro_network_prod | obreiro_network_hml |
| **Volumes** | obreiro_*_prod | obreiro_*_hml |
| **SSL** | cert for www.* | cert for hml.* |
| **Debug Mode** | False | False |
| **Sentry** | Production env | Homologation env |
| **Email Subject** | [Obreiro Virtual] | [Obreiro Virtual HML] |

---

## 🔐 Segurança

### Checklist de Segurança

- [ ] SECRET_KEY diferente da produção
- [ ] Senhas fortes no banco de dados
- [ ] Arquivo .env_hml com permissões 600
- [ ] SSL configurado e válido
- [ ] Headers de segurança no NGINX
- [ ] Debug=False em produção
- [ ] Acesso SSH protegido com chave
- [ ] Firewall configurado (ufw)
- [ ] Backups automatizados
- [ ] Logs sendo monitorados

### Comandos de Segurança

```bash
# Verificar permissões do .env
ls -la /root/obreiro-hml/.env_hml
# Deve ser: -rw------- (600)

# Verificar SSL
sudo certbot certificates | grep hml.obreirovirtual.com

# Verificar firewall
sudo ufw status

# Verificar usuários com acesso SSH
cat /etc/ssh/sshd_config | grep PermitRootLogin
```

---

## 📚 Referências

### Arquivos Importantes

- `/root/obreiro-hml/docker-compose.hml.yml` - Orquestração dos containers
- `/root/obreiro-hml/.env_hml` - Variáveis de ambiente
- `/etc/nginx/sites-available/hml.obreirovirtual.com` - Configuração NGINX
- `/etc/letsencrypt/live/hml.obreirovirtual.com/` - Certificados SSL

### Comandos Rápidos

```bash
# Logs em tempo real
docker compose -f docker-compose.hml.yml logs -f

# Restart completo
docker compose -f docker-compose.hml.yml restart

# Status dos serviços
docker compose -f docker-compose.hml.yml ps

# Entrar no backend
docker exec -it obreiro_backend_hml bash

# Conectar ao banco
docker exec -it obreiro_postgres_hml psql -U obreiro_hml -d obreiro_hml

# Backup do banco
docker exec obreiro_postgres_hml pg_dump -U obreiro_hml obreiro_hml > backup_hml.sql
```

### Links Úteis

- Documentação Django: https://docs.djangoproject.com/
- Documentação Docker: https://docs.docker.com/
- Documentação NGINX: https://nginx.org/en/docs/
- Documentação Let's Encrypt: https://letsencrypt.org/docs/
- Teste SSL: https://www.ssllabs.com/ssltest/

---

## ✅ Checklist Final

- [ ] DNS configurado e resolvendo
- [ ] Diretório /root/obreiro-hml criado
- [ ] Código clonado/copiado
- [ ] .env_hml criado e configurado
- [ ] docker-compose.hml.yml criado
- [ ] NGINX configurado
- [ ] Certificado SSL instalado
- [ ] Containers buildados
- [ ] Containers rodando
- [ ] Migrações aplicadas
- [ ] Frontend copiado
- [ ] Statics copiados
- [ ] Health checks passando
- [ ] API respondendo (https://hml.obreirovirtual.com/api/v1/)
- [ ] Frontend carregando (https://hml.obreirovirtual.com/)
- [ ] Admin acessível (https://hml.obreirovirtual.com/admin/)
- [ ] Logs sem erros críticos
- [ ] Backups configurados
- [ ] Documentação atualizada

---

## 🎉 Conclusão

Após seguir todos os passos deste guia, você terá:

✅ Ambiente de homologação totalmente funcional  
✅ Isolado da produção  
✅ Com SSL válido  
✅ Pronto para testes  
✅ Fácil de atualizar  
✅ Monitorado e logado  

**URL Final:** https://hml.obreirovirtual.com

---

## 📞 Suporte

Em caso de dúvidas ou problemas:

1. Consulte a seção [Troubleshooting](#10-troubleshooting)
2. Verifique os logs detalhados
3. Compare com a produção funcionando
4. Documente o erro para análise

---

**Documento criado em:** Novembro de 2025  
**Versão:** 1.0.0  
**Autor:** Sistema Obreiro Virtual  
**Última atualização:** 22/11/2025  

---

**⚠️ IMPORTANTE:** Mantenha este documento atualizado sempre que fizer mudanças na infraestrutura!
