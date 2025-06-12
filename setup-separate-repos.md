# 🔄 Configuração com Repositórios Separados

## Opção: Frontend e Backend em repositórios diferentes

### 1. Manter frontend no repositório atual
```bash
cd frontend
git init
git remote add origin <URL_DO_SEU_REPO_FRONTEND>
git pull origin main
```

### 2. Criar novo repositório para backend
```bash
cd backend
git init
git remote add origin <URL_NOVO_REPO_BACKEND>
```

### 3. Configurar .gitignore para backend
```bash
# Adicionar ao backend/.gitignore
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
env/
venv/
.venv/
pip-log.txt
pip-delete-this-directory.txt
.tox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
*.log
.git
.mypy_cache
.pytest_cache
.hypothesis
db.sqlite3
media/
staticfiles/
.env
.DS_Store
```

### 4. Primeiro commit do backend
```bash
cd backend
git add .
git commit -m "feat: initial Django REST API setup"
git push origin main
```

### Vantagens:
- ✅ Repositórios independentes
- ✅ Equipes podem trabalhar separadamente
- ✅ Deploy independente

### Desvantagens:
- ❌ Versionamento separado
- ❌ Mais complexo para sincronizar
- ❌ CI/CD mais complexo 