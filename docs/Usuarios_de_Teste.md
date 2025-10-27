# Usuários de Teste - Obreiro Virtual

**Versão:** 1.0
**Data:** Outubro 2025
**Autor:** Sistema Automatizado

---

## 📋 Visão Geral

Este documento descreve os **usuários de teste** criados automaticamente para facilitar o desenvolvimento e testes do sistema Obreiro Virtual. Os usuários cobrem todos os perfis de permissão definidos no [Sistema de Permissões](./Sistema_de_Permissoes.md).

---

## 🎯 Perfis Disponíveis

O sistema possui **4 perfis hierárquicos**:

1. **SUPER_ADMIN** (Nível 4) - Administrador da Plataforma
2. **DENOMINATION_ADMIN** (Nível 3) - Administrador de Denominação *(em desenvolvimento)*
3. **CHURCH_ADMIN** (Nível 2) - Administrador de Igreja
4. **SECRETARY** (Nível 1) - Secretário(a)

---

## 👥 Usuários de Teste Criados

### 1. SUPER_ADMIN - Administrador da Plataforma

| Campo | Valor |
|-------|-------|
| **Email** | `superadmin@teste.com` |
| **Senha** | `teste123` |
| **Nome** | Super Admin (Plataforma) |
| **Telefone** | (11) 91111-1111 |
| **Igreja** | Obreiro Virtual - Administração |
| **Acesso** | **Total** - Todas as igrejas, todas as filiais, todas as funcionalidades |
| **Permissões** | `is_superuser=True`, `is_staff=True` |

**Descrição:**
- Desenvolvedor/dono da plataforma
- Acesso irrestrito a todos os dados
- Pode acessar Django Admin
- Único perfil que não pode ser criado via cadastro normal

---

### 2. CHURCH_ADMIN - Admin da Denominação

| Campo | Valor |
|-------|-------|
| **Email** | `denominacao.admin@teste.com` |
| **Senha** | `teste123` |
| **Nome** | Admin da Denominação |
| **Telefone** | (11) 92222-2222 |
| **Igreja** | Igreja Teste Denominação |
| **Acesso** | Todas as filiais da igreja |
| **Permissões** | Gestão completa da igreja |

**Descrição:**
- Representa um administrador de múltiplas igrejas
- Atualmente usa role `CHURCH_ADMIN` (DENOMINATION_ADMIN ainda não implementado)
- Pode gerenciar membros, visitantes, filiais e atividades

---

### 3. CHURCH_ADMIN - Admin da Igreja

| Campo | Valor |
|-------|-------|
| **Email** | `igreja.admin@teste.com` |
| **Senha** | `teste123` |
| **Nome** | Admin da Igreja |
| **Telefone** | (11) 93333-3333 |
| **Igreja** | Igreja Teste Independente |
| **Acesso** | Matriz + todas as filiais (3 filiais) |
| **Permissões** | Gestão completa da igreja e filiais |

**Descrição:**
- Administrador de uma igreja específica
- Gerencia matriz e todas as congregações
- Pode criar/editar/excluir membros e visitantes
- Pode criar e gerenciar filiais
- Pode gerar e gerenciar QR Codes

---

### 4. SECRETARY - Secretário Matriz e Norte

| Campo | Valor |
|-------|-------|
| **Email** | `secretario.matriz@teste.com` |
| **Senha** | `teste123` |
| **Nome** | Secretário - Matriz e Norte |
| **Telefone** | (11) 94444-4444 |
| **Igreja** | Igreja Teste Independente |
| **Acesso** | **Apenas 2 filiais:** Matriz Central + Congregação Norte |
| **Permissões** | CRUD de membros e visitantes nas filiais atribuídas |

**Descrição:**
- Secretário com acesso a múltiplas filiais
- Pode cadastrar e editar membros/visitantes
- NÃO pode excluir membros/visitantes
- NÃO pode gerenciar filiais ou QR Codes
- Acesso limitado às branches atribuídas

---

### 5. SECRETARY - Secretário Congregação Sul

| Campo | Valor |
|-------|-------|
| **Email** | `secretario.sul@teste.com` |
| **Senha** | `teste123` |
| **Nome** | Secretário - Congregação Sul |
| **Telefone** | (11) 95555-5555 |
| **Igreja** | Igreja Teste Independente |
| **Acesso** | **Apenas 1 filial:** Congregação Sul |
| **Permissões** | CRUD de membros e visitantes apenas na Congregação Sul |

**Descrição:**
- Secretário com acesso a uma única filial
- Pode cadastrar e editar membros/visitantes
- NÃO pode acessar dados de outras filiais
- Ideal para testar restrições de acesso por branch

---

## 🏗️ Estrutura Criada Automaticamente

### Denominação

| Campo | Valor |
|-------|-------|
| **Nome** | Denominação Teste - Desenvolvimento |
| **Nome Curto** | Teste Dev |
| **Cidade** | São Paulo/SP |
| **Email** | denominacao@teste.com |
| **Plano** | Denomination |

---

### Igrejas

#### Igreja 1: Igreja Teste Denominação

| Campo | Valor |
|-------|-------|
| **Nome** | Igreja Teste Denominação |
| **Nome Curto** | Teste Denominação |
| **Denominação** | Denominação Teste - Desenvolvimento |
| **Cidade** | São Paulo/SP |
| **Plano** | Professional |

#### Igreja 2: Igreja Teste Independente

| Campo | Valor |
|-------|-------|
| **Nome** | Igreja Teste Independente |
| **Nome Curto** | Teste Independente |
| **Denominação** | Denominação Teste - Desenvolvimento |
| **Cidade** | São Paulo/SP |
| **Plano** | Professional |

---

### Filiais (Branches)

Todas as filiais têm **QR Codes gerados automaticamente**.

#### Igreja Teste Independente - 3 Filiais:

1. **Matriz Central** (is_main=True)
   - Nome: Matriz Central
   - Cidade: São Paulo/SP
   - QR Code: ✅ Ativo

2. **Congregação Norte**
   - Nome: Congregação Norte
   - Cidade: São Paulo/SP
   - QR Code: ✅ Ativo

3. **Congregação Sul**
   - Nome: Congregação Sul
   - Cidade: São Paulo/SP
   - QR Code: ✅ Ativo

---

## 🚀 Como Usar os Comandos

### Pré-requisitos

- Docker deve estar rodando
- Container backend deve estar ativo (`obreiro_backend_dev`)

---

### Criar Usuários de Teste

**Comando básico:**
```bash
docker exec obreiro_backend_dev python manage.py create_test_users
```

**Saída esperada:**
```
🚀 Criando usuários de teste para os 4 perfis do sistema...
📖 Baseado em: docs/Sistema_de_Permissoes.md (v2.0)
✓ Denominação de teste criada
✓ Igreja "Igreja Teste Denominação" criada
✓ Igreja "Igreja Teste Independente" criada
✓ Filial "Matriz Central" criada
✓ Filial "Congregação Norte" criada
✓ Filial "Congregação Sul" criada

✅ Usuários de teste criados com sucesso!
```

---

### Limpar e Recriar Usuários

Se você já executou o comando antes e quer recriar os usuários:

```bash
docker exec obreiro_backend_dev python manage.py create_test_users --clean
```

**O que faz:**
- Remove todos os usuários de teste existentes
- Remove igrejas e denominações de teste
- Recria tudo do zero

---

### Criar com Senha Customizada

Por padrão, a senha é `teste123`. Para usar outra senha:

```bash
docker exec obreiro_backend_dev python manage.py create_test_users --password minhasenha123
```

---

### Executar Fora do Docker (Desenvolvimento Local)

Se estiver rodando o Django diretamente (sem Docker):

```bash
cd backend
python manage.py create_test_users
```

---

## 🧪 Cenários de Teste

### Cenário 1: Testar Acesso Total (SUPER_ADMIN)

```bash
Email: superadmin@teste.com
Senha: teste123
```

**O que testar:**
- ✅ Acesso a todas as igrejas
- ✅ Acesso a todas as filiais
- ✅ Pode criar/editar/excluir tudo
- ✅ Acesso ao Django Admin (se habilitado)

---

### Cenário 2: Testar Admin de Igreja (CHURCH_ADMIN)

```bash
Email: igreja.admin@teste.com
Senha: teste123
```

**O que testar:**
- ✅ Acesso apenas à "Igreja Teste Independente"
- ✅ Vê todas as 3 filiais da igreja
- ✅ Pode criar/editar/excluir membros em qualquer filial
- ✅ Pode criar novas filiais
- ✅ Pode gerar e regenerar QR Codes
- ❌ NÃO vê dados de outras igrejas

---

### Cenário 3: Testar Secretário com Múltiplas Filiais

```bash
Email: secretario.matriz@teste.com
Senha: teste123
```

**O que testar:**
- ✅ Vê apenas "Matriz Central" e "Congregação Norte"
- ✅ Pode criar/editar membros nessas filiais
- ❌ NÃO vê "Congregação Sul"
- ❌ NÃO pode excluir membros
- ❌ NÃO pode criar filiais
- ❌ NÃO pode gerar QR Codes

---

### Cenário 4: Testar Secretário com Filial Única

```bash
Email: secretario.sul@teste.com
Senha: teste123
```

**O que testar:**
- ✅ Vê apenas "Congregação Sul"
- ✅ Pode criar/editar membros/visitantes apenas nessa filial
- ❌ NÃO vê "Matriz Central" nem "Congregação Norte"
- ❌ NÃO pode acessar dados de outras filiais
- ❌ Mesmo pertencendo à mesma igreja, acesso é restrito

---

## 📊 Tabela Resumo de Permissões

| Funcionalidade | SUPER_ADMIN | CHURCH_ADMIN | SECRETARY |
|----------------|-------------|--------------|-----------|
| Ver todas igrejas | ✅ | ❌ (só a sua) | ❌ (só a sua) |
| Criar igrejas | ✅ | ❌ | ❌ |
| Criar filiais | ✅ | ✅ | ❌ |
| Gerar QR Codes | ✅ | ✅ | ❌ |
| Criar membros | ✅ | ✅ (todas filiais) | ✅ (filiais atribuídas) |
| Editar membros | ✅ | ✅ (todas filiais) | ✅ (filiais atribuídas) |
| Excluir membros | ✅ | ✅ | ❌ |
| Ver todas filiais | ✅ | ✅ (da igreja) | ❌ (só atribuídas) |
| Relatórios globais | ✅ | ✅ (da igreja) | ✅ (das filiais) |
| Django Admin | ✅ | ❌ | ❌ |

---

## 🔒 Boas Práticas de Segurança

### ⚠️ IMPORTANTE

1. **NUNCA use estes usuários em produção!**
   - São apenas para desenvolvimento e testes
   - Senhas são públicas e conhecidas

2. **Limpe antes de deploy:**
   ```bash
   docker exec obreiro_backend_dev python manage.py create_test_users --clean
   ```

3. **Em produção:**
   - Crie usuários reais através do sistema de cadastro
   - Use senhas fortes e únicas
   - SUPER_ADMIN só pode ser criado via comando `create_platform_admin`

---

## 🐛 Troubleshooting

### Erro: "Email já existe"

**Problema:** Usuários de teste já foram criados anteriormente.

**Solução:**
```bash
docker exec obreiro_backend_dev python manage.py create_test_users --clean
```

---

### Erro: "Container não encontrado"

**Problema:** Container backend não está rodando.

**Solução:**
```bash
# Verificar containers rodando
docker ps

# Iniciar containers
docker-compose -f docker-compose.dev.yml up -d
```

---

### Erro: "django.db.models.deletion.ProtectedError"

**Problema:** Dependências de foreign keys protegidas.

**Solução:** O comando já trata isso, mas se persistir:
```bash
# Limpar manualmente via Django shell
docker exec -it obreiro_backend_dev python manage.py shell
>>> from apps.denominations.models import Denomination
>>> Denomination.objects.filter(name__icontains='Teste').delete()
>>> exit()
```

---

### Login não funciona (404 Error)

**Problema:** Proxy do Vite não está configurado.

**Solução:** Já foi corrigido no `frontend/vite.config.ts`:
```typescript
proxy: {
  '/api/v1': {
    target: 'http://backend:8000',
    changeOrigin: true,
    secure: false,
  }
}
```

Reinicie o container frontend:
```bash
docker restart obreiro_frontend_dev
```

---

## 📚 Referências

- [Sistema de Permissões](./Sistema_de_Permissoes.md) - Documentação completa dos roles
- [Plano de Reestruturação de Modelos](./plano-reestruturacao-modelos.md) - Arquitetura de dados
- Código do comando: `backend/apps/accounts/management/commands/create_test_users.py`

---

## 🎯 Próximos Passos Após Criar Usuários

1. **Acesse o frontend:**
   ```
   http://localhost:5173
   ```

2. **Faça login com qualquer usuário:**
   - Email: `igreja.admin@teste.com`
   - Senha: `teste123`

3. **Teste funcionalidades específicas:**
   - Dashboard
   - Listagem de membros
   - Cadastro de visitantes
   - Relatórios
   - Permissões de acesso

4. **Valide restrições:**
   - Troque para `secretario.sul@teste.com`
   - Verifique que NÃO vê outras filiais
   - Confirme que NÃO pode excluir membros

---

## 📝 Notas de Desenvolvimento

### Roles Implementados vs. Planejados

| Role | Status | Implementação |
|------|--------|---------------|
| SUPER_ADMIN | ✅ Implementado | Completo |
| CHURCH_ADMIN | ✅ Implementado | Completo |
| SECRETARY | ✅ Implementado | Completo |
| **DENOMINATION_ADMIN** | ⚠️ **Pendente** | Usando CHURCH_ADMIN temporariamente |

**Quando DENOMINATION_ADMIN for implementado:**

1. Atualizar `apps/core/models.py` - adicionar ao `RoleChoices`
2. Criar migração Django
3. Atualizar comando `create_test_users.py`:
   ```python
   role=RoleChoices.DENOMINATION_ADMIN  # em vez de CHURCH_ADMIN
   ```

---

**Última atualização:** Outubro 2025
**Versão:** 1.0
**Mantenedor:** Equipe Obreiro Virtual
