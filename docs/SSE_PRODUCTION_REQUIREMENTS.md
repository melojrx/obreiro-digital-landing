# 🔔 Server-Sent Events (SSE) - Requisitos para Produção

## 📋 Status Atual

**🚦 SSE está DESABILITADO em produção**

- ✅ **Desenvolvimento:** SSE ativo (funciona com `runserver`)
- ❌ **Produção:** Polling ativo (60 segundos)

## ⚠️ Por que SSE está desabilitado em produção?

### Problema Crítico: Bloqueio de Workers WSGI

O código atual usa `time.sleep()` dentro do gerador SSE:

```python
# backend/apps/notifications/views.py (linha ~365)
def event_stream():
    while True:
        # ... verificação de notificações ...
        time.sleep(check_interval)  # ❌ BLOQUEIA O WORKER!
```

**Impacto em Produção:**

1. **Gunicorn WSGI (atual):** Cada conexão SSE bloqueia 1 worker completamente
2. **Escalabilidade:** 4 workers + 100 usuários = sistema travado
3. **Concorrência:** Outras requisições ficam na fila esperando worker livre

### Arquitetura Atual

```
Cliente 1 → EventSource → [Worker 1 BLOQUEADO] ← time.sleep()
Cliente 2 → EventSource → [Worker 2 BLOQUEADO] ← time.sleep()
Cliente 3 → EventSource → [Worker 3 BLOQUEADO] ← time.sleep()
Cliente 4 → EventSource → [Worker 4 BLOQUEADO] ← time.sleep()
Cliente 5 → HTTP Request → ❌ SEM WORKERS DISPONÍVEIS
```

---

## ✅ Soluções para Habilitar SSE em Produção

### Opção 1: Gunicorn + Gevent (Recomendado) ⭐

**Vantagens:**
- ✅ Compatível com código atual (mínimas mudanças)
- ✅ Coroutines permitem milhares de conexões simultâneas
- ✅ Mesma stack WSGI (Django padrão)
- ✅ Implementação rápida (1-2 dias)

**Implementação:**

```bash
# 1. Instalar gevent
pip install gevent

# 2. Atualizar requirements.txt
echo "gevent==23.9.1" >> backend/requirements.txt

# 3. Modificar comando Gunicorn (docker-compose.prod.yml)
command: gunicorn config.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 4 \
  --worker-class gevent \
  --worker-connections 1000 \
  --timeout 300

# 4. Habilitar SSE no .env_prod
ENABLE_SSE=true
```

**Capacidade:**
- 4 workers × 1000 connections = **4.000 conexões SSE simultâneas**
- Perfeito para até ~2.000 usuários simultâneos

---

### Opção 2: Migrar para ASGI (Django Channels)

**Vantagens:**
- ✅ Arquitetura nativa para WebSockets e SSE
- ✅ Suporta 10k+ conexões simultâneas
- ✅ Preparado para features futuras (chat, presença)

**Desvantagens:**
- ❌ Requer refatoração significativa (1-2 semanas)
- ❌ Precisa de Daphne/Uvicorn em vez de Gunicorn
- ❌ Adiciona complexidade (channels layers, Redis)

**Implementação:**

```bash
# 1. Instalar Django Channels
pip install channels daphne channels-redis

# 2. Configurar ASGI
# backend/config/asgi.py
application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(
                notifications.routing.websocket_urlpatterns
            )
        )
    ),
})

# 3. Reescrever notificações com Channels
# backend/apps/notifications/consumers.py
class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # ... lógica SSE/WebSocket ...
```

---

### Opção 3: Polling Otimizado (Atual) ✅

**Status:** ✅ **Ativo em produção**

**Vantagens:**
- ✅ Zero bloqueio de workers
- ✅ Funciona perfeitamente com Gunicorn WSGI
- ✅ Simples e confiável
- ✅ Já implementado e testado

**Desvantagens:**
- ⚠️ Latência de até 60 segundos
- ⚠️ Múltiplas requisições HTTP (mas aceitável)

**Configuração:**

```typescript
// frontend - Auto-detecta ambiente
NOTIFICATIONS_CONFIG.enableSSE = false (produção)
NOTIFICATIONS_CONFIG.pollingInterval = 60000 (60s)
```

---

## 🎯 Recomendação Técnica

### Para Deploy IMEDIATO ✅

**Use Polling (configuração atual)**

```bash
# Produção
ENABLE_SSE=false
NOTIFICATION_POLLING_INTERVAL=60000

# Desenvolvimento
ENABLE_SSE=true
SSE_CHECK_INTERVAL=3
```

✅ **Vantagens:**
- Deploy seguro hoje
- Zero risco de travamento
- Funcionalidade 100% operacional
- Latência de 60s é aceitável para notificações

### Para Médio Prazo (2-4 semanas)

**Migrar para Gunicorn + Gevent**

1. Testar em staging (1 semana)
2. Teste de carga com 500+ usuários (3 dias)
3. Deploy gradual em produção (1 semana)
4. Monitoramento intensivo (1 semana)

### Para Longo Prazo (3+ meses)

**Considerar Django Channels** se precisar de:
- Chat em tempo real
- Presença online de usuários
- Notificações push muito frequentes
- +10.000 usuários simultâneos

---

## 📊 Métricas e Monitoramento

### Quando Habilitar SSE, Monitorar:

```python
# Adicionar métricas Prometheus/StatsD
- notifications.sse.connections_active
- notifications.sse.connections_total
- notifications.sse.reconnections_count
- notifications.sse.errors_count
- notifications.sse.messages_sent

# Alertas
- SSE errors > 10/min → Investigar
- Connections > 80% capacity → Escalar workers
- Reconnections > 50/min → Problemas de rede
```

---

## 🧪 Checklist de Testes (Antes de Habilitar SSE)

### Desenvolvimento ✅
- [x] SSE conecta corretamente
- [x] Notificações aparecem em <1s
- [x] Reconexão automática funciona
- [x] Fallback para polling funciona

### Staging
- [ ] Teste de carga: 100 usuários simultâneos
- [ ] Teste de carga: 500 usuários simultâneos
- [ ] Teste de estabilidade: 24h com conexões ativas
- [ ] Teste de reconexão: reiniciar backend
- [ ] Teste de fallback: desabilitar SSE durante execução
- [ ] Métricas coletadas e dashboards configurados

### Produção
- [ ] Deploy canary: 10% dos usuários
- [ ] Monitoramento 24/7 primeira semana
- [ ] Rollback plan testado
- [ ] Documentação operacional completa

---

## 🚀 Roadmap de Implementação

### Fase 1: Produção Estável (ATUAL) ✅
- **Status:** ✅ Completo
- **Estratégia:** Polling (60s)
- **Deploy:** Hoje

### Fase 2: SSE em Staging (Semana 1-2)
- **Ação:** Implementar Gunicorn + Gevent
- **Testes:** Carga e estabilidade
- **Meta:** 500 usuários simultâneos

### Fase 3: SSE em Produção (Semana 3-4)
- **Deploy:** Gradual (10% → 50% → 100%)
- **Monitoramento:** Intensivo
- **Rollback:** Automático se erros > limite

### Fase 4: Otimização (Mês 2)
- **Cache:** Redis para contagens
- **Limite:** 1 conexão SSE por usuário
- **Métricas:** Dashboard Grafana

---

## 📚 Referências

- [Django + SSE + Gunicorn Gevent](https://www.viget.com/articles/server-sent-events-with-django/)
- [Django Channels Documentation](https://channels.readthedocs.io/)
- [Gevent Documentation](http://www.gevent.org/)
- [Gunicorn Worker Classes](https://docs.gunicorn.org/en/stable/design.html#async-workers)

---

## 📝 Notas Finais

**Decisão Técnica:** SSE desabilitado em produção até implementação correta com Gevent.

**Justificativa:** Evitar bloqueio de workers WSGI que pode derrubar a aplicação em produção.

**Próximo Passo:** Deploy com polling estável, implementar Gevent em paralelo.

**Responsável:** Time de DevOps + Backend

**Data:** 07/11/2025
