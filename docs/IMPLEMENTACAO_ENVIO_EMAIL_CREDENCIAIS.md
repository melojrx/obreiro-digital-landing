# 📧 IMPLEMENTAÇÃO COMPLETA DE ENVIO DE EMAIL COM SENHA AUTOGERADA

## ✅ Localização da Implementação

**Commit:** `5111eb3` - "feat: implementa envio automático de credenciais por email"  
**Data:** 7 de novembro de 2025, 10:21

---

## 🏗️ Arquitetura da Solução

### 1. EmailService Centralizado
📁 `backend/apps/core/services/email_service.py` (412 linhas)

```python
class EmailService:
    @staticmethod
    def send_welcome_credentials(
        member_name: str,
        user_email: str,
        user_password: str,
        church_name: str,
        role_display: str,
        role_code: str,
        **extra_context
    ) -> bool:
        # Renderiza templates HTML + TXT
        # Envia email multipart
        # Logs detalhados
```

**Recursos:**
- ✅ Templates HTML e texto puro
- ✅ Descrição automática de permissões por papel
- ✅ URLs dinâmicas para login
- ✅ Logging detalhado de sucesso/falha
- ✅ Tratamento robusto de erros

---

### 2. Geração Automática de Senha
📁 `backend/apps/members/serializers.py` (linha 454)

```python
import secrets

# Gera senha segura de 16 caracteres (URL-safe)
generated_password = secrets.token_urlsafe(12)

# Cria usuário com senha hasheada
user = User.objects.create_user(
    email=user_email,
    password=generated_password,  # Automaticamente hasheada
    full_name=member.full_name,
    phone=member.phone or '',
    is_active=True
)
```

**Segurança:**
- 🔒 Senha com 16 caracteres aleatórios URL-safe
- 🔒 Hash automático pelo Django (PBKDF2)
- 🔒 Admin **NUNCA** vê a senha
- 🔒 Senha enviada **UMA ÚNICA VEZ** por email

---

### 3. Fluxo de Envio
📁 `backend/apps/members/serializers.py` (linhas 482-521)

```python
# PASSO 1: Gerar senha
generated_password = secrets.token_urlsafe(12)

# PASSO 2: Criar usuário
user = User.objects.create_user(
    email=user_email,
    password=generated_password,
    full_name=member.full_name
)

# PASSO 3: Vincular ao membro
member.user = user
member.save()

# PASSO 4: Criar ChurchUser com papel
ChurchUser.objects.create(
    user=user,
    church=member.church,
    role=system_role
)

# PASSO 5: Enviar email
try:
    EmailService.send_welcome_credentials(
        member_name=member.full_name,
        user_email=user_email,
        user_password=generated_password,  # ← SENHA EM TEXTO PLANO
        church_name=member.church.name,
        role_display=role_display,
        role_code=system_role,
    )
    logger.info(f"✅ Email enviado para {user_email}")
except EmailServiceError as e:
    # NÃO FALHA a criação do membro
    logger.error(f"❌ Falha no email: {e}")
```

---

## 📧 Configuração de Email

### SMTP Gmail
📁 `backend/config/settings/base.py` (linhas 324-338)

```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = env('EMAIL_HOST_USER')  # suporteobreirovirtual@gmail.com
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD')  # App Password do Gmail
DEFAULT_FROM_EMAIL = 'suporteobreirovirtual@gmail.com'
```

### Variáveis de Ambiente (.env)
```bash
EMAIL_HOST_USER=suporteobreirovirtual@gmail.com
EMAIL_HOST_PASSWORD=xxxx xxxx xxxx xxxx  # App Password
FRONTEND_URL=http://localhost:5173
```

---

## 📄 Templates de Email

### HTML Template
📁 `backend/templates/emails/welcome_member.html` (65 linhas)
- Design responsivo com cores da marca
- Logo e branding
- Credenciais destacadas
- Botão CTA para login
- Descrição de permissões

### Texto Puro
📁 `backend/templates/emails/welcome_member.txt` (56 linhas)
```
================================================================================
SUAS CREDENCIAIS DE ACESSO
================================================================================

📧 E-mail: {{ user_email }}
🔐 Senha temporária: {{ user_password }}

⚠️  IMPORTANTE - SEGURANÇA DA CONTA
• Esta é uma senha temporária gerada automaticamente
• Recomendamos fortemente que você altere sua senha após o primeiro acesso
```

---

## 🎨 Frontend Atualizado

### Removido Campo de Senha Manual
📁 `frontend/src/components/members/MemberForm.tsx`

**ANTES:**
```tsx
<Input type="password" placeholder="Digite a senha" />
```

**DEPOIS:**
```tsx
<Alert>
  🔐 Uma senha segura será gerada automaticamente 
  e enviada para o email do usuário
</Alert>
```

**Toast Diferenciado:**
```tsx
toast.success(
  'Membro criado! Um email com as credenciais foi enviado para ' + email
)
```

---

## 🔒 Segurança Implementada

### 1. Sem Armazenamento de Senha em Texto Plano
- Senha hasheada ANTES de salvar no banco
- Django usa PBKDF2_SHA256 (100.000 iterações)

### 2. Multi-Tenant Seguro
- Mesmo email pode existir em igrejas diferentes
- Removida constraint de email único global
- Validação por escopo de denominação/igreja

### 3. Logs Detalhados
```python
logger.info(f"🔐 Gerando credenciais para {member.full_name}")
logger.info(f"✅ Email enviado para {user_email}")
logger.error(f"❌ Falha no envio: {error}")
```

### 4. Falha Graceful
- Se email falhar, usuário é criado normalmente
- Admin é notificado no log
- Membro não é deletado

---

## 📋 Casos de Uso

### Caso 1: Criar Membro + Conceder Acesso
1. Admin preenche formulário de membro
2. Marca checkbox "Conceder acesso ao sistema"
3. Seleciona papel (Church Admin ou Secretary)
4. Submete formulário
5. **Sistema:**
   - ✅ Cria registro de membro
   - ✅ Gera senha aleatória (16 chars)
   - ✅ Cria usuário com senha hasheada
   - ✅ Vincula ChurchUser com papel
   - ✅ Envia email com credenciais
   - ✅ Toast: "Email enviado para usuario@exemplo.com"

### Caso 2: Editar Membro + Conceder Acesso
1. Admin edita membro existente (sem usuário)
2. Marca "Conceder acesso ao sistema"
3. Submete
4. **Mesmo fluxo do Caso 1**

---

## 🧪 Como Testar

### 1. Configurar Email (Dev)
```bash
# .env_dev
EMAIL_HOST_USER=suporteobreirovirtual@gmail.com
EMAIL_HOST_PASSWORD=xxxxxxxxxxxx  # App Password do Gmail
FRONTEND_URL=http://localhost:5173
```

### 2. Criar Membro com Acesso
```bash
# Acessar sistema
http://localhost:5173/membros/novo

# Preencher:
- Nome: João Teste
- Email: seuemail@gmail.com
- ✅ Conceder acesso ao sistema
- Papel: Secretário(a)

# Submeter
```

### 3. Verificar Email
- Abrir caixa de entrada de `seuemail@gmail.com`
- Email de: `suporteobreirovirtual@gmail.com`
- Assunto: "Bem-vindo ao Obreiro Digital - [Nome da Igreja]"
- Conteúdo: Credenciais de acesso

### 4. Verificar Logs
```bash
docker compose -f docker-compose.dev.yml logs backend | grep "🔐\|✅\|❌"
```

---

## 📊 Estatísticas da Implementação

- **22 arquivos alterados**
- **+2.089 linhas** adicionadas
- **-273 linhas** removidas
- **3 templates** de email
- **1 serviço** centralizado (EmailService)
- **2 migrações** (remove unique email constraint)
- **1 dependência** adicionada (django-templated-mail)

---

## ✅ Resumo da Implementação

A implementação está **COMPLETA** e **FUNCIONAL** com:

1. ✅ **Geração automática** de senha (16 caracteres seguros)
2. ✅ **Envio por email** (HTML + texto puro)
3. ✅ **Templates profissionais** com branding
4. ✅ **Multi-tenant** seguro (mesmo email em igrejas diferentes)
5. ✅ **Logs detalhados** para debugging
6. ✅ **Frontend atualizado** (sem campo de senha manual)
7. ✅ **Configuração SMTP** com Gmail
8. ✅ **Documentação completa** em `/docs/PLANO_ENVIO_EMAIL_CREDENCIAIS.md`

A senha **NUNCA** é exibida para o admin e é enviada **UMA ÚNICA VEZ** por email! 🎉
