from database import engine
from sqlalchemy import text
import pandas as pd

def q(query):
    with engine.connect() as conn:
        return pd.read_sql(text(query), conn)

print("--- Searching for human names in relevant tables ---")
tables = q("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE (TABLE_NAME LIKE '%Incidenc%' OR TABLE_NAME LIKE '%Parte%' OR TABLE_NAME LIKE '%Operacion%' OR TABLE_NAME LIKE '%Trabajo%') AND TABLE_TYPE = 'BASE TABLE'")

# Target names from step 501/327: RAUL, DANIEL, NELSON, MARTA, DAVID
targets = ['RAUL', 'DANIEL', 'NELSON', 'MARTA', 'DAVID']

for table in tables['TABLE_NAME']:
    try:
        # Check string columns
        cols = q(f"SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '{table}' AND DATA_TYPE LIKE '%char%'")
        if cols.empty: continue
        
        conditions = []
        for c in cols['COLUMN_NAME']:
            for t in targets:
                conditions.append(f"{c} LIKE '%{t}%'")
        
        if not conditions: continue
        
        where = " OR ".join(conditions)
        cnt_res = q(f"SELECT COUNT(*) as cnt FROM {table} WHERE {where}")
        cnt = cnt_res.iloc[0]['cnt']
        
        if cnt > 0:
            print(f"Table {table}: {cnt} matches")
            peek = q(f"SELECT TOP 5 * FROM {table} WHERE {where}")
            print(peek.to_string())
    except Exception:
        pass
