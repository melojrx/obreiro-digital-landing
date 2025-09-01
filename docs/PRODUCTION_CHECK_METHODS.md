# Comandos para executar via SSH na VPS com Docker

## 🐳 Via Container PostgreSQL (COMANDO PRINCIPAL)
```bash
# Verificar campos problemáticos que a migração 0012 tenta remover
docker exec NOME_CONTAINER_POSTGRES_PROD psql -U USUARIO_PROD -d DATABASE_PROD -c "
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'accounts_churchuser' 
    AND column_name IN (
        'can_create_churches',
        'can_manage_church_admins', 
        'can_manage_denomination',
        'can_view_financial_reports'
    );
"
```

**Interpretação do resultado:**
- **VAZIO** → ✅ Deploy SEGURO (migração atual funciona)
- **COM DADOS** → ⚠️ Reverter migração 0012 antes do deploy

## 🔍 Via Container Django (verificação detalhada)
```bash
# Executar shell Django no container
docker exec -it NOME_CONTAINER_BACKEND_PROD python manage.py shell

# No shell Django:
from django.db import connection
cursor = connection.cursor()

# Verificar estrutura completa da tabela
cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'accounts_churchuser' ORDER BY column_name;")
columns = [row[0] for row in cursor.fetchall()]
print(f"Colunas na tabela: {columns}")

# Verificar campos problemáticos
problematic = ['can_create_churches', 'can_manage_church_admins', 'can_manage_denomination', 'can_view_financial_reports']
existing_problematic = [col for col in problematic if col in columns]
print(f"Campos problemáticos encontrados: {existing_problematic}")
```

## 📋 Via PostgreSQL direto (estrutura completa)
```bash
# Ver estrutura completa da tabela
docker exec NOME_CONTAINER_POSTGRES_PROD psql -U USUARIO_PROD -d DATABASE_PROD -c "\d accounts_churchuser"
```
