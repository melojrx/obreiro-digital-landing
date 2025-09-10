#!/bin/bash

echo "🎯 TESTE FINAL - SISTEMA DE LOGIN"
echo "================================="
echo ""

echo "✅ 1. Backend funcionando:"
backend_response=$(curl -s -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "teste@login.com", "password": "123456"}')

if echo "$backend_response" | grep -q "token"; then
    echo "   ✅ Backend OK - Login funciona"
else
    echo "   ❌ Backend com problema"
    echo "   Response: $backend_response"
fi

echo ""
echo "✅ 2. Frontend carregando:"
frontend_response=$(curl -s http://localhost:5173)
if echo "$frontend_response" | grep -q "Obreiro Virtual"; then
    echo "   ✅ Frontend OK - Página carrega"
else
    echo "   ❌ Frontend com problema"
fi

echo ""
echo "✅ 3. Configuração da API no frontend:"
echo "   📂 Arquivo .env:"
cat frontend/.env

echo ""
echo "✅ 4. Containers ativos:"
docker-compose -f docker-compose.dev.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🎉 INSTRUÇÕES PARA TESTAR:"
echo "================================="
echo "1. Acesse: http://localhost:5173/login"
echo "2. Use as credenciais:"
echo "   📧 Email: teste@login.com"
echo "   🔒 Senha: 123456"
echo ""
echo "3. Ou teste com outros usuários existentes:"
echo "   📧 admin@teste.com"
echo "   📧 pastor@teste.com"
echo "   📧 admin@obreirovirtual.com"
echo "   🔒 Senha padrão: admin123 ou 123456"
echo ""
echo "💡 Se ainda não funcionar, verifique o console do navegador (F12)"
