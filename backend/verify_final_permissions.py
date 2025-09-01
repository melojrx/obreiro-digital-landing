#!/usr/bin/env python
"""
Script de verificação final das permissões para o usuário denomination_admin
"""
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.prod')
django.setup()

from apps.accounts.models import ChurchUser

def verify_final_permissions():
    print("🔍 VERIFICAÇÃO FINAL DAS PERMISSÕES")
    print("=" * 50)
    
    try:
        # Buscar usuário por email
        user = ChurchUser.objects.filter(user__email='batistanordeste@gmail.com').first()
        
        if user:
            print(f"✅ Usuário: {user.user.email}")
            print(f"👤 Nome completo: {user.user.first_name} {user.user.last_name}")
            print(f"🏛️ Igreja: {user.church.name}")
            print(f"🎭 Role: {user.role}")
            print()
            print("📋 PERMISSÕES BACKEND:")
            print(f"   can_access_admin: {'✅' if user.can_access_admin else '❌'} {user.can_access_admin}")
            print(f"   can_manage_members: {'✅' if user.can_manage_members else '❌'} {user.can_manage_members}")
            print(f"   can_manage_visitors: {'✅' if user.can_manage_visitors else '❌'} {user.can_manage_visitors}")
            print(f"   can_manage_activities: {'✅' if user.can_manage_activities else '❌'} {user.can_manage_activities}")
            print(f"   can_view_reports: {'✅' if user.can_view_reports else '❌'} {user.can_view_reports}")
            print(f"   can_manage_branches: {'✅' if user.can_manage_branches else '❌'} {user.can_manage_branches}")
            print()
            
            # Verificar se todas as permissões estão corretas para DENOMINATION_ADMIN
            expected_permissions = {
                'can_access_admin': True,
                'can_manage_members': True,
                'can_manage_visitors': True,
                'can_manage_activities': True,
                'can_view_reports': True,
                'can_manage_branches': True,
            }
            
            all_correct = True
            for perm, expected in expected_permissions.items():
                actual = getattr(user, perm)
                if actual != expected:
                    print(f"❌ ERRO: {perm} deveria ser {expected}, mas é {actual}")
                    all_correct = False
            
            if all_correct:
                print("🎉 TODAS AS PERMISSÕES ESTÃO CORRETAS!")
                print()
                print("📱 INSTRUÇÕES PARA O FRONTEND:")
                print("1. Acesse http://localhost:3000")
                print("2. Faça login com: batistanordeste@gmail.com")
                print("3. Na sidebar, você deve ver a seção 'GESTÃO HIERÁRQUICA' com:")
                print("   - Dashboard Denominação")
                print("   - Gerenciar Igrejas")
                print("   - Visão Hierárquica")
                print()
                print("🔧 Se o menu não aparecer, pode ser um problema de:")
                print("   - Cache do navegador (Ctrl+F5)")
                print("   - Token JWT não atualizado (fazer logout/login)")
                print("   - Problema na comunicação frontend/backend")
            else:
                print("❌ EXISTEM PERMISSÕES INCORRETAS!")
                
        else:
            print('❌ Usuário não encontrado!')
            
    except Exception as e:
        print(f"❌ Erro na verificação: {e}")

if __name__ == "__main__":
    verify_final_permissions()
