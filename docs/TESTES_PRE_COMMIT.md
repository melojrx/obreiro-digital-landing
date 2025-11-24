# ✅ Checklist de Testes Pré-Commit

Use este guia para validar suas alterações localmente **antes** de fazer push para `develop` e acionar o deploy automático.

## 🎯 Por que testar localmente?

- ⚡ **Mais rápido**: Evita ciclos de CI/CD desnecessários
- 💰 **Economia**: Reduz uso de recursos do GitHub Actions
- 🐛 **Menos bugs**: Detecta problemas antes do deploy
- 😌 **Confiança**: Push com segurança

---

## 📋 Checklist Completo

### 1️⃣ Backend (Django)

```bash
cd backend

# Verificar sintaxe Python
python -m py_compile $(find . -name "*.py" -not -path "*/migrations/*" -not -path "*/venv/*")

# Verificar imports
python manage.py check

# Rodar migrações pendentes (se houver)
python manage.py makemigrations --dry-run --check

# Testar conexão com banco
python manage.py dbshell --command="SELECT 1;"

# Opcional: Rodar testes unitários
python manage.py test

# Opcional: Verificar estilo de código
pip install flake8
flake8 . --exclude=migrations,venv --max-line-length=120
```

**✅ Tudo OK?** Prossiga para o frontend.

---

### 2️⃣ Frontend (React + Vite)

```bash
cd frontend

# Instalar dependências (se necessário)
npm install

# Verificar erros de TypeScript
npm run build

# Verificar se build foi criado
test -f dist/index.html && echo "✅ Build OK" || echo "❌ Build FAIL"

# Opcional: Rodar testes
npm run test

# Opcional: Verificar linting
npm run lint
```

**✅ Build criado com sucesso?** Prossiga para validação final.

---

### 3️⃣ Validação Final

```bash
# Verificar se está na branch correta
git branch --show-current
# Deve mostrar: develop

# Ver status do git
git status

# Ver diferenças
git diff

# Verificar se há conflitos
git pull origin develop
```

**✅ Sem conflitos?** Você está pronto para commit!

---

## 🚀 Fluxo de Commit Recomendado

```bash
# 1. Adicionar arquivos
git add .

# 2. Ver o que será commitado
git status

# 3. Commit com mensagem descritiva
git commit -m "feat: adiciona nova funcionalidade X"

# 4. Pull para garantir que está atualizado
git pull origin develop

# 5. Push
git push origin develop
```

### 📝 Padrão de Mensagens de Commit

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação, sem mudança de código
- `refactor:` Refatoração de código
- `test:` Adiciona testes
- `chore:` Manutenção, config, etc.

**Exemplos:**
```bash
git commit -m "feat: adiciona endpoint de relatórios"
git commit -m "fix: corrige erro na autenticação"
git commit -m "docs: atualiza README com instruções de deploy"
```

---

## 🧪 Testes Locais com Docker

### Testar Build Completo Localmente

```bash
# Backend
cd backend
docker build -t obreiro-backend-test -f ../docker/backend/Dockerfile .

# Frontend
cd frontend
docker build -t obreiro-frontend-test -f ../docker/frontend/Dockerfile \
  --build-arg VITE_API_URL=https://hml.obreirovirtual.com/api/v1 \
  --target build .

# Verificar imagens criadas
docker images | grep obreiro
```

### Testar Docker Compose Localmente

```bash
# Copiar e ajustar docker-compose para testes locais
cp docker-compose.hml.yml docker-compose.local.yml

# Editar portas para não conflitar
# Alterar:
# - 8001:8000 → 8002:8000
# - 5433:5432 → 5434:5432

# Subir ambiente local
docker-compose -f docker-compose.local.yml up -d

# Testar
curl http://localhost:8002/api/v1/

# Limpar
docker-compose -f docker-compose.local.yml down -v
```

---

## 🔍 Verificação de Segurança

### Verificar Secrets

```bash
# NUNCA commitar arquivos com secrets
git diff | grep -E "(SECRET_KEY|PASSWORD|API_KEY|TOKEN)"

# Verificar se .env está no .gitignore
cat .gitignore | grep ".env"

# Listar arquivos que serão commitados
git ls-files | grep -E "\.env|credentials|secret"
```

**⚠️ ATENÇÃO:** Se encontrou algum secret, remova imediatamente!

```bash
# Se commitou secret acidentalmente
git reset HEAD~1
git add .gitignore
echo ".env*" >> .gitignore
git add .gitignore
git commit -m "chore: adiciona .env ao .gitignore"
```

---

## 📊 Checklist Rápido

Antes de fazer push para `develop`:

- [ ] Backend: Sintaxe Python validada
- [ ] Backend: `python manage.py check` passou
- [ ] Frontend: Build criado com sucesso
- [ ] Frontend: `npm run build` sem erros
- [ ] Git: Branch correta (`develop`)
- [ ] Git: Sem conflitos com origin
- [ ] Git: Mensagem de commit descritiva
- [ ] Segurança: Sem secrets no código
- [ ] Documentação: Atualizada se necessário

---

## 🎯 Comandos Rápidos

### Script de Validação Automática

Crie um arquivo `validate.sh` na raiz do projeto:

```bash
#!/bin/bash
set -e

echo "🔍 Validando código antes do commit..."
echo ""

# Backend
echo "📦 Testando Backend..."
cd backend
python -m py_compile $(find . -name "*.py" -not -path "*/migrations/*" -not -path "*/venv/*") 2>&1 | head -5
python manage.py check
cd ..
echo "✅ Backend OK"
echo ""

# Frontend
echo "⚛️  Testando Frontend..."
cd frontend
npm run build > /dev/null 2>&1
if [ -f dist/index.html ]; then
  echo "✅ Frontend OK"
else
  echo "❌ Frontend FAIL - Build não foi criado"
  exit 1
fi
cd ..
echo ""

# Git
echo "🔍 Verificando Git..."
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "develop" ]; then
  echo "⚠️  Você não está na branch develop (atual: $BRANCH)"
  echo "   Execute: git checkout develop"
  exit 1
fi
echo "✅ Branch correta: $BRANCH"
echo ""

echo "✅ Todas as validações passaram!"
echo "🚀 Você pode fazer push com segurança"
```

Tornar executável:

```bash
chmod +x validate.sh
```

Usar antes de commit:

```bash
./validate.sh && git push origin develop
```

---

## 🆘 Troubleshooting

### Erro: "python: command not found"

```bash
# Verificar se Python está instalado
python --version
python3 --version

# Usar python3 se necessário
alias python=python3
```

### Erro: "npm: command not found"

```bash
# Instalar Node.js
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar
node --version
npm --version
```

### Build do frontend falha com erro de memória

```bash
# Aumentar limite de memória do Node
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### Git pull com conflitos

```bash
# Ver arquivos em conflito
git status

# Resolver conflitos manualmente ou
# Descartar mudanças locais (CUIDADO!)
git reset --hard origin/develop
```

---

## 🎓 Boas Práticas

1. **Sempre** teste localmente antes do push
2. **Nunca** faça push direto para `main`
3. **Sempre** faça pull antes de push
4. **Sempre** use mensagens de commit descritivas
5. **Nunca** commite secrets ou senhas
6. **Sempre** revise o `git diff` antes do commit
7. **Sempre** teste em ambiente local primeiro

---

## 📚 Recursos Adicionais

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Best Practices](https://git-scm.com/book/en/v2)
- [Django Testing](https://docs.djangoproject.com/en/5.2/topics/testing/)
- [Vite Build](https://vitejs.dev/guide/build.html)

---

**Última atualização:** 2025-11-24
**Autor:** Sistema Obreiro Virtual
