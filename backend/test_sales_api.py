import requests

def main():
    try:
        url = "http://127.0.0.1:8000/api/sales/dashboard"
        payload = {
            "start_date": "2025-01-01",
            "end_date": "2025-02-28",
            "company_id": None,
            "sales_rep_id": None,
            "client_id": None,
            "series_id": None,
            "division": None
        }
        # Since the route is protected by `Depends(auth.get_current_active_user)`
        # Let's write a script to just get a token and then call the dashboard API
        
        # 1. Login to get token
        login_url = "http://127.0.0.1:8000/api/auth/token"
        login_data = {
            "username": "admin",
            "password": "password" # Trying default
        }
        print("Authenticating...")
        r = requests.post(login_url, data=login_data)
        if r.status_code != 200:
            print(f"Login failed: {r.status_code} {r.text}")
            return
            
        token = r.json().get('access_token')
        
        # 2. Call dashboard
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        print("Calling dashboard API...")
        r_dash = requests.post(url, json=payload, headers=headers)
        if r_dash.status_code == 200:
            data = r_dash.json()
            kpis = data.get('kpis', {})
            print(f"Revenue KPI: {kpis.get('revenue')}")
            print(f"Margin KPI: {kpis.get('sales_margin')}")
            print(f"Margin Dist: {data.get('charts', {}).get('sales_margin_dist')}")
        else:
            print(f"Dashboard failed: {r_dash.status_code} {r_dash.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
