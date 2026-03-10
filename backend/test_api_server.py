import threading
import time
import requests
import uvicorn
import json

def run_server():
    from main import app
    uvicorn.run(app, host="127.0.0.1", port=8001, log_level="error")

t = threading.Thread(target=run_server, daemon=True)
t.start()
time.sleep(2) # let it start

print("\n--- TEST SEARCH ENDPOINT ---")
try:
    response = requests.get("http://127.0.0.1:8001/api/inventory-tracking/search?q=21100464")
    print(f"Status: {response.status_code}")
    print("Response:", json.dumps(response.json(), indent=2)[:500])
except Exception as e:
    print(e)
