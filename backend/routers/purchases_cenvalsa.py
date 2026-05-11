from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
import auth, models
import pandas as pd
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
import traceback
import os

router = APIRouter(
    prefix="/api/purchases-cenvalsa",
    tags=["Purchases Cenvalsa"]
)

class TrackingUpdate(BaseModel):
    codigo_empresa: int
    ejercicio_pedido: int
    serie_pedido: str
    numero_pedido: int
    incoterm: Optional[str] = None
    medio_transporte: Optional[str] = None
    agencia_transporte: Optional[str] = None
    ref_envio: Optional[str] = None
    bultos: Optional[int] = None
    volumen: Optional[str] = None
    peso: Optional[str] = None
    fecha_establecida_inicial: Optional[str] = None
    fecha_real_proveedor: Optional[str] = None
    fecha_recogida_real: Optional[str] = None
    fecha_salida_origen: Optional[str] = None
    fecha_llegada_espana: Optional[str] = None
    fecha_llegada_nosotros: Optional[str] = None
    fecha_recepcion_almacen: Optional[str] = None
    anotaciones: Optional[str] = None

@router.get("/orders")
def get_orders(
    page: int = 1,
    page_size: int = 50,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    order_num: Optional[str] = None,
    provider: Optional[str] = None,
    status: Optional[int] = None,
    db: Session = Depends(get_db),
    # current_user: models.User = Depends(auth.get_current_active_user)
):
    offset = (page - 1) * page_size
    
    # Base query for orders with Parent Date logic
    # COALESCE(Parent.FechaPedido, Child.FechaPedido) handles the date inheritance
    # Filtering for Company 2 (Cenvalsa Industrial)
    query_base = """
        FROM CabeceraPedidoProveedor c
        LEFT JOIN CabeceraPedidoProveedor p 
          ON c._AEL_EjercicioPedOrigen = p.EjercicioPedido 
          AND c._AEL_SeriePedOrigen = p.SeriePedido 
          AND c._AEL_NumeroPedOrigen = p.NumeroPedido 
          AND c.CodigoEmpresa = p.CodigoEmpresa
        LEFT JOIN purchase_tracking t
          ON c.CodigoEmpresa = t.codigo_empresa
          AND c.EjercicioPedido = t.ejercicio_pedido
          AND c.SeriePedido = t.serie_pedido
          AND c.NumeroPedido = t.numero_pedido
        WHERE c.CodigoEmpresa = 2
    """
    
    params = {}
    
    # Filters
    if start_date:
        query_base += " AND COALESCE(p.FechaPedido, c.FechaPedido) >= :start_date"
        params["start_date"] = start_date
    if end_date:
        query_base += " AND COALESCE(p.FechaPedido, c.FechaPedido) <= :end_date"
        params["end_date"] = end_date
    if order_num:
        query_base += " AND (CAST(c.NumeroPedido AS VARCHAR) LIKE :order_num OR CAST(c._AEL_NumeroPedOrigen AS VARCHAR) LIKE :order_num)"
        params["order_num"] = f"%{order_num}%"
    if provider:
        query_base += " AND (c.RazonSocial LIKE :provider OR CAST(c.CodigoProveedor AS VARCHAR) LIKE :provider)"
        params["provider"] = f"%{provider}%"
    if status is not None:
        query_base += " AND c.Estado = :status"
        params["status"] = status
    else:
        # Por defecto pedidos activos
        query_base += " AND c.Estado < 2"

    # Count for pagination
    count_query = f"SELECT COUNT(*) {query_base}"
    total_count = db.execute(text(count_query), params).scalar()
    
    # Data query
    data_query = f"""
        SELECT 
            c.CodigoEmpresa, c.EjercicioPedido, c.SeriePedido, c.NumeroPedido,
            COALESCE(p.FechaPedido, c.FechaPedido) as FechaPedidoPadre,
            c.FechaPedido as FechaPedidoReal,
            c._AEL_NumeroPedOrigen as NumeroPedidoPadre,
            c.RazonSocial as Proveedor,
            c.Nacion as PaisOrigen,
            c.Estado,
            t.incoterm, t.medio_transporte, t.agencia_transporte, t.ref_envio,
            t.bultos, t.volumen, t.peso,
            t.fecha_establecida_inicial, t.fecha_real_proveedor, t.fecha_recogida_real,
            t.fecha_salida_origen, t.fecha_llegada_espana, t.fecha_llegada_nosotros,
            t.fecha_recepcion_almacen, t.anotaciones
        {query_base}
        ORDER BY FechaPedidoPadre DESC
        OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    """
    params["offset"] = offset
    params["limit"] = page_size
    
    try:
        df = pd.read_sql(text(data_query), db.bind, params=params)
        
        # Format dates
        date_cols = [
            'FechaPedidoPadre', 'FechaPedidoReal', 'fecha_establecida_inicial', 
            'fecha_real_proveedor', 'fecha_recogida_real', 'fecha_salida_origen', 
            'fecha_llegada_espana', 'fecha_llegada_nosotros', 'fecha_recepcion_almacen'
        ]
        for col in date_cols:
            if col in df.columns:
                df[col] = df[col].apply(lambda x: x.isoformat().split('T')[0] if pd.notnull(x) else None)

        return {
            "total": total_count,
            "page": page,
            "page_size": page_size,
            "items": df.to_dict('records')
        }
    except Exception as e:
        with open("purchases_error.log", "a") as f:
            f.write(f"\n--- {datetime.now()} ---\n")
            f.write(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tracking")
def update_tracking(data: TrackingUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    tracking = db.query(models.PurchaseTracking).filter(
        models.PurchaseTracking.codigo_empresa == data.codigo_empresa,
        models.PurchaseTracking.ejercicio_pedido == data.ejercicio_pedido,
        models.PurchaseTracking.serie_pedido == data.serie_pedido,
        models.PurchaseTracking.numero_pedido == data.numero_pedido
    ).first()
    
    if not tracking:
        tracking = models.PurchaseTracking(
            codigo_empresa=data.codigo_empresa,
            ejercicio_pedido=data.ejercicio_pedido,
            serie_pedido=data.serie_pedido,
            numero_pedido=data.numero_pedido
        )
        db.add(tracking)
    
    # Update fields
    fields = [
        'incoterm', 'medio_transporte', 'agencia_transporte', 'ref_envio', 
        'bultos', 'volumen', 'peso', 'anotaciones'
    ]
    for field in fields:
        val = getattr(data, field)
        if val is not None:
            setattr(tracking, field, val)
            
    # Handle dates
    date_fields = [
        'fecha_establecida_inicial', 'fecha_real_proveedor', 'fecha_recogida_real',
        'fecha_salida_origen', 'fecha_llegada_espana', 'fecha_llegada_nosotros',
        'fecha_recepcion_almacen'
    ]
    for field in date_fields:
        val = getattr(data, field)
        if val:
            try:
                setattr(tracking, field, datetime.fromisoformat(val))
            except ValueError:
                pass # Or handle error
        elif val == "":
            setattr(tracking, field, None)

    db.commit()
    return {"status": "success"}

@router.get("/albaranes")
def get_albaranes(
    ejercicio: int, serie: str, numero: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    # Find albaranes linked to this order
    # LineasAlbaranProveedor linked via LineasPedidoProveedor?
    # Usually in Sage: LineasAlbaranProveedor has EjercicioPedido, SeriePedido, NumeroPedido
    query = """
        SELECT DISTINCT
            c.EjercicioAlbaran, c.SerieAlbaran, c.NumeroAlbaran, c.FechaAlbaran,
            c.RazonSocial, c.ImporteLiquido
        FROM CabeceraAlbaranProveedor c
        JOIN LineasAlbaranProveedor l 
          ON c.CodigoEmpresa = l.CodigoEmpresa 
          AND c.EjercicioAlbaran = l.EjercicioAlbaran 
          AND c.SerieAlbaran = l.SerieAlbaran 
          AND c.NumeroAlbaran = l.NumeroAlbaran
        WHERE l.CodigoEmpresa = 2 
          AND l.EjercicioPedido = :ej 
          AND l.SeriePedido = :ser 
          AND l.NumeroPedido = :num
    """
    df = pd.read_sql(text(query), db.bind, params={"ej": ejercicio, "ser": serie, "num": numero})
    
    if 'FechaAlbaran' in df.columns:
        df['FechaAlbaran'] = df['FechaAlbaran'].apply(lambda x: x.isoformat().split('T')[0] if pd.notnull(x) else None)
        
    return df.to_dict('records')

@router.get("/facturas")
def get_facturas(
    ejercicio: int, serie: str, numero: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    # Find invoices linked to this order
    # Order -> Albaran -> Factura
    # En Sage 200, la información de la factura de compra suele estar en la cabecera del albarán
    # cuando este ha sido facturado.
    # En Sage 200, la información de la factura de compra suele estar en la cabecera del albarán
    # cuando este ha sido facturado. Agrupamos por factura para ver qué albaranes la componen.
    query = """
        SELECT 
            c.EjercicioFactura, c.SerieFactura, c.NumeroFactura, c.FechaFactura,
            c.RazonSocial, MAX(c.ImporteFactura) as ImporteLiquido,
            STRING_AGG(CAST(c.NumeroAlbaran AS VARCHAR), ', ') as AlbaranesAsociados
        FROM CabeceraAlbaranProveedor c
        JOIN LineasAlbaranProveedor l 
          ON c.CodigoEmpresa = l.CodigoEmpresa 
          AND c.EjercicioAlbaran = l.EjercicioAlbaran 
          AND c.SerieAlbaran = l.SerieAlbaran 
          AND c.NumeroAlbaran = l.NumeroAlbaran
        WHERE l.CodigoEmpresa = 2 
          AND l.EjercicioPedido = :ej 
          AND l.SeriePedido = :ser 
          AND l.NumeroPedido = :num
          AND c.NumeroFactura <> 0
        GROUP BY c.EjercicioFactura, c.SerieFactura, c.NumeroFactura, c.FechaFactura, c.RazonSocial
    """
    df = pd.read_sql(text(query), db.bind, params={"ej": ejercicio, "ser": serie, "num": numero})
    
    if 'FechaFactura' in df.columns:
        df['FechaFactura'] = df['FechaFactura'].apply(lambda x: x.isoformat().split('T')[0] if pd.notnull(x) else None)
        
    return df.to_dict('records')
