
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=r"c:\Users\adrian.rubio\OneDrive - CENVAL S.L\Escritorio\repositorios\Data_Management\backend\.env")

SERVER = os.getenv("DB_SERVER", "localhost")
DATABASE = os.getenv("DB_DATABASE")
USER = os.getenv("DB_USER")
PASSWORD = os.getenv("DB_PASSWORD")
DRIVER = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server")

SQLALCHEMY_DATABASE_URL = f"mssql+pyodbc://{USER}:{PASSWORD}@{SERVER}/{DATABASE}?driver={DRIVER}&TrustServerCertificate=yes"

engine = create_engine(SQLALCHEMY_DATABASE_URL)

try:
    with engine.connect() as conn:
        print("Actualizando valores NULL en 'must_change_password'...")
        conn.execute(text("UPDATE dashboard_users SET must_change_password = 0 WHERE must_change_password IS NULL"))
        print("Cambiando columna a NOT NULL...")
        conn.execute(text("ALTER TABLE dashboard_users ALTER COLUMN must_change_password BIT NOT NULL"))
        conn.commit()
        print("Limpieza completada con éxito.")
except Exception as e:
    print(f"Error en la limpieza: {e}")
