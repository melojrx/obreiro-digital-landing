# 🔒 Segurança de Papéis - Obreiro Digital

## ⚠️ **AVISO CRÍTICO DE SEGURANÇA**

Os papéis **Super Admin** e **Platform Admin** são **EXCLUSIVOS** para os **donos e desenvolvedores da plataforma**. Estes papéis **JAMAIS** devem ser atribuídos a clientes ou usuários finais.

---

## 🚫 **Papéis Restritos (APENAS Plataforma)**

### **SUPER_ADMIN**
- **Descrição:** Administrador supremo da plataforma
- **Acesso:** Controle total sobre toda a plataforma
- **Criação:** **APENAS via comando Django** pelos desenvolvedores
- **Uso:** Desenvolvimento, manutenção e administração da plataforma

### **PLATFORM_ADMIN** 
- **Descrição:** Administrador da plataforma SaaS
- **Acesso:** Gestão de denominações, estatísticas globais
- **Criação:** **APENAS via comando Django** pelos desenvolvedores  
- **Uso:** Gestão comercial da plataforma, suporte técnico

---

## ✅ **Papéis Disponíveis para Clientes**

### **DENOMINATION_ADMIN**
- **Descrição:** Administrador de denominação (maior nível para clientes)
- **Acesso:** Gestão completa de sua denominação
- **Criação:** Via interface da plataforma
- **Limitações:** Apenas sua própria denominação

### **CHURCH_ADMIN**
- **Descrição:** Administrador de igreja
- **Acesso:** Gestão de uma igreja específica
- **Criação:** Via interface da plataforma
- **Limitações:** Apenas sua própria igreja

### **PASTOR**
- **Descrição:** Pastor de igreja
- **Acesso:** Gestão pastoral limitada
- **Criação:** Via interface da plataforma
- **Limitações:** Sem acesso administrativo completo

### **SECRETARY / LEADER / MEMBER**
- **Descrição:** Papéis operacionais
- **Acesso:** Funcionalidades específicas limitadas
- **Criação:** Via interface da plataforma
- **Limitações:** Sem acesso administrativo

---

## 🛡️ **Medidas de Segurança Implementadas**

### **Backend (Django)**

#### **1. Validação no Serializer**
```python
def validate_role(self, value):
    """Validar que SUPER_ADMIN não pode ser atribuído via cadastro"""
    if value == RoleChoices.SUPER_ADMIN:
        raise serializers.ValidationError(
            "O papel de Super Administrador não pode ser atribuído via cadastro. "
            "Este papel é reservado apenas para desenvolvedores da plataforma."
        )
    return value
```

#### **2. Permissões Restritivas nas Views**
```python
def get_permissions(self):
    if self.action == 'create':
        # APENAS PLATFORM ADMINS podem criar denominações
        permission_classes = [IsPlatformAdmin]
    elif self.action == 'platform_stats':
        permission_classes = [IsPlatformAdmin]
    # ... outros endpoints
```

#### **3. Endpoints Protegidos**
- `POST /api/v1/denominations/` → **APENAS IsPlatformAdmin**
- `GET /api/v1/denominations/platform_stats/` → **APENAS IsPlatformAdmin**

### **Frontend (React + TypeScript)**

#### **1. Papéis Removidos do Mapeamento**
```typescript
// SUPER_ADMIN: Removido - apenas para desenvolvedores via comando Django
const ROLE_PERMISSIONS = {
  DENOMINATION_ADMIN: { /* permissões */ },
  // ...outros papéis de cliente
}
```

#### **2. Menu Condicional**
```typescript
// Seção hierárquica - APENAS para Denomination Admins (clientes premium)
// SUPER_ADMIN é apenas para desenvolvedores da plataforma
...(permissions.canManageDenomination || permissions.canCreateChurches ? [
  /* menu hierárquico */
] : [])
```

---

## 🔧 **Comandos para Criação de Papéis Restritos**

### **Super Admin**
```bash
# APENAS para desenvolvedores da plataforma
python manage.py shell
from django.contrib.auth import get_user_model
from apps.core.models import RoleChoices

User = get_user_model()
user = User.objects.create_superuser('admin@plataforma.com', 'senha_segura')
```

### **Platform Admin**
```bash
# APENAS para equipe da plataforma
python manage.py promote_to_platform_admin user@plataforma.com
```

---

## ⚡ **Verificações Automáticas**

### **1. Testes de Segurança**
```python
# Testar se clientes não podem criar SUPER_ADMIN
def test_cannot_create_super_admin():
    serializer = ChurchUserCreateSerializer(data={
        'role': RoleChoices.SUPER_ADMIN,
        # ... outros dados
    })
    assert not serializer.is_valid()
    assert 'role' in serializer.errors
```

### **2. Logs de Segurança**
- Tentativas de acesso a endpoints restritos
- Criação/alteração de papéis administrativos
- Acesso a funcionalidades de plataforma

### **3. Monitoramento**
- Alertas para atividades suspeitas
- Auditoria de permissões
- Relatórios de acesso

---

## 🚨 **Alertas de Segurança**

### **Cenários de Risco**
1. **Cliente solicitando papel SUPER_ADMIN**
   - ❌ **NUNCA** conceder
   - ✅ Explicar que é exclusivo da plataforma
   - ✅ Oferecer DENOMINATION_ADMIN como alternativa

2. **Tentativa de bypass de validações**
   - ❌ Investigar imediatamente
   - ✅ Revisar logs de segurança
   - ✅ Reforçar validações se necessário

3. **Acesso não autorizado a endpoints restritos**
   - ❌ Bloquear acesso imediatamente
   - ✅ Analisar origem do acesso
   - ✅ Implementar medidas adicionais

---

## 📋 **Checklist de Segurança**

### **Para Desenvolvedores**
- [ ] SUPER_ADMIN criado apenas via comando
- [ ] Platform endpoints protegidos com IsPlatformAdmin
- [ ] Validação de papéis no serializer
- [ ] Testes de segurança implementados

### **Para Administradores da Plataforma**
- [ ] Monitoramento de tentativas de acesso indevido
- [ ] Logs de auditoria funcionando
- [ ] Alertas configurados para atividades suspeitas
- [ ] Backup regular das configurações de segurança

### **Para Suporte ao Cliente**
- [ ] Treinamento sobre limitações de papéis
- [ ] Scripts para explicar hierarquia de permissões
- [ ] Alternativas para atender necessidades dos clientes
- [ ] Escalação para casos de tentativa de bypass

---

## 🎯 **Resumo**

✅ **SUPER_ADMIN e PLATFORM_ADMIN são papéis EXCLUSIVOS da plataforma**  
✅ **Clientes têm acesso apenas a DENOMINATION_ADMIN como papel máximo**  
✅ **Validações robustas implementadas no backend e frontend**  
✅ **Sistema de monitoramento e alertas em funcionamento**  
✅ **Documentação e treinamento atualizados**

**A segurança da plataforma está garantida através destas medidas implementadas.**

---

**🔒 Documento Confidencial - Apenas para Equipe da Plataforma**