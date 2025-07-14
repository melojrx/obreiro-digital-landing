# 🐳 Ambiente Docker - Obreiro Digital

## ⚡ Início Rápido

### 1. Pré-requisitos
- **Docker Desktop** instalado no Windows 11
- **WSL2** habilitado
- **WSL integration** ativado no Docker Desktop

### 2. Configuração Inicial

```bash
# Executar script de setup
./scripts/dev_setup.sh
```

### 3. Verificar Integração Docker + WSL

Se os comandos `docker` não funcionarem no WSL:

1. **Docker Desktop → Settings → Resources → WSL Integration**
2. **Ativar** "Enable integration with my default WSL distro"
3. **Ativar** a distro Ubuntu específica
4. **Reiniciar** o WSL: `wsl --shutdown` no PowerShell

## 🚀 Comandos Principais

### Iniciar Ambiente
```bash
docker compose -f docker-compose.dev.yml up -d
```

### Ver Logs
```bash
# Todos os serviços
docker compose -f docker-compose.dev.yml logs -f

# Apenas backend
docker compose -f docker-compose.dev.yml logs -f backend
```

### Parar Ambiente
```bash
docker compose -f docker-compose.dev.yml down
```

### Reiniciar Serviço Específico
```bash
docker compose -f docker-compose.dev.yml restart backend
```

## 🔗 URLs de Desenvolvimento

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Backend API** | http://localhost:8000 | Django REST API |
| **Admin Django** | http://localhost:8000/admin | Interface administrativa |
| **API Docs** | http://localhost:8000/api/v1/schema/swagger-ui/ | Documentação da API |
| **Frontend** | http://localhost:5173 | React + Vite |
| **PostgreSQL** | localhost:5432 | Banco de dados |
| **Redis** | localhost:6379 | Cache + Celery |

## 🔧 Configurações

### Variáveis de Ambiente
Arquivo: `.env_dev`
```env
DJANGO_SETTINGS_MODULE=config.settings.dev
DATABASE_URL=postgres://obreiro_user:obreiro_pass@postgres:5432/obreiro_dev
REDIS_URL=redis://redis:6379/0
```

### Usuários de Teste
O sistema cria automaticamente usuários para teste:
- **Admin**: admin@obreiro.digital / admin@123
- **Outros usuários**: conforme script `create_test_users`

## 🐛 Troubleshooting

### Docker não encontrado
```bash
# Verificar integração WSL
docker --version

# Se não funcionar, verificar Docker Desktop WSL settings
```

### Serviços não iniciam
```bash
# Verificar logs
docker compose -f docker-compose.dev.yml logs

# Verificar recursos
docker system df
```

### Banco não conecta
```bash
# Verificar status PostgreSQL
docker compose -f docker-compose.dev.yml exec postgres pg_isready

# Testar conexão
docker compose -f docker-compose.dev.yml exec backend python manage.py check --database default
```

### Frontend não carrega
```bash
# Verificar se Vite está rodando
docker compose -f docker-compose.dev.yml logs frontend

# Acessar container
docker compose -f docker-compose.dev.yml exec frontend sh
```

## 🔄 Hot Reload

### Backend
- Código em `./backend` é montado como volume
- Django detecta mudanças automaticamente
- Não é necessário rebuild

### Frontend  
- Código em `./frontend` é montado como volume
- Vite detecta mudanças automaticamente
- HMR (Hot Module Replacement) ativo

## 📦 Volumes

### Dados Persistentes
```bash
# Listar volumes
docker volume ls | grep obreiro

# Limpar volumes (CUIDADO: apaga dados)
docker compose -f docker-compose.dev.yml down -v
```

### Backup Local
```bash
# Backup do banco
docker compose -f docker-compose.dev.yml exec postgres pg_dump -U obreiro_user obreiro_dev > backup_dev.sql
```

## 🚀 Próximos Passos

1. **Testar**: Verificar se todos os serviços sobem corretamente
2. **Desenvolver**: Fazer mudanças no código e ver hot reload
3. **Produção**: Implementar docker-compose.prod.yml
4. **Deploy**: Configurar VPS Ubuntu com ambiente de produção