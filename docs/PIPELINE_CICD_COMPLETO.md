# 🚀 Pipeline CI/CD Completo - Obreiro Virtual

**Documentação completa do fluxo de deploy automático**

**Versão:** 2.0
**Data:** 24/11/2025
**Status:** 🟢 Implementado e Funcionando

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura dos Ambientes](#arquitetura-dos-ambientes)
3. [Fluxo de Trabalho (GitFlow)](#fluxo-de-trabalho-gitflow)
4. [Workflows Implementados](#workflows-implementados)
5. [Estratégia de Deploy](#estratégia-de-deploy)
6. [Proteções e Validações](#proteções-e-validações)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

### Pipeline Atual

```
┌─────────────┐
│   Código    │
│  (develop)  │
└──────┬──────┘
       │
       │ push/PR
       ▼
┌─────────────┐
│  CI Tests   │◄── Validação de código
└──────┬──────┘
       │
       │ ✅ passou
       ▼
┌─────────────┐
│  Deploy     │
│     HML     │◄── Automático
└──────┬──────┘
       │
       │ aprovação manual
       │ via PR para main
       ▼
┌─────────────┐
│  Deploy     │
│   PRODUÇÃO  │◄── Requer aprovação
└─────────────┘
```

### Branches e Ambientes

| Branch | Ambiente | URL | Deploy | Aprovação |
|--------|----------|-----|--------|-----------|
| `develop` | Homologação (HML) | hml.obreirovirtual.com | ✅ Automático | ❌ Não requer |
| `main` | Produção (PROD) | obreirovirtual.com | ✅ Automático | ✅ PR Review obrigatório |

---

## 🏗️ Arquitetura dos Ambientes

### Ambiente de Homologação (HML)

**Localização:** VPS - `/root/obreiro-hml`

**Componentes:**

1. **NGINX no HOST**
   - Virtual host: `hml.obreirovirtual.com`
   - Serve frontend estático: `/root/obreiro-hml/frontend-build/`
   - Proxy para backend: `http://localhost:8001`
   - Arquivos estáticos Django: `/root/obreiro-hml/staticfiles/`

2. **Backend (Docker)**
   - Container: `obreiro_backend_hml`
   - Porta: `8001` (mapeada do host)
   - Arquivo: `docker-compose.hml.yml`
   - Comando: Gunicorn

3. **Banco de Dados (Docker)**
   - Container: `obreiro_postgres_hml`
   - Porta: `5433` (mapeada do host)
   - Database: `obreiro_hml`

4. **Workers (Docker)**
   - `obreiro_celery_hml`: Worker Celery
   - `obreiro_celery_beat_hml`: Scheduler
   - `obreiro_redis_hml`: Broker/Cache

5. **Frontend (Docker - Build Only)**
   - Container temporário: `obreiro_frontend_hml`
   - Build com Vite + React
   - Output: Volume → `/root/obreiro-hml/frontend-build/`

---

### Ambiente de Produção (PROD)

**Localização:** VPS - `/root/obreiro-prod`

**Componentes:**

1. **NGINX no HOST**
   - Virtual host: `obreirovirtual.com` e `www.obreirovirtual.com`
   - Serve frontend estático: `/root/obreiro-prod/frontend-build/`
   - Proxy para backend: `http://localhost:8000`
   - Arquivos estáticos Django: `/root/obreiro-prod/staticfiles/`
   - SSL: Let's Encrypt (certbot)

2. **Backend (Docker)**
   - Container: `obreiro_backend_prod`
   - Porta: `8000` (mapeada do host)
   - Arquivo: `docker-compose.prod.yml`
   - Comando: Gunicorn com mais workers

3. **Banco de Dados (Docker)**
   - Container: `obreiro_postgres_prod`
   - Porta: `5432` (mapeada do host)
   - Database: `obreiro_prod`
   - Backups automáticos: `/root/obreiro-prod/backups/`

4. **Workers (Docker)**
   - `obreiro_celery_prod`: Worker Celery (mais concorrência)
   - `obreiro_celery_beat_prod`: Scheduler
   - `obreiro_redis_prod`: Broker/Cache

5. **Frontend (Docker - Build Only)**
   - Container temporário: `obreiro_frontend_prod`
   - Build com Vite + React (otimizado para produção)
   - Output: Volume → `/root/obreiro-prod/frontend-build/`

---

## 🔄 Fluxo de Trabalho (GitFlow)

### 1. Desenvolvimento Local

```bash
# Criar feature branch
git checkout develop
git pull origin develop
git checkout -b feature/nome-da-feature

# Desenvolver e testar localmente
npm run dev        # Frontend
python manage.py runserver  # Backend

# Commit
git add .
git commit -m "feat: adiciona nova funcionalidade"
git push origin feature/nome-da-feature
```

### 2. Pull Request para Develop

```bash
# Criar PR no GitHub
# feature/nome-da-feature → develop

# Automático após merge:
✅ CI Tests executam
✅ Deploy HML executado
📧 Email de notificação enviado
```

### 3. Testes em Homologação

```
🌐 Testar em: https://hml.obreirovirtual.com
✅ Validar funcionalidades
✅ Testar integrações
✅ Revisar com stakeholders
```

### 4. Pull Request para Main (Produção)

```bash
# Quando HML estiver estável
# Criar PR: develop → main

# Requer:
✅ Aprovação de code review (obrigatório)
✅ CI Tests passar
✅ Sem conflitos

# Após merge:
✅ Deploy PROD executado automaticamente
📧 Email de notificação enviado
🔔 Monitoramento ativado
```

---

## 🤖 Workflows Implementados

### 1. CI - Testes Mínimos (`ci-tests.yml`)

**Trigger:** Push ou PR em `develop` ou `main`

**O que faz:**
- ✅ Valida sintaxe Python
- ✅ Instala dependências do frontend
- ✅ Executa build do React + Vite
- ✅ Verifica se build foi criado

**Duração:** ~30-40 segundos

---

### 2. Deploy Homologação (`deploy-hml.yml`)

**Trigger:** Push em `develop`

**Steps:**
1. Checkout do código
2. Conexão SSH na VPS
3. Pull do código na VPS (`/root/obreiro-hml`)
4. Carrega variáveis de ambiente (`.env_hml`)
5. Rebuild containers backend
6. Para containers atuais
7. Inicia novos containers
8. Aplica migrações Django
9. Coleta arquivos estáticos
10. Rebuild frontend React
11. Copia build para host (`/root/obreiro-hml/frontend-build/`)
12. Ajusta permissões
13. Recarrega NGINX
14. Health check (backend + frontend)
15. Envia email de sucesso/falha

**Duração:** ~1-2 minutos

**Notificações:**
- 📧 Email para: `suporteobreirovirtual@gmail.com`
- ✅ Sucesso: Template verde com links
- ❌ Falha: Template vermelho com troubleshooting

---

### 3. Deploy Produção (`deploy-prod.yml`) - A IMPLEMENTAR

**Trigger:** Push em `main` (após merge de PR aprovado)

**Steps:**
1. Checkout do código
2. **Validação extra de segurança**
3. Conexão SSH na VPS
4. Backup automático do banco de dados
5. Pull do código na VPS (`/root/obreiro-prod`)
6. Carrega variáveis de ambiente (`.env_prod`)
7. **Testes de smoke pré-deploy**
8. Rebuild containers backend (sem downtime)
9. Para containers atuais gradualmente
10. Inicia novos containers
11. Aplica migrações Django (com rollback automático se falhar)
12. Coleta arquivos estáticos
13. Rebuild frontend React (otimizado)
14. Copia build para host (`/root/obreiro-prod/frontend-build/`)
15. Ajusta permissões
16. **Testa nova versão antes de ativar**
17. Recarrega NGINX
18. Health check estendido (5min de monitoramento)
19. **Se falhar: Rollback automático**
20. Envia email de sucesso/falha

**Duração:** ~3-5 minutos

**Notificações:**
- 📧 Email para: `suporteobreirovirtual@gmail.com`
- 💬 Slack/Discord (opcional)
- 📊 Métricas de deploy

---

## 🛡️ Estratégia de Deploy

### Zero-Downtime Strategy

**Objetivo:** Deploy sem interrupção do serviço

**Como funciona:**

1. **Build da nova versão** (em paralelo com versão antiga rodando)
2. **Validação da nova versão** (health checks)
3. **Troca gradual de tráfego** (NGINX reload)
4. **Monitoramento pós-deploy** (5min)
5. **Rollback automático** se erros detectados

### Rollback Automático

**Triggers para rollback:**
- ❌ Health check falha após deploy
- ❌ Taxa de erro > 5% nos primeiros 5min
- ❌ Backend não responde após 30s
- ❌ Migrações falham

**Processo de rollback:**
```bash
# Automático via workflow
1. git reset --hard COMMIT_ANTERIOR
2. Rebuild containers com versão anterior
3. Restaurar banco de dados do backup (se necessário)
4. Reiniciar serviços
5. Notificar equipe
```

---

## 🔒 Proteções e Validações

### Branch Protection Rules

**Branch `main` (Produção):**
- ✅ Requer pull request
- ✅ Requer aprovação de code review (1 pessoa)
- ✅ Requer CI passar
- ✅ Requer branch atualizada
- ❌ Não permite force push
- ❌ Não permite delete

**Branch `develop` (Homologação):**
- ✅ Requer pull request (recomendado)
- ⚠️ CI deve passar
- ✅ Permite push direto (desenvolvedores)

### Environments no GitHub

**Environment: `homologation`**
- URL: https://hml.obreirovirtual.com
- Secrets: `HML_VPS_HOST`, `HML_VPS_USER`, `HML_VPS_SSH_KEY`
- Protection: Nenhuma (deploy automático)

**Environment: `production`**
- URL: https://obreirovirtual.com
- Secrets: `PROD_VPS_HOST`, `PROD_VPS_USER`, `PROD_VPS_SSH_KEY`
- Protection:
  - ✅ Required reviewers: 1 pessoa
  - ✅ Wait timer: 5 minutos
  - ✅ Allowed branches: `main` apenas

### Validações Pré-Deploy

**Homologação:**
1. ✅ Sintaxe Python válida
2. ✅ Frontend builda sem erros
3. ✅ Testes unitários passam (se habilitados)

**Produção (mais rigoroso):**
1. ✅ Todos os checks de HML
2. ✅ PR aprovado por revisor
3. ✅ Branch atualizada com main
4. ✅ Sem conflitos de merge
5. ✅ Testes de integração passam
6. ✅ Backup do banco criado

---

## 📊 Monitoramento e Métricas

### Health Checks

**Backend:**
```bash
curl -f https://hml.obreirovirtual.com/api/v1/
# Deve retornar: 401 (requer autenticação) ou 200
```

**Frontend:**
```bash
curl -I https://hml.obreirovirtual.com/
# Deve retornar: 200 OK
```

**Admin Django:**
```bash
curl -I https://hml.obreirovirtual.com/admin/
# Deve retornar: 302 (redirect para login)
```

### Logs

**Locais dos logs:**

**HML:**
- NGINX: `/var/log/nginx/hml.obreirovirtual.com.*.log`
- Backend: `docker logs obreiro_backend_hml`
- Celery: `docker logs obreiro_celery_hml`

**PROD:**
- NGINX: `/var/log/nginx/obreirovirtual.com.*.log`
- Backend: `docker logs obreiro_backend_prod`
- Celery: `docker logs obreiro_celery_prod`
- Backups: `/root/obreiro-prod/backups/`

---

## 🔧 Troubleshooting

### Deploy HML Falhou

**1. Verificar logs do workflow:**
```
GitHub → Actions → Deploy para Homologação → Ver logs
```

**2. Conectar na VPS e verificar:**
```bash
ssh root@VPS_IP
cd /root/obreiro-hml
docker-compose -f docker-compose.hml.yml ps
docker-compose -f docker-compose.hml.yml logs --tail=50 backend_hml
```

**3. Problemas comuns:**
- ❌ **SSH falhou:** Verificar chave em Secrets
- ❌ **Build falhou:** Erro no código, reverter commit
- ❌ **Migração falhou:** Verificar models.py, corrigir e redeploy
- ❌ **Frontend não copia:** Verificar permissões do diretório

---

### Deploy PROD Falhou

**1. NÃO ENTRAR EM PÂNICO** ✋

**2. Verificar se rollback automático foi acionado:**
```bash
# Ver logs do workflow
# Se rollback executou, versão anterior está rodando
```

**3. Se rollback não executou:**
```bash
# Conectar na VPS
ssh root@VPS_IP
cd /root/obreiro-prod

# Voltar para commit anterior
git log -3  # Ver últimos commits
git reset --hard COMMIT_ANTERIOR

# Redeploy manual
docker-compose -f docker-compose.prod.yml up -d --build --force-recreate backend
```

**4. Restaurar banco (apenas se necessário):**
```bash
cd /root/obreiro-prod/backups
ls -lt | head -5  # Ver backups recentes
# Restaurar último backup antes do deploy
```

---

### Health Check Sempre Falha

**Diagnóstico:**
```bash
# Testar localmente na VPS
curl -v https://hml.obreirovirtual.com/api/v1/

# Verificar se container está rodando
docker ps | grep obreiro_backend

# Verificar logs
docker logs obreiro_backend_hml --tail=100

# Testar diretamente no container
docker exec obreiro_backend_hml curl http://localhost:8000/api/v1/
```

---

## 📚 Comandos Úteis

### Deploy Manual (Emergency)

**HML:**
```bash
cd /root/obreiro-hml
git pull origin develop
docker-compose -f docker-compose.hml.yml up -d --build --force-recreate
```

**PROD:**
```bash
cd /root/obreiro-prod
git pull origin main
docker-compose -f docker-compose.prod.yml up -d --build --force-recreate
```

### Rollback Manual

```bash
cd /root/obreiro-[hml|prod]
git log -5  # Ver commits recentes
git reset --hard COMMIT_SHA
docker-compose -f docker-compose.[hml|prod].yml up -d --build --force-recreate
```

### Ver Diferenças entre HML e PROD

```bash
# Na VPS
diff /root/obreiro-hml/.env_hml /root/obreiro-prod/.env_prod
git diff develop main
```

---

## 🎯 Próximas Melhorias

### Curto Prazo (1-2 semanas)
- [ ] Implementar workflow de deploy para PROD
- [ ] Adicionar testes E2E com Playwright
- [ ] Configurar alertas no Slack/Discord
- [ ] Implementar backup automático diário

### Médio Prazo (1-2 meses)
- [ ] Blue-Green deployment
- [ ] Canary releases (1% → 10% → 100%)
- [ ] Monitoramento com Prometheus + Grafana
- [ ] Logs centralizados (ELK Stack)

### Longo Prazo (3-6 meses)
- [ ] Deploy multi-região
- [ ] Auto-scaling baseado em carga
- [ ] Disaster recovery plan
- [ ] Compliance e auditoria

---

## 📞 Contatos

**Suporte Técnico:**
- Email: suporteobreirovirtual@gmail.com
- GitHub Issues: https://github.com/melojrx/obreiro-digital-landing/issues

**Documentação:**
- Pipeline CI/CD: Este documento
- Setup GitHub Actions: `docs/GITHUB_ACTIONS_SETUP.md`
- Comandos Úteis: `docs/COMANDOS_UTEIS_DEPLOY.md`
- Testes Pré-Commit: `docs/TESTES_PRE_COMMIT.md`

---

**Última atualização:** 24/11/2025
**Versão:** 2.0
**Autor:** Junior Melo
**Status:** ✅ HML Implementado | 🔄 PROD Em Implementação
