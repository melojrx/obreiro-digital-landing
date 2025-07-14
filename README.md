# 🏛️ Obreiro Digital - Sistema de Gestão Eclesiástica

> **Plataforma completa e profissional para gestão moderna de igrejas e instituições religiosas**

[![Django](https://img.shields.io/badge/Django-5.2.3-green)](https://djangoproject.com/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-24.0-blue)](https://docker.com/)
[![Status](https://img.shields.io/badge/Status-Produção-success)](https://github.com/melojrx/obreiro-digital-landing)

## 📖 Sobre o Projeto

O **Obreiro Digital** é uma plataforma SaaS completa de gestão eclesiástica desenvolvida para modernizar a administração de igrejas brasileiras. Combina uma API robusta em Django com uma interface React moderna, oferecendo ferramentas profissionais para gestão completa de membros, visitantes, finanças, atividades e muito mais.

### ✨ Principais Diferenciais

- 🏛️ **Multi-denominacional**: Suporte completo a diferentes denominações e filiais
- 👥 **Gestão Completa de Membros**: Sistema hierárquico de permissões e criação de usuários
- 📱 **QR Code Inteligente**: Cadastro automático de visitantes (pioneiro no Brasil)
- 📊 **Analytics Avançado**: Relatórios de crescimento e métricas em tempo real
- 🔐 **Segurança Empresarial**: Sistema de permissões hierárquico com autenticação robusta
- 🌐 **API REST Completa**: Integração com qualquer sistema externo
- ☁️ **100% Cloud**: Acesso de qualquer lugar, sempre atualizado
- 🎨 **Interface Moderna**: UI/UX profissional com componentes shadcn/ui
- 🐳 **Containerizado**: Deploy com Docker Compose para dev/prod

## 🏗️ Arquitetura Técnica

```
ObreiroDigital/
├── 🔧 backend/                    # Django REST API
│   ├── apps/
│   │   ├── accounts/             # Sistema de autenticação e perfil
│   │   ├── churches/             # Gestão de igrejas e filiais
│   │   ├── denominations/        # Gestão de denominações
│   │   ├── members/              # Gestão completa de membros
│   │   ├── visitors/             # Gestão de visitantes com QR Code
│   │   ├── activities/           # Atividades e ministérios
│   │   ├── branches/             # Gestão de filiais
│   │   └── core/                 # Configurações centrais
│   ├── config/                   # Configurações Django
│   ├── docs/                     # Documentação completa da API
│   └── management/               # Comandos Django customizados
├── 🎨 frontend/                   # React + TypeScript
│   ├── src/
│   │   ├── components/           # Componentes reutilizáveis
│   │   ├── pages/                # Páginas da aplicação
│   │   ├── services/             # Integração com API
│   │   ├── hooks/                # Hooks customizados
│   │   └── lib/                  # Utilitários
│   └── public/                   # Arquivos estáticos
├── 🐳 docker/                     # Configurações Docker
│   ├── backend/                  # Dockerfile e scripts backend
│   ├── frontend/                 # Dockerfile frontend
│   └── nginx/                    # Configurações NGINX
├── 📜 scripts/                    # Scripts de automação
│   ├── deploy-prod.sh            # Deploy em produção
│   ├── backup.sh                 # Backup automatizado
│   ├── monitoring.sh             # Monitoramento do sistema
│   └── validate-gitignore.sh     # Validação de segurança
└── 📁 docs/                      # Documentação do projeto
```

## 🚀 Início Rápido

### 📋 Pré-requisitos

- **Docker** - Containerização
- **Docker Compose** - Orquestração de containers
- **Git** - Controle de versão

### 🐳 Método Recomendado: Docker Compose

#### 1️⃣ Clone e Configure

```bash
# Clone o repositório
git clone https://github.com/melojrx/obreiro-digital-landing.git
cd obreiro-digital-landing

# Configure o ambiente de desenvolvimento
cp .env_dev.example .env_dev
```

#### 2️⃣ Inicie o Ambiente de Desenvolvimento

```bash
# Inicie todos os serviços
docker-compose -f docker-compose.dev.yml up -d

# Acompanhe os logs
docker-compose -f docker-compose.dev.yml logs -f
```

#### 3️⃣ Acesse o Sistema

| Serviço | URL | Descrição |
|---------|-----|-----------|
| 🎨 **Frontend** | <http://localhost:5173> | Interface principal |
| 🔧 **Backend API** | <http://localhost:8000/api/v1/> | API REST |
| ⚙️ **Admin Django** | <http://localhost:8000/admin/> | Painel administrativo |
| 📚 **Swagger Docs** | <http://localhost:8000/api/schema/swagger-ui/> | Documentação da API |

### 🔐 Usuários de Teste

O sistema cria automaticamente usuários de teste para desenvolvimento:

| Papel | Email | Senha | Permissões |
|-------|-------|-------|------------|
| **Denominação Admin** | `denominacao.admin@teste.com` | `teste123` | Pode gerenciar todas as igrejas |
| **Igreja Admin** | `igreja.admin@teste.com` | `teste123` | Pode gerenciar a igreja sede |
| **Pastor** | `pastor@teste.com` | `teste123` | Pode gerenciar membros e atividades |
| **Secretário** | `secretario@teste.com` | `teste123` | Pode gerenciar cadastros |
| **Membro** | `membro@teste.com` | `teste123` | Visualização básica |

📋 **Documentação completa**: [`USUARIOS_TESTE.md`](USUARIOS_TESTE.md)

## 🔐 Sistema de Autenticação e Permissões

### Funcionalidades Implementadas

- ✅ **Login/Logout** com redirecionamento automático
- ✅ **Logout por inatividade** (30 minutos)
- ✅ **Sistema hierárquico de permissões** com 7 níveis
- ✅ **ProtectedRoute** para controle de acesso
- ✅ **Gestão de tokens** com localStorage
- ✅ **Validação automática** de sessões
- ✅ **Isolamento multi-tenant** por igreja

### Hierarquia de Permissões

```
SUPER_ADMIN (Nível 10)
    ↓
DENOMINATION_ADMIN (Nível 9)
    ↓
CHURCH_ADMIN (Nível 8)
    ↓
PASTOR (Nível 7)
    ↓
SECRETARY (Nível 6)
    ↓
LEADER (Nível 5)
    ↓
MEMBER (Nível 4)
    ↓
READ_ONLY (Nível 3)
```

## 📋 Funcionalidades Implementadas

### ✅ **Gestão Completa de Membros**

**Status**: **🟢 CONCLUÍDO**

- 👥 **CRUD Completo**: Criar, visualizar, editar e deletar membros
- 📊 **Dashboard Analytics**: Métricas em tempo real e KPIs
- 🔍 **Sistema de Filtros**: Busca avançada por múltiplos critérios
- 📱 **Upload de Fotos**: Sistema completo de upload com validação
- 🔐 **Criação de Usuários**: Transformar membros em usuários do sistema
- 📋 **Formulário em Abas**: Interface moderna e organizada
- 🏷️ **Sistema de Papéis**: Atribuição hierárquica de permissões
- 📄 **Exportação**: Relatórios em Excel/CSV
- 🔒 **Soft Delete**: Exclusão segura com possibilidade de restauração

**Documentação**: `backend/docs/Módulo de Membros - Guia Completo.md`

### ✅ **Sistema de Permissões Completo**

**Status**: **🟢 CONCLUÍDO**

- 🔐 **Hierarquia de 8 Níveis**: Do Super Admin ao Read-Only
- 🛡️ **Isolamento Multi-Tenant**: Dados separados por igreja
- ⚖️ **Validação Dupla**: Frontend + Backend
- 🔄 **Atribuição Dinâmica**: Usuários só atribuem papéis inferiores
- 📋 **Endpoint Específico**: `/auth/available-roles/`
- 🔍 **Preview de Permissões**: Interface mostra o que cada papel pode fazer
- 📊 **Auditoria Completa**: Logs de todas as ações

**Documentação**: `backend/docs/Sistema de Permissões e Papéis - Guia Completo.md`

### ✅ **Gestão de Perfil Completa**

**Status**: **🟢 CONCLUÍDO**

- 👤 **Dados Pessoais**: Nome, email, telefone, biografia com validações
- ⛪ **Dados da Igreja**: CNPJ, endereço com busca automática por CEP
- 📸 **Upload de Avatar**: Com preview, validação e processamento automático
- 🔐 **Configurações de Segurança**: Alteração de senha com indicador de força
- ⚠️ **Danger Zone**: Exclusão de conta com confirmação dupla
- 🎨 **Interface Moderna**: Gradientes e componentes profissionais
- ✅ **Validações Zod**: Feedback em tempo real
- 📱 **Máscaras Automáticas**: Telefone, CPF, CNPJ, CEP

**Documentação**: `backend/docs/Módulo de Gestão de Perfil.md`

### 🔄 **Em Desenvolvimento**

#### 🏛️ **Gestão Completa de Igrejas e Filiais**

**Status**: **🟡 EM DESENVOLVIMENTO**

- ⛪ **CRUD de Igrejas**: Cadastro completo com dados administrativos
- 🏢 **Gestão de Filiais**: Sistema hierárquico igreja-sede → filiais
- 📊 **Dashboard por Igreja**: Métricas específicas de cada unidade
- 📈 **Relatórios Consolidados**: Visão geral da denominação
- 🔗 **Transferência de Membros**: Entre igrejas e filiais
- 💰 **Gestão Financeira**: Orçamentos e transferências

#### 📱 **On-Boarding de Visitantes com QR Code**

**Status**: **🟡 EM DESENVOLVIMENTO**

- 📱 **QR Code Único**: Geração automática por igreja
- 📝 **Cadastro Simplificado**: Formulário otimizado para mobile
- 🔔 **Notificações**: Alertas em tempo real para líderes
- 📊 **Dashboard de Visitantes**: Métricas de conversão
- 🎯 **Follow-up Automático**: Sistema de acompanhamento
- 📧 **Email Marketing**: Campanhas automatizadas

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
- **PostgreSQL** - Banco de dados principal
- **SQLite** - Desenvolvimento local
- **Token Authentication** - Sistema de autenticação
- **Pillow** - Processamento de imagens
- **drf-spectacular** - Documentação automática da API

### Frontend
- **React 18** - Biblioteca JavaScript
- **TypeScript** - Tipagem estática
- **Vite** - Build tool moderna
- **Tailwind CSS** - Framework CSS utilitário
- **shadcn/ui** - Componentes UI profissionais
- **React Router** - Roteamento SPA
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de esquemas
- **Sonner** - Sistema de notificações

### DevOps & Qualidade
- **Git** - Controle de versão
- **ESLint** - Linting JavaScript/TypeScript
- **Prettier** - Formatação de código
- **Docker** - Containerização (planejado)
- **CI/CD** - Deploy automatizado (planejado)

## 📊 Métricas do Projeto

### 📈 Estatísticas de Desenvolvimento

- **📁 Arquivos**: 200+ arquivos de código
- **📝 Linhas de Código**: 50.000+ linhas
- **🔧 Endpoints API**: 40+ endpoints
- **🎨 Componentes React**: 80+ componentes
- **📚 Documentação**: 15+ documentos técnicos
- **🧪 Cobertura de Testes**: 85%+ (meta)

### 🎯 Funcionalidades por Status

| Status | Quantidade | Percentual |
|--------|------------|------------|
| ✅ **Concluído** | 3 módulos | 25% |
| 🟡 **Em Desenvolvimento** | 2 módulos | 17% |
| 🔴 **Planejado** | 7 módulos | 58% |

## 🔄 Roadmap de Desenvolvimento

### 📅 Q1 2025 (Janeiro - Março)

- ✅ ~~Gestão Completa de Membros~~
- ✅ ~~Sistema de Permissões~~
- ✅ ~~Gestão de Perfil~~
- 🔄 **Gestão de Igrejas e Filiais**
- 🔄 **On-Boarding com QR Code**

### 📅 Q2 2025 (Abril - Junho)

- 🔴 **Módulo Financeiro**
- 🔴 **Módulo de Atividades**
- 🔴 **Sistema de Alertas**

### 📅 Q3 2025 (Julho - Setembro)

- 🔴 **Módulo de Mensagens**
- 🔴 **Relatórios Avançados**
- 🔴 **App Mobile (React Native)**

### 📅 Q4 2025 (Outubro - Dezembro)

- 🔴 **Módulo de Devocionais**
- 🔴 **Configurações e Personalizações**
- 🔴 **Integrações Externas**

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
perf: melhorias de performance
```

### Comandos Úteis

```bash
# Backend
python manage.py makemigrations  # Criar migrações
python manage.py migrate         # Aplicar migrações
python manage.py runserver       # Executar servidor
python manage.py test           # Executar testes
python manage.py shell          # Shell Django

# Frontend
npm run dev                      # Servidor desenvolvimento
npm run build                    # Build produção
npm run preview                  # Preview build
npm run lint                     # Verificar código
npm run type-check              # Verificar tipos
```

### 📁 Documentação Técnica

- **📋 Módulo de Membros**: `backend/docs/Módulo de Membros - Guia Completo.md`
- **🔐 Sistema de Permissões**: `backend/docs/Sistema de Permissões e Papéis - Guia Completo.md`
- **👤 Gestão de Perfil**: `backend/docs/Módulo de Gestão de Perfil.md`
- **🏗️ Bootstrap do Projeto**: `backend/docs/Bootstrap do projeto Django.md`
- **📊 Análise Técnica**: `backend/docs/ANÁLISE TÉCNICA - PLATAFORMA SAAS - OBREIRO DIGITAL.md`

## 💰 Planos e Preços

### 🆓 **Plano Gratuito** - R$ 0/mês
*Ideal para igrejas pequenas*

- ✅ Até 60 membros cadastrados
- ✅ Comunicação e engajamento básicos
- ✅ Gestão de eventos simples
- ✅ Relatórios mensais
- ✅ Suporte por e-mail

### 📈 **Plano Crescimento** - R$ 99/mês ⭐ *Mais Popular*
*Perfeito para igrejas em expansão*

- ✅ Até 500 membros cadastrados
- ✅ Comunicação e engajamento avançados
- ✅ Gestão completa de eventos e ministérios
- ✅ Relatórios semanais e dashboards
- ✅ Suporte prioritário por WhatsApp
- ✅ Gestão financeira básica
- ✅ Personalizações no sistema
- ✅ Ferramentas de IA para postagens automáticas

### 🏛️ **Plano Ministério** - R$ 199/mês
*Para igrejas de médio e grande porte*

- ✅ Membros ilimitados
- ✅ Todas as funcionalidades de comunicação
- ✅ Gestão completa de eventos e ministérios
- ✅ Relatórios personalizados e em tempo real
- ✅ Suporte VIP 24/7
- ✅ Gestão financeira completa
- ✅ Personalizações avançadas no sistema
- ✅ Pacotes de funcionalidades personalizadas

---

## 🎯 Diferenciais Competitivos

### 🚀 Tecnológicos

- **🏗️ Arquitetura Moderna**: Separação clara entre API e Frontend
- **📱 Mobile-First**: Design responsivo e PWA
- **⚡ Performance**: Otimizações avançadas de carregamento
- **🔒 Segurança**: Autenticação robusta e isolamento de dados
- **🔌 Integrável**: API REST completa para integrações
- **☁️ Escalável**: Arquitetura preparada para crescimento

### 💼 Funcionais

- **🎯 Específico para Igrejas**: Desenvolvido especificamente para o contexto eclesiástico brasileiro
- **👥 Gestão Hierárquica**: Sistema de permissões que respeita a estrutura da igreja
- **📱 QR Code Inovador**: Primeira plataforma brasileira com cadastro automático de visitantes
- **📊 Analytics Eclesiástico**: Métricas e KPIs específicos para crescimento da igreja
- **🔄 Multi-denominacional**: Suporte a diferentes denominações e tradições

## 📞 Suporte e Contato

Para suporte técnico ou dúvidas sobre o sistema:

- 📧 **Email**: contato@obreirovirtual.com.br
- 📞 **Telefone**: (11) 3000-0000
- 🌐 **Website**: https://obreirovirtual.com.br
- 💬 **WhatsApp**: (11) 99999-9999
- 📱 **Telegram**: @obreirovirtual

### 🆘 Suporte Técnico

- **🐛 Reportar Bug**: Abra uma issue no GitHub
- **💡 Sugestão**: Use o formulário de feedback
- **📚 Documentação**: Consulte a pasta `/docs`
- **🎥 Tutoriais**: Canal no YouTube (em breve)

## ⚖️ Licença e Direitos Autorais

**© 2024-2025 Obreiro Virtual. Todos os direitos reservados.**

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

---

### 📈 Status Atual: **Versão 1.3.0** - **Produção Estável**

**Última atualização**: Janeiro 2025  
**Próxima release**: Fevereiro 2025 (Gestão de Igrejas)  
**Contribuidores**: 3 desenvolvedores ativos
