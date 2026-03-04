import sys
sys.path.append('.')
from sqlalchemy import create_engine, text
from database import engine
import pandas as pd

with engine.connect() as conn:
    print("--- TOTALS COMPARISON (FEB 2026) ---")
    
    # 1. CEN_PowerBI_LineasAlbaranesFacturadosSinDuplicados
    q1 = "SELECT SUM(BaseImponible) FROM CEN_PowerBI_LineasAlbaranesFacturadosSinDuplicados WHERE CodigoEmpresa = 2 AND EjercicioFactura = 2026 AND MONTH(FechaFactura) = 2"
    res1 = conn.execute(text(q1)).fetchone()
    print(f"CEN_PowerBI (Used in CierreMes Facturacion): {res1[0] if res1 else 0}")

    # 2. Vis_AEL_DiarioFactxComercial
    q2 = "SELECT SUM(BaseImponible) FROM Vis_AEL_DiarioFactxComercial WHERE CodigoEmpresa = 2 AND YEAR(FechaFactura) = 2026 AND MONTH(FechaFactura) = 2"
    res2 = conn.execute(text(q2)).fetchone()
    print(f"Vis_AEL_Diario (Used in Sales Panel): {res2[0] if res2 else 0}")
