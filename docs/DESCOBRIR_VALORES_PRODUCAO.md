# 🔍 Como descobrir os valores para produção na VPS

## 1. 🐳 Descobrir NOME_CONTAINER_POSTGRES_PROD
```bash
# Na VPS, executar:
docker ps | grep postgres
# ou
docker ps -a | grep postgres

# Exemplo de saída:
# 514ec514d551   postgres:15-alpine   "docker-entrypoint.s…"   Up 2 hours   obreiro_postgres_prod
#                                                                            ^^^^^^^^^^^^^^^^^^^^
#                                                                            ESTE É O NOME
```

## 2. 👤 Descobrir USUARIO_PROD
```bash
# Método 1: Ver variáveis de ambiente do container
docker inspect NOME_CONTAINER_POSTGRES_PROD | grep -i postgres_user

# Método 2: Ver docker-compose de produção
cat docker-compose.prod.yml | grep -A 10 -B 5 POSTGRES_USER

# Método 3: Ver logs do container (às vezes mostra)
docker logs NOME_CONTAINER_POSTGRES_PROD | head -20
```

## 3. 🗄️ Descobrir DATABASE_PROD
```bash
# Método 1: Ver variáveis de ambiente do container
docker inspect NOME_CONTAINER_POSTGRES_PROD | grep -i postgres_db

# Método 2: Ver docker-compose de produção
cat docker-compose.prod.yml | grep -A 10 -B 5 POSTGRES_DB

# Método 3: Listar bancos disponíveis
docker exec NOME_CONTAINER_POSTGRES_PROD psql -U USUARIO_ENCONTRADO -l
```

## 🎯 Comando completo para descobrir tudo de uma vez:
```bash
# 1. Listar containers postgres
echo "=== CONTAINERS POSTGRES ==="
docker ps -a | grep postgres

# 2. Se encontrar o container, ver as variáveis de ambiente
echo -e "\n=== VARIÁVEIS DE AMBIENTE ==="
CONTAINER_NAME=$(docker ps | grep postgres | awk '{print $NF}' | head -1)
echo "Container encontrado: $CONTAINER_NAME"

if [ ! -z "$CONTAINER_NAME" ]; then
    echo "POSTGRES_USER:"
    docker inspect $CONTAINER_NAME | grep -i "POSTGRES_USER" | head -1
    
    echo "POSTGRES_DB:"
    docker inspect $CONTAINER_NAME | grep -i "POSTGRES_DB" | head -1
    
    echo "Comando final seria:"
    echo "docker exec $CONTAINER_NAME psql -U [USUARIO] -d [DATABASE] -c \"SELECT ...\""
fi
```

## 📋 Exemplo prático baseado no seu docker-compose.prod.yml:
Se você estiver usando o arquivo docker-compose.prod.yml que vi antes, provavelmente será:

```bash
# Valores mais prováveis:
NOME_CONTAINER_POSTGRES_PROD = "obreiro_postgres_prod"
USUARIO_PROD = "obreiro_prod" 
DATABASE_PROD = "obreiro_prod"

# Comando final seria:
docker exec obreiro_postgres_prod psql -U obreiro_prod -d obreiro_prod -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'accounts_churchuser' AND column_name IN ('can_create_churches', 'can_manage_church_admins', 'can_manage_denomination', 'can_view_financial_reports');"
```
