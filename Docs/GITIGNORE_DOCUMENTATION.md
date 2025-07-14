# 📝 Documentação do .gitignore - Obreiro Digital

## 🎯 Objetivo

Este `.gitignore` foi criado para um projeto Django + React com Docker, focando em:
- **Segurança:** Evitar versionamento de dados sensíveis
- **Performance:** Ignorar arquivos desnecessários
- **Colaboração:** Facilitar trabalho em equipe
- **CI/CD:** Otimizar pipelines de desenvolvimento

## 🔒 Arquivos Sensíveis (CRÍTICOS)

### **Arquivos de Ambiente**
```
.env_dev          # Configurações de desenvolvimento
.env_prod         # Configurações de produção
.env*             # Qualquer arquivo de ambiente
```

### **Alternativas Seguras**
```
.env_dev.example  # ✅ Template para desenvolvimento
.env_prod.example # ✅ Template para produção
```

### **Configurações Sensíveis**
```
local_settings.py     # Configurações Django locais
secrets.json         # Arquivos de segredos
credentials.json     # Credenciais de API
```

## 🐍 Python/Django

### **Arquivos Ignorados**
```
__pycache__/         # Cache Python
*.pyc               # Bytecode compilado
.pytest_cache/      # Cache de testes
.coverage           # Relatórios de coverage
```

### **Específicos do Django**
```
media/              # Uploads de usuários
staticfiles/        # Arquivos estáticos coletados
db.sqlite3          # Banco de desenvolvimento
*.log              # Logs da aplicação
```

### **Considerações**
- **Migrations:** Incluídas no versionamento (estratégia padrão)
- **Static files:** Ignorados (gerados pelo `collectstatic`)
- **Media files:** Ignorados (uploads de usuários)

## ⚛️ React/Frontend

### **Arquivos Ignorados**
```
node_modules/       # Dependências NPM
dist/              # Build de produção
.cache/            # Cache do bundler
*.tsbuildinfo      # Cache TypeScript
```

### **Específicos do Vite**
```
dist-ssr/          # Server-side rendering
*.local            # Arquivos locais do Vite
```

### **Logs e Cache**
```
npm-debug.log*     # Logs do NPM
yarn-error.log*    # Logs do Yarn
.eslintcache       # Cache do ESLint
```

## 🐳 Docker

### **Arquivos Ignorados**
```
docker-compose.override.yml   # Overrides locais
postgres_data/               # Dados do PostgreSQL
redis_data/                  # Dados do Redis
```

### **Estratégia**
- **docker-compose.dev.yml:** ✅ Versionado
- **docker-compose.prod.yml:** ✅ Versionado  
- **Dockerfile:** ✅ Versionado
- **Override files:** ❌ Ignorados (específicos do dev)

## 💾 Backups e Dados

### **Arquivos Ignorados**
```
backups/           # Backups de banco
*.sql.gz          # Dumps comprimidos
*.backup          # Arquivos de backup
logs/             # Logs da aplicação
```

### **Razão**
- Backups são gerados automaticamente
- Podem conter dados sensíveis
- Arquivos grandes que não devem estar no repo

## 🛠️ Editores e IDEs

### **Configurações Incluídas**
```
.vscode/settings.json     # ✅ Configurações do projeto
.vscode/tasks.json        # ✅ Tasks do VS Code
.vscode/launch.json       # ✅ Configurações de debug
```

### **Configurações Ignoradas**
```
.vscode/           # Configurações pessoais
.idea/            # IntelliJ/PyCharm
*.sublime-*       # Sublime Text
```

## 🖥️ Sistema Operacional

### **Arquivos Ignorados**
```
.DS_Store         # macOS
Thumbs.db         # Windows
*~               # Linux backup files
```

## 🔐 Certificados SSL

### **Arquivos Ignorados**
```
*.crt            # Certificados
*.key            # Chaves privadas
*.pem            # Certificados PEM
letsencrypt/     # Let's Encrypt
```

## 📊 Estratégias por Ambiente

### **Desenvolvimento**
- Logs detalhados permitidos
- Cache ignorado para rebuild
- Configurações locais ignoradas

### **Produção**
- Dados sensíveis sempre ignorados
- Backups automáticos ignorados
- Certificados SSL ignorados

## 🚀 CI/CD Considerations

### **Arquivos que Ajudam CI/CD**
```
requirements.txt        # ✅ Dependências Python
package.json           # ✅ Dependências Node
package-lock.json      # ✅ Lock de dependências
docker-compose.*.yml   # ✅ Configurações Docker
```

### **Arquivos que Atrapalham CI/CD**
```
node_modules/          # ❌ Muito grandes
.cache/               # ❌ Específicos do ambiente
*.log                 # ❌ Logs locais
```

## 🔍 Verificação de Segurança

### **Comandos Úteis**
```bash
# Verificar arquivos ignorados
git check-ignore -v **/.env*

# Verificar arquivos sensíveis
git status --ignored

# Verificar se algo sensível foi commitado
git log --oneline --grep="password\|secret\|key"
```

### **Checklist de Segurança**
- [ ] Nenhum arquivo `.env*` versionado
- [ ] Nenhuma senha ou token no código
- [ ] Backups não versionados
- [ ] Certificados SSL ignorados
- [ ] Dados de usuários ignorados

## 📋 Manutenção

### **Revisão Periódica**
- Verificar novos tipos de arquivos ignorados
- Atualizar para novas ferramentas
- Revisar arquivos de exemplo (`.example`)

### **Quando Atualizar**
- Adicionar novas ferramentas ao projeto
- Mudanças na estrutura de deploy
- Novos ambientes de desenvolvimento
- Problemas de segurança identificados

## 🎯 Resultado Final

Este `.gitignore` garante:
- ✅ **Segurança:** Dados sensíveis protegidos
- ✅ **Performance:** Repositório limpo e rápido
- ✅ **Colaboração:** Consistência entre desenvolvedores
- ✅ **Manutenção:** Fácil de manter e atualizar

**🎉 Pronto para produção e trabalho em equipe!**