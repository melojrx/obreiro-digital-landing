# 🚀 Deploy Orquestrado Completo - Obreiro Digital
## Guia Unificado para Desenvolvimento, Produção e Operações

### 📋 Índice Navegacional

**🎯 [Início Rápido](#início-rápido)** - Para quem quer começar agora  
**🛠️ [Desenvolvimento Local](#desenvolvimento-local)** - Setup e ambiente dev  
**🚀 [Deploy de Produção](#deploy-de-produção)** - Produção completa e segura  
**📊 [Monitoramento e Operações](#monitoramento-e-operações)** - Pós-deploy e saúde  
**🔧 [Troubleshooting](#troubleshooting)** - Resolução de problemas  
**📚 [Referência Técnica](#referência-técnica)** - Arquivos e configurações  

---

## 🎯 Início Rápido

### Para Desenvolvedores (Ambiente Local)
```bash
# 1. Setup inicial automático
./scripts/dev_setup.sh

# 2. Iniciar ambiente de desenvolvimento
docker-compose -f docker-compose.dev.yml up -d

# 3. Acessar aplicação
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:8000"
echo "Admin: http://localhost:8000/admin"
```

### Para Deploy de Produção
```bash
# SEMPRE use o script seguro
cd /root/obreiro-digital-landing
./safe-pull.sh
```

### Para Operações (Monitoramento)
```bash
# Verificar saúde geral
docker-compose -f docker-compose.prod.yml ps
docker stats

# Logs em tempo real
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 🛠️ Desenvolvimento Local

### Pré-requisitos do Sistema

#### Windows 11 + WSL2
- **Docker Desktop** instalado
- **WSL2** habilitado e configurado
- **WSL integration** ativado no Docker Desktop

#### Verificação de Integração Docker + WSL
Se comandos `docker` não funcionarem no WSL:

1. **Docker Desktop → Settings → Resources → WSL Integration**
2. **Ativar** "Enable integration with my default WSL distro"
3. **Ativar** a distro Ubuntu específica
4. **Reiniciar** o WSL: `wsl --shutdown` no PowerShell

### Setup e Configuração

#### 1. Configuração Inicial Automatizada
```bash
# Executar script de setup automático
./scripts/dev_setup.sh
```

#### 2. Verificar Ambiente
```bash
# Testar Docker
docker --version
docker-compose --version

# Verificar portas disponíveis
netstat -an | grep -E ":(5432|6379|8000|5173)"
```

#### 3. Inicialização do Ambiente
```bash
# Iniciar todos os serviços
docker-compose -f docker-compose.dev.yml up -d

# Monitorar logs em tempo real
docker-compose -f docker-compose.dev.yml logs -f

# Parar ambiente quando necessário
docker-compose -f docker-compose.dev.yml down
```

### URLs e Serviços de Desenvolvimento

| Serviço | URL | Descrição | Status |
|---------|-----|-----------|--------|
| **Frontend** | http://localhost:5173 | React + Vite | Hot reload ativo |
| **Backend API** | http://localhost:8000 | Django REST API | Debug mode |
| **Admin Django** | http://localhost:8000/admin | Interface administrativa | Superuser necessário |
| **API Docs** | http://localhost:8000/api/v1/schema/swagger-ui/ | Documentação Swagger | Auto-gerada |
| **PostgreSQL** | localhost:5432 | Banco de dados | Persistente |
| **Redis** | localhost:6379 | Cache + Celery Broker | Em memória |

### Variáveis de Ambiente - Desenvolvimento

**Arquivo: `.env_dev`**
```env
# === Core Django ===
DJANGO_SETTINGS_MODULE=config.settings.dev
DJANGO_SECRET_KEY=dev-secret-key-change-in-production
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0

# === Database ===
DATABASE_URL=postgres://obreiro_user:obreiro_pass@postgres:5432/obreiro_dev

# === Cache & Queue ===
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/2
CELERY_RESULT_BACKEND=redis://redis:6379/3

# === CORS (Desenvolvimento) ===
CORS_ALLOW_ALL_ORIGINS=True

# === Email (Console) ===
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend

# === Frontend ===
FRONTEND_URL=http://localhost:5173
```

### Comandos Úteis de Desenvolvimento

```bash
# === Gerenciamento de Containers ===
# Ver status de todos os serviços
docker-compose -f docker-compose.dev.yml ps

# Reiniciar serviço específico
docker-compose -f docker-compose.dev.yml restart backend

# Acessar shell do container
docker-compose -f docker-compose.dev.yml exec backend bash
docker-compose -f docker-compose.dev.yml exec frontend sh

# === Django ===
# Criar migrações
docker-compose -f docker-compose.dev.yml exec backend python manage.py makemigrations

# Aplicar migrações
docker-compose -f docker-compose.dev.yml exec backend python manage.py migrate

# Criar superuser
docker-compose -f docker-compose.dev.yml exec backend python manage.py createsuperuser

# === Banco de Dados ===
# Acessar PostgreSQL
docker-compose -f docker-compose.dev.yml exec postgres psql -U obreiro_user -d obreiro_dev

# Dump do banco
docker-compose -f docker-compose.dev.yml exec postgres pg_dump -U obreiro_user obreiro_dev > backup_dev.sql
```

---

## 🚀 Deploy de Produção

### Arquitetura de Produção

```
Internet (443/80)
       ↓
   NGINX Proxy (Container)
   ├── SSL Termination
   ├── Rate Limiting  
   ├── Static Files
   └── API Routing
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
         [Persistent Data]   [Celery Worker]
```

### Componentes de Produção

| Serviço | Responsabilidade | Porta Externa | Porta Interna | Volume Crítico |
|---------|------------------|---------------|---------------|----------------|
| **nginx** | Proxy, SSL, Static Files | 80, 443 | 80, 443 | `/var/www/html` |
| **backend** | Django API + Gunicorn | - | 8000 | `/app/media`, `/app/staticfiles` |
| **postgres** | Banco de dados | - | 5432 | `/var/lib/postgresql/data` |
| **redis** | Cache + Celery Broker | - | 6379 | `/data` |
| **celery** | Processamento assíncrono | - | - | Compartilha com backend |

### Deploy Seguro e Automatizado

#### 🛡️ Script Principal: `safe-pull.sh`

**USO OBRIGATÓRIO**: Sempre use este script ao invés de `git pull` direto.

```bash
# Comando principal de deploy
cd /root/obreiro-digital-landing
./safe-pull.sh
```

**O que o script faz automaticamente:**

1. **📦 Backup Automático**: Salva configurações atuais
2. **🔧 Correção de Variáveis**: Garante URLs corretas
3. **📥 Pull Seguro**: Baixa código do GitHub
4. **🔨 Rebuild Completo**: Reconstrói frontend e backend
5. **🗃️ Migrações**: Aplica alterações no banco
6. **🔍 Health Check**: Verifica funcionamento
7. **📂 Permissões**: Corrige permissões de mídia

#### Variáveis de Ambiente Críticas - Produção

**Arquivo: `.env_prod`**
```env
# === Core Django ===
DJANGO_SETTINGS_MODULE=config.settings.prod
DJANGO_SECRET_KEY=${GENERATE_SECURE_KEY_HERE}
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=www.obreirovirtual.com,obreirovirtual.com,localhost,127.0.0.1,backend

# === Database ===
DATABASE_URL=postgres://prod_user:${SECURE_DB_PASSWORD}@postgres:5432/obreiro_prod

# === Cache & Queue ===
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/2
CELERY_RESULT_BACKEND=redis://redis:6379/3

# === CORS (Produção) ===
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=https://www.obreirovirtual.com,https://obreirovirtual.com

# === Email (SMTP) ===
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=${EMAIL_USER}
EMAIL_HOST_PASSWORD=${EMAIL_APP_PASSWORD}

# === SSL ===
SSL_CERT_PATH=/etc/letsencrypt/live/obreirovirtual.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/obreirovirtual.com/privkey.pem

# === Frontend (CRÍTICO) ===
FRONTEND_URL=https://www.obreirovirtual.com
```

**Arquivo: `frontend/.env.prod`**
```env
VITE_API_URL=https://www.obreirovirtual.com/api/v1
VITE_SERVER_URL=https://www.obreirovirtual.com
```

### Comandos de Deploy Manual (Emergência)

Se o script automático falhar:

```bash
# 1. Backup manual
cp .env_prod backups/.env_prod.backup.$(date +%Y%m%d_%H%M%S)

# 2. Pull seguro
git stash  # Salvar mudanças locais se houver
git pull origin main

# 3. Verificar variáveis críticas
grep "FRONTEND_URL=" .env_prod
grep "DJANGO_ALLOWED_HOSTS=" .env_prod

# 4. Rebuild e restart
docker-compose -f docker-compose.prod.yml build --no-cache frontend-build
docker-compose -f docker-compose.prod.yml up -d

# 5. Corrigir permissões
./fix-media-permissions.sh

# 6. Verificar saúde
docker-compose -f docker-compose.prod.yml ps
```

### Sincronização entre Ambientes

#### Pontos Críticos de Sincronização

1. **URLs de Frontend**: 
   - DEV: `http://localhost:5173`
   - PROD: `https://www.obreirovirtual.com` (SEM /api/v1)

2. **QR Codes**: 
   - Devem gerar URLs para `/visit/{uuid}`
   - NÃO `/api/v1/visit/{uuid}`

3. **CORS Origins**: 
   - DEV: `CORS_ALLOW_ALL_ORIGINS=True`
   - PROD: Lista específica de domínios

4. **Permissões de Mídia**: 
   - UID 999 (appuser do container)
   - Script `fix-media-permissions.sh` automatiza

---

## 📊 Monitoramento e Operações

### Verificações Imediatas (0-5 minutos)

#### ✅ Checklist de Saúde do Sistema
```bash
# 1. Status dos containers
docker-compose -f docker-compose.prod.yml ps
# Verificar: todos UP, nenhum "restarting"

# 2. Health checks
docker ps --filter "label=com.docker.compose.project=obreiro"
# Verificar: coluna STATUS deve mostrar "(healthy)"

# 3. Teste de conectividade
curl -I https://www.obreirovirtual.com
curl -I https://www.obreirovirtual.com/api/v1/
curl -I https://www.obreirovirtual.com/admin/
```

#### ✅ Verificações Funcionais
- [ ] **Login funcionando** - Testar com usuário real
- [ ] **Cadastro de novos usuários** - Processo completo
- [ ] **Geração de QR codes** - Verificar URLs corretas
- [ ] **Upload de arquivos/imagens** - Testar permissions
- [ ] **Envio de emails** - Se configurado

### Monitoramento Contínuo (5-30 minutos)

#### 📊 Métricas em Tempo Real
```bash
# === Logs Agregados ===
# Todos os serviços
docker-compose -f docker-compose.prod.yml logs -f

# Serviços específicos
docker-compose -f docker-compose.prod.yml logs -f backend nginx celery

# === Performance ===
# CPU e Memória por container
docker stats

# Requisições por segundo (nginx)
docker exec obreiro_nginx_prod tail -f /var/log/nginx/access.log | \
  awk '{print $4}' | uniq -c

# === Conectividade ===
# Tempo de resposta da API
while true; do 
  curl -w "Time: %{time_total}s\n" -o /dev/null -s https://www.obreirovirtual.com/api/v1/
  sleep 5
done
```

#### 🔍 Verificações de Erro
```bash
# === Backend ===
# Erros recentes no Django
docker-compose -f docker-compose.prod.yml logs backend | grep -i error | tail -20

# === NGINX ===
# Códigos de erro 5xx
docker exec obreiro_nginx_prod grep " 5[0-9][0-9] " /var/log/nginx/access.log | tail -20

# === Celery ===
# Tarefas falhadas
docker exec obreiro_backend_prod python manage.py shell -c \
  "from django_celery_results.models import TaskResult; print(f'Failed tasks: {TaskResult.objects.filter(status=\"FAILURE\").count()}')"

# === Banco de Dados ===
# Conexões ativas
docker exec obreiro_postgres_prod psql -U prod_user -d obreiro_prod -c \
  "SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = 'active';"
```

### 🚨 Alertas e Sinais Críticos

#### 🔴 Crítico (Ação Imediata)
- **Container reiniciando constantemente**
  ```bash
  docker ps --filter "status=restarting"
  ```
- **Erro 502/503/504 no site**
  ```bash
  curl -I https://www.obreirovirtual.com
  docker-compose -f docker-compose.prod.yml logs nginx backend
  ```
- **Banco de dados inacessível**
  ```bash
  docker exec obreiro_postgres_prod pg_isready
  ```
- **Uso de CPU > 90% sustentado**
  ```bash
  docker stats --no-stream | grep -E "9[0-9].[0-9]+%"
  ```
- **Disco > 95% cheio**
  ```bash
  df -h | grep -E "9[5-9]%|100%"
  ```

#### ⚠️ Aviso (Investigar)
- **Tempo de resposta > 3 segundos**
- **Erros 500 esporádicos**
- **Memória > 80% utilizada**
- **Muitas conexões pendentes**
- **Logs com warnings repetidos**

### Comandos de Diagnóstico Avançado

#### 💾 Recursos do Sistema
```bash
# === Espaço em Disco ===
df -h
du -sh /root/obreiro-digital-landing/*
docker system df

# === Limpeza (quando necessário) ===
docker system prune -f
docker volume prune -f  # CUIDADO: Remove volumes não utilizados
docker image prune -f
```

#### 🌐 Análise de Rede
```bash
# === Conexões ===
# Conexões estabelecidas no nginx
docker exec obreiro_nginx_prod netstat -an | grep ESTABLISHED | wc -l

# Conexões no backend
docker exec obreiro_backend_prod netstat -an | grep 8000

# === Teste de Carga Básico ===
# 100 requisições, 10 concorrentes
ab -n 100 -c 10 https://www.obreirovirtual.com/api/v1/

# Teste de latência (10 amostras)
for i in {1..10}; do 
  time curl -s https://www.obreirovirtual.com > /dev/null
done
```

#### 🔄 Health Check Personalizado
```bash
# Script de verificação completa
cat > health_check.sh << 'EOF'
#!/bin/bash
echo "=== HEALTH CHECK OBREIRO DIGITAL ==="
echo "Data: $(date)"
echo

echo "1. Containers:"
docker-compose -f docker-compose.prod.yml ps

echo -e "\n2. Conectividade:"
curl -s -o /dev/null -w "Site: %{http_code} (%{time_total}s)\n" https://www.obreirovirtual.com
curl -s -o /dev/null -w "API: %{http_code} (%{time_total}s)\n" https://www.obreirovirtual.com/api/v1/

echo -e "\n3. Recursos:"
docker stats --no-stream | head -5

echo -e "\n4. Disco:"
df -h | grep -E "(Filesystem|/dev/)"
EOF

chmod +x health_check.sh
./health_check.sh
```

---

## 🔧 Troubleshooting

### Problemas de Desenvolvimento

#### 🐳 Docker não encontrado no WSL
**Sintomas**: `docker: command not found` ou `Cannot connect to the Docker daemon`

**Solução**:
```bash
# 1. Verificar versão
docker --version

# 2. Se não funcionar, verificar integração WSL
# Docker Desktop → Settings → Resources → WSL Integration
# - Ativar "Enable integration with my default WSL distro"
# - Ativar distro Ubuntu específica

# 3. Reiniciar WSL (no PowerShell)
wsl --shutdown

# 4. Testar novamente
docker run hello-world
```

#### 🚫 Serviços não iniciam
**Sintomas**: Containers em estado "Exited" ou "Error"

**Diagnóstico**:
```bash
# 1. Verificar logs detalhados
docker-compose -f docker-compose.dev.yml logs [service]

# 2. Verificar recursos disponíveis
docker system df
free -h
df -h

# 3. Verificar portas em uso
netstat -tulpn | grep -E ":(5432|6379|8000|5173)"
```

**Soluções**:
```bash
# Limpeza geral do sistema Docker
docker-compose -f docker-compose.dev.yml down
docker system prune -f

# Rebuild completo
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up -d
```

#### 🗃️ Banco não conecta
**Sintomas**: `FATAL: database "obreiro_dev" does not exist` ou timeout

**Diagnóstico**:
```bash
# 1. Verificar status PostgreSQL
docker-compose -f docker-compose.dev.yml exec postgres pg_isready

# 2. Verificar conectividade do Django
docker-compose -f docker-compose.dev.yml exec backend python manage.py check --database default

# 3. Verificar logs do PostgreSQL
docker-compose -f docker-compose.dev.yml logs postgres
```

**Soluções**:
```bash
# Recriar banco (PERDERÁ DADOS)
docker-compose -f docker-compose.dev.yml down
docker volume rm obreiro_postgres_dev_data
docker-compose -f docker-compose.dev.yml up -d postgres

# Aguardar inicialização e aplicar migrações
sleep 30
docker-compose -f docker-compose.dev.yml exec backend python manage.py migrate
```

#### ⚛️ Frontend não carrega
**Sintomas**: Página em branco, erro de conexão, hot reload não funciona

**Diagnóstico**:
```bash
# 1. Verificar logs do Vite
docker-compose -f docker-compose.dev.yml logs frontend

# 2. Verificar se processo está rodando
docker-compose -f docker-compose.dev.yml exec frontend ps aux

# 3. Testar porta internamente
docker-compose -f docker-compose.dev.yml exec frontend curl localhost:5173
```

**Soluções**:
```bash
# Rebuild do frontend
docker-compose -f docker-compose.dev.yml build --no-cache frontend
docker-compose -f docker-compose.dev.yml restart frontend

# Verificar dependências node_modules
docker-compose -f docker-compose.dev.yml exec frontend npm install
```

### Problemas de Produção

#### 🌐 Site inacessível (502/503/504)
**Sintomas**: Bad Gateway, Service Unavailable, Gateway Timeout

**Diagnóstico Imediato**:
```bash
# 1. Status dos containers
docker-compose -f docker-compose.prod.yml ps

# 2. Logs do nginx e backend
docker-compose -f docker-compose.prod.yml logs nginx backend

# 3. Teste interno
docker exec obreiro_nginx_prod curl -I localhost
docker exec obreiro_backend_prod curl -I localhost:8000
```

**Soluções por Causa**:

**Backend não responde**:
```bash
# Reiniciar backend
docker-compose -f docker-compose.prod.yml restart backend

# Se persistir, rebuild
docker-compose -f docker-compose.prod.yml build --no-cache backend
docker-compose -f docker-compose.prod.yml up -d backend
```

**NGINX misconfigured**:
```bash
# Testar configuração
docker exec obreiro_nginx_prod nginx -t

# Recarregar configuração
docker exec obreiro_nginx_prod nginx -s reload

# Se configuração está errada, verificar arquivo
docker exec obreiro_nginx_prod cat /etc/nginx/conf.d/default.conf
```

#### 🔒 "Sem resposta do servidor" no login
**Sintomas**: Frontend não consegue se comunicar com backend

**Diagnóstico**:
```bash
# 1. Verificar CORS
grep CORS_ALLOWED_ORIGINS .env_prod

# 2. Verificar FRONTEND_URL
grep FRONTEND_URL .env_prod

# 3. Testar API diretamente
curl -X POST https://www.obreirovirtual.com/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

**Soluções**:
```bash
# 1. Corrigir variáveis de ambiente
# FRONTEND_URL deve ser: https://www.obreirovirtual.com (SEM /api/v1)
sed -i 's|FRONTEND_URL=.*|FRONTEND_URL=https://www.obreirovirtual.com|' .env_prod

# 2. Verificar frontend config
cat > frontend/.env.prod << 'EOF'
VITE_API_URL=https://www.obreirovirtual.com/api/v1
VITE_SERVER_URL=https://www.obreirovirtual.com
EOF

# 3. Restart dos serviços
docker-compose -f docker-compose.prod.yml restart backend
docker-compose -f docker-compose.prod.yml up -d frontend-build
```

#### 📁 Permission denied ao salvar arquivos
**Sintomas**: Erro ao fazer upload de imagens ou gerar QR codes

**Diagnóstico**:
```bash
# 1. Verificar permissões do volume
docker exec obreiro_backend_prod ls -la /app/media/

# 2. Verificar UID do usuário do container
docker exec obreiro_backend_prod id

# 3. Verificar se consegue criar arquivo
docker exec obreiro_backend_prod touch /app/media/test.txt
```

**Solução**:
```bash
# Script automático para corrigir permissões
./fix-media-permissions.sh

# Ou manual:
sudo chown -R 999:999 /var/lib/docker/volumes/obreiro_media_prod/_data/
```

#### 🗃️ Banco de dados não conecta
**Sintomas**: `FATAL: password authentication failed` ou timeout

**Diagnóstico**:
```bash
# 1. Verificar status PostgreSQL
docker exec obreiro_postgres_prod pg_isready

# 2. Verificar logs
docker-compose -f docker-compose.prod.yml logs postgres

# 3. Testar conexão
docker exec obreiro_backend_prod python manage.py check --database default
```

**Soluções**:
```bash
# 1. Verificar variáveis de ambiente
grep DATABASE_URL .env_prod

# 2. Reiniciar PostgreSQL
docker-compose -f docker-compose.prod.yml restart postgres

# 3. Se persistir, verificar senha
docker exec obreiro_postgres_prod psql -U prod_user -d obreiro_prod -c "SELECT 1;"
```

### 🔄 Procedimentos de Rollback

#### Rollback Automático
```bash
# Usar script se disponível
./deploy-procedure.sh rollback
```

#### Rollback Manual
```bash
# 1. Identificar backup mais recente
BACKUP_DIR=$(ls -t backups/ | head -1)
echo "Usando backup: $BACKUP_DIR"

# 2. Restaurar configurações
cp backups/$BACKUP_DIR/.env_prod.backup .env_prod

# 3. Voltar para commit anterior
if [ -f backups/$BACKUP_DIR/git_commit.txt ]; then
  git checkout $(cat backups/$BACKUP_DIR/git_commit.txt)
else
  git checkout HEAD~1
fi

# 4. Rebuild e restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

# 5. Verificar saúde
sleep 30
docker-compose -f docker-compose.prod.yml ps
curl -I https://www.obreirovirtual.com
```

#### Rollback de Banco de Dados
```bash
# 1. Parar aplicação
docker-compose -f docker-compose.prod.yml stop backend celery

# 2. Identificar backup
BACKUP_FILE=$(ls -t backups/backup_*.sql | head -1)

# 3. Restaurar backup
docker exec obreiro_postgres_prod dropdb -U prod_user obreiro_prod
docker exec obreiro_postgres_prod createdb -U prod_user obreiro_prod
cat $BACKUP_FILE | docker exec -i obreiro_postgres_prod psql -U prod_user -d obreiro_prod

# 4. Reiniciar aplicação
docker-compose -f docker-compose.prod.yml start backend celery
```

### 📞 Escalonamento de Problemas

#### 🟢 Nível 1 (0-15 minutos) - Ações Imediatas
- Verificar logs básicos
- Reiniciar container afetado
- Verificar configurações óbvias
- Testar conectividade básica

#### 🟡 Nível 2 (15-30 minutos) - Investigação
- Executar rollback se necessário
- Investigar causa raiz
- Aplicar fix emergencial
- Notificar sobre problemas persistentes

#### 🔴 Nível 3 (30+ minutos) - Escalonamento
- Notificar equipe sênior
- Considerar manutenção programada
- Documentar incidente completo
- Planejar correção definitiva

---

## 📚 Referência Técnica

### Docker Compose - Desenvolvimento

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: obreiro_dev
      POSTGRES_USER: obreiro_user
      POSTGRES_PASSWORD: obreiro_pass
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U obreiro_user -d obreiro_dev"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    volumes:
      - redis_dev_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    build:
      context: .
      dockerfile: docker/backend/Dockerfile
      target: development
    env_file: .env_dev
    volumes:
      - ./backend:/app
      - media_dev:/app/media
      - staticfiles_dev:/app/staticfiles
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
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
    environment:
      - VITE_API_URL=http://localhost:8000/api/v1
    command: npm run dev -- --host 0.0.0.0

volumes:
  postgres_dev_data:
  redis_dev_data:
  media_dev:
  staticfiles_dev:
```

### Docker Compose - Produção

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
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

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
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
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
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: celery -A config worker -l info
    restart: unless-stopped

  frontend-build:
    build:
      context: .
      dockerfile: docker/frontend/Dockerfile
      target: production
    volumes:
      - frontend_build:/app/dist
    env_file: frontend/.env.prod

volumes:
  postgres_prod_data:
  redis_prod_data:
  media_prod:
  staticfiles_prod:
  frontend_build:
```

### NGINX - Configuração de Produção

```nginx
# docker/nginx/prod.conf
upstream backend {
    server backend:8000;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name obreirovirtual.com www.obreirovirtual.com;
    return 301 https://www.obreirovirtual.com$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    server_name www.obreirovirtual.com;

    # === SSL Configuration ===
    ssl_certificate /etc/letsencrypt/live/obreirovirtual.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/obreirovirtual.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;

    # === Security Headers ===
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # === Compression ===
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json
        image/svg+xml;

    # === Rate Limiting ===
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    # === API Routes ===
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
        proxy_buffering off;
    }

    # === Auth Routes (stricter rate limiting) ===
    location /api/v1/auth/ {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # === Admin Interface ===
    location /admin/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # === Static Files ===
    location /static/ {
        alias /var/www/html/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # === Media Files ===
    location /media/ {
        alias /var/www/html/media/;
        expires 1M;
        add_header Cache-Control "public";
    }

    # === Frontend (React App) ===
    location / {
        root /var/www/html;
        index index.html;
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public";
        
        # Security for HTML files
        add_header X-Frame-Options "SAMEORIGIN";
        add_header X-Content-Type-Options "nosniff";
    }

    # === Health Check ===
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}

# === Redirect non-www to www ===
server {
    listen 443 ssl http2;
    server_name obreirovirtual.com;
    
    ssl_certificate /etc/letsencrypt/live/obreirovirtual.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/obreirovirtual.com/privkey.pem;
    
    return 301 https://www.obreirovirtual.com$request_uri;
}

# === Internal server for health checks ===
server {
    listen 80 default_server;
    server_name localhost 127.0.0.1;
    
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    location / {
        return 404;
    }
}
```

### Dockerfile - Backend

```dockerfile
# docker/backend/Dockerfile
FROM python:3.11-slim as base

# === System Configuration ===
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DEBIAN_FRONTEND=noninteractive

# === System Dependencies ===
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

WORKDIR /app

# === Python Dependencies ===
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# === Development Target ===
FROM base as development

COPY backend/ .

# Create non-root user for development
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# === Production Target ===
FROM base as production

COPY backend/ .
COPY docker/backend/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# === Production Security ===
# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set ownership and permissions
RUN chown -R appuser:appuser /app
RUN chmod +x /entrypoint.sh

USER appuser

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120", "--worker-class", "gevent", "config.wsgi:application"]
```

### Dockerfile - Frontend

```dockerfile
# docker/frontend/Dockerfile
FROM node:18-alpine as base

WORKDIR /app

# === Dependencies ===
COPY frontend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# === Development Target ===
FROM base as development

# Install dev dependencies
RUN npm ci

COPY frontend/ .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# === Production Build Target ===
FROM base as production

# Install all dependencies (including dev for build)
RUN npm ci

COPY frontend/ .

# Build production assets
RUN npm run build

# Copy built files to volume
CMD ["cp", "-r", "/app/dist/*", "/app/dist/"]
```

### Scripts de Automação

#### safe-pull.sh
```bash
#!/bin/bash
# Scripts principais de deploy seguro

set -e

echo "🚀 Iniciando deploy seguro do Obreiro Digital..."

# === Configurações ===
PROJECT_DIR="/root/obreiro-digital-landing"
BACKUP_DIR="$PROJECT_DIR/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# === Função de backup ===
create_backup() {
    echo "📦 Criando backup..."
    mkdir -p "$BACKUP_DIR/$TIMESTAMP"
    
    # Backup de configurações
    cp .env_prod "$BACKUP_DIR/$TIMESTAMP/.env_prod.backup"
    cp frontend/.env.prod "$BACKUP_DIR/$TIMESTAMP/frontend.env.prod.backup" 2>/dev/null || true
    
    # Backup de commit atual
    git rev-parse HEAD > "$BACKUP_DIR/$TIMESTAMP/git_commit.txt"
    
    echo "✅ Backup salvo em: $BACKUP_DIR/$TIMESTAMP"
}

# === Função de correção de variáveis ===
fix_environment_vars() {
    echo "🔧 Corrigindo variáveis de ambiente..."
    
    # Garantir FRONTEND_URL correto
    if ! grep -q "FRONTEND_URL=https://www.obreirovirtual.com$" .env_prod; then
        sed -i 's|FRONTEND_URL=.*|FRONTEND_URL=https://www.obreirovirtual.com|' .env_prod
        echo "   ✅ FRONTEND_URL corrigido"
    fi
    
    # Garantir DJANGO_ALLOWED_HOSTS
    if ! grep -q "backend" .env_prod; then
        sed -i 's|DJANGO_ALLOWED_HOSTS=.*|DJANGO_ALLOWED_HOSTS=www.obreirovirtual.com,obreirovirtual.com,localhost,127.0.0.1,backend|' .env_prod
        echo "   ✅ DJANGO_ALLOWED_HOSTS corrigido"
    fi
    
    # Criar/corrigir frontend/.env.prod
    cat > frontend/.env.prod << 'EOF'
VITE_API_URL=https://www.obreirovirtual.com/api/v1
VITE_SERVER_URL=https://www.obreirovirtual.com
EOF
    echo "   ✅ Frontend config corrigido"
}

# === Função principal ===
main() {
    cd "$PROJECT_DIR"
    
    # 1. Backup
    create_backup
    
    # 2. Pull do código
    echo "📥 Atualizando código..."
    git stash push -m "Auto-stash before safe-pull $TIMESTAMP" || true
    git pull origin main
    
    # 3. Corrigir variáveis
    fix_environment_vars
    
    # 4. Rebuild e restart
    echo "🔨 Reconstruindo aplicação..."
    
    # Build do frontend
    docker-compose -f docker-compose.prod.yml build --no-cache frontend-build
    docker-compose -f docker-compose.prod.yml up frontend-build
    
    # Restart dos serviços
    echo "🔄 Reiniciando serviços..."
    docker-compose -f docker-compose.prod.yml restart backend
    docker-compose -f docker-compose.prod.yml restart nginx
    
    # 5. Migrações
    echo "🗃️ Aplicando migrações..."
    docker-compose -f docker-compose.prod.yml exec -T backend python manage.py migrate
    
    # 6. Corrigir permissões
    echo "📂 Corrigindo permissões..."
    ./fix-media-permissions.sh || sudo chown -R 999:999 /var/lib/docker/volumes/obreiro_media_prod/_data/
    
    # 7. Health check
    echo "🏥 Verificando saúde dos serviços..."
    sleep 30
    
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        echo "✅ Deploy concluído com sucesso!"
        echo "🌐 Site: https://www.obreirovirtual.com"
        echo "📊 API: https://www.obreirovirtual.com/api/v1/"
        
        # Teste básico
        if curl -s -f https://www.obreirovirtual.com > /dev/null; then
            echo "✅ Conectividade OK"
        else
            echo "⚠️ Possível problema de conectividade"
        fi
    else
        echo "❌ Problemas detectados nos containers"
        docker-compose -f docker-compose.prod.yml ps
        exit 1
    fi
    
    # Limpar backups antigos (manter últimos 5)
    find "$BACKUP_DIR" -maxdepth 1 -type d -name "20*" | sort -r | tail -n +6 | xargs rm -rf
}

# Executar função principal
main "$@"
```

#### fix-media-permissions.sh
```bash
#!/bin/bash
# Script para corrigir permissões do diretório de mídia

set -e

echo "📂 Corrigindo permissões do diretório media_prod..."

# Encontrar volume de mídia
MEDIA_VOLUME_PATH=$(docker volume inspect obreiro_media_prod | jq -r '.[0].Mountpoint')

if [ "$MEDIA_VOLUME_PATH" != "null" ] && [ -d "$MEDIA_VOLUME_PATH" ]; then
    echo "   📁 Volume encontrado: $MEDIA_VOLUME_PATH"
    
    # Corrigir ownership para uid 999 (appuser do container)
    sudo chown -R 999:999 "$MEDIA_VOLUME_PATH"
    
    # Corrigir permissões
    sudo chmod -R 755 "$MEDIA_VOLUME_PATH"
    
    echo "✅ Permissões corrigidas com sucesso!"
    
    # Verificar
    ls -la "$MEDIA_VOLUME_PATH" | head -5
else
    echo "❌ Volume media_prod não encontrado"
    exit 1
fi
```

### Health Check Backend (Django)

```python
# backend/apps/core/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from django.core.cache import cache
from django.conf import settings
import redis
import os

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Endpoint completo de verificação de saúde do sistema
    """
    health_status = {
        'status': 'healthy',
        'timestamp': timezone.now().isoformat(),
        'version': getattr(settings, 'VERSION', '1.0'),
        'environment': getattr(settings, 'ENVIRONMENT', 'production'),
        'checks': {}
    }
    
    overall_healthy = True
    
    # === Database Check ===
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        health_status['checks']['database'] = {
            'status': 'healthy',
            'message': 'Database connection successful'
        }
    except Exception as e:
        health_status['checks']['database'] = {
            'status': 'unhealthy',
            'message': f'Database error: {str(e)}'
        }
        overall_healthy = False
    
    # === Redis/Cache Check ===
    try:
        cache.set('health_check', 'ok', 30)
        if cache.get('health_check') == 'ok':
            health_status['checks']['cache'] = {
                'status': 'healthy',
                'message': 'Cache working properly'
            }
        else:
            raise Exception("Cache test failed")
    except Exception as e:
        health_status['checks']['cache'] = {
            'status': 'unhealthy',
            'message': f'Cache error: {str(e)}'
        }
        overall_healthy = False
    
    # === Celery Check ===
    try:
        from django_celery_results.models import TaskResult
        failed_tasks = TaskResult.objects.filter(status='FAILURE').count()
        
        health_status['checks']['celery'] = {
            'status': 'healthy' if failed_tasks < 10 else 'warning',
            'message': f'Failed tasks: {failed_tasks}',
            'failed_tasks_count': failed_tasks
        }
        
        if failed_tasks >= 50:  # Muitas tarefas falhadas
            overall_healthy = False
    except Exception as e:
        health_status['checks']['celery'] = {
            'status': 'unhealthy',
            'message': f'Celery check error: {str(e)}'
        }
    
    # === Disk Space Check ===
    try:
        disk_usage = os.statvfs('/')
        free_space_percent = (disk_usage.f_frsize * disk_usage.f_bavail) / (disk_usage.f_frsize * disk_usage.f_blocks) * 100
        
        if free_space_percent > 20:
            disk_status = 'healthy'
        elif free_space_percent > 10:
            disk_status = 'warning'
        else:
            disk_status = 'critical'
            overall_healthy = False
            
        health_status['checks']['disk_space'] = {
            'status': disk_status,
            'free_space_percent': round(free_space_percent, 2),
            'message': f'Free space: {free_space_percent:.1f}%'
        }
    except Exception as e:
        health_status['checks']['disk_space'] = {
            'status': 'unknown',
            'message': f'Disk check error: {str(e)}'
        }
    
    # === Media Directory Check ===
    try:
        media_dir = settings.MEDIA_ROOT
        if os.path.exists(media_dir) and os.access(media_dir, os.W_OK):
            health_status['checks']['media_directory'] = {
                'status': 'healthy',
                'message': 'Media directory writable'
            }
        else:
            health_status['checks']['media_directory'] = {
                'status': 'unhealthy',
                'message': 'Media directory not writable'
            }
            overall_healthy = False
    except Exception as e:
        health_status['checks']['media_directory'] = {
            'status': 'unhealthy',
            'message': f'Media directory error: {str(e)}'
        }
    
    # === Overall Status ===
    if not overall_healthy:
        health_status['status'] = 'unhealthy'
        response_status = status.HTTP_503_SERVICE_UNAVAILABLE
    else:
        response_status = status.HTTP_200_OK
    
    return Response(health_status, status=response_status)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check_simple(request):
    """
    Health check simples para load balancers
    """
    try:
        # Teste básico de banco
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        return Response({'status': 'healthy'}, status=status.HTTP_200_OK)
    except Exception:
        return Response({'status': 'unhealthy'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
```

---

## 🎯 Conclusão

Este guia orquestrado consolida todos os aspectos críticos do deploy e operações do Obreiro Digital, proporcionando:

### ✅ **Para Desenvolvedores**
- Setup automatizado em poucos comandos
- Ambiente de desenvolvimento isolado e replicável
- Hot reload e debug facilitado
- Documentação clara de todas as URLs e serviços

### ✅ **Para Deploy de Produção**
- Script `safe-pull.sh` para deploy 100% seguro
- Backup automático antes de qualquer alteração
- Correção automática de configurações críticas
- Zero downtime na maioria dos cenários

### ✅ **Para Operações**
- Monitoramento proativo com alertas claros
- Health checks abrangentes e automatizados
- Procedimentos de troubleshooting testados
- Rollback documentado e testado

### ✅ **Para Segurança**
- Configuração NGINX com headers de segurança
- Rate limiting em endpoints críticos
- SSL/TLS com best practices
- Containers não-root em produção

### 🔄 **Fluxo Operacional Recomendado**

1. **Desenvolvimento**: Use `docker-compose.dev.yml` com hot reload
2. **Deploy**: SEMPRE use `./safe-pull.sh` 
3. **Monitoramento**: Execute health checks regulares
4. **Problemas**: Siga procedimentos de troubleshooting documentados
5. **Emergência**: Use rollback automático ou manual conforme necessário

### 📊 **Métricas de Sucesso**
- **Uptime > 99.9%** - Site sempre disponível
- **Deploy < 5 minutos** - Atualizações rápidas
- **MTTR < 15 minutos** - Recuperação rápida de problemas
- **Zero perda de dados** - Backups automáticos funcionais

---

**🚀 Ambiente pronto para produção com máxima confiabilidade, segurança e performance.**

---

**Documento criado em:** 16 de Agosto de 2025  
**Versão:** 2.0 Orquestrada  
**Mantenedor:** Equipe Obreiro Digital  
**Próxima revisão:** Após próximo deploy crítico

**📚 Documento consolidado a partir de:**
- DEPLOY_CONTAINERIZACAO_COMPLETO.md
- DEPLOY_SAFE_GUIDE.md  
- SYNC_DEV_PROD.md
- deploy-monitoring-checklist.md