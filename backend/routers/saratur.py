from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
import auth, models
import pandas as pd
from datetime import date
from typing import Optional
from pydantic import BaseModel
import numpy as np

router = APIRouter(
    prefix="/api/saratur",
    tags=["saratur"]
)

class SaraturFilters(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    apartment: Optional[str] = None
    client_id: Optional[str] = None

@router.post("/dashboard")
def get_saratur_dashboard(filters: SaraturFilters, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    # RBAC Enforcement
    is_admin = (current_user.role == "admin") or (current_user.position and current_user.position.can_manage_users)
    is_allowed_dept = False
    if current_user.department:
        dept_name = current_user.department.name.lower()
        if any(d in dept_name for d in ["contabilidad", "marketing", "dirección", "direccion", "it"]):
            is_allowed_dept = True
            
    if not (is_admin or is_allowed_dept or current_user.username == "adrian.rubio"):
        raise HTTPException(status_code=403, detail="Acceso denegado: No tienes permisos para ver los datos de Saratur.")

    try:
        # Build base queries for Company 6 (Saratur)
        params = {}
        where_clause = "WHERE k.CodigoEmpresa = 6"

        if filters.start_date:
            where_clause += " AND TRY_CONVERT(date, k.FechaAlbaran) >= :start_date"
            params['start_date'] = filters.start_date
        if filters.end_date:
            where_clause += " AND TRY_CONVERT(date, k.FechaAlbaran) <= :end_date"
            params['end_date'] = filters.end_date
        if filters.client_id:
            where_clause += " AND k.CodigoCliente = :client_id"
            params['client_id'] = filters.client_id
        if filters.apartment:
            where_clause += " AND l.CodigoArticulo = :apartment"
            params['apartment'] = filters.apartment

        # Main query to fetch both headers and lines
        query = f"""
            SELECT 
                k.NumeroAlbaran, 
                k.FechaAlbaran, 
                k.CodigoCliente, 
                c.RazonSocial as Cliente,
                l.CodigoArticulo, 
                l.DescripcionArticulo, 
                l.ImporteLiquido, 
                l.BaseImponible,
                l.Precio
            FROM CabeceraAlbaranCliente k
            JOIN LineasAlbaranCliente l ON k.NumeroAlbaran = l.NumeroAlbaran 
                AND k.CodigoEmpresa = l.CodigoEmpresa 
                AND k.SerieAlbaran = l.SerieAlbaran 
                AND k.EjercicioAlbaran = l.EjercicioAlbaran
            JOIN Clientes c ON k.CodigoCliente = c.CodigoCliente 
                AND k.CodigoEmpresa = c.CodigoEmpresa
            {where_clause}
            ORDER BY k.FechaAlbaran DESC
        """

        df = pd.read_sql(text(query), db.bind, params=params)

        if df.empty:
            return {
                "kpis": {
                    "revenue": 0.0,
                    "base_imponible": 0.0,
                    "clients": 0,
                    "bookings": 0,
                    "avg_booking": 0.0
                },
                "charts": {
                    "by_apartment": [],
                    "by_complex": [],
                    "evolution": [],
                    "top_clients": [],
                    "recent_albaranes": []
                }
            }

        # Ensure numeric columns are properly typed
        df['ImporteLiquido'] = pd.to_numeric(df['ImporteLiquido'], errors='coerce').fillna(0)
        df['BaseImponible'] = pd.to_numeric(df['BaseImponible'], errors='coerce').fillna(0)
        df['FechaAlbaran'] = pd.to_datetime(df['FechaAlbaran'])

        # Calculate KPIs
        total_revenue = float(df['ImporteLiquido'].sum())
        total_base = float(df['BaseImponible'].sum())
        unique_clients = int(df['CodigoCliente'].nunique())
        total_bookings = int(df['NumeroAlbaran'].nunique())
        avg_booking = float(total_revenue / total_bookings) if total_bookings > 0 else 0.0

        # --- Chart 1: Revenue by Apartment ---
        # Exclude technical codes like ENTCTA (Deposit), REFACT SERVICIOS, COSTE ADICIONAL for apartment-specific views
        df_apartments_only = df[~df['CodigoArticulo'].str.upper().isin(['ENTCTA', 'REFACT SERVICIOS', 'COSTE ADICIONAL'])]
        
        by_apartment = []
        if not df_apartments_only.empty:
            apt_grp = df_apartments_only.groupby('CodigoArticulo').agg(
                revenue=('ImporteLiquido', 'sum'),
                bookings=('NumeroAlbaran', 'nunique')
            ).reset_index().sort_values('revenue', ascending=False)
            by_apartment = apt_grp.head(15).to_dict(orient='records')

        # --- Chart 2: Revenue by Complex ---
        # We classify them into complexes
        def classify_complex(code):
            code_upper = str(code).upper()
            if 'TROPICANA' in code_upper:
                return 'Tropicana Complejo'
            elif 'ROMANDIE' in code_upper:
                return 'Romandie Apartamentos'
            elif 'LA COLINA' in code_upper:
                return 'La Colina'
            else:
                return 'Otros Servicios/Cargos'

        df['Complex'] = df['CodigoArticulo'].apply(classify_complex)
        complex_grp = df.groupby('Complex')['ImporteLiquido'].sum().reset_index()
        by_complex = complex_grp.to_dict(orient='records')

        # --- Chart 3: Revenue Evolution (Monthly) ---
        df['Periodo'] = df['FechaAlbaran'].dt.strftime('%Y-%m')
        evol_grp = df.groupby('Periodo')['ImporteLiquido'].sum().reset_index().sort_values('Periodo')
        evolution = evol_grp.to_dict(orient='records')

        # --- Chart 4: Top Clients/Agencies ---
        clients_grp = df.groupby(['CodigoCliente', 'Cliente']).agg(
            revenue=('ImporteLiquido', 'sum'),
            bookings=('NumeroAlbaran', 'nunique')
        ).reset_index().sort_values('revenue', ascending=False).head(10)
        top_clients = clients_grp.to_dict(orient='records')

        # --- Table 5: Recent Albaranes (Rentals) ---
        # Get unique albaranes with their metadata
        recent_df = df.groupby('NumeroAlbaran').first().reset_index()
        # Get the true sum per albaran
        recent_amounts = df.groupby('NumeroAlbaran')['ImporteLiquido'].sum().to_dict()
        recent_df['TotalAlbaran'] = recent_df['NumeroAlbaran'].map(recent_amounts)
        recent_df = recent_df.sort_values('FechaAlbaran', ascending=False).head(20)
        
        recent_albaranes = []
        for _, row in recent_df.iterrows():
            recent_albaranes.append({
                "NumeroAlbaran": str(row['NumeroAlbaran']),
                "FechaAlbaran": row['FechaAlbaran'].strftime('%Y-%m-%d'),
                "CodigoCliente": row['CodigoCliente'],
                "Cliente": row['Cliente'],
                "Apartamento": row['CodigoArticulo'],
                "Total": float(row['TotalAlbaran'])
            })

        return {
            "kpis": {
                "revenue": total_revenue,
                "base_imponible": total_base,
                "clients": unique_clients,
                "bookings": total_bookings,
                "avg_booking": avg_booking
            },
            "charts": {
                "by_apartment": by_apartment,
                "by_complex": by_complex,
                "evolution": evolution,
                "top_clients": top_clients,
                "recent_albaranes": recent_albaranes
            }
        }

    except Exception as e:
        print(f"Error in Saratur dashboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))
