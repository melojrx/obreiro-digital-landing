# 🔍 ANÁLISE E PLANO DE CORREÇÃO - Ambiente HML

**Data:** 24/11/2025
**Status:** Pull realizado com sucesso, correções necessárias identificadas

---

## 📋 SITUAÇÃO ATUAL

### ✅ O que foi feito corretamente:
1. Pull do código da branch `develop` realizado com sucesso
2. Build do backend, celery e celery_beat concluídos
3. Containers backend atualizados e rodando
4. Migrações já aplicadas no banco de dados
5. Arquivos estáticos coletados

### ❌ Problemas Identificados:

**PROBLEMA CRÍTICO: Frontend HML está configurado incorretamente**

O `docker-compose.hml.yml` atual está tentando rodar nginx DENTRO do container frontend, mas a arquitetura HML usa nginx NO HOST.

---

## 🎯 ARQUITETURA CORRETA (Conforme SETUP_AMBIENTE_HML.md)

### Componentes:

1. **NGINX no HOST** (`/etc/nginx`)
   - Virtual host: `hml.obreirovirtual.com`
   - Serve frontend estático de: `/root/obreiro-hml/frontend-build/`
   - Faz proxy para backend: `http://localhost:8001`
   - Serve statics Django: `/root/obreiro-hml/staticfiles/`

2. **Backend Containers** (Docker)
   - backend_hml: Django + Gunicorn (porta 8001)
   - celery_hml: Worker Celery
   - celery_beat_hml: Scheduler Celery
   - postgres_hml: PostgreSQL (porta 5433)
   - redis_hml: Redis

3. **Frontend Container** (Docker - Build Only)
   - Faz build do React com Vite
   - Armazena em volume: `frontend_build_hml:/app/dist`
   - Executa comando e PARA: `echo 'Frontend build completed'`
   - NÃO roda nginx
   - NÃO expõe portas
   - NÃO tem healthcheck

---

## 🔧 CORREÇÕES NECESSÁRIAS

### 1. Corrigir `docker-compose.hml.yml`

**Seção frontend_hml deve ser:**

```yaml
frontend_hml:
  build:
    context: ./frontend
    dockerfile: ../docker/frontend/Dockerfile
    target: build  # ← Usar apenas stage BUILD, não production
    args:
      - VITE_API_URL=https://hml.obreirovirtual.com/api/v1
      - VITE_ENABLE_SSE=false
      - VITE_NOTIFICATION_POLLING_INTERVAL=60000
  container_name: obreiro_frontend_hml
  volumes:
    - frontend_build_hml:/app/dist
  networks:
    - obreiro_network_hml
  command: ["sh", "-c", "echo 'Frontend build completed'"]
  # SEM ports, SEM healthcheck, SEM restart
```

### 2. Adicionar volume `frontend_build_hml`

```yaml
volumes:
  postgres_data_hml:
    driver: local
  redis_data_hml:
    driver: local
  frontend_build_hml:  # ← ADICIONAR
    name: obreiro_frontend_build_hml
```

### 3. Criar diretório no host

```bash
mkdir -p /root/obreiro-hml/frontend-build
chmod -R 755 /root/obreiro-hml/frontend-build
```

### 4. Verificar NGINX no host

```bash
# Verificar se virtual host existe
ls -la /etc/nginx/sites-available/hml.obreirovirtual.com

# Se não existir, criar conforme documentação
```

---

## 📝 PROCEDIMENTO DE CORREÇÃO

### Passo 1: Parar containers frontend incorretos

```bash
cd /root/obreiro-hml
docker-compose -f docker-compose.hml.yml stop frontend_hml
docker-compose -f docker-compose.hml.yml rm -f frontend_hml
```

### Passo 2: Corrigir docker-compose.hml.yml

Aplicar as correções listadas acima na seção frontend_hml e volumes.

### Passo 3: Rebuild frontend com configuração correta

```bash
# Carregar variáveis de ambiente
set -a && source .env_hml && set +a

# Rebuild apenas frontend
docker-compose -f docker-compose.hml.yml build frontend_hml

# Subir frontend (vai buildar e parar)
docker-compose -f docker-compose.hml.yml up frontend_hml

# Aguardar build completar (verificar logs)
docker-compose -f docker-compose.hml.yml logs frontend_hml
```

### Passo 4: Copiar build para host

```bash
# Copiar arquivos do volume para o host
docker cp obreiro_frontend_hml:/app/dist/. /root/obreiro-hml/frontend-build/

# Ajustar permissões
chmod -R 755 /root/obreiro-hml/frontend-build

# Verificar arquivos
ls -la /root/obreiro-hml/frontend-build/
# Deve mostrar: index.html, assets/, etc.
```

### Passo 5: Verificar NGINX

```bash
# Verificar configuração NGINX
sudo nginx -t

# Recarregar NGINX
sudo systemctl reload nginx

# Verificar logs
sudo tail -f /var/log/nginx/hml.obreirovirtual.com.error.log
```

### Passo 6: Testar aplicação

```bash
# Testar backend
curl https://hml.obreirovirtual.com/api/v1/

# Testar frontend
curl -I https://hml.obreirovirtual.com/

# Abrir no navegador
# https://hml.obreirovirtual.com
```

---

## 🤖 AUTOMAÇÃO COM GITHUB ACTIONS

### Objetivo
Automatizar o deploy em HML quando houver push na branch `develop`.

### Estrutura do Workflow

Criar arquivo: `.github/workflows/deploy-hml.yml`

```yaml
name: Deploy to Homologation

on:
  push:
    branches: [develop]
  workflow_dispatch:  # Permite execução manual

jobs:
  deploy-hml:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to HML VPS
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.HML_VPS_HOST }}
          username: ${{ secrets.HML_VPS_USER }}
          key: ${{ secrets.HML_VPS_SSH_KEY }}
          port: 22
          script: |
            cd /root/obreiro-hml

            # 1. Pull latest code
            git fetch origin develop
            git pull origin develop

            # 2. Load environment variables
            set -a && source .env_hml && set +a

            # 3. Rebuild containers (backend + workers)
            docker-compose -f docker-compose.hml.yml build --no-cache backend_hml celery_hml celery_beat_hml

            # 4. Recreate containers
            docker-compose -f docker-compose.hml.yml up -d --force-recreate --no-deps backend_hml celery_hml celery_beat_hml

            # 5. Run migrations
            sleep 10
            docker exec obreiro_backend_hml python manage.py migrate --noinput

            # 6. Collect static files
            docker exec obreiro_backend_hml python manage.py collectstatic --noinput

            # 7. Rebuild frontend
            docker-compose -f docker-compose.hml.yml build frontend_hml
            docker-compose -f docker-compose.hml.yml up frontend_hml

            # 8. Copy frontend build to host
            docker cp obreiro_frontend_hml:/app/dist/. /root/obreiro-hml/frontend-build/
            chmod -R 755 /root/obreiro-hml/frontend-build

            # 9. Reload NGINX
            sudo systemctl reload nginx

            # 10. Health check
            sleep 5
            curl -f https://hml.obreirovirtual.com/health || exit 1

            echo "✅ Deploy to HML completed successfully!"
```

### Secrets Necessários no GitHub

Adicionar em: **Settings → Secrets and variables → Actions → New repository secret**

```
HML_VPS_HOST: IP_DA_VPS_HML
HML_VPS_USER: root
HML_VPS_SSH_KEY: (chave privada SSH)
```

### Gerar SSH Key para GitHub Actions

```bash
# Na VPS
ssh-keygen -t ed25519 -C "github-actions-hml" -f ~/.ssh/github-actions-hml

# Adicionar chave pública ao authorized_keys
cat ~/.ssh/github-actions-hml.pub >> ~/.ssh/authorized_keys

# Copiar chave privada para adicionar no GitHub Secrets
cat ~/.ssh/github-actions-hml
# Copiar TODO o conteúdo (incluindo BEGIN e END)
```

### Notificações (Opcional)

Adicionar ao final do workflow:

```yaml
      - name: Notify on Success
        if: success()
        run: |
          curl -X POST ${{ secrets.DISCORD_WEBHOOK_URL }} \
            -H "Content-Type: application/json" \
            -d '{"content":"✅ Deploy HML concluído com sucesso! https://hml.obreirovirtual.com"}'

      - name: Notify on Failure
        if: failure()
        run: |
          curl -X POST ${{ secrets.DISCORD_WEBHOOK_URL }} \
            -H "Content-Type: application/json" \
            -d '{"content":"❌ Deploy HML falhou! Verificar logs do Actions."}'
```

---

## 📊 CHECKLIST DE VALIDAÇÃO

Após correções, validar:

- [ ] Frontend container builda e para corretamente
- [ ] Arquivos copiados para `/root/obreiro-hml/frontend-build/`
- [ ] NGINX serve frontend de `https://hml.obreirovirtual.com/`
- [ ] NGINX faz proxy API para `localhost:8001`
- [ ] Backend responde em `https://hml.obreirovirtual.com/api/v1/`
- [ ] Admin Django acessível em `https://hml.obreirovirtual.com/admin/`
- [ ] Statics Django sendo servidos corretamente
- [ ] Media files acessíveis
- [ ] Celery workers rodando
- [ ] Celery beat rodando
- [ ] Logs sem erros críticos
- [ ] SSL válido e funcionando
- [ ] GitHub Actions configurado e testado

---

## 🚀 PRÓXIMOS PASSOS

1. **Imediato:** Corrigir configuração do frontend conforme este documento
2. **Curto prazo:** Implementar GitHub Actions para automação
3. **Médio prazo:** Adicionar testes automatizados antes do deploy
4. **Longo prazo:** Implementar blue-green deployment ou canary releases

---

## 📞 COMANDOS ÚTEIS

```bash
# Ver status dos containers
docker ps --filter "name=obreiro.*hml"

# Logs em tempo real do backend
docker-compose -f docker-compose.hml.yml logs -f backend_hml

# Logs do NGINX
sudo tail -f /var/log/nginx/hml.obreirovirtual.com.error.log

# Restart completo (se necessário)
docker-compose -f docker-compose.hml.yml restart

# Limpar volumes órfãos
docker volume prune
```

---

**Documento criado:** 24/11/2025
**Responsável:** Sistema Obreiro Virtual
**Próxima revisão:** Após implementação das correções
