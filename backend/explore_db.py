from database import engine
from sqlalchemy import text, inspect

def list_tables():
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"Found {len(tables)} tables in the database.")
        print("First 50 tables:")
        for table in tables[:50]:
            print(f"- {table}")
    except Exception as e:
        print(f"Error listing tables: {e}")

if __name__ == "__main__":
    list_tables()
