# 📚 Documentação do Projeto Obreiro Digital

## 🎯 Visão Geral

Documentação técnica completa do sistema de gestão eclesiástica Obreiro Digital, desenvolvido com Django + React + Docker.

## 📋 Índice de Documentação

### **🔧 Configuração e Setup**
- [`GITIGNORE_COMPLETE.md`](./GITIGNORE_COMPLETE.md) - Configuração profissional do .gitignore

### **📱 Módulos do Sistema**
- [`MODULO_QR_CODE_VISITANTES.md`](./MODULO_QR_CODE_VISITANTES.md) - Sistema completo de QR Code para visitantes

### **🏗️ Arquitetura**
```
Obreiro Digital
├── Backend (Django REST Framework)
│   ├── apps/accounts/      # Autenticação e usuários
│   ├── apps/churches/      # Gestão de igrejas
│   ├── apps/denominations/ # Denominações religiosas
│   ├── apps/branches/      # Filiais de igrejas
│   ├── apps/members/       # Membros da igreja
│   ├── apps/visitors/      # Sistema de visitantes (QR Code)
│   ├── apps/activities/    # Eventos e atividades
│   └── apps/core/          # Configurações centrais
├── Frontend (React + TypeScript)
│   ├── components/         # Componentes reutilizáveis
│   ├── pages/             # Páginas da aplicação
│   ├── hooks/             # Hooks customizados
│   ├── services/          # Integração com API
│   └── config/            # Configurações
└── Docker
    ├── docker-compose.dev.yml   # Desenvolvimento
    └── docker-compose.prod.yml  # Produção
```

## 🚀 Quick Start

### **Desenvolvimento**
```bash
# Clonar repositório
git clone https://github.com/melojrx/obreiro-digital-landing.git
cd obreiro-digital-landing

# Configurar ambiente
cp .env_dev.example .env_dev

# Subir containers
docker-compose -f docker-compose.dev.yml up -d

# Acessar aplicação
# Frontend: http://localhost:5173
# Backend:  http://localhost:8000
```

### **URLs Importantes**
| Serviço | URL | Descrição |
|---------|-----|-----------|
| Frontend | http://localhost:5173 | Interface React |
| Backend API | http://localhost:8000/api/v1/ | API REST |
| Admin Django | http://localhost:8000/admin/ | Painel administrativo |
| Swagger Docs | http://localhost:8000/api/docs/ | Documentação da API |

## 📊 Status dos Módulos

| Módulo | Status | Documentação | Testes |
|--------|--------|-------------|--------|
| **Autenticação** | ✅ Completo | 📝 Básica | ✅ Funcional |
| **Gestão de Igrejas** | ✅ Completo | 📝 Básica | ✅ Funcional |
| **Membros** | ✅ Completo | 📝 Básica | ✅ Funcional |
| **QR Code Visitantes** | ✅ Completo | 📖 Completa | ✅ Funcional |
| **Atividades** | 🟡 Parcial | 📝 Básica | 🟡 Parcial |
| **Relatórios** | 🔄 Planejado | ❌ Pendente | ❌ Pendente |

**Legenda:**
- ✅ Completo e funcional
- 🟡 Parcialmente implementado
- 🔄 Em desenvolvimento
- ❌ Não iniciado

## 🔐 Segurança

### **Dados Sensíveis Protegidos**
- ✅ Arquivos `.env*` ignorados
- ✅ Certificados SSL protegidos
- ✅ Backups não versionados
- ✅ Logs locais ignorados
- ✅ Configurações pessoais excluídas

### **Autenticação e Autorização**
- 🔑 **Token-based authentication**
- 👥 **Sistema hierárquico de permissões** (8 níveis)
- 🏢 **Multi-tenant** com isolamento por igreja
- 🛡️ **Middleware de segurança** personalizado

## 🧪 Testes e Qualidade

### **Backend (Django)**
```bash
# Executar testes
docker-compose exec backend python manage.py test

# Verificar sistema
docker-compose exec backend python manage.py check
```

### **Frontend (React)**
```bash
# Linting
docker-compose exec frontend npm run lint

# Build de produção
docker-compose exec frontend npm run build
```

## 🔄 Versionamento

### **Histórico de Releases**
- **v1.2.0** - Sistema QR Code para Visitantes
- **v1.1.0** - Gestão de Membros e Dashboard
- **v1.0.0** - Sistema base de autenticação

### **Próximas Versões**
- **v1.3.0** - Sistema de Relatórios
- **v1.4.0** - Integração WhatsApp
- **v1.5.0** - PWA e Notificações Push

## 📞 Suporte e Contribuição

### **Como Contribuir**
1. Fork do repositório
2. Criar branch para feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit das mudanças (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Push para branch (`git push origin feature/nova-funcionalidade`)
5. Abrir Pull Request

### **Padrões de Commit**
```
feat: nova funcionalidade
fix: correção de bug
docs: atualização de documentação
style: formatação de código
refactor: refatoração sem mudança de funcionalidade
test: adição ou correção de testes
chore: tarefas de manutenção
```

### **Contato**
- **Desenvolvedor:** Junior Melo (@melojrx)
- **Email:** jrmeloafrf@gmail.com
- **GitHub:** https://github.com/melojrx/obreiro-digital-landing

## 🎯 Roadmap

### **Curto Prazo (1-2 meses)**
- [ ] Sistema de Relatórios PDF
- [ ] Integração WhatsApp para follow-up
- [ ] Notificações em tempo real
- [ ] Backup automático

### **Médio Prazo (3-6 meses)**
- [ ] Mobile App (React Native)
- [ ] Sistema de Pagamentos
- [ ] Analytics Avançados
- [ ] API GraphQL

### **Longo Prazo (6+ meses)**
- [ ] Inteligência Artificial para insights
- [ ] Integração com outras plataformas
- [ ] Sistema de CRM eclesiástico
- [ ] Marketplace de plugins

---

*Documentação mantida pela equipe de desenvolvimento do Obreiro Digital*  
*Última atualização: Julho 2025*