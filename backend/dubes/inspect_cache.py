import sqlite3
import os

db_path = "backend/dubes/misstipsi_cache.db"

if not os.path.exists(db_path):
    print(f"Error: {db_path} no existe.")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("--- Contenido de la tabla Locals ---")
    try:
        cursor.execute("SELECT * FROM Locals")
        rows = cursor.fetchall()
        for row in rows:
            print(row)
            
        print("\n--- Conteo de ventas por Local ---")
        cursor.execute("""
            SELECT l.Name, COUNT(s.Id) 
            FROM Sales s
            JOIN Elements e ON s.ElementId = e.Id
            JOIN Maps m ON e.MapId = m.Id
            JOIN Locals l ON m.LocalId = l.Id
            GROUP BY l.Name
        """)
        rows = cursor.fetchall()
        for row in rows:
            print(f"Local: {row[0]}, Ventas: {row[1]}")
            
    except Exception as e:
        print(f"Error al consultar: {e}")
    finally:
        conn.close()
