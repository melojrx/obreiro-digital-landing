# 🧩 Módulos do Sistema - Obreiro Digital
## Guia Completo dos Módulos Implementados

### 📋 Índice
1. [Visão Geral dos Módulos](#visão-geral-dos-módulos)
2. [Módulo de Membros](#módulo-de-membros)
3. [Módulo de Visitantes](#módulo-de-visitantes)
4. [Módulo de Gestão de Perfil](#módulo-de-gestão-de-perfil)
5. [Módulo de Gestão Hierárquica](#módulo-de-gestão-hierárquica)
6. [Integração entre Módulos](#integração-entre-módulos)
7. [Padrões Arquiteturais](#padrões-arquiteturais)

---

## 🎯 Visão Geral dos Módulos

O **Obreiro Digital** é estruturado em módulos especializados que trabalham de forma integrada para oferecer uma solução completa de gestão eclesiástica. Cada módulo segue os mesmos padrões arquiteturais e de design, garantindo consistência e qualidade em toda a plataforma.

### **Módulos Principais**
```
🏛️ GESTÃO HIERÁRQUICA    → Denominações, Igrejas e Filiais
👥 GESTÃO DE MEMBROS      → CRUD completo com sistema de usuários
📱 GESTÃO DE VISITANTES   → QR Code, registro público e conversão
👤 GESTÃO DE PERFIL       → Dados pessoais, igreja e segurança
```

### **Características Comuns**
- ✅ **Multi-tenant**: Isolamento completo de dados por igreja
- ✅ **Permissões hierárquicas**: Controle granular baseado em papéis
- ✅ **API REST completa**: Documentada e versionada
- ✅ **Interface responsiva**: Mobile-first design
- ✅ **Validações robustas**: Frontend (Zod) + Backend (Django)
- ✅ **Design system**: Componentes Shadcn/UI consistentes

---

## 👥 Módulo de Membros

### **🎯 Objetivo**
Gerenciamento completo dos membros da igreja com sistema integrado de criação de usuários do sistema administrativo.

### **⭐ Funcionalidades Principais**

#### **1. CRUD Completo de Membros**
- **Dashboard analítico** com KPIs em tempo real
- **Formulário em abas**: Dados pessoais, contato, eclesiásticos e sistema
- **Filtros avançados**: Status, gênero, função ministerial
- **Upload de fotos** com preview e validação
- **Soft delete** com histórico preservado

#### **2. Sistema de Criação de Usuários** ⭐
**Funcionalidade Crítica** que permite transformar membros em usuários do sistema:

```typescript
// Fluxo de criação
Membro Comum → [Opção: Criar Usuário] → Usuário do Sistema
     ↓                    ↓                       ↓
   Member           Validações           CustomUser + ChurchUser
                   Hierárquicas
```

**Validações de Segurança:**
- ✅ Usuário só pode atribuir papéis **inferiores** ao seu
- ✅ Email deve ser **único** no sistema
- ✅ Senha deve atender **critérios de segurança**
- ✅ Igreja do membro vinculada **automaticamente**

**Hierarquia de Papéis:**
```
SUPER_ADMIN (Plataforma)
    ↓
DENOMINATION_ADMIN (Cliente Premium)
    ↓
CHURCH_ADMIN (Cliente Básico)
    ↓
PASTOR → SECRETARY → LEADER → MEMBER
```

#### **3. Analytics e Relatórios**
- **Dashboard KPIs**: Total, ativos, crescimento mensal
- **Distribuições**: Por status, gênero, idade, função
- **Exportação**: Excel/CSV com dados filtrados

### **🔗 Endpoints Principais**
```http
GET    /api/v1/members/                     # Listar com filtros
POST   /api/v1/members/                     # Criar (+ usuário opcional)
GET    /api/v1/members/{id}/profile/        # Perfil completo
GET    /api/v1/members/dashboard/           # Dashboard KPIs
GET    /api/v1/auth/available-roles/        # Papéis disponíveis
```

### **🎨 Interface**
- **Páginas**: Listagem, cadastro (abas), detalhes, edição
- **Componentes**: MembersTable, MemberForm, SystemUserSection
- **Hooks**: useMembers, useRoleHierarchy, usePermissions

### **🔒 Segurança**
- **Multi-tenant** por igreja
- **Validação hierárquica** de papéis
- **Auditoria completa** de criação de usuários
- **Prevenção de escalação** de privilégios

---

## 📱 Módulo de Visitantes

### **🎯 Objetivo**
Sistema completo de captação, registro e gestão de visitantes através de QR Codes únicos por filial.

### **⭐ Funcionalidades Principais**

#### **1. Sistema QR Code Inteligente**
- **QR Code único** por filial/igreja
- **Regeneração** com invalidação automática dos códigos antigos
- **Ativação/desativação** por filial
- **URL pública**: `https://obreiro.digital/visit/{uuid}`

#### **2. Registro Público de Visitantes**
- **Interface responsiva** mobile-first
- **Registro sem login** através do QR Code
- **Validação em tempo real** do código
- **Integração ViaCEP** para preenchimento automático
- **Máscaras automáticas** (CPF, telefone, CEP)

#### **3. Gestão Administrativa Completa**
- **Dashboard** com estatísticas por filial
- **Lista de visitantes** com filtros avançados
- **Detalhes completos** do visitante
- **Sistema de follow-up** com status
- **Conversão para membro** com histórico

#### **4. Analytics Avançado**
- **Taxa de conversão** visitante → membro
- **Eficiência por QR Code** (filial)
- **Origem do cadastro** (QR Code, manual, admin)
- **Status de follow-up** consolidado

### **🔗 Endpoints Principais**
```http
# Públicos (sem autenticação)
GET    /api/v1/visitors/public/qr/{uuid}/validate/    # Validar QR
POST   /api/v1/visitors/public/qr/{uuid}/register/    # Registrar

# Administrativos
GET    /api/v1/visitors/admin/visitors/               # Listar
GET    /api/v1/visitors/admin/visitors/stats/         # Estatísticas
PATCH  /api/v1/visitors/admin/visitors/{id}/convert/  # Converter
POST   /api/v1/branches/{id}/regenerate_qr_code/      # Regenerar QR
```

### **🎨 Interface**
- **Páginas**: Registro público, listagem admin, detalhes, edição, QR Codes
- **Componentes**: VisitorsTable, VisitorForm, QRCodeCard, VisitorStats
- **Hooks**: useVisitors, useQRCode

### **🔒 Segurança**
- **Rate limiting** em endpoints públicos
- **Validação UUID** do QR Code
- **IP tracking** para auditoria
- **Multi-tenant** por igreja

### **📊 Métricas de Sucesso**
- ✅ Taxa de conclusão de registro > 80%
- ✅ Tempo médio de registro < 2 min
- ✅ Taxa de conversão > 20%
- ✅ Performance < 3s carregamento

---

## 👤 Módulo de Gestão de Perfil

### **🎯 Objetivo**
Interface completa para usuários gerenciarem dados pessoais, informações da igreja e configurações de segurança.

### **⭐ Funcionalidades Principais**

#### **1. Gestão de Dados Pessoais**
- **Interface moderna** com gradientes azul/indigo
- **Validações em tempo real** usando Zod
- **Máscaras automáticas** para formatação
- **Upload de avatar** com processamento automático

**Campos disponíveis:**
- Nome completo, email (único), telefone
- Data de nascimento, gênero
- Biografia (máx. 500 caracteres)

#### **2. Gestão de Dados da Igreja**
- **Interface moderna** com gradientes verde/emerald
- **Busca automática** de endereço por CEP
- **Validações específicas** para CNPJ

**Campos disponíveis:**
- Nome da igreja, CNPJ, email, telefone
- Endereço completo com busca por CEP

#### **3. Upload e Processamento de Avatar**
- **Tipos aceitos**: JPEG, PNG, GIF, WebP
- **Tamanho máximo**: 5MB
- **Redimensionamento**: 300x300px
- **Cache-busting** para atualizações

#### **4. Configurações de Segurança**
- **Alteração de senha** com validações robustas
- **Indicador de força** em tempo real
- **Checklist de requisitos** da senha
- **Toggle de visibilidade** para campos

#### **5. Danger Zone - Exclusão de Conta**
- **Confirmação dupla** obrigatória
- **Validação de senha** para segurança
- **Limpeza completa** de dados
- **Processo irreversível** com avisos

### **🔗 Endpoints Principais**
```http
GET    /api/v1/users/me/                      # Dados do usuário
PATCH  /api/v1/users/update_personal_data/    # Dados pessoais
PATCH  /api/v1/users/update_church_data/      # Dados da igreja
POST   /api/v1/users/upload-avatar/           # Upload avatar
DELETE /api/v1/users/delete-account/          # Deletar conta
GET    /api/v1/core/cep/<cep>/               # Buscar CEP
```

### **🎨 Interface**
- **Abas organizadas**: Dados pessoais, igreja, segurança
- **Design consistente** com paleta de cores específica
- **Responsividade completa** mobile-first
- **Feedback visual** para todas as ações

### **🔒 Segurança**
- **Autenticação obrigatória** para todos endpoints
- **Validação de propriedade** dos dados
- **Sanitização de inputs** no backend
- **Transações atômicas** para integridade

---

## 🏛️ Módulo de Gestão Hierárquica

### **🎯 Objetivo**
Gestão completa da hierarquia organizacional: Denominação → Igreja → Filiais com controle granular de permissões.

### **⭐ Funcionalidades Principais**

#### **1. Dashboard de Denominação**
- **Estatísticas consolidadas** de todas as igrejas
- **Crescimento mensal/anual** por região
- **Mapa de distribuição** geográfica
- **Performance por igreja** com comparações

#### **2. CRUD Completo de Igrejas**
- **36 endpoints especializados** (CRUD + funcionalidades)
- **Formulário completo** com validações
- **Upload de logo** e imagem de capa
- **Atribuição de administradores**

#### **3. Gestão de Filiais**
- **QR Code único** por filial
- **Designação de responsáveis**
- **Dashboard específico** por filial
- **Regeneração de códigos** quando necessário

#### **4. Sistema de Permissões Hierárquicas**
- **4 novos níveis** de permissão específicos
- **Controle granular** por funcionalidade
- **Isolamento multi-tenant** rigoroso

### **🔗 Endpoints Principais**
```http
# Denominações (APENAS Platform/Denomination Admins)
GET    /api/v1/denominations/                          # Listar
GET    /api/v1/denominations/{id}/dashboard_data/      # Dashboard
POST   /api/v1/denominations/{id}/create_church/       # Criar igreja

# Igrejas (36 endpoints especializados)
GET    /api/v1/churches/                               # Listar
POST   /api/v1/churches/                               # Criar
GET    /api/v1/churches/my-churches/                   # Do usuário
POST   /api/v1/churches/{id}/assign-admin/             # Atribuir admin

# Filiais
POST   /api/v1/branches/{id}/regenerate_qr_code/       # Regenerar QR
GET    /api/v1/branches/{id}/dashboard/                # Dashboard filial
```

### **🎨 Interface**
- **Dashboard específico** para denominação
- **Gestão de igrejas** com interface completa
- **Componentes especializados**: ChurchCard, HierarchyView
- **Navegação hierárquica** intuitiva

### **🔒 Permissões Específicas**
```typescript
// Apenas Denomination Admin vê sidebar hierárquica
permissions.canManageDenomination || permissions.canCreateChurches

// Matriz de acesso por papel
DENOMINATION_ADMIN: ✅ Gestão completa
CHURCH_ADMIN:       👁️ Visualização limitada
PASTOR/OTHERS:      ❌ Sem acesso hierárquico
```

---

## 🔗 Integração entre Módulos

### **1. Fluxo Visitante → Membro → Usuário**
```
Visitante (QR Code) → Conversão → Membro → Criação de Usuário → Acesso ao Sistema
      ↓                   ↓          ↓            ↓                 ↓
Módulo Visitantes → Módulo Membros → Sistema de Usuários → Gestão de Perfil
```

### **2. Hierarquia Organizacional**
```
Denominação → Igreja → Filiais → QR Codes → Visitantes → Membros
     ↓           ↓        ↓         ↓           ↓          ↓
Gestão Hier. → Membros → Visitantes → Conversões → Usuários → Perfil
```

### **3. Sistema de Permissões Unificado**
Todos os módulos utilizam o mesmo sistema de permissões baseado em:
- **ChurchUser**: Vínculo usuário-igreja com papel
- **RoleChoices**: Hierarquia de papéis padronizada
- **Permissões granulares**: Controle específico por funcionalidade

### **4. APIs Integradas**
```python
# Endpoints compartilhados
/api/v1/auth/available-roles/     # Usado por Membros e outros
/api/v1/users/me/                 # Usado por Perfil e Dashboard
/api/v1/core/cep/{cep}/          # Usado por Membros, Visitantes, Perfil
```

---

## 🏗️ Padrões Arquiteturais

### **Backend (Django)**
```python
# Estrutura padrão de módulo
apps/{modulo}/
├── models.py          # Modelos com BaseModel
├── serializers.py     # Validações e serialização
├── views.py           # ViewSets com permissões
├── urls.py            # Roteamento específico
├── permissions.py     # Permissões customizadas
└── tests.py          # Testes automatizados
```

### **Frontend (React + TypeScript)**
```typescript
// Estrutura padrão de módulo
src/{modulo}/
├── pages/            # Páginas principais
├── components/       # Componentes específicos
├── hooks/           # Lógica de negócio
├── services/        # APIs e integrações
└── types/          # Interfaces TypeScript
```

### **Padrões de Desenvolvimento**

#### **1. Multi-tenant por Igreja**
```python
class TenantManager(models.Manager):
    def get_queryset(self):
        # Filtro automático por igreja
        return super().get_queryset().filter(church=request.church)
```

#### **2. Permissões Hierárquicas**
```python
class IsChurchAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.church_users.filter(
            role__in=[RoleChoices.CHURCH_ADMIN, RoleChoices.DENOMINATION_ADMIN]
        ).exists()
```

#### **3. Validações Duplas**
```typescript
// Frontend (Zod)
const schema = z.object({
  full_name: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
});

// Backend (Django)
def validate_email(self, value):
    if User.objects.filter(email=value).exists():
        raise ValidationError('Email já existe')
```

#### **4. Design System Consistente**
```typescript
// Componentes Shadcn/UI padronizados
import { Button, Card, Input, Select } from '@/components/ui'

// Hooks personalizados reutilizáveis
const useAuth = () => { /* lógica de autenticação */ }
const usePermissions = () => { /* lógica de permissões */ }
```

### **Convenções de Nomenclatura**

#### **URLs/Rotas**
```
# Frontend
/{modulo}              # Lista principal
/{modulo}/novo         # Criação
/{modulo}/:id          # Detalhes
/{modulo}/:id/editar   # Edição

# Backend API
/api/v1/{modulo}/      # CRUD básico
/api/v1/{modulo}/admin/  # Endpoints administrativos
/api/v1/{modulo}/public/ # Endpoints públicos
```

#### **Componentes**
```typescript
// Páginas: {Modulo}Page.tsx
MembersPage.tsx, VisitorsPage.tsx

// Componentes: {Modulo}{Funcao}.tsx
MemberForm.tsx, VisitorCard.tsx

// Hooks: use{Modulo}.tsx
useMembers.tsx, useVisitors.tsx
```

---

## 📊 Métricas e Qualidade

### **Código Implementado**
- **Backend**: ~2.000 linhas (4 módulos)
- **Frontend**: ~5.000 linhas (interfaces + lógica)
- **APIs**: 50+ endpoints especializados
- **Componentes**: 30+ componentes reutilizáveis

### **Qualidade de Código**
- ✅ **TypeScript Strict**: 100%
- ✅ **Design System**: 100% consistente
- ✅ **Responsividade**: Mobile-first
- ✅ **Acessibilidade**: WCAG 2.1
- ✅ **Performance**: Lazy loading + Memoização

### **Cobertura de Funcionalidades**
- ✅ **Membros**: CRUD + Sistema de usuários
- ✅ **Visitantes**: QR Code + Registro público
- ✅ **Perfil**: Dados pessoais + Segurança
- ✅ **Hierárquico**: Denominação + Igrejas + Filiais

---

## 🚀 Status e Próximos Passos

### **✅ Módulos Completamente Implementados**
1. ✅ **Módulo de Membros** - 100% funcional
2. ✅ **Módulo de Visitantes** - 100% funcional
3. ✅ **Módulo de Gestão de Perfil** - 100% funcional
4. ✅ **Módulo de Gestão Hierárquica** - 100% funcional

### **🔄 Integrações Funcionais**
- ✅ Sistema de permissões unificado
- ✅ Multi-tenancy por igreja
- ✅ APIs REST padronizadas
- ✅ Design system consistente
- ✅ Fluxos integrados visitante → membro → usuário

### **🎯 Próximas Funcionalidades (Opcionais)**
- [ ] **Módulo Financeiro**: Dízimos, ofertas, relatórios contábeis
- [ ] **Módulo de Atividades**: Eventos, ministérios, participação
- [ ] **Módulo de Comunicação**: Notificações, mensagens, campanhas
- [ ] **Módulo de Relatórios**: Analytics avançado, dashboards executivos

---

## 🎉 Conclusão

O **Obreiro Digital** oferece um **conjunto completo de módulos integrados** para gestão eclesiástica, implementados com:

✅ **Arquitetura sólida**: Multi-tenant, APIs REST, design system  
✅ **Funcionalidades completas**: CRUD, permissões, analytics, integração  
✅ **Qualidade profissional**: TypeScript, validações, responsividade  
✅ **Segurança rigorosa**: Isolamento, hierarquia, auditoria  
✅ **Experiência moderna**: Interface intuitiva, performance otimizada  

**O sistema está pronto para produção e oferece a base sólida para crescimento futuro com novos módulos e funcionalidades.**

---

**Documento criado em:** 16 de Agosto de 2025  
**Versão:** 1.0 Consolidada  
**Status:** ✅ Produção Ready  
**Mantenedor:** Equipe Obreiro Digital  
**Próxima revisão:** Pós-implementação de novos módulos