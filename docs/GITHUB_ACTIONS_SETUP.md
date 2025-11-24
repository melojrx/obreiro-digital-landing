# 🚀 Configuração GitHub Actions - Deploy Automático HML

Este documento descreve como configurar e usar os workflows do GitHub Actions para deploy automático no ambiente de homologação.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Configuração de Secrets](#configuração-de-secrets)
4. [Workflows Disponíveis](#workflows-disponíveis)
5. [Como Testar](#como-testar)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Temos 2 workflows configurados:

1. **CI - Testes Mínimos** (`.github/workflows/ci-tests.yml`)
   - Executa em: Push/PR para `develop` ou `main`
   - Valida: Sintaxe Python e Build do Frontend

2. **Deploy para HML** (`.github/workflows/deploy-hml.yml`)
   - Executa em: Push para `develop`
   - Deploy automático para: https://hml.obreirovirtual.com

---

## ✅ Pré-requisitos

### Na VPS de Homologação:

1. **Projeto clonado em:** `/root/obreiro-hml`
2. **Docker e Docker Compose instalados**
3. **NGINX configurado no host**
4. **Chave SSH configurada para GitHub Actions**

---

## 🔐 Configuração de Secrets

### Passo 1: Gerar Chave SSH na VPS

Conecte-se à VPS de homologação e execute:

```bash
# Gerar chave SSH específica para GitHub Actions
ssh-keygen -t ed25519 -C "github-actions-hml" -f ~/.ssh/github-actions-hml -N ""

# Adicionar chave pública ao authorized_keys
cat ~/.ssh/github-actions-hml.pub >> ~/.ssh/authorized_keys

# Ajustar permissões
chmod 600 ~/.ssh/github-actions-hml
chmod 644 ~/.ssh/github-actions-hml.pub
chmod 600 ~/.ssh/authorized_keys

# Exibir chave privada (para copiar)
cat ~/.ssh/github-actions-hml
```

**⚠️ IMPORTANTE:** Copie TODO o conteúdo da chave privada, incluindo as linhas:
```
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

### Passo 2: Testar Conexão SSH

Teste se a chave funciona:

```bash
ssh -i ~/.ssh/github-actions-hml root@localhost
```

Se conectar sem pedir senha, está funcionando!

### Passo 3: Adicionar Secrets no GitHub

1. Acesse seu repositório no GitHub
2. Vá em: **Settings → Secrets and variables → Actions**
3. Clique em: **New repository secret**
4. Adicione os seguintes secrets:

#### Secret 1: `HML_VPS_HOST`
- **Name:** `HML_VPS_HOST`
- **Value:** `IP_DA_VPS_HML` (exemplo: `123.456.789.012`)

#### Secret 2: `HML_VPS_USER`
- **Name:** `HML_VPS_USER`
- **Value:** `root`

#### Secret 3: `HML_VPS_SSH_KEY`
- **Name:** `HML_VPS_SSH_KEY`
- **Value:** Cole TODO o conteúdo da chave privada que você copiou

### Passo 4: Configurar Environment (Opcional mas Recomendado)

1. Vá em: **Settings → Environments**
2. Clique em: **New environment**
3. Nome: `homologation`
4. Configure proteções se desejar:
   - ✅ Required reviewers (revisores obrigatórios antes do deploy)
   - ✅ Wait timer (tempo de espera antes do deploy)

---

## 📦 Workflows Disponíveis

### 1. CI - Testes Mínimos

**Arquivo:** `.github/workflows/ci-tests.yml`

**Quando executa:**
- Push ou Pull Request para `develop` ou `main`

**O que faz:**
- ✅ Valida sintaxe de arquivos Python
- ✅ Instala dependências do frontend
- ✅ Executa build do React com Vite
- ✅ Verifica se `dist/index.html` foi gerado

**Como ver os resultados:**
1. Vá em: **Actions** no GitHub
2. Selecione: **CI - Testes Mínimos**
3. Veja os logs de execução

---

### 2. Deploy para Homologação

**Arquivo:** `.github/workflows/deploy-hml.yml`

**Quando executa:**
- Automaticamente: Push para branch `develop`
- Manualmente: Via workflow_dispatch (botão "Run workflow")

**O que faz:**
1. 📥 Faz pull do código na VPS
2. 🔨 Rebuild dos containers backend, celery e celery_beat
3. ▶️ Reinicia containers com nova versão
4. 🗄️ Aplica migrações do Django
5. 📦 Coleta arquivos estáticos
6. ⚛️ Rebuild do frontend React
7. 📋 Copia build para `/root/obreiro-hml/frontend-build/`
8. 🔄 Recarrega NGINX
9. 🏥 Executa health check
10. ✅ Confirma sucesso ou falha

**Tempo estimado:** 5-10 minutos

---

## 🧪 Como Testar

### Teste 1: Executar Deploy Manual

1. Vá em: **Actions** → **Deploy para Homologação**
2. Clique em: **Run workflow**
3. Selecione branch: `develop`
4. Clique em: **Run workflow**
5. Acompanhe os logs em tempo real

### Teste 2: Deploy Automático via Push

```bash
# No seu ambiente de desenvolvimento

# 1. Certifique-se de estar na branch develop
git checkout develop

# 2. Faça uma alteração simples (exemplo)
echo "# Teste deploy automático" >> README.md

# 3. Commit e push
git add .
git commit -m "test: validar deploy automático HML"
git push origin develop

# 4. Acompanhe no GitHub Actions
# https://github.com/seu-usuario/seu-repo/actions
```

### Teste 3: Verificar Deploy

Após o workflow completar:

```bash
# Testar API backend
curl https://hml.obreirovirtual.com/api/v1/

# Testar frontend
curl -I https://hml.obreirovirtual.com/

# Verificar no navegador
# https://hml.obreirovirtual.com
```

---

## 🔧 Troubleshooting

### Erro: "Permission denied (publickey)"

**Causa:** Chave SSH não configurada corretamente

**Solução:**
```bash
# Na VPS, verificar se a chave foi adicionada
cat ~/.ssh/authorized_keys | grep github-actions

# Verificar permissões
ls -la ~/.ssh/

# Devem ser:
# -rw------- (600) para arquivos de chave privada
# -rw-r--r-- (644) para arquivos .pub
# -rw------- (600) para authorized_keys
```

### Erro: "Host key verification failed"

**Causa:** Host key não foi adicionado aos known_hosts

**Solução:** A action `appleboy/ssh-action` já lida com isso automaticamente. Se persistir, adicione ao secret:

```yaml
# No workflow, adicionar:
with:
  host_key_verification: false  # Apenas para testes
```

### Erro: "Backend não está rodando"

**Causa:** Container backend falhou ao iniciar

**Solução:**
```bash
# Conectar na VPS e verificar logs
ssh root@VPS_IP
cd /root/obreiro-hml
docker-compose -f docker-compose.hml.yml logs backend_hml

# Verificar variáveis de ambiente
cat .env_hml

# Tentar subir manualmente
docker-compose -f docker-compose.hml.yml up backend_hml
```

### Erro: "Frontend build não foi copiado"

**Causa:** Volume do frontend não está sendo criado corretamente

**Solução:**
```bash
# Verificar volumes
docker volume ls | grep frontend

# Listar conteúdo do volume
docker run --rm -v obreiro_frontend_build_hml:/app alpine ls -la /app

# Recriar volume se necessário
docker volume rm obreiro_frontend_build_hml
docker-compose -f docker-compose.hml.yml build frontend_hml
```

### Erro: "NGINX não recarregou"

**Causa:** Configuração do NGINX pode estar incorreta

**Solução:**
```bash
# Testar configuração
sudo nginx -t

# Ver logs de erro
sudo tail -100 /var/log/nginx/error.log

# Verificar virtual host
cat /etc/nginx/sites-available/hml.obreirovirtual.com

# Verificar se está habilitado
ls -la /etc/nginx/sites-enabled/ | grep hml
```

### Workflow travado ou timeout

**Causa:** Comando SSH demorou muito ou travou

**Solução:**
- O timeout está configurado para 30 minutos
- Verifique logs no GitHub Actions
- Conecte na VPS e veja o que está travado
- Considere aumentar o `command_timeout` no workflow

---

## 📊 Monitoramento

### Ver logs em tempo real na VPS:

```bash
# Backend
docker-compose -f docker-compose.hml.yml logs -f backend_hml

# Celery
docker-compose -f docker-compose.hml.yml logs -f celery_hml

# Celery Beat
docker-compose -f docker-compose.hml.yml logs -f celery_beat_hml

# NGINX
sudo tail -f /var/log/nginx/hml.obreirovirtual.com.access.log
sudo tail -f /var/log/nginx/hml.obreirovirtual.com.error.log
```

### Status dos containers:

```bash
docker ps --filter "name=obreiro.*hml"
docker-compose -f docker-compose.hml.yml ps
```

---

## 🎯 Próximos Passos

Após configurar e testar:

1. ✅ Configurar notificações (Slack/Discord/Email)
2. ✅ Adicionar mais testes ao CI
3. ✅ Implementar rollback automático
4. ✅ Criar workflow para produção
5. ✅ Adicionar smoke tests pós-deploy

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do GitHub Actions
2. Conecte na VPS e verifique os logs dos containers
3. Consulte este documento
4. Verifique o `ANALISE_E_PLANO_CORRECAO.md`

---

**Última atualização:** 2025-11-24
**Autor:** Sistema Obreiro Virtual
