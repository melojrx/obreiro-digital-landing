#!/usr/bin/env python3
"""
Script para testar operações CRUD da API
"""

import urllib.request
import urllib.error
import json
import time

BASE_URL = "http://127.0.0.1:8000/api/v1"
TOKEN = "3542c8d510fdd0953d01083018297da9421f7c3b"

def make_request(endpoint, method="GET", data=None):
    """Faz uma requisição HTTP"""
    url = f"{BASE_URL}{endpoint}"
    
    req = urllib.request.Request(url, method=method)
    req.add_header('Authorization', f'Token {TOKEN}')
    req.add_header('Content-Type', 'application/json')
    
    if data:
        req.data = json.dumps(data).encode('utf-8')
    
    try:
        with urllib.request.urlopen(req) as response:
            result = response.read().decode('utf-8')
            return response.status, json.loads(result)
    except urllib.error.HTTPError as e:
        error_data = e.read().decode('utf-8')
        return e.code, error_data
    except Exception as e:
        return 500, str(e)

def test_crud_operations():
    """Testa operações CRUD"""
    
    print("🚀 Testando operações CRUD")
    
    # 1. Testar criação de ministério
    timestamp = int(time.time())
    print("\n1. Criando ministério...")
    ministry_data = {
        "church": 1,
        "name": f"Ministério de Louvor {timestamp}",
        "description": "Ministério responsável pela música e adoração",
        "color": "#ff6b6b",
        "is_public": True
    }
    
    status, result = make_request("/v1/ministries/", "POST", ministry_data)
    print(f"Status: {status}")
    
    if status == 201 and isinstance(result, dict) and 'id' in result:
        ministry_id = result['id']
        print(f"✅ Ministério criado com ID: {ministry_id}")
        print(f"✅ Nome: {result['name']}")
    else:
        print(f"❌ Erro: {result}")
        return
    
    # 2. Testar listagem
    print("\n2. Listando ministérios...")
    status, result = make_request("/v1/ministries/")
    print(f"Status: {status}")
    if status == 200:
        print(f"✅ Total de ministérios: {result.get('count', 'N/A')}")
    
    # 3. Testar detalhes
    print(f"\n3. Buscando detalhes do ministério {ministry_id}...")
    status, result = make_request(f"/v1/ministries/{ministry_id}/")
    print(f"Status: {status}")
    if status == 200:
        print(f"✅ Nome: {result.get('name', 'N/A')}")
        print(f"✅ Descrição: {result.get('description', 'N/A')}")
    
    # 4. Testar ação customizada
    print(f"\n4. Testando estatísticas do ministério {ministry_id}...")
    status, result = make_request(f"/v1/ministries/{ministry_id}/stats/")
    print(f"Status: {status}")
    if status == 200:
        print(f"✅ Estatísticas obtidas!")
        print(f"   - Total membros: {result.get('total_members', 0)}")
        print(f"   - Total atividades: {result.get('total_activities', 0)}")
    
    # 5. Testar criação de atividade
    print("\n5. Criando atividade...")
    activity_data = {
        "church": 1,
        "branch": 1,
        "ministry": ministry_id,
        "name": f"Ensaio de Louvor {timestamp}",
        "description": "Ensaio semanal do ministério de louvor",
        "activity_type": "rehearsal",
        "start_datetime": "2025-06-15T19:00:00Z",
        "end_datetime": "2025-06-15T21:00:00Z",
        "location": "Sala de música",
        "requires_registration": False,
        "is_public": True
    }
    
    status, result = make_request("/v1/activities/", "POST", activity_data)
    print(f"Status: {status}")
    if status == 201:
        activity_id = result['id']
        print(f"✅ Atividade criada com ID: {activity_id}")
        print(f"✅ Nome: {result['name']}")
    else:
        print(f"❌ Erro na atividade: {result}")
    
    # 6. Testar próximas atividades
    print("\n6. Testando próximas atividades...")
    status, result = make_request("/v1/activities/upcoming/")
    print(f"Status: {status}")
    if status == 200:
        print(f"✅ Próximas atividades: {len(result)} encontradas")
    
    print(f"\n{'='*50}")
    print("✅ Teste CRUD concluído com sucesso!")

if __name__ == "__main__":
    test_crud_operations() 