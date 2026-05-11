from sqlalchemy import text
from database import engine

with engine.connect() as conn:
    res = conn.execute(text("SELECT DB_NAME()"))
    print(res.scalar())
