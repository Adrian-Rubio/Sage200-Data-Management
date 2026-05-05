import logging
from sqlalchemy import create_engine, text
from urllib.parse import quote_plus
from dotenv import load_dotenv
import os

load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_DATABASE = os.getenv("DB_DATABASE")
DB_DRIVER = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server")

possible_ips = ["10.0.8.2", "10.0.8.3", "10.0.8.5"]

for ip in possible_ips:
    try:
        temp_params = quote_plus(
            f"DRIVER={{{DB_DRIVER}}};SERVER={ip}\\Misstipsi;DATABASE={DB_DATABASE};UID={DB_USER};PWD={DB_PASSWORD};Connect Timeout=3"
        )
        temp_url = f"mssql+pyodbc:///?odbc_connect={temp_params}"
        temp_engine = create_engine(temp_url)
        
        with temp_engine.connect() as conn:
            print(f"SUCCESS connecting to {ip}!")
            cursor = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE'"))
            tables = [row[0] for row in cursor.fetchall()]
            found = False
            for t in tables:
                t_low = t.lower()
                if any(x in t_low for x in ['caja', 'close', 'cierre', 'z', 'cash', 'session', 'turn']):
                    print(' - ' + t)
                    found = True
            if not found:
                print("No closure tables found on this server.")
    except Exception as e:
        print(f"Failed to connect to {ip}: {e}")
