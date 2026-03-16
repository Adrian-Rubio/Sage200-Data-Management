import os
import sys
import pandas as pd
import shutil
import tempfile
from sqlalchemy import create_engine, text
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import SQLALCHEMY_DATABASE_URL

# Path to Excel
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
BUDGET_EXCEL_PATH = os.path.join(PROJECT_ROOT, "Presupuestos por cliente.xlsx")

DIVISIONS_REPS = {
    'Conectrónica': ['JOSE CESPEDES BLANCO', 'ANTONIO MACHO MACHO', 'JESUS COLLADO ARAQUE', 'ADRIÁN ROMERO JIMENEZ'],
    'Sismecánica': ['JUAN CARLOS BENITO RAMOS', 'JAVIER ALLEN PERKINS'],
    'Informática Industrial': ['JUAN CARLOS VALDES ANTON']
}

# IMPORTANT: These must match the Excel column order to avoid importing the Total section
# Sismecanic starts at 2, Conectores at 15, Informatica at 28.
# The section at 41 is a duplicate/total and should be ignored.
DIV_COL_LIMITS = {
    'sismecanic': (2, 14),
    'conectores': (15, 27),
    'informatica': (28, 40)
}

DIV_MAPPING = {
    'sismecanic': 'Sismecánica',
    'conectores': 'Conectrónica',
    'informatica': 'Informática Industrial'
}

def parse_excel_raw():
    print(f"Reading Excel: {BUDGET_EXCEL_PATH}")
    if not os.path.exists(BUDGET_EXCEL_PATH):
        raise FileNotFoundError(f"Missing file: {BUDGET_EXCEL_PATH}")
            
    temp_dir = tempfile.gettempdir()
    temp_path = os.path.join(temp_dir, f"temp_import_{os.getpid()}.xlsx")
    shutil.copy2(BUDGET_EXCEL_PATH, temp_path)
    
    try:
        df = pd.read_excel(temp_path, sheet_name=0, header=None)
        sub_headers = df.iloc[1].fillna('')
        df_data = df.iloc[2:].copy()
        
        rows = []
        months_map = {
            'ene': 1, 'feb': 2, 'mar': 3, 'abr': 4, 'may': 5, 'jun': 6,
            'jul': 7, 'ago': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dic': 12
        }
        
        for _, row in df_data.iterrows():
            c_raw = str(row[0]).strip()
            if c_raw == 'nan' or not c_raw: continue
            client_code = c_raw.split('.')[0]
            
            for div_key, (start_col, end_col) in DIV_COL_LIMITS.items():
                for i in range(start_col, end_col + 1):
                    s_head = str(sub_headers[i]).lower().strip()
                    if s_head in months_map:
                        val = row[i]
                        try: num_val = float(val) if not pd.isna(val) else 0.0
                        except: num_val = 0.0
                        
                        if num_val != 0:
                            rows.append({
                                'CodigoCliente': client_code,
                                'Division': DIV_MAPPING[div_key],
                                'Mes': months_map[s_head],
                                'Año': 2026,
                                'Presupuesto': num_val
                            })
        return rows
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

def migrate():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    raw_rows = parse_excel_raw()
    if not raw_rows:
        print("No data in Excel.")
        return

    df_budgets = pd.DataFrame(raw_rows)
    
    print("Fetching assigned reps from Sage...")
    # Fetch all assignments
    rep_query = """
        SELECT c.CodigoCliente, UPPER(RTRIM(LTRIM(com.Comisionista))) as ComercialPrincipal
        FROM Clientes c
        JOIN Comisionistas com ON c.CodigoComisionista = com.CodigoComisionista AND c.CodigoEmpresa = com.CodigoEmpresa
        WHERE c.CodigoEmpresa = '2'
    """
    sales_rep_query = """
        SELECT DISTINCT CodigoCliente, UPPER(RTRIM(LTRIM(Comisionista))) as Comercial,
            CASE 
                WHEN Comisionista IN ('JOSE CESPEDES BLANCO', 'ANTONIO MACHO MACHO', 'JESUS COLLADO ARAQUE', 'ADRIÁN ROMERO JIMENEZ') THEN 'Conectrónica'
                WHEN Comisionista IN ('JUAN CARLOS BENITO RAMOS', 'JAVIER ALLEN PERKINS') THEN 'Sismecánica'
                WHEN Comisionista IN ('JUAN CARLOS VALDES ANTON') THEN 'Informática Industrial'
                ELSE 'Otros'
            END as Division
        FROM Vis_AEL_DiarioFactxComercial
        WHERE CodigoEmpresa = '2' AND EjercicioFactura IN (2025, 2026)
    """
    
    with engine.connect() as conn:
        df_main_reps = pd.read_sql(text(rep_query), conn)
        df_sales_reps = pd.read_sql(text(sales_rep_query), conn)
        
    df_main_reps['CodigoCliente'] = df_main_reps['CodigoCliente'].astype(str).str.strip()
    df_sales_reps['CodigoCliente'] = df_sales_reps['CodigoCliente'].astype(str).str.strip()
    
    final_rows = []
    skipped_count = 0
    
    for (client_code, division), group in df_budgets.groupby(['CodigoCliente', 'Division']):
        assigned_rep = None
        match_sales = df_sales_reps[(df_sales_reps['CodigoCliente'] == client_code) & (df_sales_reps['Division'] == division)]
        if not match_sales.empty:
            assigned_rep = match_sales['Comercial'].iloc[0]
        
        if not assigned_rep:
            match_main = df_main_reps[df_main_reps['CodigoCliente'] == client_code]
            if not match_main.empty:
                main_rep = match_main['ComercialPrincipal'].iloc[0]
                if main_rep in DIVISIONS_REPS.get(division, []):
                    assigned_rep = main_rep
        
        in_sage = not df_main_reps[df_main_reps['CodigoCliente'] == client_code].empty
        if not assigned_rep and in_sage:
            assigned_rep = DIVISIONS_REPS[division][0]
            
        if assigned_rep:
            for _, row in group.iterrows():
                final_rows.append({
                    'CodigoCliente': client_code,
                    'Division': division,
                    'Comercial': assigned_rep,
                    'Mes': row['Mes'],
                    'Año': row['Año'],
                    'Presupuesto': row['Presupuesto']
                })
        else:
            skipped_count += 1

    df_final = pd.DataFrame(final_rows)
    
    with engine.begin() as conn:
        conn.execute(text("IF OBJECT_ID('Presupuestos_AEL', 'U') IS NOT NULL DROP TABLE Presupuestos_AEL"))
        conn.execute(text("""
            CREATE TABLE Presupuestos_AEL (
                CodigoCliente VARCHAR(50),
                Division VARCHAR(100),
                Comercial VARCHAR(200),
                Mes INT,
                Año INT,
                Presupuesto FLOAT
            )
        """))
        
    df_final.to_sql('Presupuestos_AEL', engine, if_exists='append', index=False)
    
    print(f"Done! {len(df_final)} entries imported.")
    # Breakdown for user review
    march_df = df_final[df_final['Mes'] == 3]
    breakdown = march_df.groupby('Division')['Presupuesto'].sum()
    print("\nRESUMEN PRESUPUESTO MARZO 2026 (solo clientes en Sage):")
    for div, s in breakdown.items():
        print(f" - {div}: {s:,.2f} €")
    print(f"TOTAL GLOBAL MARZO: {march_df['Presupuesto'].sum():,.2f} €")

if __name__ == "__main__":
    migrate()
