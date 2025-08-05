# 🛡️ Guia de Deploy Seguro - Obreiro Digital

## 🔴 Problema Identificado

Ao fazer `git pull` do GitHub, o ambiente Docker quebra devido a:

1. **Variáveis de ambiente desincronizadas** entre frontend e backend
2. **Build do frontend não atualizado** com novas configurações
3. **Cache do Docker** usando configurações antigas
4. **Health checks falhando** durante o deploy

## ✅ Solução: Script de Pull Seguro

### 📋 Como Usar

```bash
# Sempre use este comando ao invés de git pull
cd /root/obreiro-digital-landing
./safe-pull.sh
```

### 🔧 O que o Script Faz

1. **Backup Automático**: Salva configurações atuais em `backups/`
2. **Corrige Variáveis**: Garante que URLs estão corretas
3. **Pull Seguro**: Baixa código do GitHub
4. **Rebuild Completo**: Reconstrói frontend e backend
5. **Migrações**: Aplica alterações no banco
6. **Health Check**: Verifica se tudo está funcionando

### ⚠️ Configurações Críticas

#### 1. Arquivo `.env_prod`
```bash
FRONTEND_URL=https://obreirovirtual.com/api/v1
DJANGO_ALLOWED_HOSTS=obreirovirtual.com,www.obreirovirtual.com,localhost,127.0.0.1,backend
CORS_ALLOWED_ORIGINS=https://obreirovirtual.com,https://www.obreirovirtual.com
```

#### 2. Arquivo `frontend/.env.prod`
```bash
VITE_API_URL=https://obreirovirtual.com/api/v1
VITE_SERVER_URL=https://obreirovirtual.com
```

### 🚨 Comandos de Emergência

Se algo der errado:

```bash
# Ver logs em tempo real
docker compose -f docker-compose.prod.yml logs -f backend

# Reiniciar apenas o backend
docker compose -f docker-compose.prod.yml restart backend

# Verificar status dos containers
docker compose -f docker-compose.prod.yml ps

# Forçar rebuild completo
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```

### 📊 Verificação de Saúde

```bash
# Testar se API está respondendo
curl -I https://obreirovirtual.com/api/v1/

# Ver uso de recursos
docker stats

# Verificar logs do NGINX
docker compose -f docker-compose.prod.yml logs nginx
```

### 🔄 Processo Manual (se necessário)

Se preferir fazer manualmente:

```bash
# 1. Garantir variáveis corretas
echo "FRONTEND_URL=https://obreirovirtual.com/api/v1" >> .env_prod

# 2. Atualizar frontend config
cat > frontend/.env.prod << 'EOF'
VITE_API_URL=https://obreirovirtual.com/api/v1
VITE_SERVER_URL=https://obreirovirtual.com
EOF

# 3. Carregar variáveis
source .env_prod
export FRONTEND_URL

# 4. Pull e rebuild
git pull origin main
docker compose -f docker-compose.prod.yml build --no-cache frontend-build
docker compose -f docker-compose.prod.yml up -d
```

### 🎯 Checklist Pós-Deploy

- [ ] Site está acessível em https://obreirovirtual.com
- [ ] Login funciona corretamente
- [ ] API responde em /api/v1/
- [ ] Containers estão "healthy"
- [ ] Logs sem erros críticos

### 💡 Dicas Importantes

1. **Sempre use o script `safe-pull.sh`** ao invés de `git pull` direto
2. **Monitore os logs** após o deploy por alguns minutos
3. **Mantenha backups** das configurações funcionais
4. **Teste o login** após cada atualização

### 🐛 Troubleshooting

**Erro: "sem resposta do servidor"**
- Verifique se FRONTEND_URL está correto: `grep FRONTEND_URL .env_prod`
- Rebuild frontend: `docker compose -f docker-compose.prod.yml up --build frontend-build`

**Erro: "502 Bad Gateway"**
- Backend não está rodando: `docker compose -f docker-compose.prod.yml restart backend`
- Verificar logs: `docker compose -f docker-compose.prod.yml logs backend`

**Erro: "CORS blocked"**
- Verificar CORS_ALLOWED_ORIGINS no .env_prod
- Reiniciar backend após correção

---

🔐 **Mantenha este guia atualizado com novos problemas e soluções encontrados!**