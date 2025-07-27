#!/bin/bash
# ============================================
# OBREIRO DIGITAL - FIX MEDIA PERMISSIONS
# ============================================
# Este script corrige as permissões do diretório media
# para permitir que o container Django escreva arquivos

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔧 Corrigindo permissões do diretório media...${NC}"

# Alterar proprietário para o usuário do container (uid 999)
chown -R 999:999 /root/obreiro-digital-landing/media_prod/

# Garantir permissões de escrita
chmod -R 755 /root/obreiro-digital-landing/media_prod/

# Criar diretórios necessários se não existirem
mkdir -p /root/obreiro-digital-landing/media_prod/branches/qr_codes
chown -R 999:999 /root/obreiro-digital-landing/media_prod/branches/

echo -e "${GREEN}✅ Permissões corrigidas com sucesso!${NC}"
echo ""
echo "Agora o Django pode salvar arquivos de QR Code e outras mídias."