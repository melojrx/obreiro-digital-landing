# 🏛️ Obreiro Virtual

Sistema completo de gestão eclesiástica moderno, desenvolvido com Django REST Framework e React TypeScript.

## 🏗️ Arquitetura

```
ObreiroVirtual/
├── 🔧 backend/          # Django REST API
│   ├── apps/           # Apps Django organizados
│   ├── config/         # Configurações Django
│   ├── static/         # Arquivos estáticos
│   ├── manage.py       # Django CLI
│   └── requirements.txt # Dependências Python
├── 🎨 frontend/        # React + TypeScript + Vite
│   ├── src/           # Código fonte React
│   ├── public/        # Arquivos públicos
│   └── package.json   # Dependências Node.js
├── 📚 docs/           # Documentação
└── 🔄 scripts/        # Scripts de desenvolvimento
```

## 🚀 Início Rápido

### Pré-requisitos
- Python 3.12+
- Node.js 18+
- Git

### Instalação

1. **Clone o repositório**
```bash
git clone <repo-url>
cd ObreiroVirtual
```

2. **Instale as dependências**
```bash
# Instalar concurrently para desenvolvimento
npm install

# Backend (Django)
npm run install:backend

# Frontend (React)
npm run install:frontend
```

3. **Configure o ambiente**
```bash
# Backend - copie e configure o .env
cp backend/.env.example backend/.env

# Execute as migrações
npm run migrate
```

4. **Inicie o desenvolvimento**
```bash
# Inicia backend e frontend simultaneamente
npm run dev
```

## 🔧 Scripts Disponíveis

### Desenvolvimento
- `npm run dev` - Inicia backend + frontend
- `npm run dev:backend` - Apenas Django (porta 8000)
- `npm run dev:frontend` - Apenas React (porta 3000)

### Instalação
- `npm run install:all` - Instala todas as dependências
- `npm run install:backend` - Dependências Python
- `npm run install:frontend` - Dependências Node.js

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

### ✅ Backend (Django REST API)
- 🔐 Autenticação por email + token
- 👥 Gestão de usuários e perfis
- ⛪ Gestão de igrejas e denominações
- 👨‍👩‍👧‍👦 Gestão de membros e visitantes
- 📅 Atividades e ministérios
- 📊 Dashboard e relatórios
- 📖 Documentação automática (Swagger)

### 🎨 Frontend (React + TypeScript)
- 🎨 Interface moderna com shadcn/ui
- 📱 Design responsivo com Tailwind CSS
- ⚡ Build rápido com Vite
- 🔒 Autenticação integrada
- 📊 Dashboard interativo
- 🎯 TypeScript para type safety

## 🛠️ Tecnologias

### Backend
- **Django 5.2** - Framework web
- **Django REST Framework** - API REST
- **PostgreSQL** - Banco de dados
- **Redis** - Cache e Celery
- **Celery** - Tarefas assíncronas

### Frontend
- **React 18** - Interface de usuário
- **TypeScript** - Type safety
- **Vite** - Build tool moderna
- **Tailwind CSS** - Styling
- **shadcn/ui** - Componentes UI

## 📖 Documentação

- [Backend API](./backend/docs/)
- [Frontend Components](./frontend/docs/)
- [Deployment Guide](./docs/deployment.md)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes. 