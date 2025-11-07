# 🔔 Sistema de Notificações - Obreiro Virtual

## 📊 Status de Produção

| Feature | Status | Estratégia |
|---------|--------|------------|
| **Notificações Backend** | ✅ Produção | Signals automáticos |
| **API REST** | ✅ Produção | CRUD completo |
| **Frontend UI** | ✅ Produção | Dropdown + Badge |
| **Tempo Real (Dev)** | ⚠️ Dev Only | SSE (Server-Sent Events) |
| **Tempo Real (Prod)** | ✅ Produção | Polling (60s) |

## 🎯 Como Funciona

### Backend (Django)

#### 1. Signals Automáticos

Notificações são criadas automaticamente via Django signals:

```python
# backend/apps/notifications/signals.py

# Visitante novo → Notifica admins
@receiver(post_save, sender='visitors.Visitor')
def visitor_created_notification(...)

# Visitante convertido → Notifica admins
@receiver(post_save, sender='visitors.Visitor')
def visitor_converted_notification(...)

# Membro novo → Notifica admins
@receiver(post_save, sender='members.Member')
def member_created_notification(...)

# Status de membro mudou → Notifica admins
@receiver(pre_save/post_save, sender='members.Member')
def member_status_changed_notification(...)

# Perfil atualizado → Notifica usuário
@receiver(post_save, sender='accounts.CustomUser')
def profile_updated_notification(...)

# Avatar atualizado → Notifica usuário
@receiver(post_save, sender='accounts.UserProfile')
def avatar_updated_notification(...)

# Senha alterada → Notifica usuário (segurança)
@receiver(post_save, sender='accounts.CustomUser')
def password_changed_notification(...)
```

**9 tipos de notificações implementados:**
- `new_visitor` - Novo visitante via QR Code
- `visitor_converted` - Visitante virou membro
- `new_member` - Novo membro cadastrado
- `member_status_changed` - Status de membresia alterado
- `member_transferred` - Membro transferido entre igrejas
- `profile_updated` - Dados pessoais atualizados
- `avatar_updated` - Foto de perfil alterada
- `password_changed` - Senha modificada (alerta segurança)

#### 2. API REST Completa

```
GET    /api/v1/notifications/                  # Listar notificações
GET    /api/v1/notifications/{id}/             # Detalhar notificação
POST   /api/v1/notifications/{id}/mark_read/   # Marcar como lida
POST   /api/v1/notifications/mark_all_read/    # Marcar todas
POST   /api/v1/notifications/bulk_mark_read/   # Marcar múltiplas
GET    /api/v1/notifications/unread_count/     # Contagem não lidas
POST   /api/v1/notifications/clear_all/        # Limpar todas
GET    /api/v1/notifications/recent/           # Últimos 7 dias

# SSE (Desabilitado em produção)
GET    /api/v1/notifications/stream/           # Server-Sent Events
```

#### 3. Multi-Tenant Seguro

Todas as notificações são isoladas por igreja:

```python
# Middleware adiciona request.church
# Queries automaticamente filtram por church

Notification.objects.filter(
    user=request.user,
    church=request.church,  # Isolamento automático
    is_read=False
)
```

### Frontend (React)

#### 1. Hook useNotifications

```typescript
const {
  notifications,        // Lista de notificações
  unreadCount,         // Contagem de não lidas
  loading,             // Estado de carregamento
  sseConnected,        // Se SSE está conectado (dev)
  markAsRead,          // Marcar uma como lida
  markAllAsRead,       // Marcar todas
  clearAll,            // Limpar todas
} = useNotifications({
  enablePolling: true,  // Polling ativo (padrão)
  pollingInterval: 60000, // 60 segundos
  useSSE: false,        // SSE desabilitado (prod)
});
```

#### 2. Componentes UI

**NotificationDropdown** (Header)
- Badge com contador de não lidas
- Dropdown com últimas 5 notificações
- Botão "Marcar todas como lidas"
- Botão "Limpar todas"
- Click na notificação navega para URL relacionada

**NotificationItem** (Individual)
- Ícone por tipo de notificação
- Badge de prioridade (low/medium/high/critical)
- Timestamp relativo
- Link para ação relacionada

#### 3. Estratégias de Tempo Real

**Desenvolvimento:**
```typescript
// SSE habilitado automaticamente
NOTIFICATIONS_CONFIG.enableSSE = true
// Notificações aparecem em <1 segundo
```

**Produção:**
```typescript
// Polling ativo (estável e confiável)
NOTIFICATIONS_CONFIG.enableSSE = false
NOTIFICATIONS_CONFIG.pollingInterval = 60000 // 60s
// Notificações aparecem em até 60 segundos
```

**Fallback Automático:**
- Se SSE falhar 3x, desabilita automaticamente
- Sistema volta para polling sem interrupção
- Usuário não percebe a mudança

## 🚀 Como Usar

### Backend: Criar Notificação Manual

```python
from apps.notifications.services import NotificationService

# Notificar um usuário específico
NotificationService.create_notification(
    user=user_obj,
    church=church_obj,
    notification_type='custom_type',
    title='Título da Notificação',
    message='Mensagem detalhada',
    priority='high',  # low/medium/high/critical
    action_url='/membros/123',  # URL para clicar
    metadata={'extra': 'dados'}
)

# Notificar todos os admins da igreja
NotificationService.notify_church_admins(
    church=church_obj,
    notification_type='important_update',
    title='Atualização Importante',
    message='Sistema será atualizado às 22h',
    priority='critical'
)
```

### Frontend: Adicionar Dropdown no Header

```typescript
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';

<Header>
  {/* ... outros componentes ... */}
  
  <NotificationDropdown 
    maxItems={5}  // Últimas 5 notificações
  />
  
  {/* ... avatar, etc ... */}
</Header>
```

## 📈 Performance e Escalabilidade

### Polling (Produção Atual)

**Vantagens:**
- ✅ Zero bloqueio de workers
- ✅ Funciona com Gunicorn WSGI padrão
- ✅ Simples e confiável
- ✅ Já testado em produção

**Desvantagens:**
- ⚠️ Latência de até 60 segundos
- ⚠️ 1 requisição HTTP por minuto por usuário

**Capacidade:**
- 100 usuários = 100 req/min
- 1000 usuários = 1000 req/min
- Suporta até ~5.000 usuários simultâneos

### SSE (Desenvolvimento)

**Vantagens:**
- ✅ Notificações em <1 segundo
- ✅ 1 conexão persistente (não múltiplas requisições)
- ✅ Eficiente em recursos

**Por que desabilitado em produção?**

Ver documentação completa: [docs/SSE_PRODUCTION_REQUIREMENTS.md](./SSE_PRODUCTION_REQUIREMENTS.md)

**Resumo:**
- `time.sleep()` bloqueia workers WSGI
- Requer Gunicorn + Gevent ou ASGI
- Implementação planejada para Fase 2

## 🔧 Configuração

### Variáveis de Ambiente

**Backend (.env_prod):**
```bash
# Notificações
ENABLE_SSE=false                        # SSE desabilitado
NOTIFICATION_POLLING_INTERVAL=60000     # 60 segundos
SSE_CHECK_INTERVAL=3                    # 3s (quando habilitado)
SSE_HEARTBEAT_INTERVAL=30               # 30s heartbeat
SSE_MAX_CONNECTIONS_PER_USER=1          # Limite por usuário
```

**Frontend (.env.production):**
```bash
VITE_ENABLE_SSE=false                           # SSE desabilitado
VITE_NOTIFICATION_POLLING_INTERVAL=60000        # 60 segundos
VITE_API_URL=https://www.obreirovirtual.com/api/v1
```

## 🧪 Testes

### Testar Notificação de Visitante

1. Faça login como admin
2. Abra o QR Code de uma filial
3. Cadastre um visitante
4. ✅ Notificação aparece no sino (60s max)

### Testar Notificação de Conversão

1. Acesse lista de visitantes
2. Clique em "Converter para Membro"
3. ✅ Notificação de conversão aparece

### Testar Polling

1. Abra console do navegador (F12)
2. Procure por: `[useNotifications] SSE conectado` (dev) ou `pollingEnabled: true` (prod)
3. Cadastre visitante
4. ✅ Contador atualiza em até 60s

## 📊 Monitoramento

### Métricas Disponíveis

```python
# Via Django Admin
- Total de notificações não lidas
- Notificações por tipo
- Notificações por prioridade
- Taxa de leitura (read rate)

# Logs
- Criação de notificações
- Erros em signals
- Conexões SSE (se habilitado)
```

### Alertas Recomendados

```yaml
- notification.create.errors > 10/min → Investigar signals
- notification.unread > 100/user → Usuário não lê notificações
- notification.sse.reconnects > 50/min → Problemas de rede (se SSE)
```

## 🛣️ Roadmap

### ✅ Fase 1: Produção Estável (ATUAL)
- [x] Backend completo com signals
- [x] API REST completa
- [x] Frontend com dropdown
- [x] Polling estável (60s)
- [x] Deploy em produção

### 🚧 Fase 2: SSE com Gevent (Planejado)
- [ ] Implementar Gunicorn + Gevent
- [ ] Testes de carga (500+ usuários)
- [ ] Deploy gradual em produção
- [ ] Monitoramento intensivo

### 🔮 Fase 3: Features Avançadas (Futuro)
- [ ] Push notifications (browser)
- [ ] Notificações por email/SMS
- [ ] Customização de notificações por usuário
- [ ] Analytics e insights

## 📚 Documentação Adicional

- [SSE Production Requirements](./SSE_PRODUCTION_REQUIREMENTS.md) - Requisitos técnicos para SSE
- [Sistema de Permissões](./Sistema_de_Permissoes.md) - Hierarquia de papéis
- [Arquitetura Técnica](./ARQUITETURA_TECNICA_COMPLETA.md) - Visão geral do sistema

## 🐛 Troubleshooting

### Notificações não aparecem

```bash
# 1. Verificar logs do backend
docker compose -f docker-compose.prod.yml logs backend | grep notification

# 2. Verificar signals registrados
python manage.py shell
>>> from apps.notifications import signals
>>> # Verificar se signals estão conectados

# 3. Verificar polling no frontend
# Console do navegador: deve mostrar requisições a cada 60s
```

### Contador não atualiza

```bash
# 1. Verificar header X-Church
# Console navegador → Network → notifications/unread_count/
# Deve ter header: X-Church: <id>

# 2. Verificar multi-tenant
# Notificação deve ter church_id = igreja ativa
```

### SSE não conecta (dev)

```bash
# 1. Verificar ENABLE_SSE
echo $ENABLE_SSE  # deve ser 'true' em dev

# 2. Verificar runserver rodando
docker compose -f docker-compose.dev.yml ps backend

# 3. Verificar console navegador
# Deve mostrar: [SSE] Conectado: notification_count
```

## 👥 Suporte

Problemas ou dúvidas? Abra uma issue no GitHub ou contate o time de desenvolvimento.

---

**Última atualização:** 07/11/2025  
**Versão:** 1.0.0  
**Status:** ✅ Produção (Polling) | ⚠️ Dev Only (SSE)
