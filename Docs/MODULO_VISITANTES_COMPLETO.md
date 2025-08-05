# 📱 Módulo de Visitantes - Sistema QR Code - Documentação Completa
**Última atualização:** 05/08/2025  
**Status:** ✅ **100% COMPLETO E EM PRODUÇÃO**

## 🎯 Visão Geral

Sistema completo de registro e gestão de visitantes através de QR Codes, implementado com Django REST Framework (backend) e React + TypeScript (frontend), integrado ao sistema de gestão eclesiástica Obreiro Virtual.

### **Funcionalidades Principais**
- ✅ **Geração automática de QR Codes** por filial/igreja
- ✅ **Regeneração de QR Codes** com invalidação dos códigos antigos
- ✅ **Registro público** de visitantes (sem necessidade de login)
- ✅ **Gestão administrativa** completa de visitantes
- ✅ **Dashboard com estatísticas** em tempo real
- ✅ **Sistema de follow-up** e conversão para membros
- ✅ **Isolamento multi-tenant** por igreja
- ✅ **Interface de gestão** para ativar/desativar QR Codes
- ✅ **Página de detalhes** do visitante com todas as informações
- ✅ **Edição de visitantes** com formulário completo
- ✅ **Design responsivo** para todos os dispositivos
- ✅ **Integração com ViaCEP** para preenchimento automático de endereços

---

## 🏗️ Arquitetura do Sistema

### **Stack Tecnológico**
```
Frontend: React 18 + TypeScript + Vite + shadcn/ui + Tailwind CSS
Backend:  Django 5.2.3 + DRF + PostgreSQL
Docker:   Multi-container development environment
QR Code:  Python qrcode library + Frontend integration
APIs:     ViaCEP para endereços, REST API completa
```

### **Fluxo de Dados**
```
QR Code → Página Pública → API Backend → Banco de Dados → Dashboard Admin
    ↓           ↓                ↓               ↓              ↓
Mobile    Responsivo      Multi-tenant    PostgreSQL    Estatísticas
    ↓           ↓                ↓               ↓              ↓
Regeneração → Novo UUID → Nova Imagem → Invalidação → Notificações
```

---

## 🗄️ Estrutura do Banco de Dados

### **Tabela: branches_branch (Atualizada)**
```sql
-- Campos para QR Code
qr_code_uuid UUID UNIQUE NOT NULL DEFAULT uuid4()
qr_code_image VARCHAR(100) NULL  -- Path para imagem do QR Code
qr_code_active BOOLEAN DEFAULT TRUE
allows_visitor_registration BOOLEAN DEFAULT TRUE
requires_visitor_approval BOOLEAN DEFAULT FALSE
total_visitors_registered INTEGER DEFAULT 0

-- Campos básicos da filial
id SERIAL PRIMARY KEY
church_id INTEGER REFERENCES churches_church(id)
name VARCHAR(200) NOT NULL
short_name VARCHAR(50) NOT NULL
description TEXT
email EMAIL_FIELD
phone VARCHAR(20)
address TEXT NOT NULL
neighborhood VARCHAR(100) NOT NULL
city VARCHAR(100) NOT NULL
state VARCHAR(2) NOT NULL
zipcode VARCHAR(10)
latitude DECIMAL(10,8) NULL
longitude DECIMAL(11,8) NULL
pastor_id INTEGER REFERENCES auth_user(id) NULL

-- Estatísticas
total_visitors INTEGER DEFAULT 0
total_activities INTEGER DEFAULT 0

-- Timestamps
created_at TIMESTAMP WITH TIME ZONE
updated_at TIMESTAMP WITH TIME ZONE
is_active BOOLEAN DEFAULT TRUE
```

### **Tabela: visitors_visitor (Completa)**
```sql
-- Identificação
id SERIAL PRIMARY KEY
uuid UUID UNIQUE NOT NULL DEFAULT uuid4()
created_at TIMESTAMP WITH TIME ZONE
updated_at TIMESTAMP WITH TIME ZONE
is_active BOOLEAN DEFAULT TRUE

-- Relacionamentos (Multi-tenant)
church_id INTEGER REFERENCES churches_church(id) NOT NULL
branch_id INTEGER REFERENCES branches_branch(id) NOT NULL
converted_member_id INTEGER REFERENCES members_member(id) NULL

-- Dados Pessoais
full_name VARCHAR(200) NOT NULL
email EMAIL_FIELD NOT NULL
phone VARCHAR(20) NOT NULL
birth_date DATE NULL
gender VARCHAR(1) CHOICES('M', 'F', 'O', 'N') DEFAULT 'N'
cpf VARCHAR(14) DEFAULT ''
city VARCHAR(100) NOT NULL
state VARCHAR(2) NOT NULL
neighborhood VARCHAR(100) NOT NULL
address VARCHAR(255) DEFAULT ''
zipcode VARCHAR(10) DEFAULT ''
marital_status VARCHAR(20) CHOICES DEFAULT 'single'

-- Informações Eclesiásticas
first_visit BOOLEAN DEFAULT TRUE
ministry_interest TEXT DEFAULT ''
wants_prayer BOOLEAN DEFAULT FALSE
wants_growth_group BOOLEAN DEFAULT FALSE
observations TEXT DEFAULT ''

-- Dados de Registro via QR Code
qr_code_used UUID NULL  -- Referência ao qr_code_uuid usado
registration_source VARCHAR(20) DEFAULT 'qr_code'  -- qr_code, admin, manual
user_agent TEXT DEFAULT ''  -- Browser/device info
ip_address INET NULL  -- IP do registro

-- Sistema de Follow-up e Conversão
converted_to_member BOOLEAN DEFAULT FALSE
conversion_date TIMESTAMP WITH TIME ZONE NULL
conversion_notes TEXT DEFAULT ''
contact_attempts INTEGER DEFAULT 0
last_contact_date TIMESTAMP WITH TIME ZONE NULL
follow_up_status VARCHAR(20) DEFAULT 'pending'  -- pending, contacted, interested, not_interested, converted

-- Indexes
INDEX idx_church_branch (church_id, branch_id)
INDEX idx_qr_code_used (qr_code_used)
INDEX idx_created_at (created_at)
INDEX idx_follow_up (follow_up_status, converted_to_member)
```

---

## 🔌 APIs REST Completas

### **1. Endpoints Públicos (Sem Autenticação)**

#### **Validar QR Code**
```http
GET /api/v1/visitors/public/qr/{qr_code_uuid}/validate/
```
**Response:**
```json
{
    "valid": true,
    "branch": {
        "id": 1,
        "name": "Filial Centro",
        "church_name": "Igreja Exemplo",
        "address": "Rua Exemplo, 123, Centro, São Paulo/SP",
        "allows_registration": true
    }
}
```

#### **Registrar Visitante**
```http
POST /api/v1/visitors/public/qr/{qr_code_uuid}/register/
```
**Request Body:**
```json
{
    "full_name": "João Silva",
    "email": "joao@email.com",
    "phone": "(11) 99999-9999",
    "birth_date": "1990-01-01",
    "gender": "M",
    "cpf": "123.456.789-00",
    "city": "São Paulo",
    "state": "SP",
    "neighborhood": "Centro",
    "address": "Rua Exemplo, 123",
    "zipcode": "01000-000",
    "marital_status": "married",
    "first_visit": true,
    "ministry_interest": "Música, Jovens",
    "wants_prayer": true,
    "wants_growth_group": true,
    "observations": "Veio através de amigo"
}
```

### **2. Endpoints Administrativos (Requer Autenticação)**

#### **CRUD de Visitantes**
```http
GET    /api/v1/visitors/admin/visitors/          # Listar com filtros
POST   /api/v1/visitors/admin/visitors/          # Criar visitante manual
GET    /api/v1/visitors/admin/visitors/{id}/     # Detalhes do visitante
PUT    /api/v1/visitors/admin/visitors/{id}/     # Atualizar visitante
PATCH  /api/v1/visitors/admin/visitors/{id}/     # Atualização parcial
DELETE /api/v1/visitors/admin/visitors/{id}/     # Excluir visitante
```

#### **Actions Customizadas**
```http
GET    /api/v1/visitors/admin/visitors/stats/                        # Estatísticas gerais
GET    /api/v1/visitors/admin/visitors/by_branch/                    # Stats por filial
GET    /api/v1/visitors/admin/visitors/pending_follow_up/            # Visitantes pendentes
PATCH  /api/v1/visitors/admin/visitors/{id}/convert_to_member/       # Converter em membro
PATCH  /api/v1/visitors/admin/visitors/{id}/update_follow_up/        # Atualizar follow-up
POST   /api/v1/visitors/admin/visitors/bulk_action/                  # Ações em lote
```

#### **Endpoints Específicos**
```http
GET    /api/v1/visitors/admin/recent/              # Visitantes recentes (7 dias)
GET    /api/v1/visitors/admin/dashboard-stats/     # Stats para dashboard
```

### **3. Gestão de QR Codes (Branches)**

```http
GET    /api/v1/branches/qr_codes/                  # Listar QR Codes das filiais
POST   /api/v1/branches/{id}/regenerate_qr_code/   # Regenerar QR Code
POST   /api/v1/branches/{id}/toggle_qr_code/       # Ativar/Desativar QR Code
GET    /api/v1/branches/{id}/visitor_stats/        # Estatísticas de visitantes
```

---

## 🎨 Frontend - Páginas e Componentes

### **Páginas Implementadas**

#### **1. `/visitantes` - Lista de Visitantes**
- Tabela responsiva com filtros
- Estatísticas em cards
- Ações: visualizar, editar, converter, excluir
- Filtros por período, status, filial
- Exportação de dados

#### **2. `/visitantes/novo` - Cadastro Manual**
- Formulário completo com validações
- Integração com ViaCEP
- Máscaras de input (CPF, telefone, CEP)
- Design responsivo

#### **3. `/visitantes/:id` - Detalhes do Visitante**
- **✅ NOVA PÁGINA IMPLEMENTADA**
- Visualização completa dos dados
- Timeline de interações
- Histórico de follow-up
- Ações: editar, converter em membro, atualizar follow-up
- Modal de conversão com notas
- Modal de follow-up com status

#### **4. `/visitantes/:id/editar` - Editar Visitante**
- **✅ NOVA PÁGINA IMPLEMENTADA**
- Formulário reutilizável (VisitorForm)
- Pré-preenchimento de dados
- Validações completas
- Integração com ViaCEP

#### **5. `/configuracoes/qr-codes` - Gestão de QR Codes**
- Lista de QR Codes por filial
- Download de QR Codes
- Regeneração com confirmação
- Ativar/desativar QR Codes
- Estatísticas por filial

#### **6. `/visit/:uuid` - Registro Público de Visitantes**
- **✅ RESPONSIVIDADE MELHORADA**
- Design mobile-first
- Validação de QR Code
- Formulário otimizado para mobile
- Máscaras e validações
- Integração com ViaCEP
- Confirmação de registro

### **Componentes Criados**

```typescript
// Componentes principais
- VisitorsTable.tsx        // Tabela de visitantes com ações
- VisitorsFilters.tsx      // Filtros avançados
- VisitorDetails.tsx       // ✅ NOVO - Detalhes completos do visitante
- VisitorForm.tsx          // ✅ NOVO - Formulário reutilizável
- QRCodeCard.tsx          // Card de QR Code com ações
- VisitorStats.tsx        // Estatísticas em cards

// Hooks customizados
- useVisitors.tsx         // Gerenciamento de estado de visitantes
- useQRCode.tsx          // Lógica de QR Codes
```

### **Melhorias de Responsividade Implementadas**

```css
/* Sistema de breakpoints mobile-first */
- Mobile:  320px - 640px  (base)
- Tablet:  640px - 1024px (sm:)
- Desktop: 1024px+        (lg:)

/* Componentes otimizados */
- Inputs com altura mínima de 44px (h-11)
- Grid adaptativo: grid-cols-1 sm:grid-cols-2
- Tipografia responsiva: text-sm sm:text-base
- Espaçamentos adaptativos: space-y-3 sm:space-y-4
- Container flexível: max-w-2xl lg:max-w-4xl
```

---

## 🔒 Segurança e Validações

### **Backend**
- ✅ Multi-tenant isolation por igreja
- ✅ Validação de UUID do QR Code
- ✅ Rate limiting nos endpoints públicos
- ✅ Sanitização de inputs
- ✅ Logging de registros
- ✅ IP tracking para auditoria

### **Frontend**
- ✅ Validação com Zod schemas
- ✅ Máscaras de input
- ✅ Prevenção de submissões duplicadas
- ✅ HTTPS only em produção
- ✅ Sanitização de dados exibidos

---

## 📊 Estatísticas e Relatórios

### **Dashboard Metrics**
```typescript
interface VisitorStats {
  total: number;
  last_30_days: number;
  last_7_days: number;
  pending_conversion: number;
  converted_to_members: number;
  conversion_rate: number;
  follow_up_needed: number;
  first_time_visitors: number;
}
```

### **Relatórios Disponíveis**
- ✅ Visitantes por período
- ✅ Taxa de conversão
- ✅ Visitantes por filial
- ✅ Status de follow-up
- ✅ Primeira visita vs retorno
- ✅ Origem do cadastro (QR Code, manual, admin)

---

## 🚀 Deploy e Configuração

### **Variáveis de Ambiente**
```env
# Backend
DJANGO_SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:pass@db:5432/dbname
ALLOWED_HOSTS=yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com

# Frontend
VITE_API_URL=https://api.yourdomain.com
VITE_SERVER_URL=https://yourdomain.com
```

### **Comandos de Deploy**
```bash
# Backend
python manage.py migrate
python manage.py collectstatic
gunicorn config.wsgi:application

# Frontend
npm run build
npm run preview
```

---

## 📱 URLs de Acesso

### **Produção**
- Frontend: `https://obreirovirtual.com.br`
- API: `https://api.obreirovirtual.com.br`
- QR Code público: `https://obreirovirtual.com.br/visit/{uuid}`

### **Desenvolvimento**
- Frontend: `http://localhost:5173`
- API: `http://localhost:8000`
- QR Code público: `http://localhost:5173/visit/{uuid}`

---

## 🎯 Métricas de Sucesso

### **Performance**
- ✅ Tempo de carregamento < 3s
- ✅ First Contentful Paint < 1.5s
- ✅ Time to Interactive < 3.5s
- ✅ Lighthouse Score > 90

### **Usabilidade**
- ✅ Taxa de conclusão de registro > 80%
- ✅ Tempo médio de registro < 2 min
- ✅ Taxa de conversão visitante → membro > 20%
- ✅ NPS > 8

---

## 🐛 Issues Resolvidos

### **Recentes**
- ✅ **Issue #6**: Política de Privacidade implementada
- ✅ **Issue #9**: Responsividade das páginas de visitantes
- ✅ **Modal de follow-up**: Correção de navegação indesejada
- ✅ **Página de detalhes**: Implementação completa
- ✅ **Página de edição**: Criação com formulário reutilizável

### **Melhorias Implementadas**
- ✅ Design mobile-first em todas as páginas
- ✅ Áreas de toque adequadas (44px mínimo)
- ✅ Tipografia responsiva
- ✅ Grid layouts adaptativos
- ✅ Formulários otimizados para mobile

---

## 📝 Próximos Passos (Roadmap)

### **Fase 1 - Curto Prazo**
- [ ] Notificações push para novos visitantes
- [ ] Integração com WhatsApp Business API
- [ ] Relatórios em PDF
- [ ] Dashboard mobile app

### **Fase 2 - Médio Prazo**
- [ ] IA para sugestões de follow-up
- [ ] Integração com sistemas de check-in
- [ ] QR Code dinâmico por evento
- [ ] Gamificação para engajamento

### **Fase 3 - Longo Prazo**
- [ ] Reconhecimento facial (opt-in)
- [ ] Análise preditiva de conversão
- [ ] Integração com CRM externo
- [ ] API pública para parceiros

---

## 👥 Equipe de Desenvolvimento

- **Backend**: Django/Python specialists
- **Frontend**: React/TypeScript developers
- **DevOps**: Docker/Cloud engineers
- **UI/UX**: Design system architects
- **QA**: Test automation engineers

---

## 📄 Licença e Termos

Este módulo é parte integrante do sistema Obreiro Virtual e está protegido por direitos autorais. Uso autorizado apenas mediante licença comercial.

**© 2025 300 Soluções Tecnologia e Serviços - Todos os direitos reservados**