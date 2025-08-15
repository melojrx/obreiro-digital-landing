# 📋 Matriz de Permissões - Gestão Hierárquica

## 🎯 **Visão Geral**

Este documento define as **regras de negócio e permissões** para o módulo de Gestão Hierárquica do Obreiro Digital, estabelecendo quais perfis de usuários têm acesso às funcionalidades de gestão de denominações, igrejas e filiais.

---

## 🏗️ **Arquitetura de Permissões**

### **Critério de Exibição da Sidebar "GESTÃO HIERÁRQUICA"**

```typescript
// Condição para mostrar a seção hierárquica no menu
permissions.canManageDenomination || permissions.canCreateChurches
```

### **Modelo de Negócio**

- 🏛️ **Denominações:** Clientes premium que pagam pelo serviço completo
- ⛪ **Igrejas:** Podem ser independentes (plano básico) ou vinculadas a denominações
- 🏢 **Filiais:** Extensões de igrejas principais

---

## 👥 **Matriz de Permissões por Perfil**

| **Perfil** | **canManageDenomination** | **canCreateChurches** | **Vê Sidebar?** | **Nível de Acesso** |
|------------|:-------------------------:|:---------------------:|:----------------:|:------------------:|
| **DENOMINATION_ADMIN** | ✅ `true` | ✅ `true` | ✅ **SIM** | 🟢 **COMPLETO** |
| **CHURCH_ADMIN** | ❌ `false` | ❌ `false` | ❌ **NÃO** | 🟡 **LIMITADO** |
| **PASTOR** | ❌ `false` | ❌ `false` | ❌ **NÃO** | 🟡 **LIMITADO** |
| **SECRETARY** | ❌ `false` | ❌ `false` | ❌ **NÃO** | 🟠 **BÁSICO** |
| **LEADER** | ❌ `false` | ❌ `false` | ❌ **NÃO** | 🟠 **BÁSICO** |
| **MEMBER** | ❌ `false` | ❌ `false` | ❌ **NÃO** | 🔴 **MÍNIMO** |

---

## 🔐 **Detalhamento de Permissões Hierárquicas**

### **🏛️ DENOMINATION_ADMIN (Administrador de Denominação)**
```yaml
Acesso: COMPLETO
Funcionalidades:
  - ✅ Visualizar dashboard da denominação
  - ✅ Criar novas igrejas na denominação
  - ✅ Gerenciar administradores de igrejas
  - ✅ Visualizar relatórios consolidados
  - ✅ Navegar pela hierarquia completa
  - ✅ Visualizar estatísticas de todas as igrejas
  - ✅ Editar informações da denominação
  
Restrições:
  - ❌ Criar novas denominações (apenas Platform Admin)
  - ❌ Deletar denominações (apenas Platform Admin)
```

### **⛪ CHURCH_ADMIN (Administrador de Igreja)**
```yaml
Acesso: LIMITADO
Funcionalidades:
  - ✅ Gerenciar sua própria igreja
  - ✅ Criar e gerenciar filiais da igreja
  - ✅ Visualizar dados da denominação (se vinculado)
  - ✅ Visualizar estatísticas da igreja
  - ✅ Navegar hierarquia (apenas visualização)
  
Restrições:
  - ❌ Criar novas igrejas
  - ❌ Gerenciar outras igrejas
  - ❌ Editar dados da denominação
  - ❌ Acessar gestão hierárquica
```

### **👨‍💼 PASTOR**
```yaml
Acesso: LIMITADO
Funcionalidades:
  - ✅ Visualizar dados da igreja
  - ✅ Visualizar estatísticas básicas
  - ✅ Navegar hierarquia (apenas visualização)
  - ✅ Gerenciar membros e visitantes
  
Restrições:
  - ❌ Criar igrejas ou filiais
  - ❌ Gerenciar configurações administrativas
  - ❌ Acessar gestão hierárquica
```

### **📝 SECRETARY (Secretário)**
```yaml
Acesso: BÁSICO
Funcionalidades:
  - ✅ Visualizar dados da igreja
  - ✅ Gerenciar membros e visitantes
  - ✅ Visualizar relatórios básicos
  
Restrições:
  - ❌ Criar ou gerenciar estruturas hierárquicas
  - ❌ Acessar gestão hierárquica
  - ❌ Gerenciar configurações administrativas
```

### **👥 LEADER (Líder)**
```yaml
Acesso: BÁSICO
Funcionalidades:
  - ✅ Gerenciar atividades e eventos
  - ✅ Visualizar membros
  - ✅ Registrar visitantes
  
Restrições:
  - ❌ Visualizar dados hierárquicos
  - ❌ Acessar gestão hierárquica
  - ❌ Gerenciar configurações
```

### **👤 MEMBER (Membro)**
```yaml
Acesso: MÍNIMO
Funcionalidades:
  - ✅ Visualizar lista de membros
  - ✅ Participar de atividades
  
Restrições:
  - ❌ Qualquer acesso hierárquico
  - ❌ Gerenciar outros usuários
  - ❌ Acessar relatórios
```

---

## 📱 **Funcionalidades da Sidebar Hierárquica**

### **Para DENOMINATION_ADMIN (Único com acesso):**

```
🏛️ GESTÃO HIERÁRQUICA
├── 📊 Dashboard Denominação
│   ├── Estatísticas consolidadas
│   ├── Gráficos de crescimento
│   └── Métricas de todas as igrejas
│
├── ⛪ Gerenciar Igrejas
│   ├── Criar nova igreja
│   ├── Editar igrejas existentes
│   ├── Atribuir administradores
│   └── Visualizar estatísticas por igreja
│
└── 🌳 Visão Hierárquica
    ├── Árvore organizacional
    ├── Navegação entre níveis
    └── Mapa de relacionamentos
```

---

## 🔒 **Regras de Segurança**

### **Princípios de Acesso**

1. **Princípio do Menor Privilégio:** Usuários recebem apenas as permissões mínimas necessárias
2. **Segregação de Responsabilidades:** Cada nível tem responsabilidades específicas
3. **Isolamento Multi-tenant:** Usuários só acessam dados de sua organização
4. **Hierarquia Ascendente:** Níveis superiores podem visualizar níveis inferiores

### **Validações de Segurança**

```typescript
// Backend - Verificação de permissões
@permission_classes([CanManageDenomination])
def create_church(request):
    # Apenas Denomination Admins podem criar igrejas
    pass

@permission_classes([IsPlatformAdmin])  
def create_denomination(request):
    # Apenas Platform Admins podem criar denominações
    pass
```

### **Restrições por Papel**

- **SUPER_ADMIN:** Reservado exclusivamente para desenvolvedores da plataforma
- **PLATFORM_ADMIN:** Apenas para proprietários da plataforma
- **DENOMINATION_ADMIN:** Único papel cliente com acesso hierárquico completo

---

## 🧪 **Matriz de Testes**

### **Cenários de Validação**

| **Teste** | **Usuário** | **Ação** | **Resultado Esperado** |
|-----------|-------------|----------|------------------------|
| T01 | `denominacao.admin@teste.com` | Acessar sidebar | ✅ Deve ver "GESTÃO HIERÁRQUICA" |
| T02 | `igreja.admin@teste.com` | Acessar sidebar | ❌ NÃO deve ver seção hierárquica |
| T03 | `pastor@teste.com` | Acessar sidebar | ❌ NÃO deve ver seção hierárquica |
| T04 | `secretario@teste.com` | Acessar sidebar | ❌ NÃO deve ver seção hierárquica |
| T05 | `lider@teste.com` | Acessar sidebar | ❌ NÃO deve ver seção hierárquica |
| T06 | `membro@teste.com` | Acessar sidebar | ❌ NÃO deve ver seção hierárquica |

### **Testes de API**

```bash
# Teste 1: Denomination Admin criando igreja
curl -X POST /api/denominations/1/churches/ \
  -H "Authorization: Bearer <denomination_admin_token>"
# Esperado: 201 Created

# Teste 2: Church Admin tentando criar igreja  
curl -X POST /api/denominations/1/churches/ \
  -H "Authorization: Bearer <church_admin_token>"
# Esperado: 403 Forbidden

# Teste 3: Pastor tentando acessar gestão hierárquica
curl -X GET /api/denominations/1/dashboard/ \
  -H "Authorization: Bearer <pastor_token>"  
# Esperado: 403 Forbidden
```

---

## 📈 **Modelo de Negócio e Monetização**

### **Níveis de Serviço**

```
🏛️ DENOMINAÇÃO (Premium)
├── Gestão hierárquica completa
├── Relatórios consolidados
├── Múltiplas igrejas
└── Suporte prioritário

⛪ IGREJA INDEPENDENTE (Básico)
├── Gestão da própria igreja
├── Relatórios básicos
├── Múltiplas filiais
└── Suporte padrão

🏢 FILIAL (Incluído)
├── Vinculada à igreja principal
├── Gestão local básica
└── Sem custos adicionais
```

### **Justificativa Comercial**

- **Denominações** pagam pelo valor agregado da gestão hierárquica
- **Igrejas independentes** têm funcionalidades suficientes para gestão local
- **Escalabilidade** do modelo permite crescimento orgânico

---

## 🔄 **Evolução e Manutenção**

### **Versionamento de Permissões**

- **v1.0:** Implementação base (atual)
- **v1.1:** Permissões granulares por funcionalidade
- **v2.0:** Sistema de permissões baseado em recursos

### **Monitoramento**

- Logs de acesso a funcionalidades restritas
- Métricas de uso por perfil
- Alertas de tentativas de acesso não autorizado

---

## 📚 **Referências Técnicas**

### **Arquivos Relacionados**

```
frontend/src/hooks/usePermissions.tsx
frontend/src/components/layout/Sidebar.tsx  
backend/apps/core/permissions.py
backend/apps/denominations/views.py
backend/apps/accounts/models.py
```

### **Comandos de Diagnóstico**

```bash
# Verificar permissões de usuário no backend
docker-compose -f docker-compose.dev.yml exec backend python manage.py shell -c "
from apps.accounts.models import CustomUser
user = CustomUser.objects.get(email='denominacao.admin@teste.com')
print(user.church_users.first().can_manage_denomination)
"

# Verificar estrutura de denominações
docker-compose -f docker-compose.dev.yml exec backend python manage.py shell -c "
from apps.denominations.models import Denomination
print(f'Total denominações: {Denomination.objects.count()}')
"
```

---

## ✅ **Conclusão**

Esta matriz de permissões garante que:

1. **Segurança:** Acesso restrito conforme necessidade
2. **Modelo de Negócio:** Diferenciação clara entre planos  
3. **Escalabilidade:** Estrutura preparada para crescimento
4. **Usabilidade:** Interface limpa para cada perfil

**⚠️ IMPORTANTE:** A gestão hierárquica é um recurso **premium exclusivo** para administradores de denominação. Outros perfis não devem ter acesso a essas funcionalidades por design.

---

**Documento criado em:** 15 de Agosto de 2025  
**Versão:** 1.0  
**Autor:** Sistema Obreiro Digital  
**Próxima revisão:** 30 dias pós-produção