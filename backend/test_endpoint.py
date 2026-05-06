from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
import models
import auth

client = TestClient(app)

# Mock user
db = SessionLocal()
user = db.query(models.User).first()
db.close()

# We need a token or mock the dependency
def override_get_current_user():
    return user

app.dependency_overrides[auth.get_current_active_user] = override_get_current_user

response = client.get("/api/home/summary")
print(response.status_code)
if response.status_code != 200:
    print(response.text)
else:
    print(response.json())
