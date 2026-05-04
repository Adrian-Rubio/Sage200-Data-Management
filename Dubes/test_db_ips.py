import pyodbc

ips = ["10.0.8.2", "10.0.8.1", "localhost", "127.0.0.1"]
instance = "Misstipsi"
database = "MisstipsiPro"
user = "TpvReadOnly"
password = r"98cxMs}xV>bDzD@Y"

for ip in ips:
    server = f"{ip}\\{instance}"
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
        break
    except Exception as e:
        print(f"Failed {server}: {str(e)[:100]}...")

# Also try without instance name just in case
for ip in ips:
    server = ip
    conn_str = f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};UID={user};PWD={password};Timeout=5"
    print(f"Trying {server} (No Instance)...")
    try:
        conn = pyodbc.connect(conn_str)
        print(f"SUCCESS with {server} (No Instance)")
        conn.close()
        break
    except Exception as e:
        print(f"Failed {server}: {str(e)[:100]}...")
