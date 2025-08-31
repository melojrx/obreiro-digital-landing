# 🏛️ Obreiro Digital - Sistema de Gestão Eclesiástica

> **Plataforma SaaS completa e profissional para gestão moderna de igrejas e denominações brasileiras**

[![Django](https://img.shields.io/badge/Django-5.2.3-green)](https://djangoproject.com/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-24.0-blue)](https://docker.com/)
[![Status](https://img.shields.io/badge/Status-Produção-success)](https://github.com/melojrx/obreiro-digital-landing)

## 📖 Sobre o Projeto

O **Obreiro Digital** é uma plataforma SaaS enterprise de gestão eclesiástica desenvolvida para modernizar a administração de igrejas brasileiras. Combina uma API robusta em Django com uma interface React moderna, oferecendo uma solução completa e escalável para gestão hierárquica de denominações, igrejas, filiais, membros, visitantes e muito mais.

### ✨ Principais Diferenciais

- 🏛️ **Gestão Hierárquica Completa**: Sistema Denominação → Igreja → Filiais com dashboard consolidado
- 👥 **Sistema de Membros Avançado**: CRUD completo com histórico ministerial e gestão de usuários
- 📱 **QR Code Inteligente**: Cadastro automático de visitantes (pioneiro no Brasil)
- 📊 **Analytics Enterprise**: Dashboard denominacional com métricas em tempo real
- 🔐 **Segurança Robusta**: Sistema hierárquico de permissões com isolamento multi-tenant
- 🌐 **API REST Completa**: 60+ endpoints documentados com Swagger
- ☁️ **Arquitetura Cloud**: 100% containerizada com Docker para dev/prod
- 🎨 **Interface Moderna**: Design system profissional com shadcn/ui
- 🚀 **Performance Otimizada**: Queries optimizadas e cache inteligente

## 🏗️ Arquitetura Técnica

### Stack Tecnológica Enterprise

```
┌─────────────────────────────────────────────────────────────┐
│                    OBREIRO DIGITAL                         │
│              Sistema de Gestão Eclesiástica                │
└─────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  FRONTEND   │         │   BACKEND   │         │   DATABASE  │
│             │         │             │         │             │
│  React 18   │◄────────┤ Django 5.2  │◄────────┤ PostgreSQL  │
│ TypeScript  │  REST   │ DRF + Auth  │  ORM    │ Multi-tenant │
│ Tailwind UI │  API    │ 60+ APIs    │         │ Isolation   │
│ shadcn/ui   │         │ Swagger     │         │             │
└─────────────┘         └─────────────┘         └─────────────┘
        │                       │                       │
        │               ┌─────────────┐                 │
        └───────────────┤   DOCKER    │─────────────────┘
                        │             │
                        │ Compose     │
                        │ Development │
                        │ Production  │
                        └─────────────┘
```

### Estrutura do Projeto

```
obreiro-digital-landing/
├── 🔧 backend/                    # Django REST API Enterprise
│   ├── apps/
│   │   ├── accounts/             # Autenticação e perfis
│   │   ├── denominations/        # Gestão de denominações
│   │   ├── churches/             # Gestão de igrejas
│   │   ├── branches/             # Gestão de filiais
│   │   ├── members/              # Sistema completo de membros
│   │   ├── visitors/             # QR Code e visitantes
│   │   ├── activities/           # Eventos e ministérios
│   │   └── core/                 # Middleware e utilitários
│   ├── config/                   # Configurações Django
│   └── management/               # Comandos customizados
├── 🎨 frontend/                   # React TypeScript SPA
│   ├── src/
│   │   ├── components/           # 80+ componentes reutilizáveis
│   │   ├── pages/                # Páginas da aplicação
│   │   ├── services/             # Integração com APIs
│   │   ├── hooks/                # 15+ hooks customizados
│   │   ├── types/                # 100+ interfaces TypeScript
│   │   └── lib/                  # Utilitários e validações
├── 🐳 docker/                     # Containerização completa
│   ├── backend/                  # Dockerfile Django
│   ├── frontend/                 # Dockerfile React
│   └── nginx/                    # Proxy reverso produção
├── 📜 scripts/                    # Automação e deploy
└── 📁 docs/                      # Documentação técnica
```

## 🚀 Início Rápido

### 📋 Pré-requisitos

- **Docker & Docker Compose** - Ambiente completo
- **Git** - Controle de versão
- **Node.js 18+** (opcional para desenvolvimento local)
- **Python 3.11+** (opcional para desenvolvimento local)

### 🐳 Método Recomendado: Docker Compose

#### 1️⃣ Setup do Projeto

```bash
# Clone o repositório
git clone https://github.com/melojrx/obreiro-digital-landing.git
cd obreiro-digital-landing

# Configure ambiente de desenvolvimento
cp .env_dev.example .env_dev
cp frontend/.env.example frontend/.env.local

# Execute setup automático (recomendado)
./scripts/setup-dev.sh
```

#### 2️⃣ Iniciar Ambiente de Desenvolvimento

```bash
# Inicie todos os serviços
docker-compose -f docker-compose.dev.yml up -d

# Acompanhe os logs
docker-compose -f docker-compose.dev.yml logs -f

# Ou execute serviços específicos
docker-compose -f docker-compose.dev.yml up -d postgres redis
npm run dev
```

#### 3️⃣ Acesso ao Sistema

| Serviço | URL | Descrição |
|---------|-----|-----------|
| 🎨 **Frontend Principal** | http://localhost:5173 | Interface React |
| 🔧 **API Backend** | http://localhost:8000/api/v1/ | Django REST API |
| ⚙️ **Admin Django** | http://localhost:8000/admin/ | Painel administrativo |
| 📚 **Documentação Swagger** | http://localhost:8000/api/docs/ | API Documentation |
| 🔍 **Redoc** | http://localhost:8000/api/redoc/ | API Alternative Docs |

## 🔐 Sistema de Autenticação

### Usuários de Teste Prontos

O sistema cria automaticamente usuários para todos os níveis hierárquicos:

| Papel | Email | Senha | Escopo de Acesso |
|-------|-------|-------|------------------|
| **🏛️ Denominação Admin** | `denominacao.admin@teste.com` | `teste123` | Todas as igrejas da denominação |
| **⛪ Igreja Admin (Sede)** | `igreja.admin@teste.com` | `teste123` | Igreja Sede completa |
| **⛪ Igreja Admin (Filha)** | `igreja.filha.admin@teste.com` | `teste123` | Igreja Filha completa |
| **👨‍💼 Pastor Principal** | `pastor@teste.com` | `teste123` | Gestão pastoral (sem filiais) |
| **📝 Secretário** | `secretario@teste.com` | `teste123` | Gestão de cadastros |
| **👥 Líder de Filial** | `lider@teste.com` | `teste123` | Apenas Filial Norte |
| **🙋 Membro Comum** | `membro@teste.com` | `teste123` | Visualização básica |
| **👀 Somente Leitura** | `readonly@teste.com` | `teste123` | Acesso mínimo |

### Hierarquia de Permissões

```
SUPER_ADMIN (10)         ← Desenvolvedores da plataforma
    ↓
DENOMINATION_ADMIN (9)   ← Administra múltiplas igrejas
    ↓
CHURCH_ADMIN (8)         ← Administra igreja específica
    ↓
PASTOR (7)               ← Gestão pastoral completa
    ↓
SECRETARY (6)            ← Gestão de cadastros
    ↓
LEADER (5)               ← Liderança de filial
    ↓
MEMBER (4)               ← Membro comum
    ↓
READ_ONLY (3)            ← Apenas visualização
```

## 📋 Módulos Implementados

### ✅ **Sistema de Gestão Hierárquica** - *Enterprise Ready*

**Status**: **🟢 100% CONCLUÍDO**

- 🏛️ **Gestão de Denominações**: Sistema completo com dashboard executivo
- ⛪ **Gestão de Igrejas**: CRUD completo com filiais e hierarquia
- 🏢 **Gestão de Filiais**: Múltiplas unidades físicas por igreja
- 📊 **Dashboard Consolidado**: Analytics executivo em tempo real
- 👥 **Administradores Hierárquicos**: Atribuição por nível organizacional
- 💰 **Relatórios Financeiros**: Consolidação denominacional
- 🔐 **Permissões Granulares**: 11 permissões hierárquicas específicas
- 🎨 **Interface Enterprise**: 11 componentes React profissionais
- ⚡ **Performance Otimizada**: Queries SQL otimizadas com select_related
- 📱 **40+ Interfaces TypeScript**: Tipagem completa e documentada

**Documentação**: [`docs/MODULO_HIERARQUICO_FINAL.md`](docs/MODULO_HIERARQUICO_FINAL.md)

### ✅ **Sistema de Membros com Histórico Ministerial** - *Advanced*

**Status**: **🟢 100% CONCLUÍDO**

- 👥 **CRUD Completo**: Gestão avançada de membros
- 📊 **Dashboard Analytics**: Métricas em tempo real com KPIs
- 🔍 **Sistema de Filtros**: Busca multi-critério avançada  
- 📱 **Upload de Fotos**: Sistema completo com validação
- 🔐 **Criação de Usuários**: Transformação de membros em usuários
- ⛪ **Histórico Ministerial**: Timeline completa de funções com auditoria
- 📋 **Formulário Modular**: Interface em abas otimizada
- 🏷️ **Sistema de Papéis**: Atribuição hierárquica de permissões
- 📄 **Exportação de Dados**: Relatórios Excel/CSV
- 🔒 **Soft Delete**: Exclusão segura com restauração
- 🔄 **Migração Dual**: Compatibilidade com estrutura anterior

**Documentação**: [`docs/MEMBERSHIP_STATUS_SISTEMA_COMPLETO.md`](docs/MEMBERSHIP_STATUS_SISTEMA_COMPLETO.md)

### ✅ **Sistema QR Code para Visitantes** - *Innovation*

**Status**: **🟢 100% CONCLUÍDO**

- 📱 **QR Codes Únicos**: Geração automática por filial/igreja
- 📝 **Registro Público**: Formulário otimizado (sem autenticação)
- 👥 **Gestão Administrativa**: CRUD completo de visitantes
- 📊 **Analytics de Visitação**: Dashboard com métricas de conversão
- 🔄 **Sistema Follow-up**: Acompanhamento e conversão para membros
- 🎨 **Gestão Visual**: Ativar/desativar, download, regeneração QR
- 🔐 **Isolamento Multi-tenant**: Segurança por igreja
- 📱 **Validações Avançadas**: Máscaras e validação de campos
- ✨ **Timeline de Visitas**: Histórico completo de interações
- 🏠 **Compliance LGPD**: Política de privacidade integrada

### ✅ **Sistema de Permissões e Segurança** - *Enterprise Security*

**Status**: **🟢 100% CONCLUÍDO**

- 🔐 **8 Níveis Hierárquicos**: Granularidade completa de acesso
- 🛡️ **Isolamento Multi-Tenant**: Separação total por organização
- ⚖️ **Validação Dupla**: Frontend + Backend sincronizado
- 🔄 **Atribuição Inteligente**: Usuários só atribuem papéis inferiores
- 📋 **API Especializada**: Endpoints específicos de permissões
- 🔍 **Preview de Permissões**: Interface mostra capacidades por papel
- 📊 **Auditoria Completa**: Logs detalhados de todas as ações
- 🧪 **Usuários de Teste**: 8 perfis para validação completa
- 🔒 **Papéis Restritos**: Proteção de níveis administrativos da plataforma

**Documentação**: [`docs/PERMISSOES_SEGURANCA_SISTEMA_COMPLETO.md`](docs/PERMISSOES_SEGURANCA_SISTEMA_COMPLETO.md)

### ✅ **Gestão de Perfil Enterprise** - *Professional*

**Status**: **🟢 100% CONCLUÍDO**

- 👤 **Dados Pessoais**: Formulário completo com validações Zod
- ⛪ **Dados Organizacionais**: CNPJ, endereço com API ViaCEP
- 📸 **Upload de Avatar**: Preview, validação e processamento automático
- 🔐 **Configurações de Segurança**: Alteração de senha com força
- ⚠️ **Danger Zone**: Exclusão de conta com confirmação dupla
- 🎨 **Interface Premium**: Design system profissional
- 📱 **Máscaras Inteligentes**: Telefone, CPF, CNPJ, CEP automáticas
- ✅ **Feedback em Tempo Real**: Validações instantâneas

## 🛠️ Tecnologias Enterprise

### Backend - Django Avançado
- **Django 5.2.3** - Framework web Python enterprise
- **Django REST Framework** - API REST robusta com versionamento
- **PostgreSQL** - Banco de dados principal com otimizações
- **Redis** - Cache e filas assíncronas
- **Celery** - Processamento assíncrono de tarefas
- **Pillow** - Processamento avançado de imagens
- **drf-spectacular** - Documentação automática OpenAPI
- **django-filter** - Filtros avançados de API
- **django-cors-headers** - Configuração CORS

### 🔄 **Em Desenvolvimento**

#### 🏛️ **Gestão Completa de Igrejas e Filiais**

**Status**: **🟡 EM DESENVOLVIMENTO**

- ⛪ **CRUD de Igrejas**: Cadastro completo com dados administrativos
- 🏢 **Gestão de Filiais**: Sistema hierárquico igreja-sede → filiais
- 📊 **Dashboard por Igreja**: Métricas específicas de cada unidade
- 📈 **Relatórios Consolidados**: Visão geral da denominação
- 🔗 **Transferência de Membros**: Entre igrejas e filiais
- 💰 **Gestão Financeira**: Orçamentos e transferências

#### 💰 **Módulo Financeiro**

**Status**: **🔴 PLANEJADO**

- 💰 **Gestão de Dízimos**: Controle de contribuições
- 📊 **Relatórios Financeiros**: Entradas, saídas e balanços
- 🏦 **Múltiplas Contas**: Gestão de diferentes contas bancárias
- 📈 **Orçamentos**: Planejamento e controle orçamentário
- 📱 **PIX Integrado**: Recebimento via QR Code
- 🧾 **Emissão de Recibos**: Automatizada com PDF

#### 📅 **Módulo de Atividades**

**Status**: **🔴 PLANEJADO**

- 📅 **Calendário Integrado**: Visualização mensal/semanal
- 🎪 **Gestão de Eventos**: Cultos, reuniões, eventos especiais
- 👥 **Controle de Presença**: Lista de participantes
- 🔔 **Lembretes**: Notificações automáticas
- 📊 **Relatórios de Participação**: Analytics de engajamento
- 🎯 **Ministérios**: Gestão de grupos e lideranças

#### 💬 **Módulo de Mensagens**

**Status**: **🔴 PLANEJADO**

- 📧 **Email Marketing**: Campanhas segmentadas
- 📱 **SMS/WhatsApp**: Integração com APIs
- 🔔 **Notificações Push**: Alertas em tempo real
- 📋 **Templates**: Mensagens pré-definidas
- 📊 **Analytics**: Taxa de abertura e engajamento
- 🎯 **Segmentação**: Por grupos, ministérios, idade

#### 📖 **Módulo de Devocionais**

**Status**: **🔴 PLANEJADO**

- 📖 **Biblioteca de Devocionais**: Conteúdo diário
- ✍️ **Editor de Conteúdo**: Criação personalizada
- 📅 **Programação**: Agendamento automático
- 📱 **App Mobile**: Acesso offline
- 💬 **Comentários**: Interação da comunidade
- 📊 **Métricas de Leitura**: Engajamento do conteúdo

#### 🚨 **Sistema de Alertas**

**Status**: **🔴 PLANEJADO**

- 🔔 **Alertas Personalizados**: Por eventos e métricas
- 📊 **Dashboard de Alertas**: Central de notificações
- ⚙️ **Configurações**: Personalização por usuário
- 📧 **Múltiplos Canais**: Email, SMS, Push
- 🎯 **Alertas Inteligentes**: IA para detecção de padrões

#### 📈 **Relatórios Avançados**

**Status**: **🔴 PLANEJADO**

- 📊 **Business Intelligence**: Dashboards executivos
- 📈 **Análise de Crescimento**: Tendências e projeções
- 📋 **Relatórios Customizados**: Builder visual
- 📱 **Exportação**: PDF, Excel, CSV
- 🎯 **KPIs Eclesiásticos**: Métricas específicas
- 📅 **Relatórios Periódicos**: Automatizados

#### ⚙️ **Configurações e Personalizações**

**Status**: **🔴 PLANEJADO**

- 🎨 **Temas Personalizados**: Cores e logos da igreja
- ⚙️ **Configurações Globais**: Parâmetros do sistema
- 🔧 **Customizações**: Campos e formulários
- 🌐 **Multi-idioma**: Português, Inglês, Espanhol
- 📱 **PWA**: Instalação como app
- 🔌 **Integrações**: APIs externas

#### 🔗 **Integrações**

**Status**: **🔴 PLANEJADO**

- 💰 **Gateways de Pagamento**: PagSeguro, Mercado Pago
- 📧 **Email Services**: SendGrid, Mailgun
- 📱 **WhatsApp Business**: API oficial
- 🏦 **Open Banking**: Integração bancária
- 📊 **Google Analytics**: Métricas web
- ☁️ **Cloud Storage**: AWS S3, Google Drive

## 🛠️ Stack Tecnológica

### Backend
- **Django 5.2.3** - Framework web Python
- **Django REST Framework** - API REST robusta
- **PostgreSQL** - Banco de dados (desenvolvimento e produção)
- **Token Authentication** - Sistema de autenticação
- **Pillow** - Processamento de imagens
- **drf-spectacular** - Documentação automática da API

### Frontend
- **React 18** - Biblioteca JavaScript
- **TypeScript** - Tipagem estática
- **Vite** - Build tool moderna
- **Tailwind CSS** - Framework CSS utilitário
- **shadcn/ui** - Sistema de componentes profissional
- **React Router v6** - Roteamento SPA avançado
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas TypeScript
- **Axios** - Cliente HTTP com interceptors
- **Sonner** - Sistema de notificações moderno

### DevOps & Infraestrutura
- **Docker & Docker Compose** - Containerização completa
- **NGINX** - Proxy reverso e load balancer
- **Let's Encrypt** - Certificados SSL automáticos
- **GitHub Actions** - CI/CD automatizado (planejado)
- **Monitoring** - Health checks e métricas

## 📊 Métricas do Projeto

### 📈 Estatísticas de Desenvolvimento

| Métrica | Valor | Descrição |
|---------|-------|-----------|
| 📁 **Arquivos de Código** | 300+ | Código fonte completo |
| 📝 **Linhas de Código** | 75,000+ | Backend + Frontend |
| 🔧 **Endpoints API** | 60+ | APIs documentadas |
| 🎨 **Componentes React** | 80+ | Componentes reutilizáveis |
| 📚 **Documentação** | 12 guias | Documentação técnica |
| 🧪 **Cobertura Testes** | 90%+ | Meta de qualidade |
| 🏗️ **Interfaces TypeScript** | 150+ | Tipagem completa |
| ⚡ **Hooks Customizados** | 15+ | Lógica reutilizável |

### 🎯 Status dos Módulos

| Status | Módulos | Percentual |
|--------|---------|------------|
| ✅ **Produção** | 5 módulos | 83% |
| 🟡 **Desenvolvimento** | 0 módulos | 0% |
| 🔴 **Planejado** | 1 módulo | 17% |

## 🔄 Próximas Implementações

### 💰 **Módulo Financeiro Enterprise** - *Q1 2025*

**Status**: **🔴 PLANEJADO**

- 💰 **Gestão de Dízimos**: Controle avançado de contribuições
- 📊 **Relatórios Financeiros**: Dashboards executivos com BI
- 🏦 **Múltiplas Contas**: Gestão de diferentes instituições bancárias
- 📈 **Orçamentos**: Planejamento e controle orçamentário
- 📱 **PIX Integrado**: Recebimento via QR Code
- 🧾 **Emissão de Recibos**: Automatizada com compliance fiscal
- 💳 **Gateways de Pagamento**: Integração com provedores
- 📋 **Auditoria Financeira**: Trilha completa de transações

## 🚀 Comandos de Desenvolvimento

### Configuração Inicial
```bash
# Configurar ambiente completo
npm run setup

# Ou instalar separadamente
npm run install:backend    # Dependências Python
npm run install:frontend   # Dependências Node.js
```

### Desenvolvimento
```bash
# Executar ambiente completo
npm run dev

# Ou executar separadamente
npm run dev:backend    # Django na porta 8000
npm run dev:frontend   # Vite na porta 5173

# Comandos específicos
npm run migrate        # Migrar banco de dados
npm run test          # Executar testes
npm run lint          # Verificar código
```

### Backend Django
```bash
cd backend
python manage.py runserver              # Servidor desenvolvimento
python manage.py makemigrations         # Criar migrações
python manage.py migrate                # Aplicar migrações
python manage.py test                    # Executar testes
python manage.py shell                  # Shell Django
python manage.py create_test_users      # Criar usuários de teste
python manage.py collectstatic          # Arquivos estáticos
```

### Frontend React
```bash
cd frontend
npm run dev            # Servidor desenvolvimento
npm run build          # Build produção
npm run preview        # Preview build
npm run lint           # ESLint
npm run type-check     # Verificar tipos
```

## 📚 Documentação Técnica Completa

### 📖 **Guias Principais Consolidados**

#### **🏗️ Arquitetura e Desenvolvimento**
- **[Arquitetura Técnica Completa](docs/ARQUITETURA_TECNICA_COMPLETA.md)** - Visão enterprise da plataforma
- **[Arquitetura de Dados Completa](docs/ARQUITETURA_DADOS_PROJETO_COMPLETA.md)** - Setup, modelagem e implementação
- **[Módulos do Sistema Completo](docs/MODULOS_SISTEMA_COMPLETO.md)** - Visão geral de todos os módulos

#### **🚀 Deploy e Infraestrutura**
- **[Deploy Orquestrado Completo](docs/DEPLOY_ORQUESTRADO_COMPLETO.md)** - Guia completo dev/prod com Docker
- **[GitIgnore Completo](docs/GITIGNORE_COMPLETE.md)** - Configuração de versionamento

#### **🔒 Segurança e Permissões**
- **[Permissões e Segurança Sistema Completo](docs/PERMISSOES_SEGURANCA_SISTEMA_COMPLETO.md)** - Sistema hierárquico + usuários de teste

#### **🧩 Módulos Específicos**
- **[Módulo Hierárquico Final](docs/MODULO_HIERARQUICO_FINAL.md)** - Denominações → Igrejas → Filiais
- **[Membership Status Sistema Completo](docs/MEMBERSHIP_STATUS_SISTEMA_COMPLETO.md)** - Histórico ministerial

#### **📋 Políticas e Compliance**
- **[Política de Privacidade](docs/Política%20de%20Privacidade%20Obreiro%20Virtual.md)** - LGPD e compliance

### 🗂️ Como Navegar na Documentação

#### **👨‍💼 Para Gestores e Product Owners**
1. [Módulos do Sistema Completo](docs/MODULOS_SISTEMA_COMPLETO.md) - Visão funcional
2. [Módulo Hierárquico Final](docs/MODULO_HIERARQUICO_FINAL.md) - Funcionalidade premium
3. [Permissões e Segurança](docs/PERMISSOES_SEGURANCA_SISTEMA_COMPLETO.md) - Controle de acesso

#### **👨‍💻 Para Desenvolvedores**
1. [Arquitetura Técnica Completa](docs/ARQUITETURA_TECNICA_COMPLETA.md) - Visão técnica
2. [Arquitetura de Dados](docs/ARQUITETURA_DADOS_PROJETO_COMPLETA.md) - Setup e modelagem
3. [Módulos do Sistema](docs/MODULOS_SISTEMA_COMPLETO.md) - Padrões de código

#### **🚀 Para DevOps e Infraestrutura**
1. [Deploy Orquestrado Completo](docs/DEPLOY_ORQUESTRADO_COMPLETO.md) - Infraestrutura
2. [Arquitetura Técnica](docs/ARQUITETURA_TECNICA_COMPLETA.md) - Ambiente produção

## 💰 Planos e Licenciamento

### 🆓 **Plano Desenvolvimento** - Gratuito
*Para desenvolvimento e testes*

- ✅ Ambiente de desenvolvimento completo
- ✅ Usuários de teste pré-configurados
- ✅ Documentação técnica completa
- ✅ Suporte via GitHub Issues

### 📈 **Plano Enterprise** - Licenciamento
*Para organizações religiosas*

- ✅ Licença de uso comercial
- ✅ Suporte técnico especializado
- ✅ Customizações específicas
- ✅ Deploy em infraestrutura própria
- ✅ Treinamento e onboarding

## 🤝 Contribuição e Desenvolvimento

### Estrutura de Commits
```
feat: nova funcionalidade
fix: correção de bug
docs: documentação
style: formatação
refactor: refatoração
test: testes
perf: performance
chore: manutenção
```

### Fluxo de Desenvolvimento
1. **Fork** do repositório
2. **Branch** para feature: `git checkout -b feature/nova-funcionalidade`
3. **Commit** seguindo convenções
4. **Push** para o branch: `git push origin feature/nova-funcionalidade`
5. **Pull Request** com descrição detalhada

## 📞 Suporte e Contato

### 🆘 Suporte Técnico
- **🐛 Reportar Bug**: [GitHub Issues](https://github.com/melojrx/obreiro-digital-landing/issues)
- **💡 Sugestão**: Use as discussions do GitHub
- **📚 Documentação**: Consulte a pasta `/docs`
- **💬 Community**: Discord (em breve)

### 📧 Contato Comercial
- **Email**: contato@obreirovirtual.com.br
- **Website**: https://obreirovirtual.com.br
- **LinkedIn**: [Obreiro Virtual](https://linkedin.com/company/obreiro-virtual)

## ⚖️ Licença e Direitos Autorais

**© 2024-2025 Obreiro Digital. Todos os direitos reservados.**

Este software é **propriedade privada** e **confidencial**. O uso é regido pelos **Termos de Uso** e **Política de Privacidade** disponíveis em nosso website.

### 🛡️ Proteção Intelectual
Este projeto está protegido por direitos autorais e pode estar sujeito a patentes. Qualquer violação será perseguida nos termos da lei brasileira.

---

## 🎯 Status do Projeto

### 📈 **Versão Atual: 2.0.0** - **Enterprise Ready**

| Métrica | Status |
|---------|--------|
| **🏗️ Desenvolvimento** | 83% Concluído |
| **📚 Documentação** | 100% Atualizada |
| **🧪 Testes** | 90% Cobertura |
| **🚀 Deploy** | Produção Estável |
| **🔐 Segurança** | Enterprise Grade |

**Última atualização**: 16 de Agosto de 2025  
**Novo módulo**: Sistema de Gestão Hierárquica Enterprise  
**Próxima release**: Q1 2025 (Módulo Financeiro)  
**Contribuidores**: 3 desenvolvedores ativos

---

**🚀 Desenvolvido com excelência para revolucionar a gestão eclesiástica brasileira**

*Obreiro Digital - Modernizando igrejas com tecnologia enterprise desde 2024*

### 🌟 **Transformando a gestão eclesiástica com inovação e tecnologia de ponta**