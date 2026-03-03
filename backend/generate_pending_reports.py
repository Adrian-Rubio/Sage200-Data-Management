import os
import sys
sys.path.append(os.getcwd())

from database import SessionLocal
from sqlalchemy import text
import pandas as pd
from datetime import datetime

db = SessionLocal()

# Target Rep Name
rep_name = "JUAN CARLOS BENITO RAMOS"

query = f"""
    SELECT 
        p.FechaPedido, 
        p.BaseImponiblePendiente, 
        p.RazonSocial as Cliente, 
        c.Comisionista as NombreComercial
    FROM CEN_PowerBi_LineasPedVen_Vendedor p
    LEFT JOIN Comisionistas c ON p.CodigoComisionistaLinea = c.CodigoComisionista AND p.CodigoEmpresa = c.CodigoEmpresa
    WHERE p.UnidadesPendientes > 0
    AND p.CodigoEmpresa = '2'
"""

try:
    df = pd.read_sql(text(query), db.bind)
    
    # Process Commercial Names to match exactly
    df['NombreComercial'] = df['NombreComercial'].str.strip().str.upper()
    df['NombreComercial'] = df['NombreComercial'].fillna('SIN COMERCIAL')
    
    # Date formatting
    df['FechaPedido'] = pd.to_datetime(df['FechaPedido']).dt.strftime('%d/%m/%Y')
    
    # 1. Export for JUAN CARLOS BENITO RAMOS
    df_benito = df[df['NombreComercial'] == rep_name].copy()
    
    # Select exact columns requested: Fecha, Importe Pendiente, Cliente, Comercial
    csv_columns = ['FechaPedido', 'BaseImponiblePendiente', 'Cliente', 'NombreComercial']
    df_benito_export = df_benito[csv_columns]
    
    output_csv = r"C:\Users\adrian.rubio\OneDrive - CENVAL S.L\Escritorio\repositorios\Data_Management\Pedidos_Pendientes_JUANCARLOS.csv"
    df_benito_export.to_csv(output_csv, index=False, sep=';', encoding='latin-1')
    print(f"CSV creado: {output_csv}")
    
    # 2. Detail of sums (pending today)
    output_report = r"C:\Users\adrian.rubio\OneDrive - CENVAL S.L\Escritorio\repositorios\Data_Management\Informe_Pendiente_Total.txt"
    
    total_benito = df_benito['BaseImponiblePendiente'].sum()
    total_general = df['BaseImponiblePendiente'].sum()
    
    # Optional: Breakdown by Commercial
    breakdown = df.groupby('NombreComercial')['BaseImponiblePendiente'].sum().sort_values(ascending=False)
    
    with open(output_report, "w", encoding='utf-8') as f:
        f.write(f"INFORME PENDIENTE A FECHA DE HOY ({datetime.now().strftime('%d/%m/%Y')})\n")
        f.write("="*50 + "\n\n")
        
        f.write(f"Total Pendiente - JUAN CARLOS BENITO RAMOS: {total_benito:,.2f} \n")
        f.write(f"Total Pendiente - GLOBAL (Toda la empresa): {total_general:,.2f} \n\n")
        
        f.write("--- DESGLOSE POR COMERCIAL ---\n")
        for rep, total in breakdown.items():
            f.write(f"{rep}: {total:,.2f} \n")
            
    print(f"Informe creado: {output_report}")

except Exception as e:
    print(f"ERROR: {e}")
finally:
    db.close()
