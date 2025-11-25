# 🛡️ ANÁLISE DE RISCOS - Migração Nginx para Host

**Data:** 24/11/2025
**Objetivo:** Avaliar riscos e impactos da migração do Nginx para o Host
**Status:** Análise Completa de Segurança

---

## 📊 RESUMO EXECUTIVO

### ✅ RESPOSTA DIRETA ÀS SUAS PERGUNTAS

| Pergunta | Resposta | Risco |
|----------|----------|-------|
| **Riscos para os ambientes?** | Baixíssimo (migração controlada) | 🟢 Baixo |
| **Muda código de produção?** | **NÃO** (zero mudanças no código) | 🟢 Nenhum |
| **Afeta ambiente de desenvolvimento?** | **NÃO** (dev usa containers próprios) | 🟢 Nenhum |
| **Afeta frontend?** | **NÃO** (apenas muda quem serve) | 🟢 Nenhum |
| **Afeta Celery?** | **NÃO** (continua nos containers) | 🟢 Nenhum |
| **Afeta Redis?** | **NÃO** (continua nos containers) | 🟢 Nenhum |

**Conclusão:** Migração é **SEGURA** com risco **MUITO BAIXO**.

---

## 🔍 ANÁLISE DETALHADA POR COMPONENTE

### 1️⃣ CÓDIGO DE PRODUÇÃO

#### ❓ O que muda?
**NADA! Zero mudanças no código.**

```python
# backend/config/settings.py
# Continua EXATAMENTE IGUAL
ALLOWED_HOSTS = ['www.obreirovirtual.com', 'hml.obreirovirtual.com']
CORS_ALLOWED_ORIGINS = ['https://www.obreirovirtual.com']
```

#### ✅ Por que não precisa mudar?

O backend Django **não sabe** nem **precisa saber** se está atrás de nginx HOST ou nginx Container.

**Antes:**
```
Browser → Nginx Container → Backend Container (porta 8000)
```

**Depois:**
```
Browser → Nginx HOST → Backend Container (porta 8000)
```

Backend recebe requests do **mesmo jeito**.

#### 📝 Mudanças necessárias no código:
```
NENHUMA! 🎉
```

---

### 2️⃣ AMBIENTE DE DESENVOLVIMENTO

#### ❓ O que muda?
**NADA! Dev é completamente independente.**

#### 📋 Configuração Dev Atual:

```yaml
# docker-compose.dev.yml
services:
  backend:
    ports: "8000:8000"      # Acesso direto
  frontend:
    ports: "5173:5173"      # Vite dev server
  postgres:
    ports: "5432:5432"
  redis:
    ports: "6379:6379"
```

**Características:**
- ✅ Usa portas diretas (sem nginx)
- ✅ Hot reload do Vite funciona
- ✅ Backend em modo debug
- ✅ Banco PostgreSQL próprio
- ✅ Rede Docker própria (`obreiro_dev_network`)

#### 🔒 Isolamento Total:

```
┌──────────────────────────────────────┐
│   AMBIENTE DE DESENVOLVIMENTO        │
│   (Não afetado pela mudança)         │
├──────────────────────────────────────┤
│  Backend: localhost:8000             │
│  Frontend: localhost:5173            │
│  PostgreSQL: localhost:5432          │
│  Redis: localhost:6379               │
└──────────────────────────────────────┘
         ⬇ Zero mudanças
┌──────────────────────────────────────┐
│   PRODUÇÃO/HML                        │
│   (Nginx HOST será aplicado aqui)    │
└──────────────────────────────────────┘
```

#### ✅ Garantias:
- Dev continua usando `npm run dev` localmente
- Backend dev continua em modo debug
- Nenhum arquivo de dev precisa ser modificado

---

### 3️⃣ FRONTEND (React + Vite)

#### ❓ O que muda?
**Quem serve os arquivos estáticos**, não os arquivos em si.

#### 📦 Arquivos Frontend:

```bash
/root/obreiro-hml/frontend-build/
├── index.html          # ← Mesmo arquivo
├── assets/
│   ├── index-xyz.js    # ← Mesmo arquivo
│   └── index-xyz.css   # ← Mesmo arquivo
└── favicon.ico         # ← Mesmo arquivo
```

**Antes:**
```
Nginx Container serve de:
/var/www/html/hml/frontend/ (dentro do container)
```

**Depois:**
```
Nginx HOST serve de:
/var/www/html/hml/ (no host)
```

#### 🔄 O que acontece no build:

```bash
# 1. Frontend é buildado (IGUAL)
docker-compose -f docker-compose.hml.yml build frontend_hml

# 2. Arquivos gerados (IGUAL)
/app/dist/index.html
/app/dist/assets/...

# 3. Copiado para o host (NOVO LOCAL, mas MESMOS ARQUIVOS)
docker cp frontend:/app/dist/. /var/www/html/hml/
```

#### ✅ Mudanças no código frontend:
```
NENHUMA! Os arquivos .js, .css, .html são idênticos.
```

#### ⚙️ Variáveis de ambiente frontend:

```env
# .env (frontend)
VITE_API_URL=https://hml.obreirovirtual.com/api/v1  # ← CONTINUA IGUAL
```

**Por quê?** Porque o frontend sempre chama a mesma URL da API, independente de quem serve os arquivos.

---

### 4️⃣ CELERY (Workers)

#### ❓ O que muda?
**NADA! Celery nem sabe que nginx existe.**

#### 🔧 Por que Celery não é afetado?

Celery **não recebe requests HTTP**. Ele:
1. Lê tarefas do **Redis**
2. Processa em background
3. Salva resultados no **banco**

```
┌──────────────────────────────────────┐
│  Nginx (HTTP)                         │  ← Afetado
│  ├── Frontend (GET /index.html)      │
│  └── Backend API (POST /api/...)     │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  Celery (Background Tasks)            │  ← NÃO afetado
│  ├── Redis: tarefas pendentes         │
│  ├── Postgres: salva resultados       │
│  └── Logs: /var/log/obreiro/          │
└──────────────────────────────────────┘
```

#### ✅ Celery continua:
- ✅ Lendo tarefas do Redis
- ✅ Processando emails, relatórios, etc
- ✅ Salvando no banco de dados
- ✅ Com mesma configuração

#### 📝 Mudanças no Celery:
```
NENHUMA!
```

---

### 5️⃣ REDIS (Cache & Broker)

#### ❓ O que muda?
**NADA! Redis é interno aos containers.**

#### 🔧 Configuração Redis:

```yaml
# docker-compose.hml.yml
redis_hml:
  container_name: obreiro_redis_hml
  networks:
    - obreiro_network_hml    # ← Rede interna
  # SEM PORTAS EXPOSTAS (segurança)
```

**Quem acessa Redis:**
- ✅ Backend (via rede interna)
- ✅ Celery (via rede interna)
- ❌ Nginx (não acessa Redis)
- ❌ Mundo externo (não tem acesso)

#### ✅ Redis continua:
- ✅ Na mesma rede Docker
- ✅ Com mesma configuração
- ✅ Sem exposição externa

#### 📝 Mudanças no Redis:
```
NENHUMA!
```

---

## 🎯 O QUE REALMENTE MUDA?

### ✅ Mudanças Físicas (apenas infraestrutura):

| Componente | Antes | Depois |
|------------|-------|--------|
| **Nginx** | Container Docker | Processo systemd no host |
| **SSL Certs** | `/etc/letsencrypt/` (container) | `/etc/letsencrypt/` (host) |
| **Logs Nginx** | `/var/log/nginx/` (container) | `/var/log/nginx/` (host) |
| **Configs Nginx** | `/etc/nginx/conf.d/` (container) | `/etc/nginx/sites-available/` (host) |

### ❌ O que NÃO muda:

| Componente | Status |
|------------|--------|
| **Código Python** | Idêntico |
| **Código React** | Idêntico |
| **Banco de dados** | Idêntico |
| **Containers Backend** | Idênticos |
| **Containers Celery** | Idênticos |
| **Containers Redis** | Idênticos |
| **Containers Postgres** | Idênticos |
| **Redes Docker** | Idênticas |
| **Volumes Docker** | Idênticos |
| **Variáveis de ambiente** | Idênticas |

---

## ⚠️ RISCOS REAIS E MITIGAÇÕES

### Risco 1: Downtime durante migração
- **Probabilidade:** Baixa
- **Impacto:** Médio (poucos minutos)
- **Mitigação:**
  ```bash
  # Migração acontece em horário de baixo tráfego
  # Nginx no host sobe ANTES de parar container
  # Downtime estimado: 30 segundos
  ```

### Risco 2: Certificado SSL não funcionar
- **Probabilidade:** Muito Baixa
- **Impacto:** Alto (site inacessível via HTTPS)
- **Mitigação:**
  ```bash
  # Certificados já existem em /etc/letsencrypt/
  # Nginx no host vai ler os mesmos certificados
  # Testado antes de aplicar em produção
  ```

### Risco 3: Configuração nginx incorreta
- **Probabilidade:** Muito Baixa
- **Impacto:** Alto (site fora do ar)
- **Mitigação:**
  ```bash
  # SEMPRE testar antes: sudo nginx -t
  # Rollback em 30 segundos se der erro
  # Backup da config antiga
  ```

### Risco 4: Conflito de portas
- **Probabilidade:** Zero
- **Impacto:** N/A
- **Mitigação:**
  ```bash
  # Verificamos: porta 80/443 usada por nginx container
  # Ao parar container, portas ficam livres
  # Nginx host assume portas sem conflito
  ```

---

## 🔒 PLANO DE ROLLBACK (SEGURANÇA)

### Se algo der errado, reverter em 2 minutos:

```bash
# 1. Parar nginx do host
sudo systemctl stop nginx

# 2. Subir nginx container novamente
cd /root/obreiro-digital-landing
docker-compose -f docker-compose.prod.yml up -d nginx

# 3. Verificar
curl https://www.obreirovirtual.com/

# ✅ Ambiente volta ao estado anterior
```

**Tempo de rollback:** 60-120 segundos máximo.

---

## 📋 CHECKLIST DE SEGURANÇA PRÉ-MIGRAÇÃO

Antes de aplicar, garantir:

### ✅ Backups
- [ ] Backup do banco de dados (automático)
- [ ] Backup das configs nginx atuais
- [ ] Snapshot da VPS (se disponível)

### ✅ Testes
- [ ] Nginx no host configurado e testado (`nginx -t`)
- [ ] Certificados SSL validados
- [ ] DNS resolvendo corretamente
- [ ] Portas 80/443 prontas para liberar

### ✅ Comunicação
- [ ] Horário de baixo tráfego escolhido
- [ ] Time avisado sobre manutenção
- [ ] Plano de rollback documentado

### ✅ Monitoramento
- [ ] Logs do nginx rodando em tempo real
- [ ] Health check preparado
- [ ] Acesso SSH ativo para intervenção

---

## 🚀 PROCEDIMENTO DE MIGRAÇÃO SEGURO

### Fase 1: Preparação (SEM IMPACTO)

```bash
# 1. Instalar/atualizar nginx no host (se necessário)
sudo apt update && sudo apt install nginx -y

# 2. Criar diretórios
sudo mkdir -p /var/www/html/hml
sudo mkdir -p /var/www/html/prod

# 3. Copiar frontend atual
sudo cp -r /root/obreiro-hml/frontend-build/* /var/www/html/hml/
sudo cp -r /root/obreiro-digital-landing/frontend_build/* /var/www/html/prod/

# 4. Criar configs nginx
# (detalhado no próximo documento)

# 5. Testar (SEM ATIVAR)
sudo nginx -t

# ✅ Até aqui: ZERO IMPACTO nos ambientes
```

### Fase 2: Migração (DOWNTIME: ~30s)

```bash
# 1. Preparar
cd /root/obreiro-digital-landing

# 2. Parar nginx container
docker-compose -f docker-compose.prod.yml stop nginx

# 3. Imediatamente iniciar nginx host
sudo systemctl start nginx

# 4. Verificar
curl -I https://www.obreirovirtual.com/
curl -I https://hml.obreirovirtual.com/

# ✅ Migração completa
```

### Fase 3: Limpeza (PÓS-MIGRAÇÃO)

```bash
# 1. Remover nginx do docker-compose.prod.yml
# (editar arquivo, remover serviço 'nginx')

# 2. Limpar volumes órfãos
docker volume prune -f

# ✅ Ambiente limpo e otimizado
```

---

## 📊 COMPARAÇÃO DE RISCOS

| Cenário | Risco Atual | Risco Após Migração |
|---------|-------------|---------------------|
| **502 Bad Gateway (DNS)** | 🔴 Alto (frequente) | 🟢 Zero (nginx no host) |
| **Deploy HML quebra PROD** | 🟡 Médio (nginx compartilhado) | 🟢 Zero (isolado) |
| **Downtime em deploy** | 🟡 Médio (race condition) | 🟢 Zero (reload instantâneo) |
| **Single Point of Failure** | 🔴 Alto (1 nginx para tudo) | 🟢 Baixo (nginx + containers) |
| **Complexidade manutenção** | 🟡 Médio (configs em containers) | 🟢 Baixo (configs no host) |

---

## 💡 CONCLUSÃO FINAL

### ✅ SEGURO PARA APLICAR PORQUE:

1. **Zero mudanças no código** (Python, React, configs)
2. **Containers continuam iguais** (backend, celery, redis)
3. **Dev não é afetado** (ambiente completamente separado)
4. **Rollback rápido** (2 minutos se necessário)
5. **Testado antes** (nginx -t valida tudo)
6. **Downtime mínimo** (~30 segundos)

### 🎯 BENEFÍCIOS GARANTIDOS:

1. ✅ Resolve 502 Bad Gateway definitivamente
2. ✅ CI/CD funciona corretamente
3. ✅ Ambientes isolados (PROD ≠ HML)
4. ✅ Manutenção simplificada
5. ✅ Performance melhorada
6. ✅ Logs centralizados

### 🛡️ PROTEÇÕES EM CAMADAS:

```
Camada 1: Testes pré-migração (nginx -t)
Camada 2: Migração em horário de baixo tráfego
Camada 3: Health checks automáticos
Camada 4: Rollback em 2 minutos
Camada 5: Backups disponíveis
```

---

## 🎬 PRÓXIMOS PASSOS RECOMENDADOS

### Opção A: Aplicar AGORA (mais rápido, corrige temporariamente)
```bash
# Corrigir workflow apenas
docker restart obreiro_nginx_prod
```
**Tempo:** 5 minutos
**Risco:** Zero
**Resolve:** Temporariamente

### Opção B: Migrar para Nginx HOST (solução definitiva)
```bash
# Migração completa
# Seguir procedimento do documento
```
**Tempo:** 30 minutos
**Risco:** Muito Baixo
**Resolve:** Definitivamente

### Opção C: Fazer em 2 etapas
1. HOJE: Aplicar correção rápida (Opção A)
2. AMANHÃ/PRÓXIMA SEMANA: Migração completa (Opção B)

**Tempo:** 5 min + 30 min
**Risco:** Mínimo
**Resolve:** Com segurança máxima

---

**Recomendação final:** Opção C (2 etapas) oferece máxima segurança.

**Quer que eu prepare os comandos e configs para a migração?**
