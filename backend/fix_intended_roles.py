"""
Script para corrigir intended_role de usuários antigos
Atualiza usuários que:
- Têm subscription_plan
- Não têm intended_role definido
- Não têm igreja vinculada
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import CustomUser, ChurchUser

def fix_intended_roles():
    """Corrige intended_role para usuários sem igreja"""
    
    # Buscar todos os usuários
    users = CustomUser.objects.filter(is_active=True)
    
    fixed_count = 0
    
    for user in users:
        # Verificar se tem igreja
        has_church = ChurchUser.objects.filter(user=user, is_active=True).exists()
        
        # Verificar se tem perfil
        if not hasattr(user, 'profile') or not user.profile:
            continue
        
        # Se tem plano, não tem igreja e não tem intended_role
        if user.subscription_plan and not has_church and not user.profile.intended_role:
            user.profile.intended_role = 'CHURCH_ADMIN'
            user.profile.save()
            fixed_count += 1
            print(f'✅ {user.email} - intended_role definido como CHURCH_ADMIN')
    
    print(f'\n📊 Total de usuários corrigidos: {fixed_count}')

if __name__ == '__main__':
    print('🔧 Iniciando correção de intended_roles...\n')
    fix_intended_roles()
    print('\n✅ Correção concluída!')
