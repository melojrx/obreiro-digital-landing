#!/usr/bin/env python3
"""
Script para corrigir permissões de usuários DENOMINATION_ADMIN
"""

import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from apps.accounts.models import ChurchUser, CustomUser
from apps.core.models import RoleChoices

def fix_denomination_admin_permissions():
    """Corrige permissões para usuários DENOMINATION_ADMIN"""
    
    print("🔧 Corrigindo permissões para usuários DENOMINATION_ADMIN...")
    
    # Encontrar todos os usuários DENOMINATION_ADMIN com permissões incorretas
    problematic_users = ChurchUser.objects.filter(
        role=RoleChoices.DENOMINATION_ADMIN,
        can_access_admin=False  # Se essa está False, provavelmente todas estão
    )
    
    print(f"📋 Encontrados {problematic_users.count()} usuários com permissões incorretas:")
    
    for church_user in problematic_users:
        user = church_user.user
        print(f"\n👤 Corrigindo: {user.email}")
        print(f"   Igreja: {church_user.church.name}")
        print(f"   Role: {church_user.role}")
        
        # Exibir permissões antes
        print(f"   Permissões ANTES:")
        print(f"     can_access_admin: {church_user.can_access_admin}")
        print(f"     can_manage_members: {church_user.can_manage_members}")
        print(f"     can_manage_visitors: {church_user.can_manage_visitors}")
        print(f"     can_manage_activities: {church_user.can_manage_activities}")
        print(f"     can_view_reports: {church_user.can_view_reports}")
        print(f"     can_manage_branches: {church_user.can_manage_branches}")
        
        # Aplicar correção
        church_user.set_permissions_by_role()
        church_user.save()
        
        # Exibir permissões depois
        print(f"   Permissões DEPOIS:")
        print(f"     can_access_admin: {church_user.can_access_admin}")
        print(f"     can_manage_members: {church_user.can_manage_members}")
        print(f"     can_manage_visitors: {church_user.can_manage_visitors}")
        print(f"     can_manage_activities: {church_user.can_manage_activities}")
        print(f"     can_view_reports: {church_user.can_view_reports}")
        print(f"     can_manage_branches: {church_user.can_manage_branches}")
        
        print(f"   ✅ Usuário {user.email} corrigido!")
    
    print(f"\n🎉 Correção concluída! {problematic_users.count()} usuários corrigidos.")

if __name__ == "__main__":
    fix_denomination_admin_permissions()
