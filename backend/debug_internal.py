
import pyodbc
from database import DB_CONFIG # If DB_CONFIG exists in database.py
# Or just use the engine from database.py

from database import SessionLocal
from sqlalchemy import text

def debug_dups():
    db = SessionLocal()
    try:
        # Find one NumeroAlbaran with multiple rows in Company 2
        query = """
            SELECT TOP 1 NumeroAlbaran
            FROM CabeceraAlbaranCliente
            WHERE CodigoEmpresa = '2' AND StatusFacturado = 0
            GROUP BY NumeroAlbaran
            HAVING COUNT(*) > 1
        """
        row = db.execute(text(query)).fetchone()
        if not row:
            print("No duplicates found by NumeroAlbaran.")
            return
            
        num = row[0]
        print(f"Investigating Albaran Number: {num}")
        
        query_detail = text("SELECT * FROM CabeceraAlbaranCliente WHERE NumeroAlbaran = :num AND CodigoEmpresa = '2'")
        res = db.execute(query_detail, {"num": num})
        rows = res.fetchall()
        cols = res.keys()
        
        for r in rows:
            print("-" * 20)
            for i, val in enumerate(r):
                # Print only relevant or non-null columns to avoid clutter
                if val is not None and str(val).strip() != "":
                    print(f"{cols[i]}: {val}")
                    
    finally:
        db.close()

if __name__ == "__main__":
    debug_dups()
