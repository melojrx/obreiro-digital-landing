# 🧪 Guia de Teste - Funcionalidade "Esqueci a Senha"

## ✅ Checklist de Testes

### 1️⃣ Teste do Backend (API)

#### Teste 1: Solicitar Redefinição de Senha
```bash
curl -X POST http://localhost:8000/api/v1/auth/password-reset/request/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@obreirovirtual.com"}'
```

**Resultado Esperado:**
```json
{
  "message": "Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.",
  "detail": "Verifique sua caixa de entrada e spam."
}
```

**Verificar:**
- ✅ Resposta HTTP 200
- ✅ Email recebido na caixa de entrada
- ✅ Email contém link válido

---

#### Teste 2: Validar Token
```bash
# Pegue o token do email recebido
TOKEN="seu-token-aqui"

curl -X POST http://localhost:8000/api/v1/auth/password-reset/validate/ \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$TOKEN\"}"
```

**Resultado Esperado:**
```json
{
  "message": "Token válido.",
  "valid": true
}
```

---

#### Teste 3: Redefinir Senha
```bash
curl -X POST http://localhost:8000/api/v1/auth/password-reset/confirm/ \
  -H "Content-Type: application/json" \
  -d "{
    \"token\": \"$TOKEN\",
    \"new_password\": \"NovaSenha123!\",
    \"confirm_password\": \"NovaSenha123!\"
  }"
```

**Resultado Esperado:**
```json
{
  "message": "Senha redefinida com sucesso!",
  "detail": "Você já pode fazer login com sua nova senha.",
  "user_email": "admin@obreirovirtual.com"
}
```

---

### 2️⃣ Teste do Frontend (Interface)

#### Teste 1: Página "Esqueci Minha Senha"

1. Acesse: http://localhost:5173/login
2. Clique em "Esqueceu a senha?"
3. Deve redirecionar para: http://localhost:5173/esqueci-senha

**Verificar:**
- ✅ Página carrega corretamente
- ✅ Formulário com campo de email visível
- ✅ Botão "Enviar Link de Redefinição" visível

#### Teste 2: Solicitar Redefinição

1. Digite um email válido: `admin@obreirovirtual.com`
2. Clique em "Enviar Link de Redefinição"

**Verificar:**
- ✅ Loading aparece durante envio
- ✅ Mensagem de sucesso exibida
- ✅ Tela muda para "Email Enviado"
- ✅ Toast de sucesso aparece

#### Teste 3: Validação de Email

Teste com email inválido:
1. Digite: `emailinvalido`
2. Tente enviar

**Verificar:**
- ✅ Erro de validação aparece
- ✅ Mensagem: "Por favor, informe um e-mail válido."

#### Teste 4: Página de Redefinição

1. Abra o email recebido
2. Clique no botão "Redefinir Minha Senha"
3. Deve abrir: http://localhost:5173/redefinir-senha?token=...

**Verificar:**
- ✅ Página valida o token automaticamente
- ✅ Loading de validação aparece
- ✅ Formulário de nova senha aparece após validação
- ✅ Campos "Nova Senha" e "Confirmar Nova Senha" visíveis

#### Teste 5: Redefinir Senha

1. Digite nova senha: `NovaSenha123!`
2. Confirme a senha: `NovaSenha123!`
3. Clique em "Redefinir Senha"

**Verificar:**
- ✅ Loading aparece durante redefinição
- ✅ Tela de sucesso aparece
- ✅ Toast de sucesso exibido
- ✅ Redirecionamento automático para login em 3s

#### Teste 6: Login com Nova Senha

1. Após redirecionamento, faça login
2. Email: `admin@obreirovirtual.com`
3. Senha: `NovaSenha123!`

**Verificar:**
- ✅ Login bem-sucedido
- ✅ Redirecionamento para dashboard

---

### 3️⃣ Testes de Segurança

#### Teste 1: Token Usado Duas Vezes
1. Use um token para redefinir senha
2. Tente usar o mesmo token novamente

**Resultado Esperado:**
- ✅ Erro: "Token inválido ou expirado"

#### Teste 2: Token Inválido
1. Tente acessar: http://localhost:5173/redefinir-senha?token=tokeninvalido

**Resultado Esperado:**
- ✅ Tela "Link Inválido" aparece
- ✅ Opção de solicitar novo link

#### Teste 3: Email Não Cadastrado
1. Solicite reset para email não existente: `naocadastrado@teste.com`

**Resultado Esperado:**
- ✅ Mesma mensagem de sucesso (não revela se email existe)
- ✅ Email NÃO é enviado
- ✅ Log no backend registra tentativa

#### Teste 4: Senhas Não Conferem
1. Digite nova senha: `Senha123!`
2. Confirme com: `SenhaErrada123!`
3. Tente redefinir

**Resultado Esperado:**
- ✅ Erro: "As senhas não conferem"

#### Teste 5: Senha Fraca
1. Tente senha sem número: `SenhaFraca`

**Resultado Esperado:**
- ✅ Erro: "A senha deve conter pelo menos um número"

1. Tente senha curta: `Abc123`

**Resultado Esperado:**
- ✅ Erro: "A senha deve ter no mínimo 8 caracteres"

---

### 4️⃣ Testes de UX

#### Teste 1: Navegação
- ✅ Link "Voltar ao Login" funciona em todas as páginas
- ✅ Link "Solicitar Novo Link" funciona na página de erro

#### Teste 2: Feedback Visual
- ✅ Loading states aparecem durante requisições
- ✅ Toasts aparecem para sucesso e erro
- ✅ Alertas informativos são claros

#### Teste 3: Responsividade
- ✅ Páginas funcionam em mobile
- ✅ Páginas funcionam em tablet
- ✅ Páginas funcionam em desktop

---

### 5️⃣ Teste Automatizado

Execute o script de teste do backend:

```bash
docker compose -f docker-compose.dev.yml exec backend python test_password_reset.py
```

**Resultado Esperado:**
```
✅ TODOS OS TESTES PASSARAM COM SUCESSO!

📋 Resumo:
   • Usuário testado: admin@obreirovirtual.com
   • Token criado: xJelDj2iLRfk9X1IAo9t...
   • Email enviado: ✅
   • Senha redefinida: ✅
   • Login funcional: ✅
   • Segurança OK: ✅
```

---

## 📊 Resultado Final

### Backend ✅
- [x] Model PasswordResetToken criado
- [x] 3 endpoints de API funcionando
- [x] EmailService implementado
- [x] Templates de email criados
- [x] Testes automatizados passando

### Frontend ✅
- [x] Página EsqueciSenha criada
- [x] Página RedefinirSenha criada
- [x] Link no Login funcionando
- [x] Rotas configuradas
- [x] Serviço API integrado

### Segurança ✅
- [x] Token expira em 1 hora
- [x] Token usado apenas uma vez
- [x] Email não revela existência de conta
- [x] Validação de senha forte
- [x] Logs de auditoria

---

## 🎉 Funcionalidade Completa!

A funcionalidade "Esqueci a Senha" está **100% implementada e testada**.

**Fluxo Completo:**
1. Usuário clica "Esqueci a senha" → Página de solicitação
2. Informa email → Sistema valida e envia email
3. Usuário recebe email → Clica no link
4. Abre página de redefinição → Token validado automaticamente
5. Define nova senha → Senha redefinida
6. Redirecionado para login → Faz login com nova senha ✅
