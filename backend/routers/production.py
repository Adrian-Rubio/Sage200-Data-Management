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

# Cache production results for 10 seconds (reduced for testing)
production_cache = TTLCache(maxsize=100, ttl=10)

router = APIRouter(
    prefix="/api/production",
    tags=["Production"]
)

class ProductionFilters(BaseModel):
    exercise: Optional[int] = None
    work_num: Optional[int] = None
    series: Optional[str] = None
    fabrication_num: Optional[int] = None
    article: Optional[str] = None
    status: Optional[int] = None # 0: Preparada, 1: Abierta, 2: Finalizada, 3: Retenida
    period: Optional[int] = None
    operator: Optional[str] = None
    observations: Optional[str] = None

def format_decimal_days_to_hhmmss(decimal_days):
    try:
        if pd.isnull(decimal_days) or decimal_days == 0:
            return "00:00:00"
        
        # Ensure it's a number
        d_days = float(decimal_days)
        
        # Convert days to total seconds (1 day = 24 * 60 * 60 = 86400 seconds)
        total_seconds = d_days * 86400
        
        # Calculate hours, minutes, seconds
        hours = int(total_seconds // 3600)
        minutes = int((total_seconds % 3600) // 60)
        seconds = int(total_seconds % 60)
        
        # Format padding with 0s
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
    except (ValueError, TypeError):
        return "00:00:00"

@router.post("/orders")
def get_production_orders(filters: ProductionFilters, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    # Generate Cache Key
    filter_dict = filters.dict()
    cache_str = json.dumps(filter_dict, sort_keys=True)
    cache_key = hashlib.md5(cache_str.encode()).hexdigest()

    if cache_key in production_cache:
        return production_cache[cache_key]

    try:
        # Base Query
        query = """
            SELECT 
                ot.EjercicioTrabajo as Ejercicio,
                ot.NumeroTrabajo,
                ot.SerieFabricacion as SerieDocumento,
                ot.NumeroFabricacion,
                ot.PeriodoFabricacion as Periodo,
                ot.CodigoArticulo, ot.DescripcionArticulo,
                ot.UnidadesAFabricar as UnidadesFabricar, ot.UnidadesFabricadas, ot.EstadoOT as EstadoOF,
                ot.FechaCreacion, ot.FechaFinalPrevista,
                ofab.Observaciones as Observaciones, 
                (
                    SELECT STRING_AGG(NombreOperario, ', ')
                    FROM (
                        SELECT DISTINCT 
                            CASE WHEN inc.Operario = 0 THEN 'GENERICO'
                                 ELSE COALESCE(trs.NombreOperario, 'ID ' + CAST(inc.Operario AS VARCHAR))
                            END as NombreOperario
                        FROM Incidencias inc
                        LEFT JOIN Operarios trs ON inc.CodigoEmpresa = trs.CodigoEmpresa
                                           AND inc.Operario = trs.Operario
                        WHERE inc.CodigoEmpresa = 2
                          AND inc.EjercicioTrabajo = ot.EjercicioTrabajo
                          AND inc.NumeroTrabajo = ot.NumeroTrabajo
                    ) d
                ) AS Operarios
            FROM OrdenesTrabajo ot
            LEFT JOIN OrdenesFabricacion ofab 
                ON ot.EjercicioFabricacion = ofab.EjercicioFabricacion
                AND ot.SerieFabricacion = ofab.SerieFabricacion
                AND ot.NumeroFabricacion = ofab.NumeroFabricacion
            WHERE ot.CodigoEmpresa = 2
        """
        params = {}
        
        if filters.exercise:
            query += " AND ot.EjercicioTrabajo = :exercise"
            params["exercise"] = filters.exercise
        else:
            query += " AND ot.EjercicioTrabajo >= 2024" # Default filter for performance if no exercise is provided
            
        if filters.work_num:
            query += " AND ot.NumeroTrabajo = :work_num"
            params["work_num"] = filters.work_num
            
        if filters.series:
            query += " AND ot.SerieFabricacion = :series"
            params["series"] = filters.series
            
        if filters.fabrication_num:
            query += " AND ot.NumeroFabricacion = :fabrication_num"
            params["fabrication_num"] = filters.fabrication_num
            
        if filters.article:
            query += " AND (ot.CodigoArticulo LIKE :article OR ot.DescripcionArticulo LIKE :article)"
            params["article"] = f"%{filters.article}%"
            
        if filters.status is not None:
            query += " AND ot.EstadoOT = :status"
            params["status"] = filters.status
            
        if filters.period:
            query += " AND ot.PeriodoFabricacion = :period"
            params["period"] = filters.period
            
        if filters.operator:
            query += """ AND EXISTS (
                SELECT 1 
                FROM Incidencias i 
                LEFT JOIN Operarios o ON i.CodigoEmpresa = o.CodigoEmpresa AND i.Operario = o.Operario 
                WHERE i.CodigoEmpresa = ot.CodigoEmpresa
                  AND i.EjercicioTrabajo = ot.EjercicioTrabajo 
                  AND i.NumeroTrabajo = ot.NumeroTrabajo 
                  AND (
                      (o.NombreOperario LIKE :operator)
                      OR (i.Operario = 0 AND 'GENERICO' LIKE :operator)
                  )
            )"""
            params["operator"] = f"%{filters.operator}%"
            
        if filters.observations:
            query += " AND UPPER(CAST(ISNULL(ofab.Observaciones, '') AS NVARCHAR(MAX))) LIKE UPPER(:observations)"
            params["observations"] = f"%{filters.observations.strip()}%"
            print(f"DEBUG: Filtering observations with: {params['observations']}")
            
        # Add a hard limit or ordering if needed
        query += " ORDER BY ot.EjercicioTrabajo DESC, ot.NumeroTrabajo DESC"

        df = pd.read_sql(text(query), db.bind, params=params)
        
        if df.empty:
            return []

        # Convert to records using a robust JSON method to handle NaN/Types
        orders_json = df.to_json(orient='records', date_format='iso')
        orders = json.loads(orders_json)
        
        # Adding calculated/translated fields mapping statuses
        for o in orders:
            status_id = o.get('EstadoOF')
            if status_id == 0:
                o['EstadoDesc'] = 'Preparada'
            elif status_id == 1:
                o['EstadoDesc'] = 'Abierta'
            elif status_id == 2:
                o['EstadoDesc'] = 'Finalizada'
            elif status_id == 3:
                o['EstadoDesc'] = 'Retenida'
            else:
                o['EstadoDesc'] = 'Desconocido'
                
            # Parse dates
            if pd.notnull(o.get('FechaCreacion')):
                o['FechaCreacion'] = str(o['FechaCreacion']).split(' ')[0]
            else:
                o['FechaCreacion'] = None
                
            if pd.notnull(o.get('FechaFinalPrevista')):
                o['FechaFinalPrevista'] = str(o['FechaFinalPrevista']).split(' ')[0]
            else:
                o['FechaFinalPrevista'] = None

            # Clean up observations if None/Nan
            if pd.isnull(o.get('Observaciones')):
                o['Observaciones'] = ''
                
            if pd.isnull(o.get('Operarios')):
                o['Operarios'] = ''

        production_cache[cache_key] = orders
        return orders

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error in production endpoint: {e}")
        return {"error": str(e)}

@router.get("/operations/{exercise}/{work_num}")
def get_production_operations(exercise: int, work_num: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    try:
        query = """
            SELECT 
                op.Orden, op.Operacion, op.CodigoArticulo, op.DescripcionOperacion, 
                op.OperacionExterna, op.EstadoOperacion, 
                op.TiempoUnFabricacion, op.TiempoTotal,
                op.EjercicioTrabajo, op.NumeroTrabajo, -- For debugging if needed
                (
                    SELECT STRING_AGG(NombreOperario, ', ')
                    FROM (
                        SELECT DISTINCT 
                            CASE WHEN inc2.Operario = 0 THEN 'GENERICO'
                                 ELSE COALESCE(trs2.NombreOperario, 'ID ' + CAST(inc2.Operario AS VARCHAR))
                            END as NombreOperario
                        FROM Incidencias inc2
                        LEFT JOIN Operarios trs2 ON inc2.CodigoEmpresa = trs2.CodigoEmpresa
                                            AND inc2.Operario = trs2.Operario
                        WHERE inc2.CodigoEmpresa = 2
                          AND inc2.EjercicioTrabajo = op.EjercicioTrabajo
                          AND inc2.NumeroTrabajo = op.NumeroTrabajo
                          AND inc2.Orden = op.Orden
                    ) d
                ) AS Operarios
            FROM OperacionesOT op
            WHERE op.CodigoEmpresa = 2 AND op.EjercicioTrabajo = :exercise AND op.NumeroTrabajo = :work_num
            ORDER BY op.Orden ASC
        """
        
        df = pd.read_sql(text(query), db.bind, params={"exercise": exercise, "work_num": work_num})
        
        if df.empty:
            return []
            
        # Robust serialization to handle NaN, Decimals, etc.
        ops_json = df.to_json(orient='records', date_format='iso')
        ops = json.loads(ops_json)
        
        for op in ops:
            # Format Times (Dec. Days to HH:MM:SS)
            op['TiempoUnFabricacionFormat'] = format_decimal_days_to_hhmmss(op.get('TiempoUnFabricacion'))
            op['TiempoTotalFormat'] = format_decimal_days_to_hhmmss(op.get('TiempoTotal'))
            
            # Map Status
            status_id = op.get('EstadoOperacion')
            if status_id == 0:
                op['EstadoDesc'] = 'Pendiente'
            elif status_id == 1:
                op['EstadoDesc'] = 'En Curso'
            elif status_id == 2:
                op['EstadoDesc'] = 'Finalizada'
            elif status_id == 3:
                op['EstadoDesc'] = 'Anulada'
            else:
                op['EstadoDesc'] = 'Desconocido'
                
        return ops
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error in production operations endpoint: {e}")
        return {"error": str(e)}
