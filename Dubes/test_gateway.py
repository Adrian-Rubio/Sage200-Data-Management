import pyodbc

server = "10.0.8.1"
database = "MisstipsiPro"
user = "TpvReadOnly"
password = r"98cxMs}xV>bDzD@Y"

conn_str = f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};UID={user};PWD={password};Timeout=5"
print(f"Trying {server}...")
try:
    conn = pyodbc.connect(conn_str)
    print(f"SUCCESS with {server}")
    cursor = conn.cursor()
    cursor.execute("SELECT TOP 5 TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'")
    for row in cursor.fetchall():
        print(f" - {row.TABLE_NAME}")
    conn.close()
except Exception as e:
    print(f"Failed {server}: {str(e)}")
