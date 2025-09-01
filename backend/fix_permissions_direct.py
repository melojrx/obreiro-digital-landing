#!/usr/bin/env python
"""
Script para corrigir permissões do usuário denomination_admin
"""
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.prod')
django.setup()

from apps.accounts.models import ChurchUser

def fix_permissions():
    try:
        # Buscar usuário por email
        user = ChurchUser.objects.filter(user__email='batistanordeste@gmail.com').first()
        
        if user:
            print(f'✅ Usuário encontrado: {user.user.email}')
            print(f'📋 Role atual: {user.role}')
            
            # Status antes da correção
            print("\n📊 Permissões ANTES da correção:")
            print(f"   can_access_admin: {user.can_access_admin}")
            print(f"   can_manage_members: {user.can_manage_members}")
            print(f"   can_manage_visitors: {user.can_manage_visitors}")
            print(f"   can_manage_activities: {user.can_manage_activities}")
            print(f"   can_view_reports: {user.can_view_reports}")
            print(f"   can_manage_branches: {user.can_manage_branches}")
            
            # Aplicar permissões manualmente baseadas no role
            if user.role == 'DENOMINATION_ADMIN':
                user.can_access_admin = True
                user.can_manage_members = True
                user.can_manage_visitors = True
                user.can_manage_activities = True
                user.can_view_reports = True
                user.can_manage_branches = True
                
                user.save()
                
                print("\n✅ Permissões corrigidas!")
                
                # Status após a correção
                user.refresh_from_db()
                print("\n📊 Permissões APÓS a correção:")
                print(f"   can_access_admin: {user.can_access_admin}")
                print(f"   can_manage_members: {user.can_manage_members}")
                print(f"   can_manage_visitors: {user.can_manage_visitors}")
                print(f"   can_manage_activities: {user.can_manage_activities}")
                print(f"   can_view_reports: {user.can_view_reports}")
                print(f"   can_manage_branches: {user.can_manage_branches}")
            else:
                print(f"❌ Usuário não é DENOMINATION_ADMIN. Role atual: {user.role}")
                
        else:
            print('❌ Usuário não encontrado!')
            
    except Exception as e:
        print(f"❌ Erro ao corrigir permissões: {e}")

if __name__ == "__main__":
    fix_permissions()
