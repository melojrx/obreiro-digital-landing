# 🚀 Checklist de Deploy - Módulo QR Code Visitantes

## ✅ **Alterações Implementadas**

### **1. Configuração de QR Codes**
- ✅ `FRONTEND_URL` adicionado em `.env_dev` e `.env_prod`
- ✅ Settings configurados para carregamento automático de ambiente
- ✅ QR codes apontam corretamente para páginas React

### **2. Correções no Modelo Branch**
- ✅ Removido campo duplicado `visitor_registration_url` 
- ✅ Mantida apenas `@property` que usa `FRONTEND_URL` dinamicamente
- ✅ Migração segura criada (`0003_remove_visitor_registration_url_if_exists`)

### **3. Sistema de Notificações**
- ✅ Signals implementados para notificação automática
- ✅ Emails enviados quando visitante se registra
- ✅ Notificações para conversão visitante → membro

### **4. Ferramentas de Manutenção**
- ✅ Comando `regenerate_qr_codes` para atualizar URLs
- ✅ Comando `validate_qr_system` para verificar configuração
- ✅ Script `post-deploy.sh` automatizado

### **5. Organização de Arquivos**
- ✅ Removido `.env` duplicado
- ✅ Mantidos apenas `.env_dev` e `.env_prod`
- ✅ Carregamento automático baseado em `DJANGO_SETTINGS_MODULE`

## 🔧 **Comandos Pós-Deploy**

### **Produção:**
```bash
# 1. Deploy normal
docker compose -f docker-compose.prod.yml up -d --build

# 2. Executar script automático
./scripts/post-deploy.sh

# 3. Verificar QR codes
docker exec obreiro_backend_prod python manage.py validate_qr_system
```

### **Desenvolvimento:**
```bash
# 1. Testar localmente
docker-compose -f docker-compose.dev.yml up -d --build

# 2. Script de desenvolvimento
./scripts/post-deploy.sh dev
```

## 🎯 **URLs Funcionais**

### **Desenvolvimento:**
- **Frontend**: `http://localhost:5173`
- **API**: `http://localhost:8000/api/v1/`
- **QR Codes**: `http://localhost:5173/visit/{uuid}`

### **Produção:**
- **Frontend**: `https://obreirovirtual.com`
- **API**: `https://obreirovirtual.com/api/v1/`
- **QR Codes**: `https://obreirovirtual.com/visit/{uuid}`

## ⚠️ **Pontos de Atenção**

### **ANTES do Deploy:**
1. ✅ Configurar `DJANGO_SECRET_KEY` em produção
2. ✅ Configurar senha do banco em `DATABASE_URL`
3. ⚠️ Configurar SMTP real (quando tiver email oficial)

### **DEPOIS do Deploy:**
1. ✅ Executar `./scripts/post-deploy.sh`
2. ✅ Testar um QR code: `https://obreirovirtual.com/visit/{uuid}`
3. ✅ Verificar notificações funcionando

## 🧪 **Testes de Validação**

```bash
# 1. Testar API de validação
curl "https://obreirovirtual.com/api/v1/visitors/public/qr/{uuid}/validate/"

# 2. Testar página React
curl -I "https://obreirovirtual.com/visit/{uuid}"

# 3. Verificar configurações
docker exec obreiro_backend_prod python manage.py validate_qr_system --test-api
```

## 📊 **Status Atual**

- ✅ **Desenvolvimento**: 100% funcional
- ✅ **QR Codes**: URLs corretas geradas
- ✅ **Migrações**: Compatíveis com produção
- ✅ **Documentação**: Atualizada
- 🟡 **Email**: Aguardando SMTP oficial

## 🚀 **PRONTO PARA DEPLOY!**

Todas as alterações foram testadas em desenvolvimento e são compatíveis com a arquitetura de produção existente.