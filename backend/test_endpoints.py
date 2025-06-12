#!/usr/bin/env python3
"""
Script simples para testar endpoints da API
"""

import urllib.request
import urllib.error
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"
TOKEN = "3542c8d510fdd0953d01083018297da9421f7c3b"

def test_endpoint(endpoint):
    """Testa um endpoint específico"""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        req = urllib.request.Request(url)
        req.add_header('Authorization', f'Token {TOKEN}')
        
        with urllib.request.urlopen(req) as response:
            data = response.read().decode('utf-8')
            
            print(f"\n✅ {endpoint}")
            print(f"Status: {response.status}")
            
            try:
                json_data = json.loads(data)
                if isinstance(json_data, dict) and 'results' in json_data:
                    print(f"Count: {json_data.get('count', 0)}")
                    print(f"Results: {len(json_data['results'])} items")
                elif isinstance(json_data, list):
                    print(f"Results: {len(json_data)} items")
                else:
                    print(f"Response: {str(json_data)[:100]}...")
            except:
                print(f"Response: {data[:100]}...")
                
    except urllib.error.HTTPError as e:
        print(f"\n❌ {endpoint}")
        print(f"Error {e.code}: {e.reason}")
    except Exception as e:
        print(f"\n❌ {endpoint}")
        print(f"Exception: {e}")

if __name__ == "__main__":
    print("🚀 Testando API ObreiroVirtual")
    
    # Endpoints básicos
    test_endpoint("/status/")
    test_endpoint("/health/")
    
    # Endpoints principais
    test_endpoint("/v1/denominations/")
    test_endpoint("/v1/churches/")
    test_endpoint("/v1/members/")
    test_endpoint("/v1/visitors/")
    test_endpoint("/v1/activities/")
    test_endpoint("/v1/ministries/")
    
    print(f"\n{'='*50}")
    print("✅ Teste concluído!") 