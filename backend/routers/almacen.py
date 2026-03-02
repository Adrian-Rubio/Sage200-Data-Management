from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from pydantic import BaseModel
import pandas as pd
from database import engine
from sqlalchemy import text
from auth import get_current_user

router = APIRouter(prefix="/api/almacen", tags=["almacen"])

class AlmacenStatsFilters(BaseModel):
    operario_id: Optional[int] = None
    year: Optional[int] = None
    month: Optional[int] = None

@router.post("/stats")
async def get_almacen_stats(filters: AlmacenStatsFilters, current_user: dict = Depends(get_current_user)):
    try:
        where_clauses = ["cab.CE_FechaFinPrep IS NOT NULL"]
        params = {}

        if filters.year:
            where_clauses.append("YEAR(cab.CE_FechaFinPrep) = :year")
            params["year"] = filters.year
        if filters.month:
            where_clauses.append("MONTH(cab.CE_FechaFinPrep) = :month")
            params["month"] = filters.month
        if filters.operario_id:
            where_clauses.append("cab.CE_OperarioPreparacion = :operario_id")
            params["operario_id"] = filters.operario_id

        where_stmt = " AND ".join(where_clauses)

        # High performance query with CTEs to avoid subqueries per row
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

        with engine.connect() as conn:
            df = pd.read_sql(text(query), conn, params=params)

        if df.empty:
            return {
                "kpis": {"total_pedidos": 0, "total_lineas": 0, "total_unidades": 0},
                "data": [],
                "chart_data": [],
                "operators": []
            }

        # Fill NaNs to avoid serialization issues
        df = df.fillna(0)
        # Ensure NombreOperario is a string and clean it a bit
        df['NombreOperario'] = df['NombreOperario'].astype(str)

        # Calculate KPIs safely
        total_pedidos = len(df)
        total_lineas = int(df['NumeroLineas'].sum())
        total_unidades = float(df['Unidades'].sum())

        # Group data for the table
        table_data = df.groupby(['Mes', 'Dia', 'NombreOperario']).agg({
            'NumeroLineas': 'sum',
            'Unidades': 'sum',
            'EjercicioAlbaran': 'count'
        }).reset_index()
        table_data.columns = ['Mes', 'Dia', 'NombreOperario', 'Lineas', 'Unidades', 'Pedidos']
        # Convert to records and handle potential NaN from sum of all NaNs (should be 0 now due to fillna)
        table_data_list = table_data.sort_values(['Mes', 'Dia'], ascending=[False, False]).to_dict(orient='records')

        # Chart data: Evolution of pedidos by day and operator
        # Ensure NombreOperario columns are strings
        pivot_df = df.pivot_table(
            index='Fecha', 
            columns='NombreOperario', 
            values='EjercicioAlbaran', 
            aggfunc='count', 
            fill_value=0
        ).reset_index()
        
        chart_data = pivot_df.to_dict(orient='records')
        operators = [str(col) for col in pivot_df.columns if str(col) != 'Fecha']

        return {
            "kpis": {
                "total_pedidos": total_pedidos,
                "total_lineas": total_lineas,
                "total_unidades": total_unidades
            },
            "data": table_data_list,
            "chart_data": chart_data,
            "operators": operators
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/operators")
async def get_operators(current_user: dict = Depends(get_current_user)):
    try:
        query = """
        SELECT DISTINCT 
            Operario as id, 
            RTRIM(LTRIM(REPLACE(REPLACE(NombreOperario, CHAR(13), ''), CHAR(10), ''))) as name 
        FROM CE_OperariosAlmacen 
        WHERE NombreOperario IS NOT NULL
        ORDER BY name
        """
        with engine.connect() as conn:
            df = pd.read_sql(text(query), conn)
        
        # Ensure unique names in the final list to avoid duplicate keys in React
        df = df.drop_duplicates(subset=['name'])
        
        return df.to_dict(orient='records')
    except Exception as e:
        print(f"Error in get_operators: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
