#!/bin/bash
# =================================
# OBREIRO DIGITAL - ENTRYPOINT SCRIPT
# =================================

set -e

echo "🚀 Iniciando Obreiro Digital Backend..."

# Aguardar PostgreSQL estar pronto
echo "⏳ Aguardando PostgreSQL..."
while ! python manage.py check --database default > /dev/null 2>&1; do
    echo "PostgreSQL não está pronto - aguardando..."
    sleep 2
done

echo "✅ PostgreSQL conectado!"

# Executar migrações
echo "🔄 Executando migrações..."
python manage.py migrate --noinput

# Coletar arquivos estáticos
echo "📦 Coletando arquivos estáticos..."
python manage.py collectstatic --noinput

# Popular denominações sempre (em todos os ambientes)
echo "🏛️ Populando denominações padrão..."
python manage.py populate_denominations

# Verificar ambiente e executar ações específicas
if [ "$DJANGO_DEBUG" = "True" ]; then
    echo "🔧 Ambiente de DESENVOLVIMENTO detectado"
    
    # Criar usuários de teste
    echo "👤 Criando usuários de teste..."
    python manage.py create_test_users || echo "⚠️ Usuários de teste já existem"
    
    # Opcional: executar comandos específicos de dev
    echo "🔍 Verificando estrutura do banco..."
    python manage.py check --database default
    
else
    echo "🚀 Ambiente de PRODUÇÃO detectado"
    
    # Criar superuser se não existir (usando variáveis de ambiente)
    if [ -n "$DJANGO_SUPERUSER_EMAIL" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
        echo "🔐 Criando superuser de produção..."
        python manage.py shell -c "
from django.contrib.auth import get_user_model;
User = get_user_model();
if not User.objects.filter(email='$DJANGO_SUPERUSER_EMAIL').exists():
    User.objects.create_superuser('$DJANGO_SUPERUSER_EMAIL', '$DJANGO_SUPERUSER_PASSWORD');
    print('✅ Superuser criado: $DJANGO_SUPERUSER_EMAIL')
else:
    print('⚠️ Superuser já existe: $DJANGO_SUPERUSER_EMAIL')
"
    fi
    
    # Verificações de segurança para produção
    echo "🔐 Executando verificações de segurança..."
    python manage.py check --deploy --fail-level WARNING
fi

echo "🎉 Backend configurado para ambiente: $(if [ "$DJANGO_DEBUG" = "True" ]; then echo "DESENVOLVIMENTO"; else echo "PRODUÇÃO"; fi)"

# Executar comando principal
exec "$@"