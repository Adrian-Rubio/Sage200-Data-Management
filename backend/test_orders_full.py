import os
import sys
# Add current directory to path
sys.path.append(os.getcwd())

from database import SessionLocal
from sqlalchemy import text
import pandas as pd
from datetime import date

db = SessionLocal()

# Mock filters
class Filters:
    start_date = None
    end_date = None
    company_id = None
    sales_rep_id = None
    division = None

filters = Filters()

divisions = {
    'Conectrónica': ['JOSE CESPEDES BLANCO', 'ANTONIO MACHO MACHO', 'JESUS COLLADO ARAQUE', 'ADRIÁN ROMERO JIMENEZ'],
    'Sismecánica': ['JUAN CARLOS BENITO RAMOS', 'JAVIER ALLEN PERKINS'],
    'Informática Industrial': ['JUAN CARLOS VALDES ANTON']
}

def get_division(rep_name):
    if not rep_name or pd.isna(rep_name): return 'Otros'
    for div, reps in divisions.items():
        if rep_name in reps:
            return div
    return 'Otros'

basic_query = """
    SELECT 
        c.Comisionista,
        p.BaseImponiblePendiente,
        p.UnidadesPendientes, 
        p.PrecioCoste,
        p.NumeroPedido,
        p.CodigoComisionista,
        cl.RazonSocial as Cliente
    FROM CEN_PowerBi_LineasPedVen_Vendedor p
    LEFT JOIN Comisionistas c ON p.CodigoComisionista = c.CodigoComisionista AND p.CodigoEmpresa = c.CodigoEmpresa
    LEFT JOIN Clientes cl ON p.CodigoCliente = cl.CodigoCliente AND p.CodigoEmpresa = cl.CodigoEmpresa
    WHERE p.UnidadesPendientes > 0
    AND p.CodigoEmpresa <> '100'
"""

try:
    df = pd.read_sql(text(basic_query), db.bind)
    print("Read SQL success. Rows:", len(df))
    
    if df.empty:
        print("DF empty")
    else:
        # Step by step simulation
        df['Comisionista'] = df['Comisionista'].str.strip().str.upper()
        df['Cliente'] = df['Cliente'].str.strip()
        
        df['Division'] = df['Comisionista'].apply(get_division)
        
        df = df[df['Division'] != 'Otros']
        print("After filtering 'Otros', Rows:", len(df))
        
        if not df.empty:
            df['CosteTotal'] = df['UnidadesPendientes'] * df['PrecioCoste']
            
            # Grouping 1
            division_group = df.groupby('Division').agg(
                PendingAmount=('BaseImponiblePendiente', 'sum'),
                PendingCost=('CosteTotal', 'sum'),
                OrderCount=('NumeroPedido', 'nunique')
            ).reset_index()
            print("Division Group success")
            
            # Grouping 2
            orders_detailed = df.groupby(['NumeroPedido', 'Cliente', 'Comisionista', 'Division']).agg(
                Importe=('BaseImponiblePendiente', 'sum'),
                Coste=('CosteTotal', 'sum'),
                Unidades=('UnidadesPendientes', 'sum')
            ).reset_index()
            print("Detailed Group success")
            
            # KPI math
            total_orders = int(df['NumeroPedido'].nunique())
            total_amount = float(df['BaseImponiblePendiente'].sum())
            print("KPI math 1 success")
            total_cost = float(df['CosteTotal'].sum())
            total_units = float(df['UnidadesPendientes'].sum())
            print("KPI math 2 success")
    
except Exception as e:
    print("LOGIC ERROR:", e)
    import traceback
    traceback.print_exc()
finally:
    db.close()
