# Sincronização entre Desenvolvimento e Produção

## Arquivos Críticos para Produção

### 1. Variáveis de Ambiente

#### Backend (.env_prod)
- **FRONTEND_URL**: Deve ser `https://www.obreirovirtual.com` (SEM /api/v1)
  - Usado para gerar URLs dos QR codes
  - QR codes devem apontar para `/visit/{uuid}` e não `/api/v1/visit/{uuid}`

#### Frontend (frontend/.env.prod)
- **VITE_API_URL**: `https://www.obreirovirtual.com/api/v1`
- **VITE_SERVER_URL**: `https://www.obreirovirtual.com`

### 2. Scripts de Deploy

#### safe-pull.sh
- Script principal para deploy seguro
- Faz backup automático antes de alterações
- Corrige FRONTEND_URL automaticamente
- Reconstrói containers necessários
- Aplica migrações
- Corrige permissões de mídia

#### fix-media-permissions.sh
- Corrige permissões do diretório media_prod
- Necessário para salvar QR codes e uploads
- Altera proprietário para uid 999 (appuser do container)

### 3. Configuração NGINX (docker/nginx/prod.conf)
- Server block separado para localhost/127.0.0.1
- Evita redirect loops em health checks internos
- Sempre usar www.obreirovirtual.com

## Processo de Deploy

### 1. Deploy Automático (Recomendado)
```bash
./safe-pull.sh
```

### 2. Deploy Manual
```bash
# 1. Backup
cp .env_prod backups/.env_prod.backup

# 2. Pull do código
git pull origin main

# 3. Verificar/corrigir variáveis
# Garantir FRONTEND_URL=https://www.obreirovirtual.com em .env_prod

# 4. Rebuild frontend
docker compose -f docker-compose.prod.yml build frontend-build
docker compose -f docker-compose.prod.yml up frontend-build

# 5. Restart backend
docker compose -f docker-compose.prod.yml restart backend

# 6. Corrigir permissões
./fix-media-permissions.sh
```

## Checklist de Verificação Pós-Deploy

- [ ] Login funcionando em https://www.obreirovirtual.com
- [ ] QR codes gerando URLs corretas (sem /api/v1)
- [ ] Upload de imagens funcionando
- [ ] Regeneração de QR codes sem erro de permissão

## Problemas Comuns e Soluções

### 1. "Sem resposta do servidor" no login
- Verificar logs: `docker compose -f docker-compose.prod.yml logs -f nginx backend`
- Pode ser redirect loop - verificar nginx config

### 2. Permission denied ao salvar arquivos
- Executar: `./fix-media-permissions.sh`
- Verificar uid do container: deve ser 999

### 3. QR codes com URLs erradas
- Verificar FRONTEND_URL em .env_prod
- Deve ser apenas `https://www.obreirovirtual.com`
- Reiniciar backend após correção

## Sincronização Dev → Prod

Quando desenvolver novas funcionalidades:

1. Sempre criar arquivos `.example` sem dados sensíveis
2. Documentar novas variáveis de ambiente
3. Testar script safe-pull.sh localmente
4. Comunicar mudanças críticas na PR