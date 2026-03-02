import pandas as pd
from sqlalchemy import text
from database import engine

def test_almacen_query():
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
    print(f"Where stmt: {where_stmt}")
    
    try:
        with engine.connect() as conn:
            df = pd.read_sql(text(query), conn, params=params)
        print(f"Success! Found {len(df)} rows.")
        if not df.empty:
            print("Columns:", df.columns.tolist())
            print("First few rows:\n", df.head())
    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_almacen_query()
