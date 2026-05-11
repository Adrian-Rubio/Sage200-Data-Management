from sqlalchemy import text
from database import engine

with engine.connect() as conn:
    res = conn.execute(text("SELECT name FROM sys.tables ORDER BY name"))
    tables = [r[0] for r in res]
    for t in tables:
        if 'Fact' in t or 'Alb' in t:
            print(t)
