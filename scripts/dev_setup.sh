#!/bin/bash
# =================================
# OBREIRO DIGITAL - SETUP DESENVOLVIMENTO
# =================================

set -e

echo "🚀 Configurando ambiente de desenvolvimento..."

# Verificar se Docker está disponível
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado!"
    echo "📋 Para WSL2 + Docker Desktop:"
    echo "   1. Instale Docker Desktop no Windows"
    echo "   2. Ative WSL integration nas configurações"
    echo "   3. Reinicie o WSL"
    exit 1
fi

# Verificar se Docker Compose está disponível
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose não encontrado!"
    exit 1
fi

echo "✅ Docker encontrado!"

# Verificar se arquivo .env_dev existe
if [ ! -f ".env_dev" ]; then
    echo "❌ Arquivo .env_dev não encontrado!"
    exit 1
fi

echo "✅ Arquivo .env_dev encontrado!"

# Validar configuração do docker-compose
echo "🔍 Validando configuração do Docker Compose..."
docker compose -f docker-compose.dev.yml config > /dev/null
echo "✅ Configuração válida!"

# Build das imagens
echo "🔨 Construindo imagens Docker..."
docker compose -f docker-compose.dev.yml build

# Iniciar serviços
echo "🚀 Iniciando serviços..."
docker compose -f docker-compose.dev.yml up -d

# Aguardar serviços ficarem prontos
echo "⏳ Aguardando serviços ficarem prontos..."
sleep 30

# Verificar status dos serviços
echo "📊 Status dos serviços:"
docker compose -f docker-compose.dev.yml ps

# Verificar logs do backend
echo "📋 Últimas linhas do log do backend:"
docker compose -f docker-compose.dev.yml logs --tail=10 backend

echo ""
echo "🎉 Ambiente de desenvolvimento configurado!"
echo ""
echo "📡 Serviços disponíveis:"
echo "   Backend API: http://localhost:8000"
echo "   Admin Django: http://localhost:8000/admin"
echo "   API Docs: http://localhost:8000/api/v1/schema/swagger-ui/"
echo "   Frontend: http://localhost:5173"
echo "   PostgreSQL: localhost:5432"
echo "   Redis: localhost:6379"
echo ""
echo "🛠️ Comandos úteis:"
echo "   Ver logs: docker compose -f docker-compose.dev.yml logs -f"
echo "   Parar: docker compose -f docker-compose.dev.yml down"
echo "   Reiniciar: docker compose -f docker-compose.dev.yml restart"
echo ""