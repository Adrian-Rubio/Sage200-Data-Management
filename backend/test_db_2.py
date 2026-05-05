import pyodbc

conn_str = r'DRIVER={ODBC Driver 17 for SQL Server};SERVER=SERV02-VM1;DATABASE=Misstipsi;UID=cenval;PWD=Cenvalsa#104$;Connect Timeout=3'
try:
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE'")
    tables = [row[0] for row in cursor.fetchall()]
    print("Success. Tables:")
    for t in tables:
        t_low = t.lower()
        if any(x in t_low for x in ['caja', 'close', 'cierre', 'z', 'cash', 'session', 'turn', 'sesion', 'ticket', 'daily']):
            print(' - ' + t)
except Exception as e:
    print('Failed with Misstipsi:', e)

conn_str2 = r'DRIVER={ODBC Driver 17 for SQL Server};SERVER=SERV02-VM1;DATABASE=Sage;UID=cenval;PWD=Cenvalsa#104$;Connect Timeout=3'
try:
    conn = pyodbc.connect(conn_str2)
    cursor = conn.cursor()
    cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE'")
    tables = [row[0] for row in cursor.fetchall()]
    print("\nSuccess with Sage. Tables:")
    for t in tables:
        t_low = t.lower()
        if any(x in t_low for x in ['caja', 'close', 'cierre', 'z', 'cash', 'session', 'turn', 'sesion', 'ticket', 'daily']):
            print(' - ' + t)
except Exception as e:
    print('Failed with Sage:', e)
