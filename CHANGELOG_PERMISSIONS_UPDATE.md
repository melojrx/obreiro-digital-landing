# Changelog: Atualização do Sistema de Permissões
**Data**: 5 de outubro de 2025
**Tipo**: Mudança Crítica no Modelo de Negócio

## 📋 Resumo Executivo

Esta atualização consolida o sistema de permissões removendo o papel `DENOMINATION_ADMIN` e transferindo todas as suas responsabilidades para o `CHURCH_ADMIN`. Esta mudança reflete o modelo de negócio onde o usuário pagante (`CHURCH_ADMIN`) é responsável por gerenciar uma ou múltiplas igrejas.

---

## 🔄 Mudanças Implementadas

### 1. **Modelo de Dados** (`apps/core/models.py`)
- ❌ **Removido**: `RoleChoices.DENOMINATION_ADMIN`
- ✅ **Atualizado**: `RoleChoices.CHURCH_ADMIN` com documentação expandida
- ✅ **Novo papel centralizado**: CHURCH_ADMIN agora gerencia uma ou múltiplas igrejas

**Antes:**
```python
SUPER_ADMIN = 'super_admin', 'Super Administrador'
DENOMINATION_ADMIN = 'denomination_admin', 'Administrador de Denominação'
CHURCH_ADMIN = 'church_admin', 'Administrador da Igreja'
```

**Depois:**
```python
SUPER_ADMIN = 'super_admin', 'Super Administrador'
CHURCH_ADMIN = 'church_admin', 'Administrador da Igreja'  # Agora inclui gestão de denominações
```

---

### 2. **Classes de Permissão** (`apps/core/permissions.py`)
- ❌ **Removida**: Classe `IsDenominationAdmin`
- ✅ **Atualizada**: `IsChurchAdmin` - agora verifica apenas `CHURCH_ADMIN`
- ✅ **Atualizada**: `IsBranchManager` - removida verificação de `DENOMINATION_ADMIN`

**Mudanças na IsChurchAdmin:**
```python
# ANTES
return request.user.church_users.filter(
    role__in=[RoleChoices.DENOMINATION_ADMIN, RoleChoices.CHURCH_ADMIN],
    is_active=True
).exists()

# DEPOIS
return request.user.church_users.filter(
    role=RoleChoices.CHURCH_ADMIN,
    is_active=True
).exists()
```

---

### 3. **Views Atualizadas**

#### `apps/denominations/views.py`
- ✅ Removido import de `IsDenominationAdmin`
- ✅ Substituído por `IsChurchAdmin` em todos os usos
- ✅ Atualizada lógica de filtragem de administradores

#### `apps/churches/views.py`
- ✅ Removido import de `IsDenominationAdmin`
- ✅ Substituído por `IsChurchAdmin` em todos os endpoints
- ✅ Corrigido uso de `models.Q` para `Q` (importado corretamente)

#### `apps/branches/views.py`
- ✅ Atualizada lógica para verificar apenas `CHURCH_ADMIN`
- ✅ Comentários atualizados refletindo novo modelo

---

### 4. **Migração de Dados** 
**Arquivo**: `apps/accounts/migrations/0017_convert_denomination_admin_to_church_admin.py`

✅ **Criada migração Django** que:
- Converte automaticamente todos os usuários `DENOMINATION_ADMIN` → `CHURCH_ADMIN`
- Exibe relatório detalhado durante a migração
- Inclui função de reversão (com avisos de segurança)
- Preserva todos os vínculos e permissões existentes

**Executar com:**
```bash
cd backend
python manage.py migrate accounts 0017
```

---

### 5. **Comandos de Teste Atualizados**

#### `apps/accounts/management/commands/create_test_users.py`
- ✅ Atualizado para criar `CHURCH_ADMIN` ao invés de `DENOMINATION_ADMIN`
- ✅ Descrições e comentários atualizados

#### `apps/accounts/management/commands/fix_test_users_roles.py`
- ✅ Mapeamento atualizado: `denominacao.admin@teste.com` → `CHURCH_ADMIN`

---

### 6. **Documentação Atualizada**

#### `docs/Sistema de Permissões e Papéis - Guia Completo.md`
- ✅ Hierarquia de papéis reduzida de 6 para 5 níveis
- ✅ Seção `CHURCH_ADMIN` expandida com todas as responsabilidades
- ✅ Removidas todas as referências a `DENOMINATION_ADMIN`
- ✅ Exemplos de código atualizados
- ✅ Casos de uso revisados

---

## 🎯 Impacto nos Usuários

### Para Usuários Existentes
- ✅ **Sem perda de funcionalidade**: Todos os usuários `DENOMINATION_ADMIN` serão automaticamente convertidos para `CHURCH_ADMIN`
- ✅ **Permissões preservadas**: Todos os acessos e permissões continuam funcionando
- ✅ **Transparent**: A migração ocorre automaticamente ao aplicar as migrações

### Para Novos Cadastros
- ✅ **Processo simplificado**: Apenas um papel administrativo principal (`CHURCH_ADMIN`)
- ✅ **Modelo mais claro**: O usuário pagante recebe `CHURCH_ADMIN` e pode gerenciar suas igrejas
- ✅ **Denominações**: Suportadas automaticamente - `CHURCH_ADMIN` com denominação pode gerenciar múltiplas igrejas

---

## 🔒 Segurança

### Validações Mantidas
- ✅ `SUPER_ADMIN` continua protegido e só pode ser criado via comando específico
- ✅ Isolamento multi-tenant mantido
- ✅ Todas as verificações de permissão atualizadas
- ✅ Sem quebra de segurança ou vazamento de dados

---

## 📊 Hierarquia Final de Papéis

```
1. SUPER_ADMIN (Platform Admin)
   └─ Desenvolvedores/donos da plataforma
   
2. CHURCH_ADMIN (Usuário Pagante)
   ├─ Gerencia uma igreja específica
   └─ OU gerencia múltiplas igrejas (se tiver denominação)
   
3. Branch Manager
   └─ Gerencia filiais específicas
   
4. Member User
   └─ Membro com acesso ao sistema
   
5. Visitor
   └─ Visitante via QR Code
```

---

## 🚀 Próximos Passos para Deploy

### 1. **Backup do Banco de Dados**
```bash
# CRÍTICO: Fazer backup antes de aplicar mudanças
./scripts/backup.sh
```

### 2. **Aplicar Migrações**
```bash
cd backend
python manage.py migrate accounts 0017
```

### 3. **Verificar Conversão**
```bash
# Conferir se não há mais DENOMINATION_ADMIN
python manage.py shell
>>> from apps.accounts.models import ChurchUser
>>> ChurchUser.objects.filter(role='denomination_admin').count()
0  # Deve retornar 0
```

### 4. **Testar Funcionalidades**
- ✅ Login com usuário Church Admin
- ✅ Acesso a múltiplas igrejas (se houver denominação)
- ✅ Criação de igrejas
- ✅ Gestão de membros e filiais

---

## ⚠️ Avisos Importantes

1. **Esta é uma mudança irreversível** (tecnicamente reversível, mas não recomendado)
2. **Backup obrigatório** antes de aplicar em produção
3. **Testes em ambiente de desenvolvimento** antes de produção
4. **Comunicar usuários** sobre qualquer mudança na nomenclatura (se aplicável)

---

## 📞 Suporte

Em caso de problemas:
1. Verificar logs da migração
2. Consultar esta documentação
3. Reverter para backup se necessário
4. Contatar equipe de desenvolvimento

---

## ✅ Checklist de Validação

- [x] Modelo RoleChoices atualizado
- [x] Classes de permissão atualizadas
- [x] Views atualizadas
- [x] Migração de dados criada
- [x] Comandos de teste atualizados
- [x] Documentação sincronizada com código
- [x] Sem erros de lint/tipo
- [x] Backup documentado
- [x] Plano de rollback definido

---

**Status**: ✅ PRONTO PARA DEPLOY (após testes em dev)
**Impacto**: 🔴 ALTO - Mudança crítica no modelo de permissões
**Risco**: 🟡 MÉDIO - Com backup e migração adequada, risco é controlado
