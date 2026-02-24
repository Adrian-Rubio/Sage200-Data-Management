from database import engine
from sqlalchemy import text
import pandas as pd

def q(desc, query):
    print(f"\n--- {desc} ---")
    with engine.connect() as conn:
        df = pd.read_sql(text(query), conn)
        print(df.to_string(index=False))

# Test with the NEW logic including ID 0 as GENERICO
sql_logic = """
    SELECT STRING_AGG(NombreOperario, ', ') AS Operarios
    FROM (
        SELECT DISTINCT 
            CASE WHEN inc.Operario = 0 THEN 'GENERICO'
                 ELSE COALESCE(trs.NombreOperario, 'ID ' + CAST(inc.Operario AS VARCHAR))
            END as NombreOperario
        FROM Incidencias inc
        LEFT JOIN Operarios trs ON inc.CodigoEmpresa = trs.CodigoEmpresa
                           AND inc.Operario = trs.Operario
        WHERE inc.CodigoEmpresa = 2
          AND inc.EjercicioTrabajo = 2026
          AND inc.NumeroTrabajo = :num
    ) d
"""

with engine.connect() as conn:
    print("--- Testing Orders ---")
    for num in [496, 492, 494]:
        res = pd.read_sql(text(sql_logic), conn, params={"num": num})
        print(f"Order {num}: {res.iloc[0]['Operarios']}")

# Test specific operations for 496
sql_ops = """
    SELECT op.Orden, 
    (
        SELECT STRING_AGG(NombreOperario, ', ')
        FROM (
            SELECT DISTINCT 
                CASE WHEN inc2.Operario = 0 THEN 'GENERICO'
                     ELSE COALESCE(trs2.NombreOperario, 'ID ' + CAST(inc2.Operario AS VARCHAR))
                END as NombreOperario
            FROM Incidencias inc2
            LEFT JOIN Operarios trs2 ON inc2.CodigoEmpresa = trs2.CodigoEmpresa
                                AND inc2.Operario = trs2.Operario
            WHERE inc2.CodigoEmpresa = 2
              AND inc2.EjercicioTrabajo = op.EjercicioTrabajo
              AND inc2.NumeroTrabajo = op.NumeroTrabajo
              AND inc2.Orden = op.Orden
        ) d
    ) AS OpOperarios
    FROM OperacionesOT op
    WHERE op.CodigoEmpresa = 2 AND op.EjercicioTrabajo = 2026 AND op.NumeroTrabajo = 496
"""
q("Order 496 Operations", sql_ops)
