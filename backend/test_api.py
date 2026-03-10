from fastapi.testclient import TestClient
from main import app
import json

client = TestClient(app)

print("\n--- TEST SEARCH ENDPOINT ---")
response = client.get("/api/inventory-tracking/search?q=21100464")
print(f"Status: {response.status_code}")
print("Response:", json.dumps(response.json(), indent=2))
