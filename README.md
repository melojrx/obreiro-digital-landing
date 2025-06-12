# 🏛️ Obreiro Virtual - Sistema de Gestão Eclesiástica

Sistema completo de gestão eclesiástica moderno, desenvolvido com Django REST Framework e React TypeScript.

## 🏗️ Arquitetura Monorepo

```
obreiro-virtual/
├── 🔧 backend/          # Django REST API
│   ├── apps/           # Apps Django organizados
│   ├── config/         # Configurações Django
│   ├── static/         # Arquivos estáticos
│   ├── manage.py       # Django CLI
│   └── requirements.txt # Dependências Python
├── 🎨 frontend/        # React + TypeScript + Vite
│   ├── src/           # Código fonte React
│   │   ├── pages/     # Login, Cadastro, Dashboard
│   │   ├── components/ # Componentes UI (shadcn/ui)
│   │   ├── config/    # Configuração da API
│   │   └── hooks/     # Custom hooks
│   ├── public/        # Arquivos públicos
│   └── package.json   # Dependências Node.js
├── 📄 package.json    # Scripts de desenvolvimento
└── 📖 README.md       # Esta documentação
```

## 🚀 Início Rápido

### Pré-requisitos
- Python 3.12+
- Node.js 18+
- Git

### Instalação Completa

```bash
# 1. Clone o repositório
git clone https://github.com/melojrx/obreiro-digital-landing.git
cd obreiro-digital-landing

# 2. Setup completo (instala tudo e configura)
npm run setup
```

### Desenvolvimento

```bash
# Inicia backend + frontend simultaneamente
npm run dev
```

## 🔧 Scripts Disponíveis

### Desenvolvimento
- `npm run dev` - Inicia backend (Django) + frontend (React)
- `npm run dev:backend` - Apenas Django (porta 8000)
- `npm run dev:frontend` - Apenas React (porta 3000)

### Instalação
- `npm run setup` - Setup completo do projeto
- `npm run install:all` - Instala todas as dependências
- `npm run install:backend` - Dependências Python
- `npm run install:frontend` - Dependências Node.js

### Database
- `npm run migrate` - Executa migrações Django

### Testes
- `npm run test:backend` - Testes Django
- `npm run test:frontend` - Testes React

### Build
- `npm run build:frontend` - Build de produção React
- `npm run collectstatic` - Coleta arquivos estáticos Django

## 🌐 URLs de Desenvolvimento

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/v1/
- **Admin Django**: http://localhost:8000/admin/
- **API Docs**: http://localhost:8000/api/schema/swagger-ui/

## 📋 Funcionalidades

### ✅ Frontend (React + TypeScript)
- 🔐 **Tela de Login** - Autenticação por email
- 📝 **Tela de Cadastro** - Registro em 2 etapas
- 🎨 **UI Moderna** - shadcn/ui + Tailwind CSS
- 📱 **Responsivo** - Design mobile-first
- ⚡ **Vite** - Build rápido e HMR

### ✅ Backend (Django REST API)
- 🔐 **Autenticação** - Email + Token
- 👥 **Gestão de Usuários** - Perfis completos
- ⛪ **Gestão de Igrejas** - Denominações e filiais
- 👨‍👩‍👧‍👦 **Membros e Visitantes** - Cadastro completo
- 📅 **Atividades** - Eventos e ministérios
- 📊 **Dashboard** - Relatórios e estatísticas
- 📖 **API Docs** - Swagger/OpenAPI

## 🛠️ Tecnologias

### Frontend
- **React 18** - Interface de usuário
- **TypeScript** - Type safety
- **Vite** - Build tool moderna
- **Tailwind CSS** - Styling utilitário
- **shadcn/ui** - Componentes UI
- **React Router** - Navegação
- **React Hook Form** - Formulários
- **Zod** - Validação de schemas

### Backend
- **Django 5.2** - Framework web
- **Django REST Framework** - API REST
- **PostgreSQL** - Banco de dados (produção)
- **SQLite** - Banco de dados (desenvolvimento)
- **Redis** - Cache e Celery
- **Celery** - Tarefas assíncronas

## 🔌 Integração API

O frontend está configurado para se comunicar automaticamente com o backend Django:

- **Configuração**: `frontend/src/config/api.ts`
- **Base URL**: `http://127.0.0.1:8000/api/v1`
- **Autenticação**: Token-based
- **CORS**: Configurado para desenvolvimento

## 📖 Documentação

- **API Backend**: http://localhost:8000/api/schema/swagger-ui/
- **Componentes Frontend**: Documentação inline no código

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

---

**Desenvolvido com ❤️ para a gestão eclesiástica moderna**
