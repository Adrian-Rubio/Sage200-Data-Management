import requests
import sys

def test_api():
    base_url = "http://localhost:8000"
    
    # 1. Login to get token
    try:
        login_resp = requests.post(f"{base_url}/api/auth/login", data={"username": "admin", "password": "password"})
        if login_resp.status_code != 200:
            # Try 'admin' as password if 'password' fails
            login_resp = requests.post(f"{base_url}/api/auth/login", data={"username": "admin", "password": "admin"})
            
        if login_resp.status_code != 200:
            print(f"Login failed: {login_resp.text}")
            return
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
    except Exception as e:
        print(f"Login error: {e}")
        return

    # 2. Test operations for 496
    print("\nTesting /api/production/operations/2026/496...")
    try:
        resp = requests.get(f"{base_url}/api/production/operations/2026/496", headers=headers)
        print(f"Status: {resp.status_code}")
        print("Response:", resp.text[:500])
    except Exception as e:
        print(f"Request error: {e}")

if __name__ == "__main__":
    test_api()
