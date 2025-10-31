# Correção de Segurança Crítica - Issue #37
**Bug Crítico: Secretária pode se autopromover a Administrador**

## 📋 Resumo das Implementações

### 🔒 Validações de Segurança Implementadas

#### 1. **Novo Endpoint Seguro para Atualização de Roles**
**Arquivo:** `backend/apps/accounts/views.py`

- ✅ Criado endpoint `update_user_role(request, user_id)` com validações completas
- ✅ **VALIDAÇÃO CRÍTICA**: Usuário NÃO pode modificar suas próprias permissões
- ✅ Apenas Church Admin ou superior pode modificar roles
- ✅ Logging completo de auditoria para todas as mudanças

**URL:** `PATCH /api/v1/auth/users/<user_id>/update-role/`

**Validações Implementadas:**
```python
# 1. Bloqueia auto-modificação
if str(user_id) == str(current_user.id):
    raise PermissionDenied("Você não pode modificar suas próprias permissões")

# 2. Verifica hierarquia
allowed_to_modify = requesting_church_user.role in [
    RoleChoices.SUPER_ADMIN,
    RoleChoices.CHURCH_ADMIN
]

# 3. Log de auditoria
security_logger.info(f"ROLE_CHANGE: User {target_user.id} role changed from {old_role} to {new_role}")
```

#### 2. **Validação no assign_admin (Churches)**
**Arquivo:** `backend/apps/churches/views.py`

- ✅ Impede que usuário se auto-atribua roles
- ✅ Log de auditoria para todas as atribuições de permissões

```python
# Validação crítica adicionada
if str(user_id) == str(request.user.id):
    raise PermissionDenied("Você não pode atribuir permissões a si mesmo")
```

#### 3. **Logging de Auditoria em create_system_user**
**Arquivo:** `backend/apps/members/views.py`

- ✅ Logs de auditoria para criação e mudança de roles via membros
- ✅ Rastreamento completo de quem fez a mudança e quando

```python
security_logger.info(
    f"ROLE_ASSIGNMENT via create_system_user: Member {member.id} "
    f"assigned role {normalized_role} by user {request.user.id}"
)
```

## 🔍 Pontos Críticos de Segurança

### ❌ Problema Original
Maria (secretária) podia:
1. Acessar suas próprias configurações de perfil
2. Modificar seu próprio role de `SECRETARY` para `CHURCH_ADMIN`
3. Obter privilégios de administrador sem autorização

### ✅ Solução Implementada
Agora o sistema:
1. **Bloqueia** qualquer tentativa de auto-modificação de permissões
2. **Valida** hierarquia de roles em todos os endpoints relevantes
3. **Registra** todas as tentativas (autorizadas e não autorizadas) em logs de segurança
4. **Exige** que apenas Church Admin ou superior modifiquem roles

## 📝 Logs de Auditoria

Todos os eventos de mudança de permissão agora geram logs no formato:

```
ROLE_CHANGE: User 123 (maria@igreja.com) role changed from secretary to church_admin 
in church 45 (Igreja Exemplo) by user 456 (marcia@igreja.com)
```

### Eventos Registrados:
- ✅ Mudanças de role bem-sucedidas
- ✅ Tentativas de auto-modificação bloqueadas (SECURITY ALERT)
- ✅ Tentativas de modificação sem permissão (SECURITY ALERT)
- ✅ Atribuição de roles via múltiplos endpoints

## 🧪 Cenários de Teste

### Teste 1: Auto-modificação Bloqueada ✅
```bash
# Maria tenta se autopromover
curl -X PATCH /api/v1/auth/users/123/update-role/ \
  -H "Authorization: Token maria_token" \
  -d '{"role": "church_admin", "church_id": 1}'

# Resposta esperada: 403 Forbidden
# {"detail": "Você não pode modificar suas próprias permissões"}
```

### Teste 2: Hierarquia Respeitada ✅
```bash
# Maria (secretary) tenta promover outro usuário
curl -X PATCH /api/v1/auth/users/789/update-role/ \
  -H "Authorization: Token maria_token" \
  -d '{"role": "church_admin", "church_id": 1}'

# Resposta esperada: 403 Forbidden
# {"detail": "Apenas administradores da igreja podem modificar permissões"}
```

### Teste 3: Church Admin Pode Gerenciar ✅
```bash
# Marcia (church_admin) promove usuário
curl -X PATCH /api/v1/auth/users/789/update-role/ \
  -H "Authorization: Token marcia_token" \
  -d '{"role": "secretary", "church_id": 1}'

# Resposta esperada: 200 OK
# {"message": "Permissão atualizada com sucesso..."}
```

## 📂 Arquivos Modificados

1. **backend/apps/accounts/views.py**
   - Adicionado import de `logging` e `PermissionDenied`
   - Criado logger `security_logger`
   - Implementado endpoint `update_user_role()`

2. **backend/apps/accounts/urls.py**
   - Adicionado import `update_user_role`
   - Registrada rota `users/<int:user_id>/update-role/`

3. **backend/apps/churches/views.py**
   - Validação anti-auto-atribuição em `assign_admin()`
   - Melhorado logging de auditoria

4. **backend/apps/members/views.py**
   - Adicionado import de `logging`
   - Criado logger `security_logger`
   - Logs de auditoria em `create_system_user()`

## 🎯 Frontend (Nota)

**IMPORTANTE**: O PersonalDataForm.tsx atual NÃO envia dados de role, portanto NÃO permite edição de permissões via interface de perfil pessoal.

Se futuramente for adicionada interface para editar roles:
- ⚠️ Ocultar campo role quando `currentUser.id === editingUser.id`
- ⚠️ Validar permissões no frontend para exibir apenas opções permitidas
- ⚠️ Backend já está protegido e bloqueará tentativas inválidas

## ✅ Checklist de Implementação

- [x] Validação backend para bloquear auto-modificação
- [x] Validação de hierarquia de permissões
- [x] Logging completo de auditoria
- [x] Proteção em todos os endpoints relevantes
- [x] Documentação das mudanças
- [ ] Testes unitários
- [ ] Testes de integração
- [ ] Deploy em produção
- [ ] Revisão de segurança

## 🔐 Recomendações de Segurança

1. **Monitoramento**: Configure alertas para logs com "SECURITY ALERT"
2. **Auditoria Regular**: Revisar logs de mudanças de permissão periodicamente
3. **2FA**: Considerar autenticação de dois fatores para Church Admins
4. **Rate Limiting**: Limitar tentativas de modificação de permissões
5. **Testes Penetration**: Realizar testes de segurança completos

## 📞 Contato

Para questões sobre esta implementação, consulte a Issue #37 no GitHub.

---

**Data de Implementação**: 31/10/2025  
**Severidade Original**: 🔴 CRÍTICA  
**Status**: ✅ CORRIGIDO
