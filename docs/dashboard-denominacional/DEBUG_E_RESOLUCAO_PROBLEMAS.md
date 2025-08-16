# Debug e Resolução de Problemas - Dashboard Denominacional

## Sessão de Debug Completa - 16 de Agosto de 2025

### Contexto Inicial
O usuário relatou problemas de login após a implementação do dashboard denominacional profissional. Esta documentação detalha todo o processo de investigação e resolução.

## Problemas Identificados e Soluções

### 1. Erro de Autenticação (Status 400)

**Problema:**
```
Failed to load resource: the server responded with a status of 400 (Bad Request)
Erro: "Não foi possível fazer login com as credenciais fornecidas."
```

**Investigação:**
- Backend funcionando via curl: ✅
- Frontend retornando erro 400: ❌
- Credenciais corretas: ✅

**Causa Raiz:**
Erro no código de debug que tentava acessar `request.body` após `request.data` ter sido processado pelo Django REST Framework.

**Erro Específico:**
```python
# ❌ PROBLEMÁTICO
print(f"🔍 LOGIN DEBUG - Body: {request.body}")
# RawPostDataException: You cannot access body after reading from request's data stream
```

**Solução:**
```python
# ✅ CORRIGIDO
def post(self, request, *args, **kwargs):
    serializer = self.serializer_class(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data['user']
    token, created = Token.objects.get_or_create(user=user)
```

### 2. Erro de Componente React Lazy Loading

**Problema:**
```
Element type is invalid. Received a promise that resolves to: undefined. 
Lazy element type must resolve to a class or function.
```

**Investigação:**
- Componente `DenominationDashboardPage` existe: ✅
- Exportação padrão correta: ✅
- Problema na importação lazy: ❌

**Causa Raiz:**
Configuração incorreta do lazy loading tentando desestruturar exportação nomeada inexistente.

**Erro Específico:**
```typescript
// ❌ PROBLEMÁTICO
const DenominationDashboardPage = lazy(() => 
  import("./pages/DenominationDashboardPage").then(module => ({
    default: module.DenominationDashboardPage  // ← Exportação nomeada inexistente
  }))
);
```

**Solução:**
```typescript
// ✅ CORRIGIDO
const DenominationDashboardPage = lazy(() => 
  import("./pages/DenominationDashboardPage")
);
```

### 3. Configuração de Ambiente Docker vs SQLite

**Problema:**
Sistema tentava usar SQLite quando deveria usar PostgreSQL via Docker.

**Solução:**
```bash
# Configuração correta do ambiente
DATABASE_URL=postgres://obreiro_user:obreiro_pass@localhost:5432/obreiro_dev
```

**Verificação:**
```bash
docker ps | grep obreiro
# ✅ Containers rodando: PostgreSQL, Redis, Backend, Frontend
```

## Usuários de Teste Configurados

### Denomination Admin
- **Email**: `denominacao.admin@teste.com`
- **Senha**: `admin123`
- **Papel**: `denomination_admin`
- **Permissões**:
  - ✅ `can_manage_denomination`
  - ✅ `can_create_churches`
  - ✅ `can_manage_church_admins`
  - ✅ `can_view_financial_reports`

### Acesso a 4 Igrejas
1. Igreja Central São Paulo
2. Igreja Campinas
3. Igreja Santos
4. Igreja Teste Sede - Desenvolvimento

## Dados Mock do Dashboard

### KPIs Executivos
- **Total de Igrejas**: 8
- **Total de Membros**: 2,453
- **Receita Mensal**: R$ 189,750
- **Health Score Geral**: 87%

### Distribuição Geográfica
- **Sudeste**: 4 igrejas, 1,856 membros (76% penetração)
- **Sul**: 2 igrejas, 687 membros (28% penetração)
- **Nordeste**: 1 igreja, 234 membros (9% penetração)
- **Centro-Oeste**: 1 igreja, 176 membros (7% penetração)

### Ranking de Performance
1. Igreja Central São Paulo (94% health, +18.2% crescimento)
2. Igreja Campinas (89% health, +12.8% crescimento)
3. Igreja Santos (85% health, +8.5% crescimento)
4. Igreja Porto Alegre (82% health, +6.2% crescimento)
5. Igreja Curitiba (78% health, +4.1% crescimento)
6. Igreja Salvador (75% health, +2.8% crescimento)
7. Igreja Brasília (72% health, +1.2% crescimento)
8. Igreja Ribeirão Preto (58% health, -8.5% crescimento) ⚠️

## Logs de Debug Implementados

### Frontend (api.ts)
```typescript
console.log('🚀 API Request:', {
  method: config.method?.toUpperCase(),
  url: config.url,
  baseURL: config.baseURL,
  fullURL: `${config.baseURL}${config.url}`,
  headers: { /* headers mascarados */ },
  data: config.data,
  dataType: typeof config.data
});
```

### Backend (views.py)
```python
print(f"🔍 LOGIN DEBUG - Raw request data: {request.data}")
print(f"🔍 LOGIN DEBUG - Content type: {request.content_type}")
print(f"🔍 LOGIN DEBUG - Serializer valid: {serializer.is_valid()}")
```

## Testes de Validação

### 1. Login via curl
```bash
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "denominacao.admin@teste.com", "password": "admin123"}'

# ✅ Resultado: Token válido retornado
```

### 2. Verificação de Permissões
```python
# Consulta SQL para validar permissões
church_users = ChurchUser.objects.filter(user__email='denominacao.admin@teste.com')
# ✅ Resultado: 4 vínculos com papel denomination_admin
```

### 3. Componente React
```typescript
// Importação corrigida
import DenominationDashboardProfessional from '@/components/hierarchy/DenominationDashboardProfessional';
// ✅ Resultado: Componente carrega sem erros
```

## Checklist de Verificação

### ✅ Backend
- [x] Django rodando na porta 8000
- [x] PostgreSQL conectado
- [x] Usuário denomination_admin criado
- [x] Permissões configuradas
- [x] API de login funcionando

### ✅ Frontend
- [x] React rodando na porta 5173
- [x] Lazy loading corrigido
- [x] Importações corretas
- [x] Logs de debug implementados
- [x] Componente dashboard renderizando

### ✅ Docker
- [x] PostgreSQL container ativo
- [x] Redis container ativo
- [x] Backend container ativo
- [x] Frontend container ativo

## Comandos Úteis para Debug

### Verificar Containers
```bash
docker ps | grep obreiro
docker logs obreiro_backend_dev --tail 20
```

### Testar Login via API
```bash
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "denominacao.admin@teste.com", "password": "admin123"}'
```

### Verificar Usuários no Banco
```bash
docker exec obreiro_backend_dev python manage.py shell -c "
from apps.accounts.models import CustomUser, ChurchUser
users = ChurchUser.objects.filter(role='denomination_admin')
for u in users: print(f'{u.user.email} - {u.church.name}')
"
```

## Lições Aprendidas

1. **Debug Cuidadoso**: Logs de debug devem evitar acessar `request.body` após `request.data`
2. **Lazy Loading**: Verificar sempre a correspondência entre exportação e importação
3. **Ambiente Docker**: Garantir que variáveis de ambiente estejam corretas
4. **Testes Sistemáticos**: Validar backend isoladamente antes de testar frontend
5. **Documentação**: Manter registro detalhado do processo de debug

## Status Final
✅ **Login funcionando com credenciais**: `denominacao.admin@teste.com` / `admin123`  
✅ **Dashboard denominacional carregando corretamente**  
✅ **Todos os componentes renderizando sem erros**  
✅ **Dados mock apresentando KPIs profissionais**  

---

*Documentação de debug criada em 16 de Agosto de 2025*