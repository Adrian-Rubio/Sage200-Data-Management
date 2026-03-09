from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, Any
from database import get_db
import pandas as pd
import numpy as np
import logging

router = APIRouter(
    prefix="/api/rma",
    tags=["RMA"]
)

logger = logging.getLogger(__name__)

@router.get("/")
def get_rma_data(db: Session = Depends(get_db)):
    try:
        query = """
        SELECT 
            doc.CodigoEmpresa,
            doc.DOCNombreLc,
            doc.FechaAlta,
            doc.DOCSeguimientoLc,
            CAST(doc.DOCPalabrasLc AS VARCHAR(MAX)) AS DOCPalabrasLc,
            doc.CodigoCliente,
            doc.CodigoArticulo,
            c.RazonSocial AS NombreCliente
        FROM
            LcDOCPdf doc
        LEFT JOIN Clientes c ON doc.CodigoCliente = c.CodigoCliente AND doc.CodigoEmpresa = c.CodigoEmpresa
        WHERE
            DATALENGTH(doc.DOCPalabrasLc) > 0
            AND doc.FechaAlta > '2025-01-01'
        ORDER BY doc.FechaAlta DESC
        """
        
        # Read from database
        df = pd.read_sql(text(query), db.bind)
        
        if df.empty:
            return {"data": [], "kpis": {"total": 0, "abiertos": 0, "cerrados": 0}}
            
        # Filter valid DOCPalabrasLc
        df = df[df['DOCPalabrasLc'].notna() & (df['DOCPalabrasLc'] != "")]
        
        # Split by pipe (at most 2 times to get: Unidades, Tipo error, Razon)
        splits = df['DOCPalabrasLc'].str.split('|', n=2, expand=True)
        
        # Ensure we have at least 3 columns for full mapping, or fill missing with None
        while splits.shape[1] < 3:
            splits[splits.shape[1]] = None
            
        df['Unidades'] = splits[0].str.strip()
        df['Tipo error'] = splits[1].str.strip()
        df['Razon'] = splits[2].str.strip()

        # Normalize "Tipo error"
        tipo_error_mapping = {
            "ERROR PREPARACION": "Error preparacion",
            "ERROR ADMINISTRATIVO": "Error administrativo",
            "ERROR PRODUCCION": "Error produccion",
            "ERROR CLIENTE": "Error cliente",
            "Error producción": "Error produccion",
            "ERROR PROVEEODR": "Error proveedor",
            "ERROR COMERCIAL": "Error comercial",
            "ERROR PROVEEDOR ": "Error proveedor",
            "ERROR PROVEEDOR": "Error proveedor"
        }
        df['Tipo error'] = df['Tipo error'].replace(tipo_error_mapping)

        # Normalize "Unidades"
        def safe_int(val):
            try:
                if pd.isna(val): return 0
                val = str(val).replace("100-100", "100")
                return int(float(val))
            except:
                return 0

        df['Unidades'] = df['Unidades'].apply(safe_int)
        
        # Calculate "Estado"
        df['Estado'] = df['DOCSeguimientoLc'].apply(lambda x: "Abierto" if x == -1 else "Cerrado" if x == 0 else "Desconocido")
        
        # Date formatting
        df['FechaAlta'] = pd.to_datetime(df['FechaAlta']).dt.strftime('%Y-%m-%d')
        
        # Handle NaN values before serialization
        df = df.replace({np.nan: None})
        
        # Format for frontend response
        response_data = df.to_dict(orient="records")
        
        kpis = {
            "total": len(df),
            "abiertos": len(df[df['Estado'] == "Abierto"]),
            "cerrados": len(df[df['Estado'] == "Cerrado"])
        }
        
        return {
            "data": response_data,
            "kpis": kpis
        }

    except Exception as e:
        logger.error(f"Error fetching RMA data: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
