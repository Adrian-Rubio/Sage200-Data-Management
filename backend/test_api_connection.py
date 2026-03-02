import requests
import json

def test_api_almacen():
    url = "http://localhost:8000/api/almacen/stats"
    # Need to login first to get a token
    login_url = "http://localhost:8000/api/auth/login"
    login_data = {
        "username": "admin",
        "password": "adminpassword" # I need to know a valid user/pass
    }
    
    # Or maybe I can use the health check to see if DB is connected
    health_url = "http://localhost:8000/health"
    try:
        r = requests.get(health_url)
        print(f"Health: {r.status_code} - {r.json()}")
    except Exception as e:
        print(f"Health check failed: {e}")
        return

    # If I can't login, I can't test the protected endpoint easily.
    # But I can try to find a valid user in the DB.
    
    # Let's try to bypass auth by creating a temporary endpoint or just checking the logs.
    # Actually, I'll just check if I can find any obvious issue in the query again.

if __name__ == "__main__":
    test_api_almacen()
