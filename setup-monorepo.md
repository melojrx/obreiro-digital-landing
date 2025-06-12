# 🔄 Configuração do Monorepo - ObreiroVirtual

## Passos para integrar frontend e backend no mesmo repositório

### 1. Clonar seu repositório atual do frontend
```bash
# No diretório pai do ObreiroVirtual
git clone <URL_DO_SEU_REPO_FRONTEND> obreiro-virtual-temp
```

### 2. Inicializar Git no projeto atual
```bash
cd ObreiroVirtual
git init
```

### 3. Configurar o remote para seu repositório
```bash
git remote add origin <URL_DO_SEU_REPO_FRONTEND>
```

### 4. Fazer pull das alterações do frontend
```bash
# Criar branch temporária
git checkout -b temp-frontend

# Fazer pull do frontend atual
git pull origin main --allow-unrelated-histories
```

### 5. Reorganizar estrutura
```bash
# Mover arquivos do frontend para pasta frontend/
# (se necessário, já fizemos isso)

# Adicionar backend à estrutura
git add backend/
git add package.json
git add README.md
```

### 6. Commit da nova estrutura
```bash
git add .
git commit -m "feat: reorganizar projeto em monorepo (frontend + backend)"
```

### 7. Push da nova estrutura
```bash
git push origin temp-frontend
```

### 8. Merge para main
```bash
git checkout main
git merge temp-frontend
git push origin main
```

## Estrutura final do repositório:
```
obreiro-virtual/
├── frontend/          # React + TypeScript
├── backend/           # Django REST API  
├── package.json       # Scripts de desenvolvimento
├── README.md          # Documentação
└── .gitignore         # Ignorar venv, node_modules, etc.
``` 