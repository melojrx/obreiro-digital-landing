# 🛠️ Comandos Úteis para Deploy e Manutenção

Guia rápido de comandos para gerenciar o ambiente de homologação.

## 📋 Índice

1. [Verificação Rápida](#verificação-rápida)
2. [Docker](#docker)
3. [NGINX](#nginx)
4. [Logs](#logs)
5. [Deploy Manual](#deploy-manual)
6. [Troubleshooting](#troubleshooting)

---

## ✅ Verificação Rápida

```bash
# Status geral do ambiente HML
cd /root/obreiro-hml

# Ver containers rodando
docker ps --filter "name=obreiro.*hml"

# Status do docker-compose
docker-compose -f docker-compose.hml.yml ps

# Testar API backend
curl https://hml.obreirovirtual.com/api/v1/

# Testar frontend
curl -I https://hml.obreirovirtual.com/

# Verificar NGINX
sudo systemctl status nginx

# Ver última linha dos logs
docker-compose -f docker-compose.hml.yml logs --tail=1 backend_hml
```

---

## 🐳 Docker

### Gerenciar Containers

```bash
cd /root/obreiro-hml

# Ver todos os containers (rodando ou não)
docker-compose -f docker-compose.hml.yml ps -a

# Iniciar todos os serviços
docker-compose -f docker-compose.hml.yml up -d

# Parar todos os serviços
docker-compose -f docker-compose.hml.yml stop

# Reiniciar um serviço específico
docker-compose -f docker-compose.hml.yml restart backend_hml

# Rebuild de um serviço específico
docker-compose -f docker-compose.hml.yml build --no-cache backend_hml

# Rebuild e restart
docker-compose -f docker-compose.hml.yml up -d --build --force-recreate backend_hml
```

### Executar Comandos nos Containers

```bash
# Django shell
docker exec -it obreiro_backend_hml python manage.py shell

# Aplicar migrações
docker exec obreiro_backend_hml python manage.py migrate

# Criar superusuário
docker exec -it obreiro_backend_hml python manage.py createsuperuser

# Coletar arquivos estáticos
docker exec obreiro_backend_hml python manage.py collectstatic --noinput

# Verificar configuração Django
docker exec obreiro_backend_hml python manage.py check

# Ver versão do Django
docker exec obreiro_backend_hml python manage.py version
```

### Limpeza

```bash
# Remover containers parados
docker-compose -f docker-compose.hml.yml rm -f

# Remover imagens não utilizadas
docker image prune -f

# Remover volumes órfãos
docker volume prune -f

# Limpeza completa (CUIDADO!)
docker system prune -a --volumes
```

---

## 🌐 NGINX

### Gerenciar NGINX

```bash
# Testar configuração
sudo nginx -t

# Recarregar configuração
sudo systemctl reload nginx

# Reiniciar NGINX
sudo systemctl restart nginx

# Status do serviço
sudo systemctl status nginx

# Ver configuração do virtual host HML
cat /etc/nginx/sites-available/hml.obreirovirtual.com

# Verificar link simbólico
ls -la /etc/nginx/sites-enabled/ | grep hml
```

### Verificar Arquivos Estáticos

```bash
# Frontend build
ls -lh /root/obreiro-hml/frontend-build/
du -sh /root/obreiro-hml/frontend-build/

# Arquivos estáticos Django
ls -lh /root/obreiro-hml/staticfiles/
du -sh /root/obreiro-hml/staticfiles/

# Verificar permissões
find /root/obreiro-hml/frontend-build/ -type f -ls
find /root/obreiro-hml/staticfiles/ -type f -ls
```

---

## 📝 Logs

### Logs dos Containers

```bash
cd /root/obreiro-hml

# Ver logs do backend (últimas 50 linhas)
docker-compose -f docker-compose.hml.yml logs --tail=50 backend_hml

# Seguir logs em tempo real
docker-compose -f docker-compose.hml.yml logs -f backend_hml

# Logs de todos os serviços
docker-compose -f docker-compose.hml.yml logs --tail=20

# Logs do Celery worker
docker-compose -f docker-compose.hml.yml logs -f celery_hml

# Logs do Celery beat
docker-compose -f docker-compose.hml.yml logs -f celery_beat_hml

# Logs desde um horário específico
docker-compose -f docker-compose.hml.yml logs --since="2025-11-24T10:00:00"
```

### Logs do NGINX

```bash
# Access log
sudo tail -f /var/log/nginx/hml.obreirovirtual.com.access.log

# Error log
sudo tail -f /var/log/nginx/hml.obreirovirtual.com.error.log

# Últimas 100 linhas do error log
sudo tail -100 /var/log/nginx/hml.obreirovirtual.com.error.log

# Buscar por erro específico
sudo grep "error" /var/log/nginx/hml.obreirovirtual.com.error.log

# Ver requisições com status 500
sudo grep " 500 " /var/log/nginx/hml.obreirovirtual.com.access.log
```

### Logs do Sistema

```bash
# Logs do Docker daemon
sudo journalctl -u docker.service -f

# Logs do systemd para NGINX
sudo journalctl -u nginx.service -f

# Ver logs de erro do sistema
sudo dmesg | tail -50
```

---

## 🚀 Deploy Manual

### Processo Completo de Deploy

```bash
cd /root/obreiro-hml

# 1. Fazer backup (recomendado)
docker-compose -f docker-compose.hml.yml exec postgres_hml pg_dump -U $DB_USER $DB_NAME > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Carregar variáveis de ambiente
set -a
source .env_hml
set +a

# 3. Pull do código
git fetch origin develop
git pull origin develop

# 4. Parar containers
docker-compose -f docker-compose.hml.yml stop backend_hml celery_hml celery_beat_hml

# 5. Rebuild
docker-compose -f docker-compose.hml.yml build --no-cache backend_hml celery_hml celery_beat_hml

# 6. Subir containers
docker-compose -f docker-compose.hml.yml up -d backend_hml celery_hml celery_beat_hml

# 7. Aguardar inicialização
sleep 15

# 8. Aplicar migrações
docker exec obreiro_backend_hml python manage.py migrate --noinput

# 9. Coletar estáticos
docker exec obreiro_backend_hml python manage.py collectstatic --noinput

# 10. Rebuild frontend
docker-compose -f docker-compose.hml.yml build frontend_hml
docker-compose -f docker-compose.hml.yml run --rm frontend_hml

# 11. Copiar frontend para host
rm -rf /root/obreiro-hml/frontend-build/*
docker cp obreiro_frontend_hml:/app/dist/. /root/obreiro-hml/frontend-build/
chmod -R 755 /root/obreiro-hml/frontend-build

# 12. Recarregar NGINX
sudo nginx -t && sudo systemctl reload nginx

# 13. Verificar
curl -f https://hml.obreirovirtual.com/api/v1/
curl -I https://hml.obreirovirtual.com/

echo "✅ Deploy concluído!"
```

### Deploy Rápido (apenas código)

```bash
cd /root/obreiro-hml
git pull origin develop
docker-compose -f docker-compose.hml.yml restart backend_hml celery_hml celery_beat_hml
docker exec obreiro_backend_hml python manage.py migrate --noinput
```

### Rebuild Apenas Frontend

```bash
cd /root/obreiro-hml
docker-compose -f docker-compose.hml.yml build frontend_hml
docker-compose -f docker-compose.hml.yml run --rm frontend_hml
rm -rf /root/obreiro-hml/frontend-build/*
docker cp obreiro_frontend_hml:/app/dist/. /root/obreiro-hml/frontend-build/
chmod -R 755 /root/obreiro-hml/frontend-build
sudo systemctl reload nginx
```

---

## 🔧 Troubleshooting

### Backend não inicia

```bash
# Ver logs detalhados
docker-compose -f docker-compose.hml.yml logs backend_hml

# Verificar variáveis de ambiente
docker exec obreiro_backend_hml env | grep -E "DATABASE|REDIS|DJANGO"

# Testar conexão com banco
docker exec obreiro_backend_hml python manage.py dbshell

# Iniciar em modo debug
docker-compose -f docker-compose.hml.yml up backend_hml
```

### Frontend não aparece

```bash
# Verificar se arquivos foram copiados
ls -la /root/obreiro-hml/frontend-build/
test -f /root/obreiro-hml/frontend-build/index.html && echo "OK" || echo "ERRO"

# Verificar configuração NGINX
sudo nginx -t
cat /etc/nginx/sites-available/hml.obreirovirtual.com

# Ver logs NGINX
sudo tail -50 /var/log/nginx/hml.obreirovirtual.com.error.log

# Testar acesso direto
curl -I http://localhost/ -H "Host: hml.obreirovirtual.com"
```

### Erro 502 Bad Gateway

```bash
# Verificar se backend está respondendo
curl http://localhost:8001/api/v1/

# Ver logs do backend
docker-compose -f docker-compose.hml.yml logs backend_hml

# Verificar conexão NGINX → Backend
sudo nginx -t
netstat -tlnp | grep :8001
```

### Celery não processa tarefas

```bash
# Ver workers ativos
docker exec obreiro_celery_hml celery -A config inspect active

# Ver tarefas registradas
docker exec obreiro_celery_hml celery -A config inspect registered

# Status dos workers
docker exec obreiro_celery_hml celery -A config status

# Reiniciar workers
docker-compose -f docker-compose.hml.yml restart celery_hml celery_beat_hml
```

### Banco de dados

```bash
# Conectar ao PostgreSQL
docker exec -it obreiro_postgres_hml psql -U $DB_USER -d $DB_NAME

# Ver conexões ativas
docker exec obreiro_postgres_hml psql -U $DB_USER -d $DB_NAME -c "SELECT * FROM pg_stat_activity;"

# Backup do banco
docker exec obreiro_postgres_hml pg_dump -U $DB_USER $DB_NAME > backup.sql

# Restaurar backup
cat backup.sql | docker exec -i obreiro_postgres_hml psql -U $DB_USER -d $DB_NAME
```

### Limpar e recomeçar (CUIDADO!)

```bash
cd /root/obreiro-hml

# Parar tudo
docker-compose -f docker-compose.hml.yml down

# Remover volumes (APAGA DADOS!)
docker-compose -f docker-compose.hml.yml down -v

# Rebuild completo
docker-compose -f docker-compose.hml.yml build --no-cache

# Subir novamente
docker-compose -f docker-compose.hml.yml up -d

# Recriar banco
docker exec obreiro_backend_hml python manage.py migrate
docker exec -it obreiro_backend_hml python manage.py createsuperuser
```

---

## 📊 Monitoramento

### Uso de recursos

```bash
# Ver uso de CPU/Memória dos containers
docker stats --no-stream

# Ver uso de disco
df -h
du -sh /root/obreiro-hml/*

# Ver processos do Docker
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Ver volumes
docker volume ls
docker volume inspect obreiro_postgres_data_hml
```

### Health checks

```bash
# Script de health check completo
cat << 'EOF' > /root/obreiro-hml/health_check.sh
#!/bin/bash
echo "🏥 Health Check HML"
echo "===================="

# Backend
if curl -sf https://hml.obreirovirtual.com/api/v1/ > /dev/null; then
  echo "✅ Backend OK"
else
  echo "❌ Backend FAIL"
fi

# Frontend
if curl -sf -I https://hml.obreirovirtual.com/ | grep -q "200 OK"; then
  echo "✅ Frontend OK"
else
  echo "❌ Frontend FAIL"
fi

# Containers
echo ""
echo "Containers:"
docker ps --filter "name=obreiro.*hml" --format "{{.Names}}: {{.Status}}"
EOF

chmod +x /root/obreiro-hml/health_check.sh
/root/obreiro-hml/health_check.sh
```

---

**Última atualização:** 2025-11-24
**Autor:** Sistema Obreiro Virtual
