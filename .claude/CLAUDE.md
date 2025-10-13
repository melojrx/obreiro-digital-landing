# CLAUDE.md

Este arquivo fornece orientações para o Claude Code (claude.ai/code) ao trabalhar com código neste repositório.

## ⚠️ DIRETRIZES CRÍTICAS

### 1. 📝 NÃO Criar Documentação Sem Solicitação
- **NUNCA** crie arquivos de documentação (.md, README, etc.) sem que o usuário solicite explicitamente
- Foque em código funcional, não em documentação automática
- Se precisar documentar algo, faça via docstrings no próprio código

### 2. 🔍 Análise de Contexto Global Obrigatória
- **ANTES** de fazer qualquer alteração no código, SEMPRE analise:
  - O contexto global da aplicação
  - Dependências e relacionamentos com outros módulos
  - Impacto da mudança em outras partes do sistema
  - Sistema multi-tenant e isolamento de dados
  - Sistema de permissões hierárquico
- Use ferramentas de busca (Grep, Glob) para entender o escopo completo
- Leia os modelos relacionados e suas validações

### 3. ✅ SEMPRE Testar Antes de Commitar
- **NUNCA** commite código sem antes:
  - Ter testado a funcionalidade manualmente, OU
  - Ter sugerido explicitamente ao usuário como testar
- Para bugs corrigidos:
  - Reproduza o bug primeiro
  - Aplique a correção
  - Teste novamente para confirmar a correção
  - Documente o teste realizado
- Para novas funcionalidades:
  - Sugira cenários de teste ao usuário
  - Liste os casos de uso a validar
  - Verifique edge cases e validações

## 🐳 Ambiente de Desenvolvimento

### Sistema Base
- **Sistema**: WSL2 Ubuntu no Windows
- **Containerização**: Docker + Docker Compose (dev e prod)
- **GitHub CLI**: gh instalado e configurado
- **Autenticação**: HTTPS

### Arquitetura de Deploy
O projeto utiliza Docker tanto para desenvolvimento quanto para produção:

```
Desenvolvimento (docker-compose.dev.yml):
├── PostgreSQL 15 (porta 5432)
├── Redis 7 Alpine (porta 6379)
├── Backend Django (porta 8000)
└── Frontend Vite Dev Server (porta 5173)

Produção (docker-compose.prod.yml):
├── PostgreSQL 15 (interno)
├── Redis 7 Alpine (interno)
├── Backend Django + Gunicorn (interno)
├── Frontend Build Estático (interno)
└── NGINX (portas 80/443) → Proxy reverso
```

## 🚀 Comandos de Desenvolvimento

### Opção 1: Docker (Recomendado)

#### Desenvolvimento com Docker
```bash
# Configurar ambiente (primeira vez)
cp .env_dev.example .env_dev
cp frontend/.env.example frontend/.env.local
./scripts/setup-dev.sh

# Iniciar todos os serviços
docker-compose -f docker-compose.dev.yml up -d

# Ver logs
docker-compose -f docker-compose.dev.yml logs -f

# Parar serviços
docker-compose -f docker-compose.dev.yml down

# Rebuild após mudanças
docker-compose -f docker-compose.dev.yml up -d --build

# Executar comandos Django no container
docker-compose -f docker-compose.dev.yml exec backend python manage.py migrate
docker-compose -f docker-compose.dev.yml exec backend python manage.py createsuperuser
docker-compose -f docker-compose.dev.yml exec backend python manage.py create_test_users

# Acessar shell do container
docker-compose -f docker-compose.dev.yml exec backend bash
docker-compose -f docker-compose.dev.yml exec backend python manage.py shell
```

#### Produção com Docker
```bash
# Configurar ambiente
cp .env_prod.example .env_prod
# Editar .env_prod com valores de produção

# Build e iniciar
docker-compose -f docker-compose.prod.yml up -d --build

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Executar migrações
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Coletar arquivos estáticos
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
```

### Opção 2: Desenvolvimento Local (Sem Docker)

#### Configuração Inicial
```bash
# Configurar ambiente virtual Python
python -m venv venv
source venv/bin/activate  # Linux/Mac
# OU
venv\Scripts\activate     # Windows

# Instalar dependências completas
npm run setup

# OU instalar separadamente:
npm run install:backend    # Instala deps Python (requirements.txt)
npm run install:frontend   # Instala deps Node.js
```

#### Desenvolvimento
```bash
# Executar ambos os serviços simultaneamente
npm run dev

# OU executar separadamente:
npm run dev:backend    # Django runserver na porta 8000
npm run dev:frontend   # Vite dev server na porta 5173

# Migrar banco de dados
npm run migrate        # python manage.py migrate
```

### Backend Django (Local)
```bash
cd backend
python manage.py runserver              # Executar servidor
python manage.py makemigrations         # Criar migrações
python manage.py migrate                # Aplicar migrações
python manage.py test                   # Executar testes
python manage.py shell                  # Shell Django
python manage.py createsuperuser        # Criar admin
python manage.py collectstatic          # Arquivos estáticos
```

### Frontend React (Local)
```bash
cd frontend
npm run dev            # Servidor desenvolvimento
npm run build          # Build produção
npm run build:dev      # Build modo desenvolvimento
npm run preview        # Preview build
npm run lint           # ESLint
```

### Comandos Especiais
```bash
# Popular denominações iniciais
cd backend && python manage.py shell -c "exec(open('populate_denominations.py').read())"

# Criar usuários de teste
cd backend && python manage.py create_test_users

# Criar admin da plataforma
cd backend && python manage.py create_platform_admin
```

## 📁 Arquitetura do Sistema

### Estrutura Geral
- **Backend**: Django 5.2.3 + REST Framework com arquitetura modular por apps
- **Frontend**: React 18 + TypeScript com Vite, usando shadcn/ui
- **Database**: PostgreSQL 15 (desenvolvimento e produção)
- **Cache**: Redis 7 (sessões, celery, cache)
- **Autenticação**: Token-based com sistema hierárquico de permissões
- **Containerização**: Docker + Docker Compose (dev e prod)
- **Proxy Reverso**: NGINX (produção)

### Apps Django (backend/apps/)

#### Core Business Logic
- **accounts/**: Sistema de autenticação, perfis e permissões hierárquicas
- **churches/**: Gestão de igrejas principais (multi-tenant)
- **denominations/**: Gestão de denominações religiosas
- **branches/**: Sistema de filiais de igrejas
- **members/**: CRUD completo de membros com papéis e permissões
- **visitors/**: Sistema de visitantes com QR code
- **activities/**: Gestão de eventos e atividades eclesiásticas
- **prayers/**: Sistema de pedidos de oração
- **core/**: Configurações centrais e middlewares

#### Configuração
- **config/settings/**: Configurações modulares (base.py, dev.py, prod.py)
- **config/**: URLs principais e configurações WSGI/ASGI

### Sistema Multi-Tenant

O sistema utiliza **isolamento multi-tenant por igreja**:

```python
# Middleware TenantMiddleware adiciona request.church
# Todos os managers filtram automaticamente por church

class TenantManager(models.Manager):
    def get_queryset(self):
        # Filtra automaticamente pela igreja do request
        return super().get_queryset().filter(church=request.church)
```

**ATENÇÃO**: Ao modificar queries, sempre considere o isolamento multi-tenant!

### Sistema de Permissões

Hierarquia de 8 níveis de permissões:
```
SUPER_ADMIN (10)         → Desenvolvedores da plataforma
    ↓
DENOMINATION_ADMIN (9)   → Administra múltiplas igrejas (LEGADO - usar CHURCH_ADMIN)
    ↓
CHURCH_ADMIN (8)         → Administra igreja específica + denominação se configurado
    ↓
PASTOR (7)               → Gestão pastoral completa
    ↓
SECRETARY (6)            → Gestão de cadastros
    ↓
LEADER (5)               → Liderança de filial/ministério
    ↓
MEMBER (4)               → Membro comum
    ↓
READ_ONLY (3)            → Apenas visualização
```

**Validação em múltiplas camadas**:
1. Model (validações no save/clean)
2. Serializer (validações DRF)
3. ViewSet (permission_classes)
4. Middleware (tenant isolation)

### Frontend (frontend/src/)

#### Estrutura de Componentes
- **components/ui/**: Componentes shadcn/ui base (buttons, forms, etc.)
- **components/layout/**: Layout da aplicação (Header, Sidebar, AppLayout)
- **components/dashboard/**: Componentes específicos do dashboard
- **components/members/**: Gestão de membros (tables, forms, details)
- **components/visitors/**: Gestão de visitantes
- **components/profile/**: Gestão de perfil do usuário
- **components/hierarchy/**: Dashboard denominacional
- **pages/**: Páginas principais da aplicação (32 páginas)
- **hooks/**: Hooks customizados (auth, permissions, members)
- **services/**: Integração com API backend (15+ serviços)
- **types/**: Interfaces TypeScript (150+ tipos)
- **lib/**: Utilitários e configurações

#### Estado e Roteamento
- **React Router v6** para navegação
- **ProtectedRoute** para controle de acesso
- **useAuth** hook para gerenciamento de autenticação
- **localStorage** para persistência de tokens (30 min timeout)

### APIs e Endpoints

Base URL: `http://localhost:8000/api/v1/`

#### Principais endpoints:
- **Auth**: `/auth/login/`, `/auth/logout/`, `/auth/available-roles/`
- **Members**: `/members/` (CRUD completo com filtros)
- **Churches**: `/churches/` (gestão de igrejas)
- **Branches**: `/branches/` (gestão de filiais)
- **Visitors**: `/visitors/` (gestão de visitantes)
- **Profile**: `/users/me/`, `/users/my_church/`
- **Denominations**: `/denominations/` (gestão hierárquica)

**Documentação completa**: http://localhost:8000/api/docs/

## 🌐 URLs de Desenvolvimento

| Serviço | URL | Descrição |
|---------|-----|-----------|
| Frontend | http://localhost:5173 | Interface React (Dev) |
| Backend API | http://localhost:8000/api/v1/ | API REST Django |
| Admin Django | http://localhost:8000/admin/ | Painel administrativo |
| Swagger Docs | http://localhost:8000/api/docs/ | Documentação OpenAPI |
| Redoc | http://localhost:8000/api/redoc/ | Docs alternativa |

## 🛠️ Tecnologias Principais

### Backend
- Django 5.2.3 + Django REST Framework
- PostgreSQL 15
- Redis 7
- Token Authentication
- Celery (tarefas assíncronas)
- Pillow (processamento de imagens)
- drf-spectacular (documentação automática)
- QRCode (geração de QR codes)
- Gunicorn (servidor WSGI - produção)

### Frontend
- React 18 + TypeScript 5.5
- Vite 5.4 (build tool)
- Tailwind CSS 3.4
- shadcn/ui (design system)
- React Hook Form 7.53 (formulários)
- Zod 3.23 (validação)
- Axios 1.10 (HTTP client)
- React Router 6.26 (roteamento)
- Recharts (gráficos)
- Lucide React (ícones)

### DevOps
- Docker + Docker Compose
- NGINX (proxy reverso)
- Let's Encrypt (SSL/TLS)

## 📐 Padrões de Desenvolvimento

### Django

#### Estrutura de Apps
- Apps modulares com responsabilidade única
- Models com BaseModel (created_at, updated_at, is_active)
- Managers customizados (TenantManager, ActiveManager)
- ViewSets para CRUD padrão
- Serializers com validações customizadas
- Middleware personalizado para CORS e tenant isolation
- Configurações modulares por ambiente

#### Models
```python
# Sempre usar BaseModel
class MyModel(BaseModel):
    church = models.ForeignKey('churches.Church', ...)  # Multi-tenant

    # Managers
    objects = TenantManager()  # Filtra por church automaticamente
    active = ActiveManager()   # Filtra is_active=True

    # Validações no save
    def save(self, *args, **kwargs):
        self.full_clean()  # Chama validações
        super().save(*args, **kwargs)

    # Properties para lógica calculada
    @property
    def display_name(self):
        return self.name
```

#### ViewSets
```python
class MyViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]

    def get_queryset(self):
        # SEMPRE filtrar por tenant
        return MyModel.objects.filter(church=self.request.church)
```

### React/TypeScript

#### Componentes
```typescript
// Componentes funcionais com hooks
// TypeScript estrito - evitar any
// Props bem tipadas

interface MyComponentProps {
  title: string;
  onSave: (data: FormData) => void;
  optional?: boolean;
}

export function MyComponent({ title, onSave, optional = false }: MyComponentProps) {
  // ... implementação
}
```

#### Formulários
```typescript
// React Hook Form + Zod para validação
const schema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
});

const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: { ... }
});
```

#### Services
```typescript
// Axios com interceptors para auth
// Tratamento de erros consistente
// Tipos bem definidos para requests/responses

export const myService = {
  async getAll(): Promise<MyType[]> {
    const response = await api.get<MyType[]>('/endpoint/');
    return response.data;
  },

  async create(data: CreateData): Promise<MyType> {
    try {
      const response = await api.post<MyType>('/endpoint/', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
```

### Convenções de Código
- **Nomes em inglês** para código, **português** para UI/mensagens
- **Snake_case** para Python, **camelCase** para TypeScript
- **Imports organizados**: stdlib → third-party → local
- **Docstrings** para funções complexas
- **Type hints** no Python quando possível
- **Comments** para lógica não-óbvia

## 🧪 Estrutura de Testes

### Backend
```bash
# Docker
docker-compose -f docker-compose.dev.yml exec backend python manage.py test

# Local
python manage.py test

# Testes por app
python manage.py test apps.accounts
python manage.py test apps.members

# Com cobertura
python manage.py test --coverage
```

### Frontend
```bash
# Linting
npm run lint

# Type checking
npx tsc --noEmit
```

## 🔍 Comandos GitHub CLI

### Issues
```bash
gh issue create --title "título" --body "descrição"
gh issue list --state open
gh issue view <número>
```

### Pull Requests
```bash
gh pr create                    # Criar PR interativamente
gh pr list                      # Listar PRs
gh pr checkout <número>         # Checkout de um PR
gh pr view <número>             # Ver detalhes
```

### Repositório
```bash
gh repo view                    # Ver informações do repo
gh repo clone <owner/repo>      # Clonar repositório
```

## 📚 Documentação Adicional

### Estrutura de Documentação
```
docs/
├── ARQUITETURA_DADOS_PROJETO_COMPLETA.md
├── ARQUITETURA_TECNICA_COMPLETA.md
├── DEPLOY_ORQUESTRADO_COMPLETO.md
├── MODULOS_SISTEMA_COMPLETO.md
├── MODULO_HIERARQUICO_FINAL.md
├── MEMBERSHIP_STATUS_SISTEMA_COMPLETO.md
├── DOCUMENTACAO_MODULO_MEMBROS.md
├── DOCUMENTACAO_MODULO_VISITANTES.md
└── Sistema de Permissões e Papéis - Guia Completo.md
```

### Documentação Online
- **README.md**: Visão geral e setup inicial
- **backend/docs/**: Documentação técnica detalhada dos módulos
- **.cursorrules**: Regras para desenvolvimento com Cursor IDE

## 🎯 Workflow de Desenvolvimento

### 1. Antes de Começar
- [ ] Entenda o contexto global da mudança
- [ ] Leia os modelos relacionados
- [ ] Verifique o sistema de permissões
- [ ] Considere o isolamento multi-tenant
- [ ] Verifique dependências e relacionamentos

### 2. Durante o Desenvolvimento
- [ ] Siga os padrões do projeto
- [ ] Adicione validações apropriadas
- [ ] Considere edge cases
- [ ] Mantenha compatibilidade com código existente
- [ ] Use TypeScript strict mode

### 3. Antes de Commitar
- [ ] **TESTE a funcionalidade manualmente**
- [ ] OU sugira cenários de teste ao usuário
- [ ] Verifique se não quebrou outras funcionalidades
- [ ] Execute linting (npm run lint)
- [ ] Verifique migrações se mudou models
- [ ] NÃO crie documentação sem solicitação

### 4. Commit
```bash
# Mensagens de commit claras
git commit -m "feat: adiciona funcionalidade X"
git commit -m "fix: corrige bug Y no módulo Z"
git commit -m "refactor: melhora performance de query"
```

## ⚠️ Pontos de Atenção

### Multi-Tenant
- SEMPRE filtrar queries por `church`
- NUNCA permitir acesso cross-tenant
- Usar `TenantManager` nos models

### Permissões
- Validar em múltiplas camadas
- Respeitar hierarquia de papéis
- Testar com diferentes níveis de acesso

### Performance
- Usar `select_related()` e `prefetch_related()`
- Evitar queries N+1
- Considerar paginação para listas grandes

### Segurança
- NUNCA commitar secrets ou tokens
- Validar inputs em backend E frontend
- Sanitizar dados de usuário
- Usar prepared statements (Django ORM já faz)
