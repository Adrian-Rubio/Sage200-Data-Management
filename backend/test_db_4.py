import pyodbc

conn_str = r'DRIVER={ODBC Driver 17 for SQL Server};SERVER=SERV02-VM1;DATABASE=Misstipsi;Trusted_Connection=yes;Connect Timeout=3'
try:
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    cursor.execute("SELECT TOP 1 * FROM ClosingCashes")
    columns = [column[0] for column in cursor.description]
    print('Columns in ClosingCashes on SERV02-VM1:', columns)
except Exception as e:
    print('Failed with SERV02-VM1 (Windows Auth):', e)

conn_str2 = r'DRIVER={ODBC Driver 17 for SQL Server};SERVER=10.0.8.2\Misstipsi;DATABASE=Misstipsi;Trusted_Connection=yes;Connect Timeout=3'
try:
    conn = pyodbc.connect(conn_str2)
    cursor = conn.cursor()
    cursor.execute("SELECT TOP 1 * FROM ClosingCashes")
    columns = [column[0] for column in cursor.description]
    print('Columns in ClosingCashes on 10.0.8.2:', columns)
except Exception as e:
    print('Failed with 10.0.8.2 (Windows Auth):', e)

# Test with SQL Auth but DATABASE=Sage on 10.0.8.2 as sync_data.py does
conn_str3 = r'DRIVER={ODBC Driver 17 for SQL Server};SERVER=10.0.8.2\Misstipsi;DATABASE=Sage;UID=cenval;PWD=Cenvalsa#104$;Connect Timeout=3'
try:
    conn = pyodbc.connect(conn_str3)
    cursor = conn.cursor()
    cursor.execute("SELECT TOP 1 * FROM ClosingCashes")
    columns = [column[0] for column in cursor.description]
    print('Columns in ClosingCashes on 10.0.8.2 (SQL Auth, DB=Sage):', columns)
except Exception as e:
    print('Failed with 10.0.8.2 (SQL Auth):', e)
