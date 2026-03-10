from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
import pandas as pd
from typing import List, Optional
from pydantic import BaseModel
from database import get_db
import auth
import models
import json

router = APIRouter()

# Global constant to lock the router to Company 2 as requested by the user
TARGET_COMPANY = 2

def clean_nan(records):
    """Helper to convert Pandas NaN/NaT to None for strict JSON serialization."""
    cleaned = []
    for r in records:
        clean_dict = {}
        for k, v in r.items():
            if pd.isna(v):
                clean_dict[k] = None
            else:
                clean_dict[k] = v
        cleaned.append(clean_dict)
    return cleaned

@router.get("/ping")
def ping_tracking():
    return {"status": "ok", "message": f"Inventory tracking router is active for company {TARGET_COMPANY}"}

@router.get("/search")
def search_articles(q: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    try:
        query = """
            SELECT TOP 50
                CodigoArticulo as code, 
                DescripcionArticulo as description,
                UnidadMedidaVentas_ as unit,
                CodigoEmpresa as company
            FROM Articulos
            WHERE CodigoEmpresa = :comp 
              AND (CodigoArticulo LIKE :q OR DescripcionArticulo LIKE :q)
            ORDER BY CodigoArticulo
        """
        df = pd.read_sql(text(query), db.bind, params={"q": f"%{q}%", "comp": TARGET_COMPANY})
        return clean_nan(df.to_dict(orient='records'))
    except Exception as e:
        print(f"Error in search_articles: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/article-info")
def get_article_info(code: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    try:
        query = """
            SELECT 
                CodigoArticulo as code, 
                DescripcionArticulo as description,
                Descripcion2Articulo as description2,
                UnidadMedidaVentas_ as unit,
                PrecioCompra as purchase_price,
                PrecioVenta as sale_price,
                StockMinimo as min_stock,
                StockMaximo as max_stock,
                FechaAlta as date_created,
                CodigoEmpresa as company
            FROM Articulos
            WHERE CodigoArticulo = :code AND CodigoEmpresa = :comp
        """
        df = pd.read_sql(text(query), db.bind, params={"code": code, "comp": TARGET_COMPANY})
        
        if df.empty:
            raise HTTPException(status_code=404, detail=f"Article '{code}' not found in Company {TARGET_COMPANY}")
        
        # Clean before sending
        res = clean_nan(df.to_dict(orient='records'))[0]
        for k, v in res.items():
            if hasattr(v, 'isoformat') and v is not None:
                res[k] = v.isoformat()
        return res
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        print(f"Error in get_article_info: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/article-stock")
def get_article_stock(code: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    try:
        query = """
            SELECT 
                a.Almacen as warehouse,
                s.UnidadSaldo as stock
            FROM AcumuladoStock s
            LEFT JOIN Almacenes a ON s.CodigoEmpresa = a.CodigoEmpresa AND s.CodigoAlmacen = a.CodigoAlmacen
            WHERE s.CodigoEmpresa = :comp 
              AND s.CodigoArticulo = :code
              AND s.Periodo = 99
              AND s.Ejercicio = (
                  SELECT MAX(Ejercicio) 
                  FROM AcumuladoStock 
                  WHERE CodigoEmpresa = :comp AND CodigoArticulo = :code AND Periodo = 99
              )
            ORDER BY s.UnidadSaldo DESC
        """
        df = pd.read_sql(text(query), db.bind, params={
            "code": code, 
            "comp": TARGET_COMPANY
        })
        return clean_nan(df.to_dict(orient='records'))
    except Exception as e:
        print(f"Error in get_article_stock: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/article-sales")
def get_article_sales(code: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    try:
        query = """
            SELECT 
                l.SeriePedido + '/' + CAST(l.NumeroPedido as varchar) as order_num,
                l.CodigodelCliente as client_code,
                cab.RazonSocial as client_name,
                l.UnidadesPedidas as qty_ordered,
                l.UnidadesServidas as qty_served,
                l.UnidadesPendientes as qty_pending,
                l.FechaEntrega as date_expected,
                l.Estado as status
            FROM LineasPedidoCliente l
            LEFT JOIN CabeceraPedidoCliente cab 
                ON l.CodigoEmpresa = cab.CodigoEmpresa 
                AND l.EjercicioPedido = cab.EjercicioPedido 
                AND l.SeriePedido = cab.SeriePedido 
                AND l.NumeroPedido = cab.NumeroPedido
            WHERE l.CodigoEmpresa = :comp 
              AND l.CodigoArticulo = :code
              AND l.UnidadesPendientes > 0
            ORDER BY l.FechaEntrega ASC
        """
        df = pd.read_sql(text(query), db.bind, params={"code": code, "comp": TARGET_COMPANY})
        
        res = clean_nan(df.to_dict(orient='records'))
        for r in res:
            if r['date_expected']: r['date_expected'] = str(r['date_expected']).split(' ')[0]
        return res
    except Exception as e:
        print(f"Error in get_article_sales: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/article-purchases")
def get_article_purchases(code: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    try:
        query = """
            SELECT 
                l.SeriePedido + '/' + CAST(l.NumeroPedido as varchar) as order_num,
                l.CodigodelProveedor as vendor_code,
                cab.RazonSocial as vendor_name,
                l.UnidadesPedidas as qty_ordered,
                l.UnidadesRecibidas as qty_received,
                l.UnidadesPendientes as qty_pending,
                l.FechaRecepcion as date_expected,
                l.Estado as status
            FROM LineasPedidoProveedor l
            LEFT JOIN CabeceraPedidoProveedor cab 
                ON l.CodigoEmpresa = cab.CodigoEmpresa 
                AND l.EjercicioPedido = cab.EjercicioPedido 
                AND l.SeriePedido = cab.SeriePedido 
                AND l.NumeroPedido = cab.NumeroPedido
            WHERE l.CodigoEmpresa = :comp 
              AND l.CodigoArticulo = :code
              AND l.UnidadesPendientes > 0
            ORDER BY l.FechaRecepcion ASC
        """
        df = pd.read_sql(text(query), db.bind, params={"code": code, "comp": TARGET_COMPANY})
        
        res = clean_nan(df.to_dict(orient='records'))
        for r in res:
            if r['date_expected']: r['date_expected'] = str(r['date_expected']).split(' ')[0]
            if r['date_expected'] == 'NaT': r['date_expected'] = None
        return res
    except Exception as e:
        print(f"Error in get_article_purchases: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/article-production")
def get_article_production(code: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    try:
        query_of = """
            SELECT 
                EjercicioTrabajo as exercise,
                NumeroTrabajo as work_num,
                UnidadesAFabricar as qty_to_make,
                UnidadesFabricadas as qty_made,
                EstadoOT as status,
                FechaFinalPrevista as date_expected,
                'ÓPTICA' as role
            FROM OrdenesTrabajo
            WHERE CodigoEmpresa = :comp 
              AND CodigoArticulo = :code
              AND EstadoOT IN (0, 1)
        """
        df_of = pd.read_sql(text(query_of), db.bind, params={"code": code, "comp": TARGET_COMPANY})
        
        query_comp = """
            SELECT 
                op.EjercicioTrabajo as exercise,
                op.NumeroTrabajo as work_num,
                SUM(op.UnidadesPendientesPresupuesto) as qty_to_make,
                0 as qty_made,
                ot.EstadoOT as status,
                ot.FechaFinalPrevista as date_expected,
                'COMPONENTE' as role
            FROM ComponentesOT op
            JOIN OrdenesTrabajo ot ON op.CodigoEmpresa = ot.CodigoEmpresa 
                                AND op.EjercicioTrabajo = ot.EjercicioTrabajo 
                                AND op.NumeroTrabajo = ot.NumeroTrabajo
            WHERE op.CodigoEmpresa = :comp 
              AND op.CodigoArticulo = :code
              AND ot.EstadoOT IN (0, 1)
              AND op.UnidadesPendientesPresupuesto > 0
            GROUP BY op.EjercicioTrabajo, op.NumeroTrabajo, ot.EstadoOT, ot.FechaFinalPrevista
        """
        try:
            df_comp = pd.read_sql(text(query_comp), db.bind, params={"code": code, "comp": TARGET_COMPANY})
            if not df_comp.empty:
                df_comp['qty_to_make'] = df_comp['qty_to_make'].astype(float)
                df_comp['qty_made'] = df_comp['qty_made'].astype(float)
        except:
            df_comp = pd.DataFrame()

        df = pd.concat([df_of, df_comp]) if not df_comp.empty else df_of
        
        if df.empty: return []

        df = df.sort_values(by='date_expected', ascending=True, na_position='last')
        
        res = clean_nan(df.to_dict(orient='records'))
        for r in res:
            if r['date_expected']: r['date_expected'] = str(r['date_expected']).split(' ')[0]
            if r['date_expected'] == 'NaT': r['date_expected'] = None
            if r['status'] == 0: r['status_desc'] = 'Preparada'
            elif r['status'] == 1: r['status_desc'] = 'En Curso'
        return res
    except Exception as e:
        print(f"Error in get_article_production: {e}")
        raise HTTPException(status_code=500, detail=str(e))
