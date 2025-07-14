# 👥 Usuários de Teste - Obreiro Digital

## 🔐 Credenciais de Acesso

**SENHA PADRÃO PARA TODOS OS USUÁRIOS:** `teste123`

## 📋 Lista de Usuários

### 🏢 **Administrador da Denominação**
- **Email:** `denominacao.admin@teste.com`
- **Nome:** Admin Denominação
- **Papel:** DENOMINATION_ADMIN
- **Permissões:** Pode gerenciar todas as igrejas da denominação

### 🏛️ **Administrador da Igreja Sede**
- **Email:** `igreja.admin@teste.com`
- **Nome:** Admin Igreja Sede
- **Papel:** CHURCH_ADMIN
- **Permissões:** Pode gerenciar a igreja sede

### 🏛️ **Administrador da Igreja Filha**
- **Email:** `igreja.filha.admin@teste.com`
- **Nome:** Admin Igreja Filha
- **Papel:** CHURCH_ADMIN
- **Permissões:** Pode gerenciar a igreja filha

### 👨‍💼 **Pastor**
- **Email:** `pastor@teste.com`
- **Nome:** Pastor Teste
- **Papel:** PASTOR
- **Permissões:** Pode gerenciar membros, atividades e ministérios

### 👥 **Líder de Ministério**
- **Email:** `lider@teste.com`
- **Nome:** Líder Teste
- **Papel:** LEADER
- **Permissões:** Pode gerenciar seu ministério específico

### 📝 **Secretário**
- **Email:** `secretario@teste.com`
- **Nome:** Secretário Teste
- **Papel:** SECRETARY
- **Permissões:** Pode gerenciar cadastros e relatórios

### 👤 **Membro**
- **Email:** `membro@teste.com`
- **Nome:** Membro Teste
- **Papel:** MEMBER
- **Permissões:** Pode visualizar informações básicas

### 👀 **Usuário Somente Leitura**
- **Email:** `readonly@teste.com`
- **Nome:** ReadOnly Teste
- **Papel:** READONLY
- **Permissões:** Apenas visualização

### 🔧 **Super Administrador**
- **Email:** `admin@obreirovirtual.com`
- **Nome:** Super Admin
- **Papel:** SUPERUSER
- **Permissões:** Acesso total ao sistema

## 🌐 Acesso ao Sistema

### Frontend (React)
- **URL:** http://localhost:5173
- **Página de Login:** http://localhost:5173/login

### Backend (Django Admin)
- **URL:** http://localhost:8000/admin
- **Superuser:** admin@obreirovirtual.com / teste123

### API (Django REST Framework)
- **URL:** http://localhost:8000/api/v1/
- **Documentação:** http://localhost:8000/api/schema/swagger-ui/

## 🔄 Regenerar Usuários

Para recriar todos os usuários de teste:

```bash
# Remover usuários existentes e criar novos
docker-compose -f docker-compose.dev.yml exec backend python manage.py create_test_users --clean

# Criar novos usuários com senha personalizada
docker-compose -f docker-compose.dev.yml exec backend python manage.py create_test_users --password=minhasenha123
```

## 🏗️ Estrutura Criada

O script cria automaticamente:

### **Denominação de Teste**
- Nome: Igreja Evangélica Teste
- Descrição: Denominação criada para testes

### **Igrejas**
- **Igreja Sede:** Igreja Evangélica Teste - Sede
- **Igreja Filha:** Igreja Evangélica Teste - Filha

### **Filiais da Igreja Sede**
- Sede Principal
- Filial Norte  
- Filial Sul

## 📊 Testando Permissões

### Cenários de Teste Recomendados:

1. **Login com denominacao.admin@teste.com**
   - Deve ver todas as igrejas
   - Pode gerenciar usuários de todas as igrejas

2. **Login com igreja.admin@teste.com**
   - Deve ver apenas a igreja sede
   - Pode gerenciar usuários da igreja sede

3. **Login com pastor@teste.com**
   - Pode gerenciar membros e atividades
   - Não pode gerenciar usuários administrativos

4. **Login com membro@teste.com**
   - Visualização limitada
   - Não pode editar dados de outros usuários

## 🐛 Solução de Problemas

### Erro "Credenciais inválidas"
- Verifique se está usando a senha correta: `teste123`
- Confirme se os usuários foram criados executando o comando de criação

### Erro 404 no login
- Verifique se o backend está rodando: http://localhost:8000/api/v1/auth/login/
- Confirme se o frontend está apontando para a URL correta

### Usuários não encontrados
- Execute o comando para recriar usuários:
  ```bash
  docker-compose -f docker-compose.dev.yml exec backend python manage.py create_test_users
  ```

## ✅ **Sistema Funcionando!**

### **Última Correção (14/07/2025):**
- **Problema:** Variável `VITE_API_URL` não incluía `/api/v1`
- **Solução:** Atualizado `docker-compose.dev.yml` para usar `VITE_API_URL=http://localhost:8000/api/v1`
- **Status:** ✅ Frontend e Backend funcionando perfeitamente

### **Como testar agora:**
1. Acesse http://localhost:5173
2. Faça login com `denominacao.admin@teste.com` / `teste123`
3. O sistema deve funcionar sem erros 404

**🎉 Tudo funcionando perfeitamente!**