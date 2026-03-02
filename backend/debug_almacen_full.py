import pandas as pd
import numpy as np
from sqlalchemy import text
from database import engine
import json

def test_almacen_full_logic():
    filters = {
        "start_date": "2026-03-01",
        "end_date": "2026-03-02",
        "operario_id": None,
        "year": None,
        "month": None
    }
    
    where_clauses = ["cab.CE_FechaFinPrep IS NOT NULL"]
    params = {}

    if filters.get("year"):
        where_clauses.append("YEAR(cab.CE_FechaFinPrep) = :year")
        params["year"] = filters["year"]
    if filters.get("month"):
        where_clauses.append("MONTH(cab.CE_FechaFinPrep) = :month")
        params["month"] = filters["month"]
    if filters.get("operario_id"):
        where_clauses.append("cab.CE_OperarioPreparacion = :operario_id")
        params["operario_id"] = filters["operario_id"]
    if filters.get("start_date"):
        where_clauses.append("cab.CE_FechaFinPrep >= :start_date")
        params["start_date"] = filters["start_date"]
    if filters.get("end_date"):
        where_clauses.append("cab.CE_FechaFinPrep <= :end_date")
        params["end_date"] = filters["end_date"]

    where_stmt = " AND ".join(where_clauses)

    query = f"""
    WITH LineasAgg AS (
        SELECT 
            CodigoEmpresa, 
            EjercicioAlbaran, 
            NumeroAlbaran, 
            SUM(Unidades) as UnidadesTotales
        FROM LineasAlbaranCliente
        GROUP BY CodigoEmpresa, EjercicioAlbaran, NumeroAlbaran
    ),
    OpsClean AS (
        SELECT DISTINCT
            CodigoEmpresa,
            Operario,
            RTRIM(LTRIM(REPLACE(REPLACE(NombreOperario, CHAR(13), ''), CHAR(10), ''))) as NombreOperario
        FROM CE_OperariosAlmacen
    )
    SELECT 
        cab.EjercicioAlbaran,
        MONTH(cab.CE_FechaFinPrep) as Mes,
        DAY(cab.CE_FechaFinPrep) as Dia,
        CONVERT(VARCHAR(10), cab.CE_FechaFinPrep, 120) as Fecha,
        ISNULL(op.NombreOperario, 'Sin Asignar') as NombreOperario,
        cab.NumeroLineas,
        ISNULL(lin.UnidadesTotales, 0) as Unidades
    FROM CabeceraAlbaranCliente cab
    LEFT JOIN OpsClean op ON cab.CE_OperarioPreparacion = op.Operario AND cab.CodigoEmpresa = op.CodigoEmpresa
    LEFT JOIN LineasAgg lin ON cab.CodigoEmpresa = lin.CodigoEmpresa 
                         AND cab.EjercicioAlbaran = lin.EjercicioAlbaran 
                         AND cab.NumeroAlbaran = lin.NumeroAlbaran
    WHERE {where_stmt}
    """
    
    print(f"Executing query with params: {params}")
    
    try:
        with engine.connect() as conn:
            df = pd.read_sql(text(query), conn, params=params)
        
        print(f"Found {len(df)} rows.")
        if df.empty:
            print("Empty DF")
            return

        # KPIs
        total_pedidos = len(df)
        total_lineas = int(df['NumeroLineas'].sum()) if 'NumeroLineas' in df.columns else 0
        total_unidades = float(df['Unidades'].sum()) if 'Unidades' in df.columns else 0
        
        print(f"KPIs: Pedidos={total_pedidos}, Lineas={total_lineas}, Unidades={total_unidades}")

        # Group data for the table
        print("Grouping table data...")
        table_data = df.groupby(['Mes', 'Dia', 'NombreOperario']).agg({
            'NumeroLineas': 'sum',
            'Unidades': 'sum',
            'EjercicioAlbaran': 'count'
        }).reset_index()
        table_data.columns = ['Mes', 'Dia', 'NombreOperario', 'Lineas', 'Unidades', 'Pedidos']
        table_data_dict = table_data.sort_values(['Mes', 'Dia'], ascending=[False, False]).to_dict(orient='records')
        print(f"Table data has {len(table_data_dict)} records.")

        # Chart data
        print("Pivoting chart data...")
        pivot_df = df.pivot_table(
            index='Fecha', 
            columns='NombreOperario', 
            values='EjercicioAlbaran', 
            aggfunc='count', 
            fill_value=0
        ).reset_index()
        
        chart_data = pivot_df.to_dict(orient='records')
        operators = [col for col in pivot_df.columns if col != 'Fecha']
        print(f"Chart data has {len(chart_data)} points and {len(operators)} operators.")

        # Final response
        response = {
            "kpis": {
                "total_pedidos": total_pedidos,
                "total_lineas": total_lineas,
                "total_unidades": total_unidades
            },
            "data": table_data_dict,
            "chart_data": chart_data,
            "operators": operators
        }
        
        # Test serialization
        print("Testing JSON serialization...")
        json.dumps(response)
        print("Serialization OK")

    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_almacen_full_logic()
