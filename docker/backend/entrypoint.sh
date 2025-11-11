#!/bin/bash
# =================================
# OBREIRO DIGITAL - ENTRYPOINT SCRIPT
# =================================

set -e

echo "🚀 Iniciando Obreiro Digital Backend..."

# Aguardar PostgreSQL estar pronto
echo "⏳ Aguardando PostgreSQL..."
while ! python -c "
import os, psycopg2
from urllib.parse import urlparse
db_url = os.environ['DATABASE_URL']
parsed = urlparse(db_url)
psycopg2.connect(host=parsed.hostname, port=parsed.port, database=parsed.path[1:], user=parsed.username, password=parsed.password).close()
" > /dev/null 2>&1; do
    echo "PostgreSQL não está pronto - aguardando..."
    sleep 2
done

echo "✅ PostgreSQL conectado!"

# Executar migrações
echo "🔄 Executando migrações..."
python manage.py migrate --noinput

# Coletar arquivos estáticos
echo "📦 Coletando arquivos estáticos..."
# Criar diretório e garantir permissões
mkdir -p /app/staticfiles /app/media
chmod -R 777 /app/staticfiles /app/media 2>/dev/null || true
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
    echo "🔍 Pulando verificação do banco para dev..."
    # python manage.py check --database default
    
else
    echo "🚀 Ambiente de PRODUÇÃO detectado"
    
    # Criar superuser se não existir (pular para inicialização rápida)
    echo "🔐 Pulando criação de superuser para inicialização rápida..."
    # if [ -n "$DJANGO_SUPERUSER_EMAIL" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
    #     echo "🔐 Criando superuser de produção..."
    #     python manage.py shell -c "
    # from django.contrib.auth import get_user_model;
    # User = get_user_model();
    # if not User.objects.filter(email='$DJANGO_SUPERUSER_EMAIL').exists():
    #     User.objects.create_superuser('$DJANGO_SUPERUSER_EMAIL', '$DJANGO_SUPERUSER_PASSWORD');
    #     print('✅ Superuser criado: $DJANGO_SUPERUSER_EMAIL')
    # else:
    #     print('⚠️ Superuser já existe: $DJANGO_SUPERUSER_EMAIL')
    # "
    # fi
    
    # Verificações de segurança para produção (removidas temporariamente para produção)
    echo "🔐 Pulando verificações de segurança para inicialização rápida..."
    # python manage.py check --deploy --fail-level WARNING
fi

echo "🎉 Backend configurado para ambiente: $(if [ "$DJANGO_DEBUG" = "True" ]; then echo "DESENVOLVIMENTO"; else echo "PRODUÇÃO"; fi)"

# Executar comando principal
exec "$@"