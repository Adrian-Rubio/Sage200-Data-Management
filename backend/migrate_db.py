from database import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE dashboard_users ADD role_id INT NULL"))
        conn.execute(text("ALTER TABLE dashboard_users ADD CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES dashboard_roles(id)"))
        conn.commit()
        print("Successfully added role_id to dashboard_users")
except Exception as e:
    print(f"Error modifying schema: {e}")
