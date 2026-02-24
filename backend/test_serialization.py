from database import engine
from sqlalchemy import text
import pandas as pd
import json
from decimal import Decimal

def q(query, params):
    with engine.connect() as conn:
        df = pd.read_sql(text(query), conn, params=params)
        return df

query = """
    SELECT 
        op.Orden, op.CodigoArticulo, op.DescripcionOperacion, 
        op.OperacionExterna, op.EstadoOperacion, 
        op.TiempoUnFabricacion, op.TiempoTotal,
        (
            SELECT STRING_AGG(NombreOperario, ', ')
            FROM (
                SELECT DISTINCT trs2.NombreOperario
                FROM Incidencias inc2
                JOIN Operarios trs2 ON inc2.CodigoEmpresa = trs2.CodigoEmpresa
                                   AND inc2.Operario = trs2.Operario
                WHERE inc2.CodigoEmpresa = op.CodigoEmpresa
                  AND inc2.EjercicioTrabajo = op.EjercicioTrabajo
                  AND inc2.NumeroTrabajo = op.NumeroTrabajo
                  AND inc2.Orden = op.Orden
                  AND inc2.Operario != 0
            ) d
        ) AS Operarios
    FROM OperacionesOT op
    WHERE op.CodigoEmpresa = 2 AND op.EjercicioTrabajo = :exercise AND op.NumeroTrabajo = :work_num
    ORDER BY op.Orden ASC
"""

df = q(query, {"exercise": 2026, "work_num": 496})
print("Dtypes:")
print(df.dtypes)

ops = df.to_dict('records')
try:
    # Mimic FastAPI/JSON serialization
    class DecimalEncoder(json.JSONEncoder):
        def default(self, obj):
            if isinstance(obj, Decimal):
                return float(obj)
            return super(DecimalEncoder, self).default(obj)
    
    json_data = json.dumps(ops, cls=DecimalEncoder)
    print("Serialization successful.")
except Exception as e:
    print(f"Serialization failed: {e}")
