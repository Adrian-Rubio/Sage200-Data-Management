from database import SessionLocal
from sqlalchemy import text
import pandas as pd
import json

db = SessionLocal()
TARGET_COMPANY = 2
code = '21100464'

query = """
    SELECT 
        l.SeriePedido + '/' + CAST(l.NumeroPedido as varchar) as order_num,
        l.CodigodelCliente as client_code,
        c.Nombre as client_name,
        l.UnidadesPedidas as qty_ordered,
        l.UnidadesServidas as qty_served,
        l.UnidadesPendientes as qty_pending,
        l.FechaEntrega as date_expected,
        l.Estado as status
    FROM LineasPedidoCliente l
    LEFT JOIN Clientes c ON l.CodigodelCliente = c.CodigoCliente AND l.CodigoEmpresa = c.CodigoEmpresa
    WHERE l.CodigoEmpresa = :comp 
      AND l.CodigoArticulo = :code
      AND l.UnidadesPendientes > 0
    ORDER BY l.FechaEntrega ASC
"""
df = pd.read_sql(text(query), db.bind, params={"code": code, "comp": TARGET_COMPANY})

res = df.to_dict(orient='records')
cleaned_res = []
for r in res:
    clean_dict = {}
    for k, v in r.items():
        if pd.isna(v): 
            clean_dict[k] = None
        elif hasattr(v, 'isoformat'):
            clean_dict[k] = v.isoformat()
        else:
            clean_dict[k] = v
    if clean_dict.get('date_expected'):
        clean_dict['date_expected'] = str(clean_dict['date_expected']).split('T')[0]
    cleaned_res.append(clean_dict)

print(json.dumps(cleaned_res, indent=2))
