#!/usr/bin/env python3
"""
Script para limpar relações ChurchUser órfãs
Remove ChurchUsers que apontam para Churches que não existem mais
"""

import requests
import json
import sys

BASE_URL = "http://localhost:8000/api/v1"
HEADERS = {'Content-Type': 'application/json'}

def fix_orphan_church_users():
    """Remove relações ChurchUser órfãs"""
    print("🧹 LIMPEZA DE RELAÇÕES CHURCHUSER ÓRFÃS")
    print("=" * 50)
    
    # Login
    print("🔐 Fazendo login como denomination.admin...")
    login = requests.post(f"{BASE_URL}/auth/login/", 
                         headers=HEADERS, 
                         data=json.dumps({
                             "email": "denominacao.admin@teste.com", 
                             "password": "teste123"
                         }))
    
    if login.status_code != 200:
        print(f"❌ Login falhou: {login.text}")
        return False
        
    token = login.json()['token']
    user_id = login.json()['user']['id']
    auth_headers = HEADERS.copy()
    auth_headers['Authorization'] = f'Token {token}'
    
    print(f"✅ Login OK - User ID: {user_id}")
    
    # Buscar igrejas no dropdown
    print(f"\n📋 Analisando igrejas no dropdown...")
    my_churches = requests.get(f"{BASE_URL}/auth/my-churches/", headers=auth_headers)
    
    if my_churches.status_code != 200:
        print(f"❌ Erro ao buscar igrejas: {my_churches.text}")
        return False
    
    churches = my_churches.json().get('churches', [])
    print(f"   Encontradas {len(churches)} relações ChurchUser")
    
    # Verificar quais igrejas existem
    orphan_ids = []
    valid_ids = []
    
    for church in churches:
        church_id = church['id']
        church_name = church['name']
        
        # Verificar se a igreja existe
        church_check = requests.get(f"{BASE_URL}/churches/{church_id}/", headers=auth_headers)
        
        if church_check.status_code == 200:
            print(f"   ✅ ID {church_id}: {church_name} - EXISTE")
            valid_ids.append(church_id)
        else:
            print(f"   ❌ ID {church_id}: {church_name} - ÓRFÃ (será removida)")
            orphan_ids.append({
                'id': church_id,
                'name': church_name,
                'role': church['role_code']
            })
    
    if not orphan_ids:
        print(f"\n✅ Nenhuma relação órfã encontrada!")
        return True
    
    print(f"\n🔍 Encontradas {len(orphan_ids)} relações órfãs para remover:")
    for orphan in orphan_ids:
        print(f"   - Igreja ID {orphan['id']}: {orphan['name']} (Role: {orphan['role']})")
    
    # IMPORTANTE: Este script não pode deletar diretamente via API
    # Vamos criar comandos Django para o administrador executar
    print(f"\n📋 COMANDOS DJANGO PARA EXECUTAR:")
    print(f"   cd backend")
    print(f"   python manage.py shell")
    print(f"")
    print(f"   # No shell Django:")
    print(f"   from apps.accounts.models import ChurchUser")
    print(f"   from django.contrib.auth.models import User")
    print(f"   ")
    print(f"   user = User.objects.get(id={user_id})")
    print(f"   print(f'Usuário: {{user.full_name}} ({{user.email}})')")
    print(f"   ")
    for orphan in orphan_ids:
        print(f"   # Remover relação órfã com igreja ID {orphan['id']} ({orphan['name']})")
        print(f"   ChurchUser.objects.filter(user=user, church_id={orphan['id']}).delete()")
    
    print(f"   ")
    print(f"   print('Relações órfãs removidas!')")
    print(f"   exit()")
    
    print(f"\n⚠️  ALTERNATIVA RÁPIDA - Manter apenas igreja válida (ID 33):")
    print(f"   ChurchUser.objects.filter(user=user).exclude(church_id=33).delete()")
    print(f"   ChurchUser.objects.filter(user=user, church_id=33).update(is_active=True)")
    
    return True

def verify_cleanup():
    """Verificar se a limpeza funcionou"""
    print(f"\n🔍 VERIFICAÇÃO PÓS-LIMPEZA:")
    print(f"   Execute novamente este comando após rodar os comandos Django:")
    print(f"   python3 -c \"import requests, json; ...")
    
if __name__ == "__main__":
    success = fix_orphan_church_users()
    
    if success:
        print(f"\n📋 PRÓXIMOS PASSOS:")
        print(f"1. Execute os comandos Django mostrados acima")
        print(f"2. Recarregue o frontend (botão de limpar cache)")
        print(f"3. Verifique se o dropdown mostra apenas igrejas válidas")
    else:
        print(f"\n💥 Falhou na análise das relações órfãs")