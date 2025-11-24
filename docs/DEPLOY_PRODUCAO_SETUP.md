# 🚀 Configuração de Deploy Automático para Produção

**Data:** 24/11/2025
**Autor:** Junior Melo (jrmeloafrf@gmail.com)
**Status:** ✅ Configurado e Pronto para Uso

---

## 📋 Resumo

Foi criado o workflow de deploy automático para produção (`deploy-prod.yml`) que será acionado automaticamente quando:
1. ✅ Houver **push direto** para a branch `main`
2. ✅ Houver **merge de Pull Request** para a branch `main`
3. ✅ Houver **execução manual** via workflow_dispatch

---

## 🔧 Arquivos Criados

### 1. Workflow de Deploy Produção
**Arquivo:** `.github/workflows/deploy-prod.yml`

**Funcionalidades:**
- ✅ Deploy automático em produção
- ✅ Backup automático do banco de dados antes do deploy
- ✅ Rebuild de backend e frontend
- ✅ Aplicação de migrações
- ✅ Health checks completos
- ✅ Notificações por email (sucesso e falha)
- ✅ Rollback automático em caso de falha crítica
- ✅ Limpeza de containers e imagens antigas

---

## 🔐 Secrets Necessários no GitHub

Você precisa configurar os seguintes secrets no repositório GitHub:

### Como Adicionar Secrets:
1. Acesse: `https://github.com/melojrx/obreiro-digital-landing/settings/secrets/actions`
2. Clique em **"New repository secret"**
3. Adicione cada secret abaixo:

### Secrets Requeridos:

#### 1. Acesso SSH à VPS de Produção
```
PROD_VPS_HOST
Valor: IP ou domínio do servidor de produção
Exemplo: 123.456.789.0 ou vps.obreirovirtual.com
```

```
PROD_VPS_USER
Valor: root
```

```
PROD_VPS_SSH_KEY
Valor: [Conteúdo completo da chave SSH privada]
```

**⚠️ Como obter a chave SSH:**
```bash
# No seu computador local
cat ~/.ssh/id_rsa
# Copie TODO o conteúdo (incluindo -----BEGIN e -----END)
```

#### 2. Configuração de Email (já configurado para HML)
```
EMAIL_USERNAME
Valor: seu-email@gmail.com
```

```
EMAIL_PASSWORD
Valor: senha de aplicativo do Gmail
```

**Nota:** Se já configurou para HML, os mesmos secrets serão usados.

---

## 📁 Estrutura de Diretórios na VPS

### Arquitetura Atual (Baseada em ANALISE_ARQUITETURA_COMPLETA.md)

```
/root/
├── obreiro-prod/              # Diretório do projeto PRODUÇÃO
│   ├── .env_prod              # Variáveis de ambiente PROD
│   ├── docker-compose.prod.yml
│   ├── backend/
│   ├── frontend/
│   └── frontend_build/        # Build temporário
│
├── obreiro-hml/               # Diretório do projeto HML
│   ├── .env_hml
│   └── ...
│
├── backups/                   # Backups automáticos do banco
│   ├── backup_prod_20251124_143000.sql
│   └── ...
│
/var/www/html/
├── prod/                      # Frontend PRODUÇÃO (servido pelo nginx)
│   └── index.html
│
└── hml/                       # Frontend HML (servido pelo nginx)
    └── index.html
```

---

## ⚙️ Configuração do Nginx no Host

### Arquivo: `/etc/nginx/sites-available/prod.obreirovirtual.com`

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name www.obreirovirtual.com obreirovirtual.com;

    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.obreirovirtual.com obreirovirtual.com;

    # SSL
    ssl_certificate /etc/letsencrypt/live/obreirovirtual.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/obreirovirtual.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Logs
    access_log /var/log/nginx/prod_access.log;
    error_log /var/log/nginx/prod_error.log;

    # Frontend estático
    location / {
        root /var/www/html/prod;
        try_files $uri $uri/ /index.html;

        # Cache de assets estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API Backend
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Admin Django
    location /admin/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files Django
    location /static/ {
        alias /root/obreiro-prod/static_prod/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Media files Django
    location /media/ {
        alias /root/obreiro-prod/media_prod/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

**Ativar configuração:**
```bash
sudo ln -sf /etc/nginx/sites-available/prod.obreirovirtual.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔄 Fluxo de Deploy Automático

### 1. Developer faz merge do PR para main
```bash
# No GitHub: Aprovar e fazer merge do PR #49
```

### 2. GitHub Actions é acionado automaticamente
```
✅ Workflow "Deploy para Produção" inicia
✅ Conecta via SSH na VPS
✅ Faz git pull do código
```

### 3. Deploy na VPS
```
✅ Cria backup do banco de dados
✅ Rebuild dos containers (backend, celery)
✅ Aplica migrações
✅ Coleta arquivos estáticos
✅ Builda frontend com VITE_API_URL de produção
✅ Copia frontend para /var/www/html/prod/
✅ Recarrega nginx
✅ Executa health checks
```

### 4. Notificação
```
✅ Email enviado com resultado do deploy
📧 Para: suporteobreirovirtual@gmail.com
📧 Para: jrmeloafrf@gmail.com
```

---

## ✅ Checklist Pré-Deploy

Antes de fazer o merge do PR #49, verifique:

### No Servidor VPS:
- [ ] Diretório `/root/obreiro-prod/` existe
- [ ] Arquivo `.env_prod` configurado corretamente
- [ ] Nginx no host está ativo (`systemctl status nginx`)
- [ ] Configuração nginx para produção existe em `/etc/nginx/sites-enabled/`
- [ ] Diretório `/var/www/html/prod/` existe
- [ ] Diretório `/root/backups/` existe (para backups automáticos)
- [ ] Containers de produção estão rodando

### No GitHub:
- [ ] Secret `PROD_VPS_HOST` configurado
- [ ] Secret `PROD_VPS_USER` configurado
- [ ] Secret `PROD_VPS_SSH_KEY` configurado
- [ ] Secrets de email configurados (`EMAIL_USERNAME` e `EMAIL_PASSWORD`)
- [ ] Environment "production" criado (opcional, mas recomendado)

### No Código:
- [ ] Branch `develop` foi testada em HML
- [ ] PR #49 revisado e aprovado
- [ ] Testes passando
- [ ] Frontend usando `VITE_API_URL=https://www.obreirovirtual.com/api/v1`

---

## 🚦 Como Testar o Workflow

### Opção 1: Executar Manualmente (Recomendado para primeiro teste)
1. Acesse: `https://github.com/melojrx/obreiro-digital-landing/actions/workflows/deploy-prod.yml`
2. Clique em **"Run workflow"**
3. Selecione branch: `main`
4. Clique em **"Run workflow"**

### Opção 2: Fazer o Merge do PR #49
1. Acesse: `https://github.com/melojrx/obreiro-digital-landing/pull/49`
2. Revise as mudanças
3. Clique em **"Merge pull request"**
4. Confirme o merge
5. O deploy iniciará automaticamente

---

## 📊 Monitoramento

### Durante o Deploy:
```
GitHub Actions: https://github.com/melojrx/obreiro-digital-landing/actions
Tempo estimado: ~5-10 minutos
```

### Após o Deploy:
```bash
# No servidor VPS
cd /root/obreiro-prod

# Ver logs dos containers
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f celery

# Verificar status
docker-compose -f docker-compose.prod.yml ps

# Testar aplicação
curl https://www.obreirovirtual.com/api/v1/
curl -I https://www.obreirovirtual.com/
```

### Logs do Nginx:
```bash
sudo tail -f /var/log/nginx/prod_access.log
sudo tail -f /var/log/nginx/prod_error.log
```

---

## 🔙 Rollback em Caso de Problema

### Rollback Automático via Git:
```bash
ssh root@PROD_VPS_HOST
cd /root/obreiro-prod

# Ver últimos commits
git log --oneline -10

# Voltar para commit anterior
git reset --hard COMMIT_HASH_ANTERIOR

# Restartar containers
docker-compose -f docker-compose.prod.yml restart backend celery celery-beat

# Recarregar nginx
sudo systemctl reload nginx
```

### Restaurar Backup do Banco:
```bash
cd /root/backups
ls -lht | head -5  # Ver últimos backups

# Restaurar backup
docker exec -i obreiro_postgres_prod psql -U obreiro_prod obreiro_prod < backup_prod_YYYYMMDD_HHMMSS.sql
```

---

## 📧 Notificações por Email

### Email de Sucesso:
- ✅ Assunto: "✅ Deploy PRODUÇÃO Concluído com Sucesso"
- ✅ Para: suporteobreirovirtual@gmail.com, jrmeloafrf@gmail.com
- ✅ Contém: Link para aplicação, logs, commit, autor

### Email de Falha:
- 🚨 Assunto: "🚨 FALHA CRÍTICA no Deploy PRODUÇÃO"
- 🚨 Para: suporteobreirovirtual@gmail.com, jrmeloafrf@gmail.com
- 🚨 Contém: Detalhes do erro, instruções de rollback, links úteis

---

## 🎯 Diferenças entre HML e PROD

| Aspecto | HML | PROD |
|---------|-----|------|
| **Branch** | develop | main |
| **URL** | hml.obreirovirtual.com | www.obreirovirtual.com |
| **Diretório VPS** | /root/obreiro-hml | /root/obreiro-prod |
| **Frontend** | /var/www/html/hml/ | /var/www/html/prod/ |
| **Backend Port** | 8001 | 8000 |
| **Postgres Port** | 5433 | 5432 |
| **Env File** | .env_hml | .env_prod |
| **Docker Network** | obreiro_network_hml | obreiro_prod_network |
| **Containers** | *_hml | *_prod |
| **Backup** | Opcional | Automático antes de cada deploy |
| **Health Check** | Tolerante | Crítico (falha = rollback) |

---

## 🔐 Segurança

### Recomendações:
1. ✅ **Nunca commitar** arquivos `.env_prod` ou chaves SSH
2. ✅ **Usar secrets** do GitHub para credenciais sensíveis
3. ✅ **Backups automáticos** antes de cada deploy
4. ✅ **Health checks** rigorosos em produção
5. ✅ **Logs detalhados** de todas as operações
6. ✅ **Rollback preparado** para situações de emergência

---

## 📝 Próximos Passos

### Agora:
1. ✅ Verificar se todos os secrets estão configurados no GitHub
2. ✅ Testar workflow manualmente primeiro
3. ✅ Fazer merge do PR #49 quando tudo estiver OK

### Após o Deploy:
1. ✅ Monitorar logs por 10-15 minutos
2. ✅ Testar funcionalidades principais
3. ✅ Verificar métricas de performance
4. ✅ Confirmar que emails foram recebidos

### Melhorias Futuras:
- [ ] Configurar monitoramento com Prometheus/Grafana
- [ ] Adicionar testes de integração no workflow
- [ ] Configurar alerts do Sentry
- [ ] Implementar blue-green deployment
- [ ] Adicionar smoke tests automáticos

---

## 🤝 Suporte

**Autor:** Junior Melo
**Email:** jrmeloafrf@gmail.com
**GitHub:** @melojrx

**Repositório:** https://github.com/melojrx/obreiro-digital-landing

---

✅ **Workflow de produção configurado e pronto para uso!**
