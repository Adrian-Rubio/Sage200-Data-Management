from database import SessionLocal
from routers.inventory_tracking import get_articles_in_fabrication
from models import User

# Simulated DB session
db = SessionLocal()

# Simulated user
class MockUser:
    id = 1
    username = "admin"
    is_active = True

try:
    print("Testing get_articles_in_fabrication...")
    res = get_articles_in_fabrication(db=db, current_user=MockUser())
    print(f"Success! Found {len(res)} articles.")
    if len(res) > 0:
        print("First 3 results:")
        print(res[:3])
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
