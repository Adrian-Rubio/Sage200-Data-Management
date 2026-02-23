from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
import auth, models
import pandas as pd
from typing import Optional
from pydantic import BaseModel
from cachetools import TTLCache
import hashlib
import json

# Cache dashboard results for 5 minutes
purchases_cache = TTLCache(maxsize=100, ttl=300)

router = APIRouter(
    prefix="/api/purchases",
    tags=["Purchases"]
)

class PurchaseFilters(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    provider_id: Optional[str] = None
    status: Optional[str] = None # 'pending', 'partial', 'completed'
    exercise: Optional[int] = None
    series: Optional[str] = None
    order_num: Optional[int] = None
    parent_order_num: Optional[int] = None
    division: Optional[str] = None
    origin: Optional[str] = None # 'PADRE', 'HIJO'

@router.post("/pending")
def get_purchases(filters: PurchaseFilters, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    # Generate Cache Key
    filter_dict = filters.dict()
    cache_str = json.dumps(filter_dict, sort_keys=True)
    cache_key = hashlib.md5(cache_str.encode()).hexdigest()

    if cache_key in purchases_cache:
        return purchases_cache[cache_key]

    try:
        # 1. Fetch Headers (Padres e Hijos)
        query_cabeceras = """
            SELECT 
                CAST(IdDelegacion AS VARCHAR) as IdDelegacion,
                EjercicioPedido, SeriePedido, NumeroPedido, FechaPedido,
                CodigoProveedor, RazonSocial,
                FechaNecesaria, FechaTope, NumeroLineas, ImporteLiquido,
                StatusAprobado, ObservacionesPedido, CE_Division,
                _AEL_OrigenPedido, _AEL_EjercicioPedOrigen, _AEL_SeriePedOrigen, _AEL_NumeroPedOrigen, 
                StatusEstadis, Estado
            FROM CabeceraPedidoProveedor
            WHERE ExercisePEDIDO_HOLDER >= 2024
        """
        # Note: I used ExercisePEDIDO_HOLDER as a placeholder to fix real field name
        # Looking at columns: EjercicioPedido is the correct one.
        query_cabeceras = query_cabeceras.replace("ExercisePEDIDO_HOLDER", "EjercicioPedido")
        
        params = {}
        if not filters.status:
            # Default to "Active" orders if not specified
            query_cabeceras += " AND Estado = 0"
        elif filters.status == 'completed':
            query_cabeceras += " AND Estado = 2"
        elif filters.status in ['pending', 'partial']:
            query_cabeceras += " AND Estado = 0"
            
        if filters.start_date:
            query_cabeceras += " AND FechaPedido >= :start_date"
            params["start_date"] = filters.start_date
        if filters.end_date:
            query_cabeceras += " AND FechaPedido <= :end_date"
            params["end_date"] = filters.end_date
        if filters.provider_id:
            query_cabeceras += " AND (CodigoProveedor LIKE :prov OR RazonSocial LIKE :prov)"
            params["prov"] = f"%{filters.provider_id}%"
        if filters.exercise:
            query_cabeceras += " AND EjercicioPedido = :exercise"
            params["exercise"] = filters.exercise
        if filters.series:
            query_cabeceras += " AND SeriePedido = :series"
            params["series"] = filters.series
        if filters.order_num:
            query_cabeceras += " AND NumeroPedido = :order_num"
            params["order_num"] = filters.order_num
        if filters.parent_order_num:
            query_cabeceras += " AND _AEL_NumeroPedOrigen = :parent_order_num"
            params["parent_order_num"] = str(filters.parent_order_num)
        if filters.division:
            query_cabeceras += " AND CE_Division = :division"
            params["division"] = filters.division
        if filters.origin:
            query_cabeceras += " AND _AEL_OrigenPedido = :origin"
            params["origin"] = filters.origin

        df_cab = pd.read_sql(text(query_cabeceras), db.bind, params=params)
        
        if df_cab.empty:
            return []

        # 2. Fetch Lines ONLY for the orders we have
        # To avoid giant IN clauses, we can join or just use Ejercicio range if the list is small enough
        # But let's be precise.
        order_keys = df_cab[['EjercicioPedido', 'SeriePedido', 'NumeroPedido']].drop_duplicates()
        
        # We'll fetch lines for the exercises found to keep it indexed
        exercises = order_keys['EjercicioPedido'].unique().tolist()
        
        query_lineas = """
            SELECT 
                EjercicioPedido, SeriePedido, NumeroPedido, Orden as LineaOrden,
                CodigoArticulo, DescripcionArticulo, 
                UnidadesPedidas, UnidadesRecibidas, UnidadesPendientes,
                Precio, TotalIva, ImporteLiquido,
                CAST(_AEL_LineaPadre AS VARCHAR(50)) as LineaPadreID,
                FechaRecepcion, FechaTope, FechaNecesaria, Estado
            FROM LineasPedidoProveedor
            WHERE EjercicioPedido IN ({}) AND CodigoEmpresa = 2
        """.format(','.join(map(str, exercises)))
        
        df_lin = pd.read_sql(text(query_lineas), db.bind)
        
        # Filter lines in memory to match only the orders we fetched
        df_lin = df_lin.merge(order_keys, on=['EjercicioPedido', 'SeriePedido', 'NumeroPedido'])

        # Convert to records for easier python manipulation
        cabs = df_cab.to_dict('records')
        lines = df_lin.to_dict('records')

        # Create dictionaries to quickly find orders and lines
        # Key: "Ejercicio-Serie-Numero"
        padres = {}
        hijos = []

        # Group headers into padres and hijos
        for c in cabs:
            key = f"{c['EjercicioPedido']}-{c['SeriePedido']}-{c['NumeroPedido']}"
            
            c['lineas'] = []
            c['pedidos_hijos'] = []
            
            # Formats dates to string
            if pd.notnull(c['FechaPedido']):
                c['FechaPedido'] = c['FechaPedido'].isoformat().split('T')[0]
            else:
                c['FechaPedido'] = None

            if pd.notnull(c['FechaNecesaria']):
                c['FechaNecesaria'] = c['FechaNecesaria'].isoformat().split('T')[0]
            else:
                c['FechaNecesaria'] = None

            if pd.notnull(c['FechaTope']):
                c['FechaTope'] = c['FechaTope'].isoformat().split('T')[0]
            else:
                c['FechaTope'] = None
                
            if c['_AEL_OrigenPedido'] == 'HIJO':
                hijos.append(c)
            else:
                padres[key] = c

        # Attach lines to their respective orders (both padres and hijos)
        for l in lines:
            key = f"{l['EjercicioPedido']}-{l['SeriePedido']}-{l['NumeroPedido']}"
            
            if pd.notnull(l['FechaRecepcion']):
                l['FechaRecepcion'] = l['FechaRecepcion'].isoformat().split('T')[0]
            else:
                l['FechaRecepcion'] = None
                
            if pd.notnull(l['FechaTope']):
                l['FechaTope'] = l['FechaTope'].isoformat().split('T')[0]
            else:
                l['FechaTope'] = None
            
            if pd.notnull(l['FechaNecesaria']):
                l['FechaNecesaria'] = l['FechaNecesaria'].isoformat().split('T')[0]
            else:
                l['FechaNecesaria'] = None
                
            # Logic for line status (Entregado, Parcial, Pendiente)
            up = float(l['UnidadesPedidas'] or 0)
            ur = float(l['UnidadesRecibidas'] or 0)
            upen = float(l['UnidadesPendientes'] or 0)
            
            if upen <= 0 and ur > 0:
                l['status_calculado'] = 'Entregado'
            elif ur > 0 and upen > 0:
                l['status_calculado'] = 'Parcial'
            elif ur == 0 and up > 0:
                l['status_calculado'] = 'Pendiente'
            else:
                l['status_calculado'] = 'Desconocido'

            # Find its parent order and append
            if key in padres:
                padres[key]['lineas'].append(l)
            else:
                # Need to find it in hijos list... slow but works for now
                for h in hijos:
                    if f"{h['EjercicioPedido']}-{h['SeriePedido']}-{h['NumeroPedido']}" == key:
                        h['lineas'].append(l)
                        break

        # Attach hijos to their respective padres
        for h in hijos:
             try:
                 num_padre = int(float(h['_AEL_NumeroPedOrigen'])) if h['_AEL_NumeroPedOrigen'] else 0
                 padre_key = f"{h['_AEL_EjercicioPedOrigen']}-{h['_AEL_SeriePedOrigen']}-{num_padre}"
             except (ValueError, TypeError):
                 padre_key = "unknown"
                 
             # Note: SQL might return _AEL_NumeroPedOrigen as string or float depending on the driver
             if padre_key in padres:
                 padres[padre_key]['pedidos_hijos'].append(h)
             else:
                 # What if the parent is from 2023 but the hijo is 2024?
                 # We might miss the parent because of our Ejercicio >= 2024 filter
                 # We will add it as an orphan padre for now just to not lose the data
                 h['is_orphan_hijo'] = True
                 padres[f"orphan_{h['EjercicioPedido']}-{h['SeriePedido']}-{h['NumeroPedido']}"] = h

        # Calculate Padre overall status based on its lines and children
        result_list = list(padres.values())
        
        for p in result_list:
            total_pedidas = sum(float(l['UnidadesPedidas'] or 0) for l in p['lineas'])
            total_recibidas = sum(float(l['UnidadesRecibidas'] or 0) for l in p['lineas'])
            total_pendientes = sum(float(l['UnidadesPendientes'] or 0) for l in p['lineas'])
            
            # And also sum the children units just in case they are not reflected on the parent
            for h in p['pedidos_hijos']:
                 total_pedidas += sum(float(l['UnidadesPedidas'] or 0) for l in h['lineas'])
                 total_recibidas += sum(float(l['UnidadesRecibidas'] or 0) for l in h['lineas'])
                 total_pendientes += sum(float(l['UnidadesPendientes'] or 0) for l in h['lineas'])

            if total_pendientes <= 0 and total_recibidas > 0:
                p['status_global'] = 'Entregado'
            elif total_recibidas > 0 and total_pendientes > 0:
                p['status_global'] = 'Parcial'
            elif total_recibidas == 0 and total_pedidas > 0:
                p['status_global'] = 'Pendiente'
            else:
                p['status_global'] = 'Desconocido'
                
            p['totals'] = {
                 'pedidas': total_pedidas,
                 'recibidas': total_recibidas,
                 'pendientes': total_pendientes
            }

        # Filter by overall status if requested
        if filters.status:
            # Map 'pending' -> 'Pendiente', etc
            status_map = {
                'pending': 'Pendiente',
                'partial': 'Parcial',
                'completed': 'Entregado'
            }
            target = status_map.get(filters.status)
            if target:
                 result_list = [p for p in result_list if p['status_global'] == target]

        # Sort by most recent
        result_list.sort(key=lambda x: x['FechaPedido'] if x.get('FechaPedido') else '1900-01-01', reverse=True)

        purchases_cache[cache_key] = result_list
        return result_list

    except Exception as e:
        print(f"Error in purchases endpoint: {e}")
        return {"error": str(e)}
