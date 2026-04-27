import pyodbc
from dotenv import load_dotenv
import os

load_dotenv()

server = os.getenv('DB_SERVER')
database = os.getenv('DB_DATABASE')
username = os.getenv('DB_USER')
password = os.getenv('DB_PASSWORD')
driver = '{ODBC Driver 17 for SQL Server}'

conn_str = f"DRIVER={driver};SERVER={server};DATABASE={database};UID={username};PWD={password}"
conn = pyodbc.connect(conn_str)
cursor = conn.cursor()

views = [
    "CEN_PowerBI_KPI_Entregas_a_tiempo_proveedor",
    "CEN_PowerBI_KPI_Pedidos_fab_entregados_a_tiempo"
]

for view in views:
    print(f"--- Definition of {view} ---")
    try:
        cursor.execute(f"EXEC sp_helptext '{view}'")
        for row in cursor.fetchall():
            print(row[0].strip())
    except Exception as e:
        print(f"Error querying {view}: {e}")
        
conn.close()
