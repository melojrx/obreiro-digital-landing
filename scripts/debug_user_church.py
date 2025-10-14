#!/usr/bin/env python3
"""Debug userChurch vs activeChurch endpoints"""

import requests
import json

BASE_URL = "http://localhost:8000/api/v1"
HEADERS = {'Content-Type': 'application/json'}

def test_endpoints():
    # Login
    print("🔐 Fazendo login...")
    login_response = requests.post(f"{BASE_URL}/auth/login/", 
                                 headers=HEADERS, 
                                 data=json.dumps({
                                     "email": "denominacao.admin@teste.com", 
                                     "password": "teste123"
                                 }))
    
    if login_response.status_code != 200:
        print(f"❌ Login falhou: {login_response.text}")
        return
        
    token = login_response.json()['token']
    auth_headers = HEADERS.copy()
    auth_headers['Authorization'] = f'Token {token}'
    
    print(f"✅ Login OK - Token: {token[:20]}...")
    
    # Test both endpoints
    print("\n📋 Testando endpoint /users/my_church/...")
    try:
        response = requests.get(f"{BASE_URL}/users/my_church/", headers=auth_headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ my_church data: {json.dumps(data, indent=2)}")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Exception: {e}")
    
    print("\n📋 Testando endpoint /auth/active-church/...")
    try:
        response = requests.get(f"{BASE_URL}/auth/active-church/", headers=auth_headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ active-church data: {json.dumps(data, indent=2)}")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    test_endpoints()