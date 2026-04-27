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
    "CEN_PowerBI_KPI_Entregas_a_tiempo_cliente",
    "CEN_PowerBI_KPI_Entregas_a_tiempo_proveedor",
    "CEN_PowerBI_KPI_Pedidos_fab_entregados_a_tiempo"
]

for view in views:
    print(f"--- Schema for {view} ---")
    try:
        cursor.execute(f"SELECT TOP 1 * FROM {view}")
        columns = [column[0] for column in cursor.description]
        print(f"Columns: {columns}")
        
        # Check what Company field is available
        company_col = [c for c in columns if 'empresa' in c.lower() or c.lower() == 'codemp']
        if company_col:
            cursor.execute(f"SELECT COUNT(*) FROM {view} WHERE {company_col[0]} = 2")
            count = cursor.fetchone()[0]
            print(f"Row count for {company_col[0]} = 2: {count}")
        else:
            # Maybe there's a field indicating company implicitly
            print("No obvious company column found.")
            cursor.execute(f"SELECT COUNT(*) FROM {view}")
            count = cursor.fetchone()[0]
            print(f"Total rows: {count}")
    except Exception as e:
        print(f"Error querying {view}: {e}")
        
conn.close()
