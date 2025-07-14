#!/bin/bash
# =================================
# OBREIRO DIGITAL - FIX DOCKER PERMISSIONS
# =================================

echo "🔧 Corrigindo permissões do Docker..."

# Adicionar usuário ao grupo docker
echo "👤 Adicionando usuário ao grupo docker..."
sudo usermod -aG docker $USER

# Verificar se o grupo docker existe
if ! getent group docker > /dev/null 2>&1; then
    echo "📦 Criando grupo docker..."
    sudo groupadd docker
    sudo usermod -aG docker $USER
fi

# Alterar permissões do socket (temporário)
echo "🔌 Ajustando permissões do socket Docker..."
sudo chmod 666 /var/run/docker.sock

echo ""
echo "✅ Permissões corrigidas!"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   1. Execute: newgrp docker"
echo "   2. Ou reinicie o terminal/WSL"
echo "   3. Execute novamente: ./scripts/dev_setup.sh"
echo ""