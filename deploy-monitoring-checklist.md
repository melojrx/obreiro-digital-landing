# 📊 Checklist de Monitoramento Pós-Deploy

## 🔍 Verificações Imediatas (0-5 minutos)

### Sistema
- [ ] Todos os containers estão UP: `docker compose -f docker-compose.prod.yml ps`
- [ ] Nenhum container está reiniciando: `docker ps --filter "status=restarting"`
- [ ] Health checks passando: verificar coluna STATUS deve mostrar "(healthy)"

### Conectividade
- [ ] Site acessível: https://www.obreirovirtual.com
- [ ] API respondendo: https://www.obreirovirtual.com/api/v1/
- [ ] Admin acessível: https://www.obreirovirtual.com/admin/
- [ ] Certificado SSL válido (cadeado verde no navegador)

### Funcionalidades Críticas
- [ ] Login funcionando
- [ ] Cadastro de novos usuários
- [ ] Geração de QR codes
- [ ] Upload de arquivos/imagens
- [ ] Envio de emails (se configurado)

## 📈 Monitoramento Contínuo (5-30 minutos)

### Logs em Tempo Real
```bash
# Monitorar todos os logs
docker compose -f docker-compose.prod.yml logs -f

# Logs específicos
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f nginx
docker compose -f docker-compose.prod.yml logs -f celery
```

### Métricas de Performance
```bash
# CPU e Memória
docker stats

# Requisições por segundo no nginx
docker exec obreiro_nginx_prod tail -f /var/log/nginx/access.log | awk '{print $4}' | uniq -c

# Tempo de resposta da API
while true; do curl -w "@curl-format.txt" -o /dev/null -s https://www.obreirovirtual.com/api/v1/; sleep 5; done
```

### Verificações de Erro
```bash
# Erros no backend
docker compose -f docker-compose.prod.yml logs backend | grep -i error | tail -20

# Erros 5xx no nginx
docker exec obreiro_nginx_prod grep " 5[0-9][0-9] " /var/log/nginx/access.log | tail -20

# Tarefas Celery falhadas
docker exec obreiro_backend_prod python manage.py shell -c "from django_celery_results.models import TaskResult; print(TaskResult.objects.filter(status='FAILURE').count())"
```

## 🚨 Sinais de Alerta

### Crítico (Ação Imediata)
- ❌ Container reiniciando constantemente
- ❌ Erro 502/503/504 no site
- ❌ Banco de dados inacessível
- ❌ Uso de CPU > 90% sustentado
- ❌ Disco > 95% cheio

### Aviso (Investigar)
- ⚠️ Tempo de resposta > 3 segundos
- ⚠️ Erros 500 esporádicos
- ⚠️ Memória > 80% utilizada
- ⚠️ Muitas conexões pendentes
- ⚠️ Logs com warnings repetidos

## 🔧 Comandos de Diagnóstico

### Verificar Espaço em Disco
```bash
df -h
du -sh /root/obreiro-digital-landing/*
docker system df
```

### Verificar Conexões de Rede
```bash
docker exec obreiro_nginx_prod netstat -an | grep ESTABLISHED | wc -l
docker exec obreiro_backend_prod netstat -an | grep 8000
```

### Verificar Processos
```bash
docker exec obreiro_backend_prod ps aux
docker exec obreiro_postgres_prod ps aux
```

### Teste de Carga Básico
```bash
# Testar 10 requisições concorrentes
ab -n 100 -c 10 https://www.obreirovirtual.com/api/v1/

# Verificar latência
for i in {1..10}; do time curl -s https://www.obreirovirtual.com > /dev/null; done
```

## 📋 Relatório de Saúde

### Template de Relatório
```
Data/Hora: ________________
Versão Deploy: ________________
Responsável: ________________

✅ Verificações Passadas:
- [ ] Sistema operacional
- [ ] Funcionalidades testadas
- [ ] Performance adequada
- [ ] Sem erros críticos

⚠️ Problemas Encontrados:
1. ________________
2. ________________

🔧 Ações Tomadas:
1. ________________
2. ________________

📊 Métricas:
- Tempo médio resposta: ____ms
- CPU médio: ____%
- Memória: ____MB
- Requisições/min: ____
```

## 🔄 Procedimento de Rollback

Se necessário fazer rollback:

```bash
# Método 1: Usar script
./deploy-procedure.sh rollback

# Método 2: Manual
BACKUP_DIR=$(ls -t backups/ | head -1)
cp backups/$BACKUP_DIR/.env_prod.backup .env_prod
git checkout $(cat backups/$BACKUP_DIR/git_commit.txt)
docker compose -f docker-compose.prod.yml up -d --build
```

## 📞 Escalonamento

### Nível 1 (0-15min)
- Verificar logs
- Reiniciar container afetado
- Verificar configurações

### Nível 2 (15-30min)
- Rollback se necessário
- Investigar causa raiz
- Aplicar fix emergencial

### Nível 3 (30min+)
- Notificar equipe sênior
- Considerar manutenção programada
- Documentar incidente

---

**Lembrete**: Sempre documente qualquer problema encontrado e a solução aplicada para referência futura!