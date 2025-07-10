# Usuários de Teste - Guia Completo

## Visão Geral

Este documento descreve todos os usuários de teste criados para validar o sistema de permissões e papéis do **Obreiro Virtual**. Os usuários cobrem todos os níveis hierárquicos do sistema, desde administradores de denominação até membros comuns.

---

## 🏛️ Estrutura Organizacional

### Denominação
- **Nome:** Denominação Teste - Desenvolvimento
- **Nome Curto:** Teste Dev
- **Administrador:** Admin Denominação
- **Email:** denominacao@teste.com
- **Telefone:** (11) 90000-0000

### Igrejas

#### Igreja Sede
- **Nome:** Igreja Teste Sede - Desenvolvimento
- **Nome Curto:** Teste Sede
- **Email:** igrejasede@teste.com
- **Telefone:** (11) 90001-0001
- **Plano:** Professional

#### Igreja Filha
- **Nome:** Igreja Teste Filha - Desenvolvimento
- **Nome Curto:** Teste Filha
- **Email:** igrejafilha@teste.com
- **Telefone:** (11) 90002-0002
- **Plano:** Professional

### Filiais

| **Nome** | **Igreja** | **Email** | **QR Code** |
|----------|------------|-----------|-------------|
| Sede Principal | Igreja Sede | sedeprincipal@teste.com | ✅ Ativo |
| Filial Norte | Igreja Sede | filialnorte@teste.com | ✅ Ativo |
| Filial Sul | Igreja Sede | filialsul@teste.com | ✅ Ativo |

---

## 👥 8 Usuários de Teste com Todos os Papéis

### 1. **Administrador de Denominação**
- **Email:** `denominacao.admin@teste.com`
- **Nome:** Admin Denominação
- **Telefone:** (11) 91111-1111
- **Papel:** `DENOMINATION_ADMIN`
- **Igreja:** Igreja Sede
- **Descrição:** Administrador da denominação - pode gerenciar todas as igrejas

**Permissões:**
- ✅ Acesso administrativo
- ✅ Gerenciar membros
- ✅ Gerenciar visitantes
- ✅ Gerenciar atividades
- ✅ Ver relatórios
- ✅ Gerenciar filiais

### 2. **Administrador da Igreja Sede**
- **Email:** `igreja.admin@teste.com`
- **Nome:** Admin Igreja Sede
- **Telefone:** (11) 92222-2222
- **Papel:** `CHURCH_ADMIN`
- **Igreja:** Igreja Sede
- **Descrição:** Administrador da igreja sede

**Permissões:**
- ✅ Acesso administrativo
- ✅ Gerenciar membros
- ✅ Gerenciar visitantes
- ✅ Gerenciar atividades
- ✅ Ver relatórios
- ✅ Gerenciar filiais

### 3. **Administrador da Igreja Filha**
- **Email:** `igreja.filha.admin@teste.com`
- **Nome:** Admin Igreja Filha
- **Telefone:** (11) 92223-2223
- **Papel:** `CHURCH_ADMIN`
- **Igreja:** Igreja Filha
- **Descrição:** Administrador da igreja filha

**Permissões:**
- ✅ Acesso administrativo
- ✅ Gerenciar membros
- ✅ Gerenciar visitantes
- ✅ Gerenciar atividades
- ✅ Ver relatórios
- ✅ Gerenciar filiais

### 4. **Pastor Principal**
- **Email:** `pastor@teste.com`
- **Nome:** Pastor Principal
- **Telefone:** (11) 93333-3333
- **Papel:** `PASTOR`
- **Igreja:** Igreja Sede
- **Descrição:** Pastor da igreja

**Permissões:**
- ✅ Acesso administrativo
- ✅ Gerenciar membros
- ✅ Gerenciar visitantes
- ✅ Gerenciar atividades
- ✅ Ver relatórios
- ❌ Gerenciar filiais (não por padrão)

### 5. **Secretário da Igreja**
- **Email:** `secretario@teste.com`
- **Nome:** Secretário Igreja
- **Telefone:** (11) 94444-4444
- **Papel:** `SECRETARY`
- **Igreja:** Igreja Sede
- **Descrição:** Secretário da igreja

**Permissões:**
- ✅ Acesso administrativo
- ✅ Gerenciar membros
- ✅ Gerenciar visitantes
- ❌ Gerenciar atividades
- ✅ Ver relatórios
- ❌ Gerenciar filiais

### 6. **Líder de Filial**
- **Email:** `lider@teste.com`
- **Nome:** Líder Filial Norte
- **Telefone:** (11) 95555-5555
- **Papel:** `LEADER`
- **Igreja:** Igreja Sede
- **Filiais Gerenciadas:** Apenas Filial Norte
- **Descrição:** Líder responsável pela filial norte

**Permissões:**
- ❌ Acesso administrativo
- ❌ Gerenciar membros
- ✅ Gerenciar visitantes
- ✅ Gerenciar atividades
- ❌ Ver relatórios
- ❌ Gerenciar filiais (exceto Filial Norte)

### 7. **Membro Comum**
- **Email:** `membro@teste.com`
- **Nome:** Membro Comum
- **Telefone:** (11) 96666-6666
- **Papel:** `MEMBER`
- **Igreja:** Igreja Sede
- **Descrição:** Membro comum da igreja

**Permissões:**
- ❌ Acesso administrativo
- ❌ Gerenciar membros
- ❌ Gerenciar visitantes
- ❌ Gerenciar atividades
- ❌ Ver relatórios
- ❌ Gerenciar filiais

### 8. **Usuário Somente Leitura**
- **Email:** `readonly@teste.com`
- **Nome:** Usuário Somente Leitura
- **Telefone:** (11) 97777-7777
- **Papel:** `READ_ONLY`
- **Igreja:** Igreja Sede
- **Descrição:** Usuário com acesso somente leitura

**Permissões:**
- ❌ Acesso administrativo
- ❌ Gerenciar membros
- ❌ Gerenciar visitantes
- ❌ Gerenciar atividades
- ❌ Ver relatórios
- ❌ Gerenciar filiais

---

## 🔑 Informações de Acesso

### Credenciais Padrão
- **Senha para todos os usuários:** `teste123`
- **Formato de login:** Email + senha
- **Perfis:** Todos têm perfis completos com dados pessoais

### Dados dos Perfis
- **Data de nascimento:** 01/01/1990
- **Gênero:** Masculino
- **Notificações por email:** Ativadas
- **Notificações por SMS:** Desativadas

---

## 🎯 Casos de Teste Cobertos

### 1. **Hierarquia de Denominação**
- **Usuário:** `denominacao.admin@teste.com`
- **Testa:** Gestão de múltiplas igrejas
- **Permissões:** Todas as permissões em todas as igrejas da denominação

### 2. **Administração de Igreja**
- **Usuários:** `igreja.admin@teste.com`, `igreja.filha.admin@teste.com`
- **Testa:** Gestão completa de uma igreja específica
- **Permissões:** Todas as permissões dentro de sua igreja

### 3. **Liderança Pastoral**
- **Usuário:** `pastor@teste.com`
- **Testa:** Permissões pastorais (sem gestão de filiais)
- **Permissões:** Administrativas, exceto gestão de filiais

### 4. **Secretariado**
- **Usuário:** `secretario@teste.com`
- **Testa:** Gestão de dados básicos (sem atividades)
- **Permissões:** Membros, visitantes e relatórios

### 5. **Liderança de Filial**
- **Usuário:** `lider@teste.com`
- **Testa:** Gestão restrita a filiais específicas
- **Permissões:** Apenas visitantes e atividades da Filial Norte

### 6. **Membro Comum**
- **Usuário:** `membro@teste.com`
- **Testa:** Acesso básico de membro
- **Permissões:** Apenas visualização de dados gerais

### 7. **Acesso Restrito**
- **Usuário:** `readonly@teste.com`
- **Testa:** Acesso somente leitura
- **Permissões:** Mínimas, apenas leitura

### 8. **Isolamento entre Igrejas**
- **Comparar:** `igreja.admin@teste.com` vs `igreja.filha.admin@teste.com`
- **Testa:** Cada admin só acessa sua própria igreja
- **Validação:** Isolamento multi-tenant

---

## 🧪 Como Usar para Testes

### Comandos de Gerenciamento

#### Criar usuários de teste
```bash
# Criar todos os usuários com senha padrão
python manage.py create_test_users

# Criar com senha personalizada
python manage.py create_test_users --password "minhasenha123"

# Limpar usuários existentes e criar novos
python manage.py create_test_users --clean

# Ver ajuda do comando
python manage.py help create_test_users
```

#### Limpar ambiente de teste
```bash
# Remove todos os usuários de teste
python manage.py create_test_users --clean
```

### Testes de Login

#### Via API
```bash
# Teste de login com curl
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "denominacao.admin@teste.com",
    "password": "teste123"
  }'
```

#### Via Interface Web
1. Acesse a página de login
2. Use qualquer email da lista acima
3. Senha: `teste123`

### Cenários de Teste Recomendados

#### 1. **Teste de Hierarquia**
```
1. Login como denominacao.admin@teste.com
2. Verificar acesso a ambas as igrejas
3. Login como igreja.admin@teste.com  
4. Verificar acesso apenas à Igreja Sede
```

#### 2. **Teste de Filiais**
```
1. Login como igreja.admin@teste.com
2. Verificar acesso a todas as 3 filiais
3. Login como lider@teste.com
4. Verificar acesso apenas à Filial Norte
```

#### 3. **Teste de Permissões**
```
1. Login como pastor@teste.com
2. Tentar gerenciar membros (deve funcionar)
3. Tentar gerenciar filiais (deve falhar)
4. Login como membro@teste.com
5. Tentar qualquer ação administrativa (deve falhar)
```

#### 4. **Teste de Isolamento**
```
1. Login como igreja.admin@teste.com
2. Verificar que só vê dados da Igreja Sede
3. Login como igreja.filha.admin@teste.com
4. Verificar que só vê dados da Igreja Filha
```

### Endpoints para Testar

#### Autenticação
- `POST /api/v1/auth/login/` - Login
- `GET /api/v1/users/me/` - Dados do usuário atual

#### Gestão de Usuários
- `GET /api/v1/users/` - Listar usuários
- `GET /api/v1/church-users/` - Usuários da igreja

#### Gestão de Igreja
- `GET /api/v1/churches/` - Listar igrejas
- `GET /api/v1/branches/` - Listar filiais

#### Gestão de Membros
- `GET /api/v1/members/` - Listar membros
- `POST /api/v1/members/` - Criar membro

#### Gestão de Visitantes
- `GET /api/v1/visitors/` - Listar visitantes
- `POST /api/v1/visitors/` - Criar visitante

---

## ⚠️ Avisos Importantes

### Segurança
- ✅ **Apenas para desenvolvimento/teste**
- ❌ **NUNCA usar em produção**
- 🔒 **Senhas são simples para facilitar testes**

### Limpeza
- Use `--clean` para remover dados de teste
- Dados são criados com prefixo "Teste" para identificação
- Comando é seguro e só remove dados de teste

### Manutenção
- Recrie os usuários após mudanças no sistema de permissões
- Verifique se as permissões estão corretas após atualizações
- Use para validar novos recursos antes do deploy

---

## 📋 Checklist de Testes

### Funcionalidades Básicas
- [ ] Login com cada tipo de usuário
- [ ] Verificar dados retornados na API `/users/me/`
- [ ] Testar logout

### Permissões por Papel
- [ ] Denomination Admin: acesso a todas as igrejas
- [ ] Church Admin: acesso apenas à sua igreja
- [ ] Pastor: permissões administrativas sem filiais
- [ ] Secretary: gestão de membros/visitantes
- [ ] Leader: apenas sua filial designada
- [ ] Member: apenas visualização
- [ ] Read Only: acesso mínimo

### Isolamento Multi-Tenant
- [ ] Igreja Sede vs Igreja Filha (isolamento completo)
- [ ] Filiais: acesso correto por usuário
- [ ] Dados não vazam entre igrejas

### Endpoints Protegidos
- [ ] Criar/editar membros (apenas admins)
- [ ] Gerenciar filiais (apenas admins com permissão)
- [ ] Ver relatórios (conforme permissão)
- [ ] Ações administrativas bloqueadas para membros

### Casos Extremos
- [ ] Usuário sem igreja (não deve acontecer)
- [ ] Usuário inativo
- [ ] Permissões conflitantes
- [ ] Acesso a recursos inexistentes

---

## 🔗 Documentação Relacionada

- [Sistema de Permissões e Papéis - Guia Completo](./Sistema%20de%20Permissões%20e%20Papéis%20-%20Guia%20Completo.md)
- [Modelo Conceitual — Obreiro Virtual](./Modelo%20Conceitual%20—%20Obreiro%20Virtual.md)

---

**Última atualização:** 10/07/2025  
**Versão:** 1.0  
**Autor:** Sistema Automatizado de Testes 