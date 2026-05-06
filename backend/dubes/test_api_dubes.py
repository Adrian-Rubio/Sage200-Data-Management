import requests

def test_api():
    base_url = "http://localhost:8000/api/dubes"
    try:
        r = requests.get(f"{base_url}/locals")
        print("--- Locals from API ---")
        print(r.json())
        
        r = requests.get(f"{base_url}/kpis/summary")
        print("\n--- KPI Summary (All) ---")
        print(r.json())
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_api()
