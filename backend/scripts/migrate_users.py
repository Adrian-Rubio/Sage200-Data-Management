import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import engine

def migrate():
    with engine.connect() as conn:
        print("Añadiendo columnas a dashboard_users...")
        try:
            conn.execute(text("ALTER TABLE dashboard_users ADD department_id INT;"))
            print("department_id añadido.")
        except Exception as e:
            print(f"department_id ya existe o error: {e}")
            
        try:
            conn.execute(text("ALTER TABLE dashboard_users ADD division_id INT;"))
            print("division_id añadido.")
        except Exception as e:
            print(f"division_id ya existe o error: {e}")
            
        try:
            conn.execute(text("ALTER TABLE dashboard_users ADD position_id INT;"))
            print("position_id añadido.")
        except Exception as e:
            print(f"position_id ya existe o error: {e}")
            
        conn.commit()
        print("Migración completada.")

if __name__ == "__main__":
    migrate()
