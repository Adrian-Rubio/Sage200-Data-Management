from database import engine
from sqlalchemy import text, inspect

def get_table_columns(table_name):
    try:
        inspector = inspect(engine)
        columns = inspector.get_columns(table_name)
        print(f"\n--- Columns for {table_name} ---")
        for col in columns:
            print(f"{col['name']} ({col['type']})")
    except Exception as e:
        print(f"Error getting columns for {table_name}: {e}")

if __name__ == "__main__":
    tables = [
        "Comisionistas", 
        "Empresas", 
        "LcTiposCliente", 
        "Vis_AEL_DiarioFactxComercial"
    ]
    for t in tables:
        get_table_columns(t)
