# CLAUDE.md

Este arquivo fornece orientações para o Claude Code (claude.ai/code) ao trabalhar com código neste repositório.
# Ambiente de Desenvolvimento
- Sistema: WSL2 Ubuntu no Windows
- GitHub CLI (gh) instalado e configurado
- Autenticação via HTTPS

# Comandos GitHub Disponíveis
## Issues
- `gh issue create --title "título" --body "descrição"`
- `gh issue list --state open`
- `gh issue view <número>`

## Pull Requests
- `gh pr create` - Criar PR interativamente
- `gh pr list` - Listar PRs
- `gh pr checkout <número>` - Fazer checkout de um PR

## Repositório
- `gh repo view` - Ver informações do repo atual
- `gh repo clone <owner/repo>` - Clonar repositório
## Comandos de Desenvolvimento

### Configuração Inicial
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

### Desenvolvimento
```bash
# Executar ambos os serviços simultaneamente
npm run dev

# OU executar separadamente:
npm run dev:backend    # Django runserver na porta 8000
npm run dev:frontend   # Vite dev server na porta 5173

# Migrar banco de dados
npm run migrate        # python manage.py migrate
```

### Backend Django
```bash
cd backend
python manage.py runserver              # Executar servidor
python manage.py makemigrations         # Criar migrações
python manage.py migrate                # Aplicar migrações
python manage.py test                    # Executar testes
python manage.py shell                  # Shell Django
python manage.py createsuperuser        # Criar admin
python manage.py collectstatic          # Arquivos estáticos
```

### Frontend React
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
# Popuar denominações iniciais
cd backend && python manage.py shell -c "exec(open('populate_denominations.py').read())"

# Criar usuários de teste
cd backend && python manage.py create_test_users

# Criar admin da plataforma
cd backend && python manage.py create_platform_admin
```

## Arquitetura do Sistema

### Estrutura Geral
- **Backend**: Django REST Framework com arquitetura modular por apps
- **Frontend**: React + TypeScript com Vite, usando shadcn/ui
- **Database**: PostgreSQL (desenvolvimento e produção)
- **Autenticação**: Token-based com sistema hierárquico de permissões

### Apps Django (backend/apps/)

#### Core Business Logic
- **accounts/**: Sistema de autenticação, perfis e permissões hierárquicas
- **churches/**: Gestão de igrejas principais
- **denominations/**: Gestão de denominações religiosas  
- **branches/**: Sistema de filiais de igrejas
- **members/**: CRUD completo de membros com papéis e permissões
- **visitors/**: Sistema de visitantes com QR code
- **activities/**: Gestão de eventos e atividades eclesiásticas
- **core/**: Configurações centrais e middlewares

#### Configuração
- **config/settings/**: Configurações modulares (base.py, dev.py)
- **config/**: URLs principais e configurações WSGI/ASGI

### Sistema de Permissões
Hierarquia de 8 níveis de permissões:
```
SUPER_ADMIN (10) → DENOMINATION_ADMIN (9) → CHURCH_ADMIN (8) → PASTOR (7) 
→ SECRETARY (6) → LEADER (5) → MEMBER (4) → READ_ONLY (3)
```

Isolamento multi-tenant por igreja implementado em todas as operações.

### Frontend (frontend/src/)

#### Estrutura de Componentes
- **components/ui/**: Componentes shadcn/ui base (buttons, forms, etc.)
- **components/layout/**: Layout da aplicação (Header, Sidebar, AppLayout)
- **components/dashboard/**: Componentes específicos do dashboard
- **components/members/**: Gestão de membros (tables, forms, details)
- **components/profile/**: Gestão de perfil do usuário
- **pages/**: Páginas principais da aplicação
- **hooks/**: Hooks customizados (auth, permissions, members)
- **services/**: Integração com API backend
- **lib/**: Utilitários e configurações

#### Estado e Roteamento
- **React Router** para navegação
- **ProtectedRoute** para controle de acesso
- **useAuth** hook para gerenciamento de autenticação
- **localStorage** para persistência de tokens

### APIs e Endpoints
Base URL: `http://localhost:8000/api/v1/`

#### Principais endpoints:
- **Auth**: `/auth/login/`, `/auth/logout/`, `/auth/available-roles/`
- **Members**: `/members/` (CRUD completo com filtros)
- **Churches**: `/churches/` (gestão de igrejas)
- **Visitors**: `/visitors/` (gestão de visitantes)
- **Profile**: `/profile/` (dados pessoais e igreja)

## URLs de Desenvolvimento

| Serviço | URL | Descrição |
|---------|-----|-----------|
| Frontend | http://localhost:5173 | Interface React |
| Backend API | http://localhost:8000/api/v1/ | API REST |
| Admin Django | http://localhost:8000/admin/ | Painel admin |
| Swagger Docs | http://localhost:8000/api/docs/ | Documentação API |

## Tecnologias Principais

### Backend
- Django 5.2.3 + Django REST Framework
- PostgreSQL
- Token Authentication
- Pillow (processamento de imagens)
- drf-spectacular (documentação automática)

### Frontend  
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui
- React Hook Form + Zod (formulários e validação)
- Axios (HTTP client)
- React Router (roteamento)

## Padrões de Desenvolvimento

### Django
- Apps modulares com responsabilidade única
- ViewSets para CRUD padrão
- Serializers com validações customizadas
- Middleware personalizado para CORS e auth
- Configurações modulares por ambiente

### React
- Componentes funcionais com hooks
- TypeScript estrito
- Formulários controlados com React Hook Form
- Validações client-side com Zod
- Componentes reutilizáveis com shadcn/ui
- Estado local com useState/useEffect

### Convenções de Código
- Nomes em inglês para código, português para UI
- Snake_case (Python) e camelCase (TypeScript)
- Imports organizados (Django apps, third-party, local)
- Documentação inline para lógica complexa

## Estrutura de Testes

### Backend
```bash
# Executar todos os testes
python manage.py test

# Testes por app
python manage.py test apps.accounts
python manage.py test apps.members
```

### Frontend
```bash
# Linting
npm run lint
```

## Documentação Adicional

- `backend/docs/`: Documentação técnica completa dos módulos
- README.md: Visão geral do projeto e configuração
- .cursorrules: Regras específicas para desenvolvimento com Cursor
