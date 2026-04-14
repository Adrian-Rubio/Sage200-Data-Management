import pandas as pd
from sqlalchemy import text
from database import get_db
from datetime import datetime
from dateutil.relativedelta import relativedelta
import os

def test_rotation():
    db = next(get_db())
    
    end_date = datetime.now()
    start_date = (end_date - relativedelta(months=18)).replace(day=1)
    
    print(f"Testing rotation from {start_date} to {end_date}")
    
    query = """
        SELECT TOP 100
            RTRIM(LTRIM(CodigoArticulo)) as CodigoArticulo, 
            MAX(DescripcionArticulo) as Descripcion,
            YEAR(FechaAlbaran) as Anio,
            MONTH(FechaAlbaran) as Mes,
            SUM(Unidades) as Unidades,
            COUNT(DISTINCT CONCAT(SerieAlbaran, NumeroAlbaran, EjercicioAlbaran)) as Albaranes
        FROM LineasAlbaranCliente WITH (NOLOCK)
        WHERE FechaAlbaran >= :start_dt
          AND CodigoEmpresa IN (2, 100)
          AND RTRIM(LTRIM(CodigoArticulo)) NOT IN ('', '.')
        GROUP BY RTRIM(LTRIM(CodigoArticulo)), YEAR(FechaAlbaran), MONTH(FechaAlbaran)
    """
    
    df = pd.read_sql(text(query), db.bind, params={"start_dt": start_date})
    
    print("Columns:", df.columns.tolist())
    print("Shape:", df.shape)
    if not df.empty:
        print("First 5 rows:")
        print(df.head())
        
        meses_es = {
            1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril",
            5: "Mayo", 6: "Junio", 7: "Julio", 8: "Agosto",
            9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre"
        }
        
        df['MesNombre'] = df.apply(lambda r: f"{meses_es[r['Mes']]} {r['Anio']}", axis=1)
        df['SortKey'] = df['Anio'] * 100 + df['Mes']
        month_order = df[['MesNombre', 'SortKey']].drop_duplicates().sort_values('SortKey')['MesNombre'].tolist()
        
        pivot_uds = df.pivot(index=['CodigoArticulo', 'Descripcion'], columns='MesNombre', values='Unidades').fillna(0)
        pivot_alb = df.pivot(index=['CodigoArticulo', 'Descripcion'], columns='MesNombre', values='Albaranes').fillna(0)
        
        pivot_uds.columns = [f"{col} (Uds)" for col in pivot_uds.columns]
        pivot_alb.columns = [f"{col} (Alb)" for col in pivot_alb.columns]
        
        final_df = pd.concat([pivot_uds, pivot_alb], axis=1)
        
        ordered_cols = []
        for m in month_order:
            if f"{m} (Uds)" in final_df.columns:
                ordered_cols.append(f"{m} (Uds)")
            if f"{m} (Alb)" in final_df.columns:
                ordered_cols.append(f"{m} (Alb)")
        
        final_df = final_df[ordered_cols].reset_index()
        print("\nFinal DF columns shape:", final_df.shape)
        print("Final Columns:", final_df.columns.tolist())

if __name__ == "__main__":
    test_rotation()
