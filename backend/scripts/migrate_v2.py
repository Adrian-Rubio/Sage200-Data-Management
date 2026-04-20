import sys
import os

# Add parent directory to path to import database
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine
from sqlalchemy import text

def migrate():
    print("Starting migration...")
    
    with engine.connect() as conn:
        # Add column can_view_inventario to dashboard_roles
        try:
            print("Adding can_view_inventario to dashboard_roles...")
            conn.execute(text("ALTER TABLE dashboard_roles ADD can_view_inventario BIT DEFAULT 0"))
            conn.execute(text("UPDATE dashboard_roles SET can_view_inventario = 0"))
            print("Successfully added can_view_inventario.")
        except Exception as e:
            if "already" in str(e).lower() or "Duplicate" in str(e):
                print("Column can_view_inventario already exists.")
            else:
                print(f"Error adding can_view_inventario: {e}")

        # Add column user_type to dashboard_users
        try:
            print("Adding user_type to dashboard_users...")
            conn.execute(text("ALTER TABLE dashboard_users ADD user_type VARCHAR(20) DEFAULT 'CENVAL'"))
            conn.execute(text("UPDATE dashboard_users SET user_type = 'CENVAL'"))
            print("Successfully added user_type.")
        except Exception as e:
            if "already" in str(e).lower():
                print("Column user_type already exists.")
            else:
                print(f"Error adding user_type: {e}")

        # Add column data_filters to dashboard_users
        try:
            print("Adding data_filters to dashboard_users...")
            conn.execute(text("ALTER TABLE dashboard_users ADD data_filters VARCHAR(1000)"))
            print("Successfully added data_filters.")
        except Exception as e:
            if "already" in str(e).lower():
                print("Column data_filters already exists.")
            else:
                print(f"Error adding data_filters: {e}")
        
        conn.commit()
    
    print("Migration finished.")

if __name__ == "__main__":
    migrate()
