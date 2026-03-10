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

@router.get("/search")
def search_articles(q: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    try:
        # Search by code or description
        # Using both company 1 and 2 to be safe, or just 2 as main.
        # But maybe we should check both or have a company filter.
        # For now, searching wherever it is.
        query = """
            SELECT TOP 50 
                CodigoArticulo as code, 
                DescripcionArticulo as description,
                UnidadMedidaVentas_ as unit,
                CodigoEmpresa as company
            FROM Articulos
            WHERE CodigoArticulo LIKE :q OR DescripcionArticulo LIKE :q
            ORDER BY CodigoArticulo
        """
        df = pd.read_sql(text(query), db.bind, params={"q": f"%{q}%"})
        return df.to_dict(orient='records')
    except Exception as e:
        print(f"Error in search_articles: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/article/{code:path}/info")
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
            WHERE CodigoArticulo = :code
        """
        df = pd.read_sql(text(query), db.bind, params={"code": code})
        if df.empty:
            raise HTTPException(status_code=404, detail=f"Article '{code}' not found")
        
        # If multiple companies, take the first one found or prioritize 2.
        if len(df) > 1:
            df = df[df['company'] == 2] if 2 in df['company'].values else df.iloc[:1]
        
        res = df.iloc[0].to_dict()
        # Handle dates/decimals
        for k, v in res.items():
            if pd.isnull(v): res[k] = None
            elif hasattr(v, 'isoformat'): res[k] = v.isoformat()
            elif isinstance(v, (int, float, complex)): pass
            else: res[k] = str(v)
            
        return res
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        print(f"Error in get_article_info: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/article/{code:path}/stock")
def get_article_stock(code: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    try:
        # Get article info first to know company
        article_info = db.execute(text("SELECT CodigoEmpresa FROM Articulos WHERE CodigoArticulo = :code"), {"code": code}).fetchone()
        if not article_info:
            return []
        
        comp = article_info[0]
        
        latest_query = "SELECT MAX(Ejercicio) as ex, MAX(Periodo) as per FROM PowerBi_AcumuladoStock WHERE CodigoEmpresa = :comp"
        latest = pd.read_sql(text(latest_query), db.bind, params={"comp": comp}).iloc[0]
        
        query = """
            SELECT 
                Almacen as warehouse,
                UnidadSaldo as stock
            FROM PowerBi_AcumuladoStock
            WHERE CodigoEmpresa = :comp 
              AND CodigoArticulo = :code
              AND Ejercicio = :ex
              AND Periodo = :per
            ORDER BY UnidadSaldo DESC
        """
        df = pd.read_sql(text(query), db.bind, params={
            "code": code, 
            "comp": comp,
            "ex": int(latest['ex']), 
            "per": int(latest['per'])
        })
        return df.to_dict(orient='records')
    except Exception as e:
        print(f"Error in get_article_stock: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/article/{code:path}/sales")
def get_article_sales(code: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    try:
        article_info = db.execute(text("SELECT CodigoEmpresa FROM Articulos WHERE CodigoArticulo = :code"), {"code": code}).fetchone()
        if not article_info: return []
        comp = article_info[0]

        # Pending sales orders
        query = """
            SELECT 
                l.SeriePedido + '/' + CAST(l.NumeroPedido as varchar) as order_num,
                l.CodigodelCliente as client_code,
                c.Nombre as client_name,
                l.UnidadesPedidas as qty_ordered,
                l.UnidadesServidas as qty_served,
                l.UnidadesPendientes as qty_pending,
                l.FechaEntrega as date_expected,
                l.Estado as status
            FROM LineasPedidoCliente l
            LEFT JOIN Clientes c ON l.CodigodelCliente = c.CodigoCliente AND l.CodigoEmpresa = c.CodigoEmpresa
            WHERE l.CodigoEmpresa = :comp 
              AND l.CodigoArticulo = :code
              AND l.UnidadesPendientes > 0
            ORDER BY l.FechaEntrega ASC
        """
        df = pd.read_sql(text(query), db.bind, params={"code": code, "comp": comp})
        
        res = df.to_dict(orient='records')
        for r in res:
            if pd.notnull(r['date_expected']): r['date_expected'] = str(r['date_expected']).split(' ')[0]
            
        return res
    except Exception as e:
        print(f"Error in get_article_sales: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/article/{code:path}/purchases")
def get_article_purchases(code: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    try:
        article_info = db.execute(text("SELECT CodigoEmpresa FROM Articulos WHERE CodigoArticulo = :code"), {"code": code}).fetchone()
        if not article_info: return []
        comp = article_info[0]

        # Pending purchase orders
        query = """
            SELECT 
                l.SeriePedido + '/' + CAST(l.NumeroPedido as varchar) as order_num,
                l.CodigodelProveedor as vendor_code,
                p.Nombre as vendor_name,
                l.UnidadesPedidas as qty_ordered,
                l.UnidadesRecibidas as qty_received,
                l.UnidadesPendientes as qty_pending,
                l.FechaRecepcion as date_expected,
                l.Estado as status
            FROM LineasPedidoProveedor l
            LEFT JOIN Proveedores p ON l.CodigodelProveedor = p.CodigoProveedor AND l.CodigoEmpresa = p.CodigoEmpresa
            WHERE l.CodigoEmpresa = :comp 
              AND l.CodigoArticulo = :code
              AND l.UnidadesPendientes > 0
            ORDER BY l.FechaRecepcion ASC
        """
        df = pd.read_sql(text(query), db.bind, params={"code": code, "comp": comp})
        
        res = df.to_dict(orient='records')
        for r in res:
            if pd.notnull(r['date_expected']): r['date_expected'] = str(r['date_expected']).split(' ')[0]
            
        return res
    except Exception as e:
        print(f"Error in get_article_purchases: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/article/{code:path}/production")
def get_article_production(code: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    try:
        article_info = db.execute(text("SELECT CodigoEmpresa FROM Articulos WHERE CodigoArticulo = :code"), {"code": code}).fetchone()
        if not article_info: return []
        comp = article_info[0]

        # Active manufacturing orders
        query = """
            SELECT 
                EjercicioTrabajo as exercise,
                NumeroTrabajo as work_num,
                UnidadesAFabricar as qty_to_make,
                UnidadesFabricadas as qty_made,
                EstadoOT as status,
                FechaFinalPrevista as date_expected
            FROM OrdenesTrabajo
            WHERE CodigoEmpresa = :comp 
              AND CodigoArticulo = :code
              AND EstadoOT IN (0, 1) -- Preparada, Abierta
            ORDER BY FechaFinalPrevista ASC
        """
        df = pd.read_sql(text(query), db.bind, params={"code": code, "comp": comp})
        
        res = df.to_dict(orient='records')
        for r in res:
            if pd.notnull(r['date_expected']): r['date_expected'] = str(r['date_expected']).split(' ')[0]
            # Map status
            if r['status'] == 0: r['status_desc'] = 'Preparada'
            elif r['status'] == 1: r['status_desc'] = 'En Curso'
            
        return res
    except Exception as e:
        print(f"Error in get_article_production: {e}")
        raise HTTPException(status_code=500, detail=str(e))
