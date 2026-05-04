import pyodbc

conn_str = r'DRIVER={ODBC Driver 17 for SQL Server};SERVER=10.0.8.2\Misstipsi;DATABASE=MisstipsiPro;UID=TpvReadOnly;PWD=98cxMs}xV>bDzD@Y;Timeout=10'
try:
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    cursor.execute("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'")
    tables = [row.TABLE_NAME for row in cursor.fetchall()]
    print("--- TABLES ---")
    print("\n".join(tables))
except Exception as e:
    print("Error:", e)
