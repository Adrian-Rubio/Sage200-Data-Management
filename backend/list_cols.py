
from sqlalchemy import text
from database import SessionLocal

def list_cols():
    db = SessionLocal()
    try:
        # Table 1
        res = db.execute(text("SELECT TOP 1 * FROM CabeceraAlbaranCliente")).fetchone()
        print("Columns in CabeceraAlbaranCliente:")
        print(list(res.keys()) if res else "No rows")
        
        # Table 2
        res = db.execute(text("SELECT TOP 1 * FROM Clientes")).fetchone()
        print("\nColumns in Clientes:")
        print(list(res.keys()) if res else "No rows")
        
        # Table 3
        res = db.execute(text("SELECT TOP 1 * FROM Comisionistas")).fetchone()
        print("\nColumns in Comisionistas:")
        print(list(res.keys()) if res else "No rows")
    finally:
        db.close()

if __name__ == "__main__":
    list_cols()
