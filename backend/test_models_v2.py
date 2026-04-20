import sys
import os

# Add parent directory to path to import database
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
import models

def test_db():
    db = SessionLocal()
    try:
        user = db.query(models.User).first()
        if user:
            print(f"User found: {user.username}")
            print(f"User Type: {user.user_type}")
            print(f"Data Filters: {user.data_filters}")
        
        role = db.query(models.Role).first()
        if role:
            print(f"Role found: {role.name}")
            print(f"Can View Inventario: {role.can_view_inventario}")
            
        print("Database model check SUCCESSFUL.")
    except Exception as e:
        print(f"Database model check FAILED: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_db()
