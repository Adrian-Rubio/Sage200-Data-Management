import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

SERVER = os.getenv("DB_SERVER", "localhost")
DATABASE = os.getenv("DB_DATABASE")
USER = os.getenv("DB_USER")
PASSWORD = os.getenv("DB_PASSWORD")
DRIVER = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server")

SQLALCHEMY_DATABASE_URL = f"mssql+pyodbc://{USER}:{PASSWORD}@{SERVER}/{DATABASE}?driver={DRIVER}&TrustServerCertificate=yes"
engine = create_engine(SQLALCHEMY_DATABASE_URL)

try:
    with engine.connect() as conn:
        print("--- USER INFO ---")
        res = conn.execute(text("SELECT id, username, department_id, position_id, role, role_id FROM dashboard_users WHERE username = 'robert.calderon'")).fetchone()
        if res:
            print(f"ID: {res[0]}, Username: {res[1]}, Department ID: {res[2]}, Position ID: {res[3]}, Role: {res[4]}, Role ID: {res[5]}")
            pos_id = res[3]
            
            print("\n--- POSITION INFO ---")
            res_pos = conn.execute(text(f"SELECT id, name, can_manage_users FROM dashboard_positions WHERE id = {pos_id}")).fetchone()
            if res_pos:
                print(f"Position ID: {res_pos[0]}, Name: {res_pos[1]}, can_manage_users: {res_pos[2]}")
        else:
            print("Robert Calderon not found!")
except Exception as e:
    print(f"Error: {e}")
