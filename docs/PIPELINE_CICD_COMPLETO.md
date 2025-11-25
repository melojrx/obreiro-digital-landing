# 🚀 Pipeline CI/CD Completo - Obreiro Virtual

**Documentação completa do fluxo de deploy automático**

**Versão:** 3.0
**Data:** 25/11/2025
**Status:** ✅ **PROD e HML 100% Implementados e Funcionando**

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura da Infraestrutura](#arquitetura-da-infraestrutura)
3. [Fluxo de Trabalho Profissional](#fluxo-de-trabalho-profissional)
4. [Workflows Implementados](#workflows-implementados)
5. [Secrets e Configurações](#secrets-e-configurações)
6. [Estratégia de Deploy](#estratégia-de-deploy)
7. [Monitoramento e Health Checks](#monitoramento-e-health-checks)
8. [Troubleshooting](#troubleshooting)
9. [Comandos Úteis](#comandos-úteis)

---

## 🎯 Visão Geral

### Pipeline Implementado

```
┌──────────────────┐
│  feature/branch  │
│  (desenvolvimento)│
└────────┬─────────┘
         │ PR
         ▼
┌──────────────────┐      ┌─────────────────┐
│     develop      │─────►│   Deploy HML    │
│  (homologação)   │      │   (automático)  │
└────────┬─────────┘      └─────────────────┘
         │                         │
         │ PR + Aprovação         │ Teste e validação
         │                         │
         ▼                         ▼
┌──────────────────┐      ┌─────────────────┐
│       main       │─────►│  Deploy PROD    │
│   (produção)     │      │   (automático)  │
└──────────────────┘      └─────────────────┘
```

### Ambientes e URLs

| Ambiente | Branch | URL | Status | Deploy |
|----------|--------|-----|--------|--------|
| **Homologação (HML)** | `develop` | https://hml.obreirovirtual.com | ✅ Ativo | Automático no push |
| **Produção (PROD)** | `main` | https://www.obreirovirtual.com | ✅ Ativo | Automático no push + PR aprovado |

---

## 🏗️ Arquitetura da Infraestrutura

### VPS Compartilhada (srvmagnum)

**Informação Importante:** HML e PROD rodam na **mesma VPS**, mas com **isolamento completo** através de:
- Diretórios separados
- Containers Docker isolados
- Bancos de dados separados
- Networks Docker separadas
- Portas diferentes

```
VPS: srvmagnum (6GB RAM, 4 CPU cores)
├── /root/obreiro-digital-landing/     ← Repositório PROD
│   ├── docker-compose.prod.yml
│   ├── .env_prod
│   ├── frontend_build/
│   └── backups/
│
├── /root/obreiro-hml/                 ← Repositório HML (separado)
│   ├── docker-compose.hml.yml
│   ├── .env_hml
│   └── frontend-build/
│
├── /var/www/html/
│   ├── prod/   ← Frontend PROD servido pelo nginx
│   └── hml/    ← Frontend HML servido pelo nginx
│
└── Nginx no HOST (systemd)
    ├── hml.obreirovirtual.com → /var/www/html/hml/
    ├── www.obreirovirtual.com → /var/www/html/prod/
    └── SSL: Let's Encrypt
```

---

### Ambiente de Homologação (HML)

**Diretório:** `/root/obreiro-hml`
**URL:** https://hml.obreirovirtual.com

#### Componentes Docker:

| Container | Porta Host | Descrição |
|-----------|------------|-----------|
| `obreiro_postgres_hml` | 5433 | PostgreSQL 15 (banco: obreiro_hml) |
| `obreiro_redis_hml` | - | Redis 7 (broker Celery) |
| `obreiro_backend_hml` | 8001 | Django + Gunicorn |
| `obreiro_celery_hml` | - | Celery Worker |
| `obreiro_celery_beat_hml` | - | Celery Beat (scheduler) |
| `obreiro_frontend_hml` | - | Build temporário React + Vite |

#### Nginx (HOST):
```nginx
server_name: hml.obreirovirtual.com
root: /var/www/html/hml/
proxy_pass: http://localhost:8001
```

---

### Ambiente de Produção (PROD)

**Diretório:** `/root/obreiro-digital-landing`
**URL:** https://www.obreirovirtual.com

#### Componentes Docker:

| Container | Porta Host | Descrição |
|-----------|------------|-----------|
| `obreiro_postgres_prod` | - | PostgreSQL 15 (banco: obreiro_prod) |
| `obreiro_redis_prod` | - | Redis 7 (broker Celery) |
| `obreiro_backend_prod` | 8000 | Django + Gunicorn (3 workers) |
| `obreiro_celery_prod` | - | Celery Worker (concurrency 2) |
| `obreiro_celery_beat_prod` | - | Celery Beat (scheduler) |
| `obreiro_frontend_build` | - | Build temporário React + Vite |

#### Nginx (HOST):
```nginx
server_name: www.obreirovirtual.com obreirovirtual.com
root: /var/www/html/prod/
proxy_pass: http://localhost:8000
ssl_certificate: /etc/letsencrypt/live/obreirovirtual.com/fullchain.pem
```

---

## 🔄 Fluxo de Trabalho Profissional

### 1. Desenvolvimento Local

```bash
# 1. Atualizar develop
git checkout develop
git pull origin develop

# 2. Criar feature branch
git checkout -b feature/nome-da-funcionalidade

# 3. Desenvolver e testar localmente
npm run dev                          # Frontend (porta 5173)
python manage.py runserver           # Backend (porta 8000)
docker-compose -f docker-compose.dev.yml up  # Ambiente completo

# 4. Commit seguindo conventional commits
git add .
git commit -m "feat: adiciona nova funcionalidade X"
git push origin feature/nome-da-funcionalidade
```

**Conventional Commits:**
- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Documentação
- `chore:` - Manutenção
- `refactor:` - Refatoração
- `test:` - Testes

---

### 2. Pull Request para Develop (HML)

```bash
# 1. Criar PR no GitHub
feature/nome-da-funcionalidade → develop

# 2. O que acontece automaticamente:
✅ CI Tests executam (validação Python + build frontend)
✅ Code review (opcional para develop)
✅ Merge aprovado

# 3. Após merge:
🚀 Deploy HML inicia AUTOMATICAMENTE
├── Backend rebuilded
├── Migrações aplicadas
├── Frontend buildado
├── Nginx recarregado
└── 📧 Email de notificação enviado

⏱️ Tempo: ~1-2 minutos
```

**Deploy HML Automático Inclui:**
1. Pull do código da branch `develop`
2. Build containers backend, celery, celery-beat
3. Aplicação de migrações Django
4. Coleta de arquivos estáticos
5. Build do frontend React + Vite
6. Cópia para `/var/www/html/hml/`
7. Reload do nginx
8. Health checks (backend + frontend)
9. Notificação por email

---

### 3. Testes em Homologação

```
🌐 Acessar: https://hml.obreirovirtual.com

Checklist de validação:
├── ✅ Funcionalidade implementada funciona corretamente
├── ✅ Não quebrou funcionalidades existentes
├── ✅ Performance aceitável
├── ✅ UI/UX adequada
├── ✅ Testar em diferentes dispositivos (responsivo)
└── ✅ Aprovação de stakeholders
```

---

### 4. Pull Request para Main (PROD)

```bash
# 1. Criar PR no GitHub
develop → main

# 2. Requisitos OBRIGATÓRIOS:
✅ CI Tests passaram
✅ Code review aprovado (mínimo 1 pessoa)
✅ Branch atualizada (sem conflitos)
✅ Testes em HML validados

# 3. Após merge aprovado:
🚀 Deploy PROD inicia AUTOMATICAMENTE
├── 💾 Backup automático do banco de dados
├── 💾 Backup do frontend anterior
├── Backend rebuilded
├── Migrações aplicadas (com validação)
├── Frontend buildado (otimizado)
├── Health checks rigorosos
└── 📧 Email de notificação (2 destinatários)

⏱️ Tempo: ~3-4 minutos
```

**Deploy PROD Automático Inclui:**
1. Validação de secrets
2. **Backup do banco de dados** → `/root/backups/`
3. Pull do código da branch `main`
4. Build containers (--no-cache para garantir atualização)
5. Aplicação de migrações Django
6. Coleta de arquivos estáticos
7. Build do frontend React + Vite (modo produção)
8. **Backup do frontend anterior**
9. Cópia para `/var/www/html/prod/`
10. Reload do nginx
11. **Health checks rigorosos** (HTTP 200, 401, 403 aceitos)
12. Docker cleanup (remover imagens antigas)
13. Notificação por email

---

## 🤖 Workflows Implementados

### 1. CI Tests (`ci-tests.yml`)

**Arquivo:** `.github/workflows/ci-tests.yml`
**Trigger:** Push ou PR em `develop` ou `main`

```yaml
on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop, main]
```

**Steps:**
1. ✅ Checkout do código
2. ✅ Setup Python 3.11
3. ✅ Validação sintaxe Python (`python -m py_compile`)
4. ✅ Setup Node.js 18
5. ✅ Instalação dependências frontend (`npm ci`)
6. ✅ Build frontend (`npm run build`)
7. ✅ Verificação se build foi criado

**Duração:** ~30-40 segundos
**Status:** ✅ Implementado e funcionando

---

### 2. Deploy Homologação (`deploy-hml.yml`)

**Arquivo:** `.github/workflows/deploy-hml.yml`
**Trigger:** Push em `develop`

```yaml
on:
  push:
    branches: [develop]
  workflow_dispatch:  # Permite trigger manual
```

**Environment:** `homologation`
**URL:** https://hml.obreirovirtual.com

**Script de Deploy (22 steps):**
```bash
1. cd /root/obreiro-hml
2. git fetch origin develop && git reset --hard origin/develop
3. source .env_hml
4. docker-compose build --no-cache backend_hml celery_hml celery_beat_hml
5. docker-compose stop backend_hml celery_hml celery_beat_hml
6. docker-compose up -d --force-recreate backend_hml celery_hml celery_beat_hml
7. sleep 15  # Aguardar containers iniciarem
8. Verificar se backend está rodando
9. docker exec obreiro_backend_hml python manage.py migrate --noinput
10. docker exec obreiro_backend_hml python manage.py collectstatic --noinput
11. docker-compose build frontend_hml
12. docker-compose run --rm frontend_hml  # Build React
13. docker cp obreiro_frontend_hml:/app/dist/. /root/obreiro-hml/frontend-build/
14. chmod -R 755 /root/obreiro-hml/frontend-build
15. mkdir -p /var/www/html/hml
16. cp -r /root/obreiro-hml/frontend-build/* /var/www/html/hml/
17. chmod -R 755 /var/www/html/hml
18. Verificar se index.html existe
19. nginx -t  # Testar configuração
20. systemctl reload nginx
21. Health check backend (curl https://hml.obreirovirtual.com/api/v1/)
22. Health check frontend (curl https://hml.obreirovirtual.com/)
```

**Notificações:**
- ✅ **Sucesso:** Email para `suporteobreirovirtual@gmail.com`
- ❌ **Falha:** Email com logs e troubleshooting

**Duração:** ~1-2 minutos
**Status:** ✅ Implementado e funcionando

---

### 3. Deploy Produção (`deploy-prod.yml`)

**Arquivo:** `.github/workflows/deploy-prod.yml`
**Trigger:** Push em `main` ou PR mergeado em `main`

```yaml
on:
  push:
    branches: [main]
  pull_request:
    types: [closed]
    branches: [main]
  workflow_dispatch:  # Permite trigger manual
```

**Environment:** `production`
**URL:** https://www.obreirovirtual.com

**Script de Deploy (22 steps + backups):**
```bash
1. cd /root/obreiro-digital-landing
2. git fetch origin main && git reset --hard origin/main
3. source .env_prod
4. 💾 BACKUP DATABASE: pg_dump → /root/backups/backup_prod_TIMESTAMP.sql
5. docker-compose build --no-cache backend celery celery-beat
6. docker-compose stop backend celery celery-beat
7. docker-compose up -d --force-recreate backend celery celery-beat
8. sleep 20  # Aguardar containers iniciarem
9. Verificar se backend está rodando
10. docker exec obreiro_backend_prod python manage.py migrate --noinput
11. docker exec obreiro_backend_prod python manage.py collectstatic --noinput
12. docker-compose build --no-cache frontend-build
13. docker-compose up frontend-build  # Build React
14. rm -rf /root/obreiro-digital-landing/frontend_build/*
15. docker cp obreiro_frontend_build:/app/dist/. /root/obreiro-digital-landing/frontend_build/
16. chmod -R 755 /root/obreiro-digital-landing/frontend_build
17. 💾 BACKUP FRONTEND: cp -r /var/www/html/prod /var/www/html/prod_backup_TIMESTAMP
18. mkdir -p /var/www/html/prod
19. cp -r /root/obreiro-digital-landing/frontend_build/* /var/www/html/prod/
20. chmod -R 755 /var/www/html/prod
21. Verificar se index.html existe
22. nginx -t  # Testar configuração
23. systemctl reload nginx
24. Health check backend (aceita HTTP 200, 401, 403)
25. Health check frontend (aceita HTTP 200)
26. docker system prune -f  # Cleanup
27. Mostrar logs dos containers
```

**Validações de Segurança:**
- ✅ Validação de secrets antes de iniciar
- ✅ Backup do banco antes de qualquer alteração
- ✅ Backup do frontend antes de sobrescrever
- ✅ Health checks rigorosos (falha = abort)
- ✅ Verificação se containers estão rodando

**Notificações:**
- ✅ **Sucesso:** Email para `suporteobreirovirtual@gmail.com` e `jrmeloafrf@gmail.com`
- ❌ **Falha:** Email com logs, troubleshooting e procedimento de rollback

**Duração:** ~3-4 minutos
**Status:** ✅ Implementado e funcionando

---

### 4. Teste SSH Produção (`test-ssh-prod.yml`)

**Arquivo:** `.github/workflows/test-ssh-prod.yml`
**Trigger:** Manual via `workflow_dispatch`

**Propósito:** Validar conectividade SSH antes de deploy

**O que verifica:**
1. ✅ Conexão SSH estabelecida
2. ✅ Diretório `/root/obreiro-digital-landing` existe
3. ✅ Branch atual
4. ✅ Arquivos `.env` presentes
5. ✅ Containers rodando

**Status:** ✅ Implementado e funcionando

---

### 5. Verificar Status PROD (`check-prod-status.yml`)

**Arquivo:** `.github/workflows/check-prod-status.yml`
**Trigger:** Manual via `workflow_dispatch`

**Propósito:** Auditoria do estado de produção

**O que verifica:**
1. ✅ Commit atual na VPS
2. ✅ Branch atual
3. ✅ Migrações aplicadas (últimas 20)
4. ✅ Tabelas no banco de dados
5. ✅ Containers rodando e status
6. ✅ Tempo de execução dos containers

**Status:** ✅ Implementado

---

## 🔐 Secrets e Configurações

### Secrets no GitHub

**Localização:** `Settings → Secrets and variables → Actions → Repository secrets`

| Secret | Descrição | Usado em | Observação |
|--------|-----------|----------|------------|
| `HML_VPS_HOST` | IP da VPS | HML, PROD | ⚠️ Mesma VPS para ambos |
| `HML_VPS_USER` | Usuário SSH (root) | HML, PROD | ⚠️ Mesmo usuário |
| `HML_VPS_SSH_KEY` | Chave privada SSH | HML, PROD | ⚠️ Mesma chave |
| `EMAIL_USERNAME` | Email SMTP Gmail | HML, PROD | Para notificações |
| `EMAIL_PASSWORD` | Senha app Gmail | HML, PROD | Token gerado no Gmail |

**⚠️ IMPORTANTE:**
- PROD usa `HML_VPS_*` porque ambos ambientes estão na **mesma VPS**
- Apenas os **diretórios** e **portas** são diferentes
- Se no futuro PROD for para VPS diferente, criar `PROD_VPS_*` separados

### Como Gerar Chave SSH

```bash
# 1. Gerar chave SSH
ssh-keygen -t ed25519 -C "github-actions-obreiro" -f ~/.ssh/github_actions_obreiro

# 2. Adicionar chave pública ao servidor
cat ~/.ssh/github_actions_obreiro.pub | ssh root@VPS_IP "cat >> ~/.ssh/authorized_keys"

# 3. Testar conexão
ssh -i ~/.ssh/github_actions_obreiro root@VPS_IP

# 4. Copiar chave PRIVADA para GitHub Secrets
cat ~/.ssh/github_actions_obreiro
# Copiar TODO o conteúdo incluindo:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ...
# -----END OPENSSH PRIVATE KEY-----
```

### Como Gerar Senha de App Gmail

1. Acessar: https://myaccount.google.com/apppasswords
2. Nome: "GitHub Actions Obreiro Virtual"
3. Gerar senha
4. Copiar senha (formato: `xxxx xxxx xxxx xxxx`)
5. Adicionar ao secret `EMAIL_PASSWORD`

---

## 🛡️ Estratégia de Deploy

### Zero-Downtime Deployment

**Objetivo:** Deploy sem interrupção do serviço

**Como funciona:**

```
┌────────────────────────────────────────────────────┐
│ 1. Containers antigos rodando                       │
│    ├── Backend v1.0 (healthy)                       │
│    └── Nginx → Backend v1.0                         │
└────────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────────┐
│ 2. Build nova versão (paralelo)                     │
│    ├── Backend v1.0 (healthy) ← ainda servindo     │
│    └── Backend v1.1 (building...)                   │
└────────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────────┐
│ 3. Stop containers antigos                          │
│    ├── Backend v1.0 (stopping...)                   │
│    └── Backend v1.1 (ready)                         │
└────────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────────┐
│ 4. Start novos containers                           │
│    ├── Backend v1.1 (starting...)                   │
│    └── Nginx → aguardando...                        │
└────────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────────┐
│ 5. Health checks                                     │
│    ├── Backend v1.1 (healthy) ✅                    │
│    └── Migrations aplicadas ✅                      │
└────────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────────┐
│ 6. Nginx reload (troca instantânea)                 │
│    └── Nginx → Backend v1.1 ✅                      │
└────────────────────────────────────────────────────┘
```

**Tempo de downtime real:** ~5-10 segundos (durante o stop/start)

---

### Rollback Manual

Se algo der errado após deploy:

```bash
# 1. Conectar na VPS
ssh root@<VPS_IP>

# 2. Para HML:
cd /root/obreiro-hml
git log -5  # Ver últimos commits
git reset --hard <COMMIT_ANTERIOR>
docker-compose -f docker-compose.hml.yml up -d --build --force-recreate

# 3. Para PROD:
cd /root/obreiro-digital-landing
git log -5  # Ver últimos commits
git reset --hard <COMMIT_ANTERIOR>

# 4. Restaurar banco (se necessário)
ls -lht /root/backups/ | head -5
docker exec -i obreiro_postgres_prod psql -U obreiro_prod obreiro_prod < /root/backups/backup_prod_LATEST.sql

# 5. Rebuild
docker-compose -f docker-compose.prod.yml up -d --build --force-recreate backend celery celery-beat
```

---

## 📊 Monitoramento e Health Checks

### Health Checks Implementados

**Backend (Django API):**
```bash
# HML
curl -I https://hml.obreirovirtual.com/api/v1/
# Esperado: HTTP/2 401 (Unauthorized) ou 200 OK

# PROD
curl -I https://www.obreirovirtual.com/api/v1/
# Esperado: HTTP/2 401 (Unauthorized) ou 200 OK
```

**Frontend (React SPA):**
```bash
# HML
curl -I https://hml.obreirovirtual.com/
# Esperado: HTTP/2 200

# PROD
curl -I https://www.obreirovirtual.com/
# Esperado: HTTP/2 200
```

**Admin Django:**
```bash
# HML
curl -I https://hml.obreirovirtual.com/admin/
# Esperado: HTTP/2 302 (redirect para login)

# PROD
curl -I https://www.obreirovirtual.com/admin/
# Esperado: HTTP/2 302 (redirect para login)
```

**⚠️ IMPORTANTE:** HTTP 401 é resposta **VÁLIDA** para API sem autenticação!

---

### Logs

**Nginx (HOST):**
```bash
# HML
tail -f /var/log/nginx/hml.obreirovirtual.com.access.log
tail -f /var/log/nginx/hml.obreirovirtual.com.error.log

# PROD
tail -f /var/log/nginx/obreirovirtual.com.access.log
tail -f /var/log/nginx/obreirovirtual.com.error.log
```

**Backend Django:**
```bash
# HML
docker logs obreiro_backend_hml -f --tail=100

# PROD
docker logs obreiro_backend_prod -f --tail=100
```

**Celery Worker:**
```bash
# HML
docker logs obreiro_celery_hml -f --tail=100

# PROD
docker logs obreiro_celery_prod -f --tail=100
```

**Celery Beat:**
```bash
# HML
docker logs obreiro_celery_beat_hml -f --tail=100

# PROD
docker logs obreiro_celery_beat_prod -f --tail=100
```

---

### Métricas e Status

**Ver status dos containers:**
```bash
# Todos containers obreiro
docker ps --filter "name=obreiro" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# HML específico
docker ps --filter "name=obreiro_.*_hml" --format "table {{.Names}}\t{{.Status}}"

# PROD específico
docker ps --filter "name=obreiro_.*_prod" --format "table {{.Names}}\t{{.Status}}"
```

**Ver uso de recursos:**
```bash
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" $(docker ps --filter "name=obreiro" -q)
```

---

## 🔧 Troubleshooting

### Deploy Falhou - Checklist

**1. Verificar logs do GitHub Actions:**
```
1. Acessar: https://github.com/melojrx/obreiro-digital-landing/actions
2. Clicar no workflow que falhou
3. Clicar no step que falhou
4. Ler logs completos
```

**2. Problemas Comuns:**

| Erro | Causa | Solução |
|------|-------|---------|
| `ssh: no key found` | Chave SSH inválida | Recriar secret `HML_VPS_SSH_KEY` |
| `cd /root/obreiro-prod: No such file` | Diretório incorreto | Verificar se está usando `/root/obreiro-digital-landing` |
| `Backend não está respondendo` | Health check falhou | Verificar se aceita HTTP 401 |
| `index.html não encontrado` | Frontend não copiado | Verificar permissões em `/var/www/html/` |
| `nginx -t failed` | Config nginx inválida | Testar configuração manualmente |

**3. Verificar estado na VPS:**
```bash
ssh root@<VPS_IP>

# Ver último commit deployado
cd /root/obreiro-digital-landing  # ou /root/obreiro-hml
git log -1

# Ver containers rodando
docker ps | grep obreiro

# Ver logs recentes
docker logs obreiro_backend_prod --tail=50  # ou _hml

# Testar backend localmente
curl http://localhost:8000/api/v1/  # PROD
curl http://localhost:8001/api/v1/  # HML
```

---

### Problemas Específicos

#### Backend não inicia

```bash
# Ver logs detalhados
docker logs obreiro_backend_prod --tail=200

# Verificar se banco está acessível
docker exec obreiro_backend_prod python manage.py check

# Testar migrations
docker exec obreiro_backend_prod python manage.py showmigrations

# Restartar backend
docker restart obreiro_backend_prod
```

#### Frontend não carrega

```bash
# Verificar se arquivos existem
ls -lh /var/www/html/prod/  # ou hml/

# Verificar se index.html existe
cat /var/www/html/prod/index.html

# Verificar permissões
ls -la /var/www/html/prod/

# Recopiar frontend
docker cp obreiro_frontend_build:/app/dist/. /root/obreiro-digital-landing/frontend_build/
sudo cp -r /root/obreiro-digital-landing/frontend_build/* /var/www/html/prod/
sudo chmod -R 755 /var/www/html/prod/
sudo systemctl reload nginx
```

#### Migrações falharam

```bash
# Ver quais migrações estão pendentes
docker exec obreiro_backend_prod python manage.py showmigrations | grep "\[ \]"

# Aplicar migrations manualmente
docker exec obreiro_backend_prod python manage.py migrate --noinput

# Se falhar, ver erro específico
docker exec obreiro_backend_prod python manage.py migrate

# Rollback última migration (se necessário)
docker exec obreiro_backend_prod python manage.py migrate <app_name> <migration_number>
```

---

## 📚 Comandos Úteis

### Deploy Manual (Emergência)

```bash
# HML
ssh root@<VPS_IP>
cd /root/obreiro-hml
git pull origin develop
docker-compose -f docker-compose.hml.yml up -d --build --force-recreate backend_hml celery_hml celery_beat_hml
docker-compose -f docker-compose.hml.yml run --rm frontend_hml
docker cp obreiro_frontend_hml:/app/dist/. /root/obreiro-hml/frontend-build/
sudo cp -r /root/obreiro-hml/frontend-build/* /var/www/html/hml/
sudo systemctl reload nginx

# PROD
ssh root@<VPS_IP>
cd /root/obreiro-digital-landing
git pull origin main
docker-compose -f docker-compose.prod.yml up -d --build --force-recreate backend celery celery-beat
docker-compose -f docker-compose.prod.yml up frontend-build
docker cp obreiro_frontend_build:/app/dist/. /root/obreiro-digital-landing/frontend_build/
sudo cp -r /root/obreiro-digital-landing/frontend_build/* /var/www/html/prod/
sudo systemctl reload nginx
```

### Verificar Diferenças entre HML e PROD

```bash
# Na VPS
diff /root/obreiro-hml/.env_hml /root/obreiro-digital-landing/.env_prod

# No repositório local
git diff develop main --stat
git log develop..main --oneline
```

### Backup Manual do Banco

```bash
# HML
docker exec obreiro_postgres_hml pg_dump -U obreiro_hml obreiro_hml > backup_hml_$(date +%Y%m%d_%H%M%S).sql

# PROD
docker exec obreiro_postgres_prod pg_dump -U obreiro_prod obreiro_prod > /root/backups/backup_prod_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar Backup do Banco

```bash
# HML
docker exec -i obreiro_postgres_hml psql -U obreiro_hml obreiro_hml < backup_hml_XXXXXXXX.sql

# PROD
docker exec -i obreiro_postgres_prod psql -U obreiro_prod obreiro_prod < /root/backups/backup_prod_XXXXXXXX.sql
```

### Limpeza de Docker

```bash
# Remover containers parados
docker container prune -f

# Remover imagens não usadas
docker image prune -a -f

# Remover volumes não usados (CUIDADO!)
docker volume prune -f

# Limpeza completa
docker system prune -a -f --volumes
```

---

## 🎯 Melhorias Futuras

### Curto Prazo (1 mês)
- [ ] Adicionar testes E2E com Playwright nos workflows
- [ ] Implementar notificações no Discord/Slack
- [ ] Adicionar métricas de performance nos deploys
- [ ] Criar workflow de rollback automático

### Médio Prazo (3 meses)
- [ ] Separar PROD em VPS dedicada
- [ ] Implementar Blue-Green deployment
- [ ] Adicionar monitoramento com Prometheus + Grafana
- [ ] Implementar logs centralizados (ELK Stack)
- [ ] Adicionar testes de carga automatizados

### Longo Prazo (6 meses)
- [ ] Deploy multi-região
- [ ] Auto-scaling baseado em carga
- [ ] Disaster recovery automático
- [ ] Compliance e auditoria automatizada
- [ ] A/B testing automatizado

---

## 📞 Contatos e Suporte

**Equipe Técnica:**
- Junior Melo - jrmeloafrf@gmail.com
- Suporte: suporteobreirovirtual@gmail.com

**Links Úteis:**
- Repositório: https://github.com/melojrx/obreiro-digital-landing
- Issues: https://github.com/melojrx/obreiro-digital-landing/issues
- Actions: https://github.com/melojrx/obreiro-digital-landing/actions

**Documentação Relacionada:**
- Setup GitHub Actions: `docs/GITHUB_ACTIONS_SETUP.md`
- Análise de Arquitetura: `ANALISE_ARQUITETURA_COMPLETA.md`
- Comandos Docker: `docs/COMANDOS_UTEIS_DEPLOY.md`

---

**Última atualização:** 25/11/2025
**Versão:** 3.0
**Autor:** Junior Melo
**Status:** ✅ **PROD e HML 100% Funcionais**

---

## 📝 Changelog

### v3.0 (25/11/2025)
- ✅ Deploy de PRODUÇÃO implementado e funcionando
- ✅ Correção de diretórios (usando `/root/obreiro-digital-landing`)
- ✅ Health checks corrigidos (aceita HTTP 401)
- ✅ Secrets consolidados (HML_VPS_* para ambos ambientes)
- ✅ Backup automático de banco e frontend
- ✅ Workflows de teste SSH e verificação de status
- ✅ Documentação completa atualizada

### v2.0 (24/11/2025)
- ✅ Deploy de HML implementado
- ✅ CI Tests implementados
- ✅ Notificações por email
- ✅ Migração nginx para HOST

### v1.0 (Inicial)
- ✅ Estrutura básica do projeto
