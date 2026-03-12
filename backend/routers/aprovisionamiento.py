from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from typing import List, Optional

router = APIRouter(
    prefix="/api/aprovisionamiento",
    tags=["Aprovisionamiento"]
)

@router.get("/forecast")
def get_forecast(
    familia: str = Query("C", description="Código de familia, ej. 'C' (Conectrónica) o 'M' (Sismecánica)"),
    year1: int = Query(2024, description="Año base para comparar"),
    year2: int = Query(2025, description="Año actual para prever"),
    months: Optional[str] = Query(None, description="Meses a incluir separados por comas, ej. '1,2,3'"),
    db: Session = Depends(get_db)
):
    try:
        months_filter = ""
        if months:
            month_list = [int(m.strip()) for m in months.split(',')]
            months_filter = f"AND MONTH(la.FechaAlbaran) IN ({','.join(map(str, month_list))})"

        query = f"""
            WITH Sales AS (
                SELECT 
                    YEAR(la.FechaAlbaran) AS anio,
                    la.CodigoArticulo,
                    a.DescripcionArticulo,
                    a.CodigoProveedor,
                    CAST(SUM(la.Unidades) AS INT) AS TotalUnidades,
                    COUNT(DISTINCT la.NumeroAlbaran) AS NumeroVeces
                FROM LineasAlbaranCliente la
                INNER JOIN Articulos a ON la.CodigoEmpresa = a.CodigoEmpresa AND la.CodigoArticulo = a.CodigoArticulo
                WHERE la.CodigoEmpresa = 2
                  AND YEAR(la.FechaAlbaran) IN (:year1, :year2)
                  AND a.CodigoFamilia = :familia
                  {months_filter}
                GROUP BY YEAR(la.FechaAlbaran), la.CodigoArticulo, a.DescripcionArticulo, a.CodigoProveedor
            )
            SELECT 
                COALESCE(S1.CodigoArticulo, S2.CodigoArticulo) AS CodigoArticulo,
                COALESCE(S1.DescripcionArticulo, S2.DescripcionArticulo) AS DescripcionArticulo,
                COALESCE(S1.CodigoProveedor, S2.CodigoProveedor) AS CodigoProveedor,
                COALESCE(p.RazonSocial, '') AS NombreProveedor,
                ISNULL(S1.TotalUnidades, 0) AS UnidadesYear1,
                ISNULL(S1.NumeroVeces, 0) AS AlbaranesYear1,
                ISNULL(S2.TotalUnidades, 0) AS UnidadesYear2,
                ISNULL(S2.NumeroVeces, 0) AS AlbaranesYear2,
                ISNULL(St.UnidadSaldo, 0) AS StockActual
            FROM (SELECT * FROM Sales WHERE anio = :year1) S1
            FULL OUTER JOIN (SELECT * FROM Sales WHERE anio = :year2) S2 ON S1.CodigoArticulo = S2.CodigoArticulo
            LEFT JOIN AcumuladoStock St ON COALESCE(S1.CodigoArticulo, S2.CodigoArticulo) = St.CodigoArticulo 
                AND St.CodigoAlmacen = '001' 
                AND St.CodigoEmpresa = 2 
                AND St.Ejercicio = :year2 
                AND St.Periodo = 99
            LEFT JOIN Proveedores p ON COALESCE(S1.CodigoProveedor, S2.CodigoProveedor) = p.CodigoProveedor AND p.CodigoEmpresa = 2
        """
        
        result = db.execute(text(query), {
            "year1": year1,
            "year2": year2,
            "familia": familia
        }).fetchall()
        
        data = []
        for row in result:
            # We apply the formula here as well for Prevision and Crecimiento to save the frontend from doing it
            u1 = row.UnidadesYear1
            u2 = row.UnidadesYear2
            
            if u1 == 0:
                crecimiento = 100.0 if u2 > 0 else 0.0
            else:
                crecimiento = ((u2 - u1) / u1) * 100
            
            crecimiento_round = round(crecimiento, 1)
            
            prevision = u2
            crec_aplicado = min(crecimiento, 30.0)
            if crec_aplicado > 0:
                prevision = round(u2 * (1 + crec_aplicado / 100))
                
            data.append({
                "CodigoArticulo": row.CodigoArticulo,
                "DescripcionArticulo": row.DescripcionArticulo,
                "CodigoProveedor": row.CodigoProveedor.strip() if row.CodigoProveedor else "",
                "NombreProveedor": row.NombreProveedor.strip() if row.NombreProveedor else "Sin proveedor",
                "UnidadesYear1": u1,
                "AlbaranesYear1": row.AlbaranesYear1,
                "UnidadesYear2": u2,
                "AlbaranesYear2": row.AlbaranesYear2,
                "StockActual": int(row.StockActual),
                "Crecimiento": crecimiento_round,
                "Prevision2026": prevision # Using 2026 as nominal reference in UI
            })
            
        return data
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
