#!/bin/bash

echo "🔍 Testando sistema de login..."
echo ""

echo "1️⃣ Testando backend diretamente:"
curl -s -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "teste@login.com", "password": "123456"}' | python3 -m json.tool

echo ""
echo "2️⃣ Verificando se frontend está configurado corretamente:"
echo "- URL do frontend: http://localhost:5173"
echo "- URL da API configurada no frontend:"

# Tentar encontrar a configuração da API no frontend
docker-compose -f docker-compose.dev.yml logs frontend | grep -E "VITE_API_URL|API" | tail -5

echo ""
echo "3️⃣ Verificando se os containers estão funcionando:"
docker-compose -f docker-compose.dev.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "4️⃣ Logs recentes do backend:"
docker-compose -f docker-compose.dev.yml logs backend --tail=3
