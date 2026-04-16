from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    print("Searching for Family/Subfamily tables...")
    res = conn.execute(text("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%Fam%' OR TABLE_NAME LIKE '%Sub%'"))
    tables = [r[0] for r in res]
    for t in tables:
        print(f"Table: {t}")
