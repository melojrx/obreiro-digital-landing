#!/usr/bin/env python3
"""
Script para corrigir importações do User para usar settings.AUTH_USER_MODEL
"""

import os
import re

# Arquivos que precisam ser corrigidos
files_to_fix = [
    'apps/activities/models.py',
    'apps/branches/models.py', 
    'apps/churches/models.py',
    'apps/core/views.py',
    'apps/denominations/models.py',
    'apps/members/models.py'
]

def fix_file(filepath):
    """Corrige um arquivo específico"""
    print(f"Corrigindo {filepath}...")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Substituir importação
    content = content.replace(
        'from django.contrib.auth.models import User',
        'from django.conf import settings'
    )
    
    # Substituir referências diretas ao User em ForeignKey/OneToOneField
    content = re.sub(
        r'models\.(ForeignKey|OneToOneField)\(\s*User,',
        r'models.\1(settings.AUTH_USER_MODEL,',
        content
    )
    
    # Adicionar import do settings se não existir
    if 'from django.conf import settings' not in content and 'settings.AUTH_USER_MODEL' in content:
        # Encontrar onde adicionar o import
        lines = content.split('\n')
        import_index = 0
        for i, line in enumerate(lines):
            if line.startswith('from django.'):
                import_index = i + 1
        
        lines.insert(import_index, 'from django.conf import settings')
        content = '\n'.join(lines)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ {filepath} corrigido!")

def main():
    """Função principal"""
    print("🔧 Corrigindo importações do User...")
    
    for filepath in files_to_fix:
        if os.path.exists(filepath):
            fix_file(filepath)
        else:
            print(f"❌ Arquivo não encontrado: {filepath}")
    
    print("\n✅ Todas as correções concluídas!")

if __name__ == '__main__':
    main() 