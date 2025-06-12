#!/usr/bin/env python3
"""
Script para testar os endpoints da API ObreiroVirtual
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"
TOKEN = "3542c8d510fdd0953d01083018297da9421f7c3b"

headers = {
    "Authorization": f"Token {TOKEN}",
    "Content-Type": "application/json"
}

def test_endpoint(endpoint, method="GET", data=None):
    """Testa um endpoint específico"""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data)
        
        print(f"\n{'='*50}")
        print(f"Endpoint: {method} {endpoint}")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"Response: {json.dumps(data, indent=2, ensure_ascii=False)[:500]}...")
            except:
                print(f"Response (text): {response.text[:200]}...")
        else:
            print(f"Error: {response.text[:200]}...")
            
    except Exception as e:
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