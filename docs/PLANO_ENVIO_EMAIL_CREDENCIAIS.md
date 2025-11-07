# 📧 Plano de Implementação: Envio de Senha por E-mail

## 🎯 Objetivo
Implementar sistema de envio automático de credenciais de acesso por e-mail quando um membro recebe permissões no sistema.

---

## 📊 Análise da Funcionalidade Atual

### Fluxo Existente:
1. **Criação de Membro** → Aba "Informações Adicionais" → Opção de dar acesso
2. **Edição de Membro** → Aba "Informações Adicionais" → Opção de dar acesso

### Pontos a Investigar:
- ✅ Como é criado o usuário quando damos "acesso ao sistema"?
- ✅ A senha é gerada automaticamente ou o admin define?
- ✅ Qual modelo armazena essa relação (Member → CustomUser)?
- ✅ Quais perfis/roles podem ser atribuídos?

---

## 🏗️ Arquitetura da Solução

### **Backend (Django)**

#### 1️⃣ **Configuração de E-mail**

**Arquivo:** `backend/config/settings/base.py` e `.env_dev` / `.env_prod`

```python
# backend/config/settings/base.py

# Configuração de E-mail
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='suporteobreirovirtual@gmail.com')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD')  # Senha de App
DEFAULT_FROM_EMAIL = 'Obreiro Virtual <suporteobreirovirtual@gmail.com>'
```

**Variáveis de Ambiente:**
```bash
# .env_dev e .env_prod
EMAIL_HOST_USER=suporteobreirovirtual@gmail.com
EMAIL_HOST_PASSWORD=wgrx obiv jefb cjat
```

⚠️ **IMPORTANTE**: 
- Usar **Senha de App** do Gmail (não a senha normal)
- Senha de App fornecida: `wgrx obiv jefb cjat`
- Manter em variável de ambiente (nunca commitar)

---

#### 2️⃣ **Dependências**

**Adicionar ao:** `backend/requirements.txt`

```txt
# E-mail Templates
django-templated-mail>=1.1.1
```

**Instalar:**
```bash
docker-compose -f docker-compose.dev.yml exec backend pip install django-templated-mail
```

---

#### 3️⃣ **Configuração do django-templated-mail**

**Adicionar ao:** `backend/config/settings/base.py`

```python
INSTALLED_APPS = [
    # ... apps existentes
    'templated_mail',  # Adicionar
]

# Configuração de templates de e-mail
TEMPLATED_EMAIL_BACKEND = 'templated_mail.mail.TemplatedHTMLEmailMessageView'
TEMPLATED_EMAIL_FILE_EXTENSION = 'html'
```

---

#### 4️⃣ **Estrutura de Templates de E-mail**

**Criar estrutura:**
```
backend/templates/emails/
├── base.html                    # Layout base
├── welcome_member.html          # Boas-vindas + credenciais
├── welcome_member.txt           # Versão texto plano
└── components/
    ├── header.html              # Cabeçalho padrão
    └── footer.html              # Rodapé padrão
```

**Template Base:** `backend/templates/emails/base.html`

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .content {
            padding: 40px 30px;
        }
        .credentials {
            background: #f9fafb;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 25px 0;
            border-radius: 4px;
        }
        .credentials h3 {
            margin-top: 0;
            color: #1f2937;
            font-size: 16px;
        }
        .credentials p {
            margin: 10px 0;
            font-size: 14px;
        }
        .credentials code {
            background: white;
            padding: 8px 12px;
            border-radius: 4px;
            border: 1px solid #e5e7eb;
            font-size: 14px;
            color: #1f2937;
            font-family: 'Courier New', monospace;
            font-weight: 600;
        }
        .button {
            display: inline-block;
            background: #3b82f6;
            color: white !important;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 25px;
            font-weight: 600;
            transition: background 0.2s;
        }
        .button:hover {
            background: #2563eb;
        }
        .warning-box {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .warning-box strong {
            color: #92400e;
        }
        .warning-box ul {
            margin: 10px 0 0 0;
            padding-left: 20px;
        }
        .warning-box li {
            color: #78350f;
            margin: 5px 0;
        }
        .footer {
            background: #f9fafb;
            padding: 30px;
            text-align: center;
            color: #6b7280;
            font-size: 13px;
            border-top: 1px solid #e5e7eb;
        }
        .footer p {
            margin: 8px 0;
        }
        .footer a {
            color: #3b82f6;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        {% block content %}{% endblock %}
    </div>
</body>
</html>
```

**Template de Boas-vindas:** `backend/templates/emails/welcome_member.html`

```html
{% extends "emails/base.html" %}

{% block content %}
<div class="header">
    <h1>🙏 Bem-vindo ao Obreiro Virtual</h1>
</div>

<div class="content">
    <p>Olá <strong>{{ user_name }}</strong>,</p>
    
    <p>Você recebeu acesso ao sistema <strong>Obreiro Virtual</strong> da <strong>{{ church_name }}</strong>!</p>
    
    <p>Agora você pode acessar a plataforma e gerenciar as atividades da igreja de forma digital e organizada.</p>
    
    <div class="credentials">
        <h3>📧 Suas credenciais de acesso:</h3>
        <p><strong>E-mail:</strong> {{ email }}</p>
        <p><strong>Senha temporária:</strong> <code>{{ password }}</code></p>
    </div>
    
    <div class="warning-box">
        <p><strong>⚠️ Importante - Segurança:</strong></p>
        <ul>
            <li>Altere sua senha no primeiro acesso ao sistema</li>
            <li>Não compartilhe suas credenciais com outras pessoas</li>
            <li>Guarde este e-mail em local seguro</li>
            <li>Em caso de dúvidas, contate o administrador</li>
        </ul>
    </div>
    
    <center>
        <a href="{{ login_url }}" class="button">🚀 Acessar Sistema Agora</a>
    </center>
    
    <p style="margin-top: 35px; color: #6b7280; font-size: 14px;">
        Se tiver dúvidas ou precisar de ajuda, entre em contato conosco: 
        <a href="mailto:{{ support_email }}" style="color: #3b82f6; text-decoration: none;">{{ support_email }}</a>
    </p>
</div>

<div class="footer">
    <p><strong>Obreiro Virtual</strong> - Sistema de Gestão Eclesiástica</p>
    <p>© 2025 Todos os direitos reservados</p>
    <p style="margin-top: 15px; font-size: 12px;">
        Este é um e-mail automático, por favor não responda.<br>
        Para suporte, utilize: <a href="mailto:{{ support_email }}">{{ support_email }}</a>
    </p>
</div>
{% endblock %}
```

**Versão Texto Plano:** `backend/templates/emails/welcome_member.txt`

```text
Olá {{ user_name }},

Você recebeu acesso ao sistema Obreiro Virtual da {{ church_name }}!

SUAS CREDENCIAIS DE ACESSO:
---------------------------
E-mail: {{ email }}
Senha temporária: {{ password }}

IMPORTANTE - SEGURANÇA:
- Altere sua senha no primeiro acesso ao sistema
- Não compartilhe suas credenciais com outras pessoas
- Guarde este e-mail em local seguro

ACESSAR SISTEMA:
{{ login_url }}

Dúvidas? Entre em contato: {{ support_email }}

---
Obreiro Virtual - Sistema de Gestão Eclesiástica
© 2025 Todos os direitos reservados

Este é um e-mail automático, por favor não responda.
```

---

#### 5️⃣ **Serviço de E-mail**

**Criar:** `backend/apps/core/services/email_service.py`

```python
"""
Serviço centralizado para envio de e-mails do sistema
"""
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """Serviço centralizado para envio de e-mails"""
    
    @staticmethod
    def send_welcome_credentials(user, password, church_name):
        """
        Envia e-mail de boas-vindas com credenciais de primeiro acesso
        
        Args:
            user (CustomUser): Instância do usuário criado
            password (str): Senha em texto plano (antes de hashear)
            church_name (str): Nome da igreja
            
        Returns:
            bool: True se enviado com sucesso, False caso contrário
        """
        subject = f'Bem-vindo ao Obreiro Virtual - {church_name}'
        
        # Contexto para o template
        context = {
            'user_name': user.full_name,
            'email': user.email,
            'password': password,
            'church_name': church_name,
            'login_url': f'{settings.FRONTEND_URL}/login',
            'support_email': settings.DEFAULT_FROM_EMAIL,
        }
        
        # Renderizar templates
        html_content = render_to_string('emails/welcome_member.html', context)
        text_content = render_to_string('emails/welcome_member.txt', context)
        
        # Criar e-mail
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email],
        )
        email.attach_alternative(html_content, "text/html")
        
        # Enviar
        try:
            email.send()
            logger.info(
                f'✅ E-mail de boas-vindas enviado com sucesso para {user.email} '
                f'(Igreja: {church_name})'
            )
            return True
        except Exception as e:
            logger.error(
                f'❌ Erro ao enviar e-mail para {user.email}: {str(e)}',
                exc_info=True
            )
            return False
    
    @staticmethod
    def send_access_granted(user, church_name):
        """
        Envia e-mail informando que acesso foi concedido posteriormente
        (quando usuário já existe mas recebe novo acesso)
        
        Args:
            user (CustomUser): Instância do usuário
            church_name (str): Nome da igreja
            
        Returns:
            bool: True se enviado com sucesso, False caso contrário
        """
        # TODO: Implementar em fase futura
        pass
```

**Criar:** `backend/apps/core/services/__init__.py`

```python
from .email_service import EmailService

__all__ = ['EmailService']
```

---

#### 6️⃣ **Modificações no Serializer de Members**

**Arquivo:** `backend/apps/members/serializers.py`

**Adicionar imports:**
```python
from apps.core.services import EmailService
from django.contrib.auth.hashers import make_password
import secrets
import logging

logger = logging.getLogger(__name__)
```

**Modificar método `create`:**
```python
def create(self, validated_data):
    """
    Cria um novo membro e, se solicitado, cria usuário com acesso ao sistema
    """
    # Extrair dados de acesso (se fornecidos)
    grant_access = validated_data.pop('grant_system_access', False)
    user_role = validated_data.pop('user_role', None)
    
    # Criar membro
    member = super().create(validated_data)
    
    # Se deve dar acesso ao sistema
    if grant_access and user_role and member.email:
        try:
            # Gerar senha segura automaticamente
            password = secrets.token_urlsafe(12)  # ~16 caracteres
            
            # Criar usuário
            user = CustomUser.objects.create(
                email=member.email,
                full_name=member.full_name,
                church=member.church,
                role=user_role,
                password=make_password(password),  # Hashear senha
                is_active=True,
                is_profile_complete=True,
            )
            
            # Associar membro ao usuário
            member.user = user
            member.save()
            
            # 📧 ENVIAR E-MAIL COM CREDENCIAIS
            email_sent = EmailService.send_welcome_credentials(
                user=user,
                password=password,  # ⚠️ Única vez que temos senha em texto plano
                church_name=member.church.name
            )
            
            if email_sent:
                logger.info(
                    f'✅ Membro {member.full_name} criado com acesso ao sistema. '
                    f'E-mail enviado para {member.email}'
                )
            else:
                logger.warning(
                    f'⚠️ Membro {member.full_name} criado com acesso, '
                    f'mas falha ao enviar e-mail para {member.email}'
                )
            
        except Exception as e:
            logger.error(
                f'❌ Erro ao criar usuário para membro {member.full_name}: {str(e)}',
                exc_info=True
            )
            # Não falhar a criação do membro se der erro no usuário
            # Pode ser tratado posteriormente
    
    return member


def update(self, instance, validated_data):
    """
    Atualiza membro e, se necessário, concede acesso ao sistema
    """
    # Extrair dados de acesso
    grant_access = validated_data.pop('grant_system_access', False)
    user_role = validated_data.pop('user_role', None)
    
    # Atualizar dados do membro
    instance = super().update(instance, validated_data)
    
    # Se deve dar acesso e ainda não tem usuário
    if grant_access and user_role and not instance.user and instance.email:
        try:
            # Gerar senha segura
            password = secrets.token_urlsafe(12)
            
            # Criar usuário
            user = CustomUser.objects.create(
                email=instance.email,
                full_name=instance.full_name,
                church=instance.church,
                role=user_role,
                password=make_password(password),
                is_active=True,
                is_profile_complete=True,
            )
            
            # Associar ao membro
            instance.user = user
            instance.save()
            
            # 📧 ENVIAR E-MAIL
            email_sent = EmailService.send_welcome_credentials(
                user=user,
                password=password,
                church_name=instance.church.name
            )
            
            if email_sent:
                logger.info(
                    f'✅ Acesso concedido ao membro {instance.full_name}. '
                    f'E-mail enviado para {instance.email}'
                )
            else:
                logger.warning(
                    f'⚠️ Acesso concedido ao membro {instance.full_name}, '
                    f'mas falha ao enviar e-mail para {instance.email}'
                )
                
        except Exception as e:
            logger.error(
                f'❌ Erro ao conceder acesso ao membro {instance.full_name}: {str(e)}',
                exc_info=True
            )
    
    return instance
```

---

### **Frontend (React/TypeScript)**

#### 7️⃣ **Modificações na Interface de Membros**

**Arquivo:** `frontend/src/components/members/MemberForm.tsx`

**Mudanças na aba "Informações Adicionais":**

```tsx
import { Mail, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// ... dentro do JSX da aba "Informações Adicionais"

<div className="space-y-4">
  <div className="flex items-center space-x-2">
    <Checkbox 
      id="grant_access"
      checked={grantAccess}
      onCheckedChange={(checked) => {
        setGrantAccess(checked);
        if (!checked) {
          setUserRole(null);
        }
      }}
    />
    <Label htmlFor="grant_access" className="font-medium">
      Dar acesso ao sistema
    </Label>
  </div>
  
  {grantAccess && (
    <div className="space-y-4 pl-6 border-l-2 border-blue-200">
      {/* Seleção de Perfil/Role */}
      <div className="space-y-2">
        <Label htmlFor="user_role">Perfil de Acesso *</Label>
        <Select 
          value={userRole || ''} 
          onValueChange={(value) => setUserRole(value)}
          required
        >
          <SelectTrigger id="user_role">
            <SelectValue placeholder="Selecione o perfil" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MEMBER_USER">
              👤 Membro - Acesso básico
            </SelectItem>
            <SelectItem value="BRANCH_MANAGER">
              🏛️ Gestor de Filial - Gerencia congregações
            </SelectItem>
            {/* Adicionar outros roles conforme necessário */}
          </SelectContent>
        </Select>
      </div>
      
      {/* Validação: E-mail obrigatório */}
      {!formData.email && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>E-mail obrigatório</AlertTitle>
          <AlertDescription>
            Para dar acesso ao sistema, é necessário informar um e-mail válido 
            na aba <strong>"Dados Pessoais"</strong>.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Informação sobre envio de e-mail */}
      {formData.email && (
        <Alert className="border-blue-200 bg-blue-50">
          <Mail className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900">
            E-mail será enviado automaticamente
          </AlertTitle>
          <AlertDescription className="text-blue-800">
            As credenciais de acesso serão enviadas para:{' '}
            <strong>{formData.email}</strong>
            <br />
            <span className="text-sm text-blue-700 mt-1 block">
              O membro receberá um e-mail com senha temporária e instruções de primeiro acesso.
            </span>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )}
</div>
```

---

#### 8️⃣ **Feedback Visual ao Criar/Editar Membro**

**Atualizar toast de sucesso:**

```typescript
// Após criar ou editar membro com sucesso

toast({
  title: "✅ Membro salvo com sucesso!",
  description: grantAccess ? (
    <div className="space-y-1 mt-2">
      <p className="font-medium">📧 E-mail com credenciais enviado</p>
      <p className="text-sm text-muted-foreground">
        O membro {memberData.full_name} receberá as instruções de acesso em {memberData.email}
      </p>
    </div>
  ) : (
    "As informações do membro foram salvas."
  ),
  duration: 5000,
});
```

---

## 🔒 Segurança e Boas Práticas

### ✅ **Checklist de Segurança:**

- [x] **Senha Gerada Automaticamente**
  - ❌ NÃO permitir admin definir senha
  - ✅ Usar `secrets.token_urlsafe(12)` (forte e aleatória)
  - ✅ Mínimo 12 caracteres (~16 com codificação)

- [x] **Senha em Texto Plano**
  - ⚠️ NUNCA armazenar em banco
  - ✅ Hashear imediatamente com `make_password()`
  - ✅ Passar para e-mail ANTES de hashear
  - ✅ Não logar senha em logs (apenas sucesso/falha)

- [x] **E-mail Gmail**
  - ✅ Usar **Senha de App**: `wgrx obiv jefb cjat`
  - ✅ Armazenar em `.env` (nunca commitar)
  - ✅ Usar variável de ambiente em produção

- [x] **Validações**
  - ✅ E-mail válido obrigatório para dar acesso
  - ✅ E-mail único (validação do model CustomUser)
  - ✅ Verificar se membro já tem usuário associado

- [x] **LGPD/Privacidade**
  - ✅ Informar ao admin que e-mail será enviado
  - ✅ Mostrar para qual e-mail será enviado
  - ✅ Logar tentativas de envio (auditoria)

---

## 🧪 Testes a Implementar

### Backend:

**Arquivo:** `backend/apps/members/tests/test_email_sending.py`

```python
from django.test import TestCase
from django.core import mail
from apps.members.models import Member
from apps.accounts.models import CustomUser

class MemberEmailTestCase(TestCase):
    
    def test_create_member_with_access_sends_email(self):
        """Criar membro com acesso deve enviar e-mail"""
        # TODO: Implementar
        
    def test_email_not_sent_without_access(self):
        """Criar membro sem acesso NÃO deve enviar e-mail"""
        # TODO: Implementar
        
    def test_email_contains_credentials(self):
        """E-mail deve conter e-mail e senha"""
        # TODO: Implementar
        
    def test_password_is_hashed_in_database(self):
        """Senha no banco deve estar hasheada"""
        # TODO: Implementar
        
    def test_duplicate_user_email_raises_error(self):
        """E-mail duplicado deve gerar erro"""
        # TODO: Implementar
        
    def test_member_without_email_cannot_get_access(self):
        """Membro sem e-mail não pode receber acesso"""
        # TODO: Implementar
```

### Frontend:

**Arquivo:** `frontend/src/components/members/__tests__/MemberForm.test.tsx`

```typescript
describe('MemberForm - System Access', () => {
  it('should show email warning when grant_access is checked')
  it('should validate email is required when granting access')
  it('should display success toast mentioning email sent')
  it('should show error alert if email is missing')
})
```

---

## 📦 Dependências e Configurações

### Backend:

**Adicionar ao `requirements.txt`:**
```txt
django-templated-mail>=1.1.1
```

**Configurar no `settings/base.py`:**
```python
# E-mail
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='suporteobreirovirtual@gmail.com')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = 'Obreiro Virtual <suporteobreirovirtual@gmail.com>'

# Templates de E-mail
INSTALLED_APPS += ['templated_mail']
```

**Variáveis de Ambiente:**
```bash
# .env_dev
EMAIL_HOST_USER=suporteobreirovirtual@gmail.com
EMAIL_HOST_PASSWORD=wgrx obiv jefb cjat

# .env_prod
EMAIL_HOST_USER=suporteobreirovirtual@gmail.com
EMAIL_HOST_PASSWORD=wgrx obiv jefb cjat
```

---

## 🗓️ Cronograma de Implementação

### **Fase 1: Setup Básico** ⏱️ 2h
- [ ] Adicionar dependências ao `requirements.txt`
- [ ] Configurar SMTP Gmail no Django (`settings/base.py`)
- [ ] Adicionar variáveis de ambiente (`.env_dev`, `.env_prod`)
- [ ] Criar estrutura de templates (`backend/templates/emails/`)
- [ ] Criar templates HTML (base + welcome_member)
- [ ] Testar envio manual via Django shell

### **Fase 2: Serviço de E-mail** ⏱️ 1h
- [ ] Criar `backend/apps/core/services/email_service.py`
- [ ] Implementar método `send_welcome_credentials()`
- [ ] Adicionar logging apropriado
- [ ] Testar serviço isoladamente

### **Fase 3: Integração Backend** ⏱️ 3h
- [ ] Modificar `MemberSerializer.create()`
- [ ] Modificar `MemberSerializer.update()`
- [ ] Adicionar geração automática de senha (`secrets.token_urlsafe`)
- [ ] Integrar chamada ao `EmailService`
- [ ] Adicionar validações (e-mail obrigatório quando dar acesso)
- [ ] Tratamento de erros e logging

### **Fase 4: Frontend** ⏱️ 2h
- [ ] Adicionar aviso sobre envio de e-mail na UI
- [ ] Validar e-mail obrigatório quando marcar "dar acesso"
- [ ] Toast de confirmação informando envio de e-mail
- [ ] Alert de erro se e-mail não informado
- [ ] Melhorar UX da seleção de perfil

### **Fase 5: Testes** ⏱️ 2h
- [ ] Criar testes unitários backend (email_sending)
- [ ] Testes de integração (create + update member)
- [ ] Teste manual completo (criar membro novo)
- [ ] Teste manual completo (editar membro existente)
- [ ] Verificar e-mails recebidos na caixa de entrada
- [ ] Testar fluxo completo: receber e-mail → login → trocar senha

### **Fase 6: Documentação e Deploy** ⏱️ 1h
- [ ] Documentar variáveis de ambiente necessárias
- [ ] Atualizar README com instruções de configuração de e-mail
- [ ] Deploy em desenvolvimento
- [ ] Validação em ambiente de dev
- [ ] Preparar para produção

**Total estimado:** 11 horas

---

## 🚨 Pontos de Atenção e Bloqueios Potenciais

### ⚠️ **Possíveis Problemas:**

1. **Gmail pode bloquear envios em massa**
   - **Limite:** 500 e-mails/dia para contas gratuitas
   - **Solução:** Monitorar quantidade de envios
   - **Alternativa futura:** Migrar para SendGrid/Mailgun

2. **E-mails caindo em SPAM**
   - **Solução inicial:** Testar com diferentes provedores
   - **Solução avançada:** Configurar SPF/DKIM (futuro)
   - **Workaround:** Orientar usuários a verificar SPAM

3. **Membro sem e-mail cadastrado**
   - **Solução:** Validação obrigatória no frontend + backend
   - **UI:** Alert visual impedindo dar acesso sem e-mail

4. **Performance (envio síncrono bloqueia request)**
   - **Situação atual:** Aceitável para MVP
   - **Solução futura:** Implementar Celery (task assíncrona)
   - **Quando implementar:** Após 100+ envios/dia

5. **Senha visível em logs**
   - **Solução:** Nunca logar senha
   - **Logging:** Apenas sucesso/falha do envio
   - **Sanitizar:** Exception handlers não devem expor senha

6. **Usuário já existe com mesmo e-mail**
   - **Solução:** Validação do Django (unique email)
   - **Tratamento:** Informar admin que e-mail já cadastrado
   - **UX:** Sugerir usar outro e-mail ou editar usuário existente

---

## 🎯 Resultado Esperado

### Fluxo Completo Implementado:

1. **Admin acessa página de membros** → Cria ou edita membro
2. **Admin marca "Dar acesso ao sistema"** → Seleciona perfil (role)
3. **Frontend valida** → E-mail informado? Se não, mostra alert
4. **Admin salva membro** → Frontend envia requisição
5. **Backend valida** → E-mail único? Dados corretos?
6. **Backend cria membro** → Se acesso marcado, cria usuário
7. **Backend gera senha aleatória** → Hash da senha armazenado no DB
8. **Backend chama EmailService** → Envia e-mail com credenciais
9. **Membro recebe e-mail** → Com senha temporária + link de login
10. **Membro acessa sistema** → Faz login com credenciais recebidas
11. **Sistema força troca de senha** → (implementar futuramente)
12. **Admin recebe confirmação** → Toast informando envio de e-mail

---

## 📋 Checklist de Implementação

Use este checklist para acompanhar o progresso:

### Setup Inicial
- [ ] Instalar `django-templated-mail`
- [ ] Configurar variáveis de ambiente (EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
- [ ] Configurar settings.py (EMAIL_BACKEND, etc)
- [ ] Criar estrutura de pastas de templates

### Templates
- [ ] Criar `base.html`
- [ ] Criar `welcome_member.html`
- [ ] Criar `welcome_member.txt`
- [ ] Testar renderização de templates

### Backend
- [ ] Criar `EmailService`
- [ ] Implementar `send_welcome_credentials()`
- [ ] Modificar `MemberSerializer.create()`
- [ ] Modificar `MemberSerializer.update()`
- [ ] Adicionar validações
- [ ] Adicionar logging

### Frontend
- [ ] Adicionar UI de "dar acesso ao sistema"
- [ ] Adicionar seleção de perfil
- [ ] Adicionar alert de e-mail obrigatório
- [ ] Adicionar informação sobre envio de e-mail
- [ ] Atualizar toast de sucesso

### Testes
- [ ] Teste manual: criar membro com acesso
- [ ] Teste manual: editar membro e dar acesso
- [ ] Verificar e-mail recebido
- [ ] Testar login com credenciais
- [ ] Testes unitários (backend)
- [ ] Testes de integração

### Deploy
- [ ] Atualizar `.env_prod` com credenciais
- [ ] Rebuild containers (backend)
- [ ] Verificar logs de envio
- [ ] Teste em produção

---

## 📚 Referências e Recursos

### Documentação:
- [Django Email](https://docs.djangoproject.com/en/5.0/topics/email/)
- [django-templated-mail](https://pypi.org/project/django-templated-mail/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Python secrets module](https://docs.python.org/3/library/secrets.html)

### Segurança:
- [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Django Password Hashing](https://docs.djangoproject.com/en/5.0/topics/auth/passwords/)

---

## 🚀 Próximos Passos

**Para iniciar a implementação:**

1. ✅ Documento criado e aprovado
2. 🔜 Iniciar **Fase 1: Setup Básico**
3. 🔜 Configurar e-mail no Django
4. 🔜 Criar templates HTML
5. 🔜 Testar envio manual

**Aguardando aprovação para começar! 🎯**
