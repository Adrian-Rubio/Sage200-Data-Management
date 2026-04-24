from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from typing import List, Optional
import logging

router = APIRouter(prefix="/api/entregas", tags=["Entregas"])
logger = logging.getLogger(__name__)

@router.get("/kpi-data")
def get_entregas_kpi(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    try:
        # Filtros de año y mes
        where_clause_cliente = "WHERE CodigoEmpresa = 2"
        where_clause_prov = "WHERE CabeceraAlbaranProveedor.CodigoEmpresa = 2"
        where_clause_fab = "WHERE OrdenesFabricacion.CodigoEmpresa = 2 AND OrdenesFabricacion.EstadoOF = 2"
        
        params = {}
        if year:
            where_clause_cliente += " AND EjercicioAlbaran = :year"
            where_clause_prov += " AND CabeceraAlbaranProveedor.EjercicioAlbaran = :year"
            where_clause_fab += " AND OrdenesFabricacion.EjercicioFabricacion = :year"
            params["year"] = year
        if month:
            where_clause_cliente += " AND MesAlbaran = :month"
            where_clause_prov += " AND MONTH(CabeceraAlbaranProveedor.FechaAlbaran) = :month"
            where_clause_fab += " AND MONTH(CabeceraPedidoCliente.FechaEntrega) = :month"
            params["month"] = month

        # 1. CLIENTES
        query_clientes = f"""
            SELECT 
                SUM(Contaje) as total,
                SUM(ATiempo) as a_tiempo,
                RazonSocial as label
            FROM CEN_PowerBI_KPI_Entregas_a_tiempo_cliente
            {where_clause_cliente}
            GROUP BY RazonSocial
            ORDER BY total DESC
        """
        
        # 2. PROVEEDORES
        query_prov = f"""
            SELECT 
                SUM(1) as total,
                SUM(IIF((DATEDIFF(day, CabeceraAlbaranProveedor.FechaAlbaran,
                ISNULL(ISNULL(CabeceraPedidoProveedor.FechaRecepcion, CabeceraPedidoProveedor.FechaNecesaria), CabeceraPedidoProveedor.FechaPedido + 28))) >= 0, 1, 0)) as a_tiempo,
                CabeceraAlbaranProveedor.RazonSocial as label
            FROM CabeceraAlbaranProveedor 
            INNER JOIN CabeceraPedidoProveedor ON CabeceraPedidoProveedor.CodigoEmpresa = CabeceraAlbaranProveedor.CodigoEmpresa 
                AND CabeceraPedidoProveedor.EjercicioPedido = CabeceraAlbaranProveedor.EjercicioPedido 
                AND CabeceraPedidoProveedor.NumeroPedido = CabeceraAlbaranProveedor.NumeroPedido 
                AND CabeceraPedidoProveedor.SeriePedido = CabeceraAlbaranProveedor.SeriePedido
            {where_clause_prov} AND CabeceraPedidoProveedor._AEL_OrigenPedido <> 'PADRE'
            GROUP BY CabeceraAlbaranProveedor.RazonSocial
            ORDER BY total DESC
        """

        # 3. FABRICACION
        query_fab = f"""
            SELECT 
                SUM(1) as total,
                SUM(IIF(DATEDIFF(day, (OrdenesFabricacion.FechaFinalReal + 1), CabeceraPedidoCliente.FechaEntrega) >= 0, 1, 0)) as a_tiempo,
                OrdenesFabricacion.CodigoArticulo as label
            FROM OrdenesFabricacion 
            INNER JOIN EstadoPedidosClientes ON EstadoPedidosClientes.CodigoEmpresa = OrdenesFabricacion.CodigoEmpresa 
                AND EstadoPedidosClientes.IdOFabricacion = OrdenesFabricacion.Identificador 
            INNER JOIN CabeceraPedidoCliente ON CabeceraPedidoCliente.CodigoEmpresa = EstadoPedidosClientes.CodigoEmpresa 
                AND CabeceraPedidoCliente.SeriePedido = EstadoPedidosClientes.SeriePedido 
                AND CabeceraPedidoCliente.NumeroPedido = EstadoPedidosClientes.NumeroPedido 
                AND CabeceraPedidoCliente.EjercicioPedido = EstadoPedidosClientes.EjercicioPedido
            {where_clause_fab}
            GROUP BY OrdenesFabricacion.CodigoArticulo
            ORDER BY total DESC
        """

        res_clientes = db.execute(text(query_clientes), params).fetchall()
        res_prov = db.execute(text(query_prov), params).fetchall()
        res_fab = db.execute(text(query_fab), params).fetchall()

        def format_results(results):
            return [
                {"label": r.label, "total": int(r.total or 0), "a_tiempo": int(r.a_tiempo or 0)}
                for r in results
            ]

        data_clientes = format_results(res_clientes)
        data_prov = format_results(res_prov)
        data_fab = format_results(res_fab)

        totals = {
            "clientes": {
                "total": sum(d["total"] for d in data_clientes),
                "a_tiempo": sum(d["a_tiempo"] for d in data_clientes)
            },
            "proveedores": {
                "total": sum(d["total"] for d in data_prov),
                "a_tiempo": sum(d["a_tiempo"] for d in data_prov)
            },
            "fabricacion": {
                "total": sum(d["total"] for d in data_fab),
                "a_tiempo": sum(d["a_tiempo"] for d in data_fab)
            }
        }

        return {
            "totals": totals,
            "details": {
                "clientes": data_clientes[:100], # Top 100 para no saturar
                "proveedores": data_prov[:100],
                "fabricacion": data_fab[:100]
            }
        }

    except Exception as e:
        logger.error(f"Error fetching entregas KPI: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
