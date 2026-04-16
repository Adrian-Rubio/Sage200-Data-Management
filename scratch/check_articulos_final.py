from database import engine
from sqlalchemy import text
import json

def get_columns(table):
    query = f"SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '{table}'"
    with engine.connect() as conn:
        result = conn.execute(text(query))
        return [r[0] for r in result]

print(json.dumps(get_columns('Articulos'), indent=2))
