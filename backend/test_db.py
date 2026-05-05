import pyodbc

# Test connection to Misstipsi DB on 10.0.8.2
conn_str = r'DRIVER={ODBC Driver 17 for SQL Server};SERVER=10.0.8.2\Misstipsi;DATABASE=Misstipsi;UID=cenval;PWD=Cenvalsa#104$;Connect Timeout=3'

try:
    print("Attempting connection with DATABASE=Misstipsi...")
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE'")
    tables = [row[0] for row in cursor.fetchall()]
    print("Connection successful! Tables related to closures:")
    
    found = False
    for t in tables:
        t_low = t.lower()
        if any(x in t_low for x in ['caja', 'close', 'cierre', 'z', 'cash', 'session', 'turn']):
            print(' - ' + t)
            found = True
            
    if not found:
        print("No closure related tables found. Showing all tables:")
        for t in tables: print(" -", t)

except Exception as e:
    print('Failed with DB=Misstipsi:', e)
    
    print("\nTrying with DATABASE=Sage...")
    conn_str2 = r'DRIVER={ODBC Driver 17 for SQL Server};SERVER=10.0.8.2\Misstipsi;DATABASE=Sage;UID=cenval;PWD=Cenvalsa#104$;Connect Timeout=3'
    try:
        conn = pyodbc.connect(conn_str2)
        cursor = conn.cursor()
        cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE'")
        tables = [row[0] for row in cursor.fetchall()]
        print("Connection successful with Sage! Tables related to closures:")
        for t in tables:
            t_low = t.lower()
            if any(x in t_low for x in ['caja', 'close', 'cierre', 'z', 'cash', 'session', 'turn']):
                print(' - ' + t)
    except Exception as e2:
        print('Failed with DB=Sage:', e2)
