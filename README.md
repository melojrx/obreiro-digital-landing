# 🏛️ Obreiro Virtual - Sistema de Gestão Eclesiástica

> **Sistema completo e profissional para gestão moderna de igrejas e instituições religiosas**

[![Django](https://img.shields.io/badge/Django-5.2.3-green)](https://djangoproject.com/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://typescriptlang.org/)
[![Status](https://img.shields.io/badge/Status-Produção-success)](https://github.com/melojrx/obreiro-digital-landing)

## 📖 Sobre o Projeto

O **Obreiro Virtual** é uma plataforma completa de gestão eclesiástica desenvolvida para modernizar a administração de igrejas brasileiras. Combina uma API robusta em Django com uma interface React moderna, oferecendo ferramentas profissionais para gestão de membros, visitantes, relatórios e muito mais.

### ✨ Principais Diferenciais

- 🏛️ **Multi-denominacional**: Suporte completo a diferentes denominações
- 📱 **QR Code Inteligente**: Cadastro automático de visitantes (pioneiro no Brasil)
- 📊 **Analytics Avançado**: Relatórios de crescimento e métricas em tempo real
- 🔐 **Segurança Empresarial**: Autenticação robusta com logout automático por inatividade
- 🌐 **API REST Completa**: Integração com qualquer sistema externo
- ☁️ **100% Cloud**: Acesso de qualquer lugar, sempre atualizado

## 🏗️ Arquitetura Técnica

```
ObreiroVirtual/
├── 🔧 backend/                    # Django REST API
│   ├── apps/
│   │   ├── accounts/             # Sistema de autenticação
│   │   ├── churches/             # Gestão de igrejas
│   │   ├── members/              # Gestão de membros
│   │   ├── visitors/             # Gestão de visitantes
│   │   ├── activities/           # Atividades e ministérios
│   │   └── core/                 # Configurações centrais
│   ├── config/                   # Configurações Django
│   └── docs/                     # Documentação da API
├── 🎨 frontend/                   # React + TypeScript
│   ├── src/
│   │   ├── components/           # Componentes reutilizáveis
│   │   ├── pages/                # Páginas da aplicação
│   │   ├── services/             # Integração com API
│   │   ├── hooks/                # Hooks customizados
│   │   └── lib/                  # Utilitários
│   └── public/                   # Arquivos estáticos
└── 📁 docs/                      # Documentação do projeto
```

## 🚀 Início Rápido

### 📋 Pré-requisitos

- **Python 3.12+** - Linguagem backend
- **Node.js 18+** - Runtime JavaScript
- **Git** - Controle de versão
- **SQLite** - Banco de dados (desenvolvimento)

### ⚙️ Instalação e Configuração

#### 1️⃣ Clone e Configure o Ambiente

```bash
# Clone o repositório
git clone https://github.com/melojrx/obreiro-digital-landing.git
cd ObreiroVirtual

# Configure o ambiente virtual Python
python -m venv venv
source venv/bin/activate  # Linux/Mac
# OU
venv\Scripts\activate     # Windows
```

#### 2️⃣ Configure o Backend Django

```bash
# Navegue para o backend
cd backend

# Instale as dependências
pip install -r requirements.txt

# Configure o banco de dados
python manage.py migrate

# Crie um superusuário
python manage.py createsuperuser

# Inicie o servidor de desenvolvimento
python manage.py runserver
```

#### 3️⃣ Configure o Frontend React

```bash
# Em outro terminal, navegue para o frontend
cd frontend

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

### 🌐 URLs de Desenvolvimento

| Serviço | URL | Descrição |
|---------|-----|-----------|
| 🎨 **Frontend** | http://localhost:3000 | Interface principal |
| 🔧 **Backend API** | http://localhost:8000/api/v1/ | API REST |
| ⚙️ **Admin Django** | http://localhost:8000/admin/ | Painel administrativo |
| 📚 **Swagger Docs** | http://localhost:8000/api/schema/swagger-ui/ | Documentação da API |

## 🔐 Sistema de Autenticação

### Funcionalidades Implementadas

- ✅ **Login/Logout** com redirecionamento automático
- ✅ **Logout por inatividade** (30 minutos)
- ✅ **ProtectedRoute** para controle de acesso
- ✅ **Gestão de tokens** com localStorage
- ✅ **Validação automática** de sessões

### Fluxo de Autenticação

```
Usuário → Login → Validação → Token → Dashboard
    ↓
Inatividade (30min) → Logout Automático → Login
```

## 📋 Funcionalidades Principais

### 🔧 Backend (Django REST API)

- 👤 **Autenticação Robusta**: Sistema de login por email com tokens seguros
- ⛪ **Gestão Multi-Igreja**: Suporte a múltiplas denominações e filiais
- 👥 **Membros & Visitantes**: Cadastro completo com histórico detalhado
- 📅 **Atividades**: Gestão de ministérios, eventos e programações
- 📊 **Relatórios**: Analytics avançado com métricas de crescimento
- 🔌 **API REST**: Endpoints completos para integrações externas

### 🎨 Frontend (React + TypeScript)

- 🏠 **Landing Page Profissional**: Página inicial moderna e responsiva
- 🔐 **Sistema de Login**: Interface intuitiva com feedback visual
- 📊 **Dashboard Interativo**: Painel principal com métricas importantes
- 📱 **Design Responsivo**: Funciona perfeitamente em desktop e mobile
- ⚡ **Performance Otimizada**: Carregamento rápido com Vite
- 🎨 **UI Moderna**: Componentes shadcn/ui com Tailwind CSS

## 🛠️ Stack Tecnológica

### Backend
- **Django 5.2.3** - Framework web Python
- **Django REST Framework** - API REST robusta
- **SQLite** - Banco de dados (desenvolvimento)
- **Token Authentication** - Sistema de autenticação

### Frontend
- **React 18** - Biblioteca JavaScript
- **TypeScript** - Tipagem estática
- **Vite** - Build tool moderna
- **Tailwind CSS** - Framework CSS utilitário
- **shadcn/ui** - Componentes UI profissionais
- **React Router** - Roteamento SPA

### DevOps & Qualidade
- **Git** - Controle de versão
- **ESLint** - Linting JavaScript/TypeScript
- **Prettier** - Formatação de código

## 📊 Status do Projeto

### ✅ Funcionalidades Concluídas

- [x] Sistema de autenticação completo
- [x] Landing page responsiva
- [x] Dashboard básico
- [x] Gestão de usuários
- [x] API REST funcional
- [x] Links de cadastro ativados
- [x] Logout automático por inatividade

### 🔄 Em Desenvolvimento

- [ ] Gestão completa de membros
- [ ] Sistema de relatórios avançados
- [ ] Integração QR Code
- [ ] Módulo financeiro
- [ ] App mobile

## 🤝 Desenvolvimento

### Estrutura de Commits

```bash
feat: nova funcionalidade
fix: correção de bug
docs: documentação
style: formatação de código
refactor: refatoração
test: testes
chore: tarefas de manutenção
```

### Comandos Úteis

```bash
# Backend
python manage.py makemigrations  # Criar migrações
python manage.py migrate         # Aplicar migrações
python manage.py runserver       # Executar servidor

# Frontend
npm run dev                      # Servidor desenvolvimento
npm run build                    # Build produção
npm run preview                  # Preview build
```

## 📞 Suporte

Para suporte técnico ou dúvidas sobre o sistema:

- 📧 **Email**: contato@obreirovirtual.com.br
- 📞 **Telefone**: (11) 3000-0000
- 🌐 **Website**: https://obreirovirtual.com.br

## ⚖️ Licença e Direitos Autorais

**© 2024 Obreiro Virtual. Todos os direitos reservados.**

Este software é **propriedade privada** e **confidencial**. É estritamente proibida:

- ❌ A reprodução, distribuição ou modificação sem autorização expressa
- ❌ A engenharia reversa ou descompilação do código
- ❌ O uso comercial sem licenciamento adequado
- ❌ A redistribuição ou sublicenciamento

O uso deste software é regido pelos **Termos de Uso** e **Política de Privacidade** disponíveis em nosso website.

### 🛡️ Proteção Intelectual

Este projeto está protegido por direitos autorais e pode estar sujeito a patentes. Qualquer violação será perseguida nos termos da lei.

---

**🚀 Desenvolvido com excelência para revolucionar a gestão eclesiástica brasileira**

*Obreiro Virtual - Modernizando igrejas com tecnologia de ponta desde 2024*
