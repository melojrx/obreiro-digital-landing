# 🏛️ Obreiro Virtual - Sistema de Gestão Eclesiástica

Sistema completo de gestão eclesiástica moderno, desenvolvido com Django REST Framework e React TypeScript.

## 🏗️ Arquitetura

```
obreiro-virtual/
├── backend/            # Django REST API
│   ├── apps/          # Apps Django organizados
│   ├── config/        # Configurações Django
│   └── requirements.txt
├── frontend/          # React + TypeScript + Vite
│   ├── src/          # Código fonte React
│   ├── public/       # Arquivos públicos
│   └── package.json
├── package.json      # Scripts de desenvolvimento
└── README.md         # Documentação
```

## 🚀 Início Rápido

### Pré-requisitos
- Python 3.12+
- Node.js 18+
- Git

### Instalação e Execução

```bash
# 1. Clone o repositório
git clone https://github.com/melojrx/obreiro-digital-landing.git
cd obreiro-virtual

# 2. Setup completo
npm run setup

# 3. Iniciar desenvolvimento
npm run dev
```

## 🔧 Scripts Principais

- `npm run dev` - Inicia backend + frontend simultaneamente
- `npm run setup` - Setup completo do projeto
- `npm run migrate` - Executa migrações Django

## 🌐 URLs de Desenvolvimento

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/v1/
- **Admin Django**: http://localhost:8000/admin/
- **API Docs**: http://localhost:8000/api/schema/swagger-ui/

## 📋 Funcionalidades

### Backend (Django REST API)
- 🔐 Autenticação por email + token
- 👥 Gestão de usuários e perfis
- ⛪ Gestão de igrejas e denominações
- 👨‍👩‍👧‍👦 Gestão de membros e visitantes
- 📅 Atividades e ministérios
- 📊 Dashboard e relatórios

### Frontend (React + TypeScript)
- 🎨 Interface moderna com shadcn/ui
- 📱 Design responsivo com Tailwind CSS
- ⚡ Build rápido com Vite
- 🔒 Autenticação integrada
- 📊 Dashboard interativo

## 🛠️ Tecnologias

**Backend:** Django 5.2, Django REST Framework, PostgreSQL, Redis, Celery

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

---

**Desenvolvido com ❤️ para a gestão eclesiástica moderna**
