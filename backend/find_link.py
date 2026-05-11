from sqlalchemy import text
from database import engine

with engine.connect() as conn:
    # 1. Look for tables that might be the link
    res = conn.execute(text("SELECT name FROM sys.tables WHERE (name LIKE '%Alb%' AND name LIKE '%Fact%') OR (name LIKE '%Rel%')"))
    tables = [r[0] for r in res]
    for t in tables:
        print(f"Table: {t}")
        # Check columns of promising tables
        if 'Rel' in t or 'Fact' in t:
            try:
                cols_res = conn.execute(text(f"SELECT TOP 0 * FROM {t}"))
                print(f"  Cols: {cols_res.keys()}")
            except:
                pass
