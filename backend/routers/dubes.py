from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import Optional, List
import datetime
from dubes import models, database_cache, sync_data
from auth import get_current_user
from fastapi import status

def check_restauracion_access(current_user = Depends(get_current_user)):
    is_it_dept = current_user.department and current_user.department.name.lower() in ["departamento de it", "it"]
    is_true_admin = (
        current_user.username == "adrian.rubio"
        or is_it_dept
        or current_user.role == "admin"
        or (current_user.role_obj and current_user.role_obj.name == "admin")
    )
    dept_name_lower = current_user.department.name.lower() if current_user.department else ""
    is_allowed = is_true_admin or any(
        d in dept_name_lower
        for d in ["contabilidad", "dirección", "direccion"]
    )
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado a Restauración."
        )
    return current_user

router = APIRouter(dependencies=[Depends(check_restauracion_access)])

def get_db():
    db = database_cache.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- UTILIDADES ---
def get_business_day_bounds(date: datetime.date):
    start_time = datetime.datetime.combine(date, datetime.time(6, 0, 0))
    end_time = start_time + datetime.timedelta(days=1)
    return start_time, end_time

def get_business_date(dt: datetime.datetime):
    if not dt: return None
    # Si es antes de las 6 AM, pertenece al día anterior
    if dt.hour < 6:
        return (dt - datetime.timedelta(days=1)).date()
    return dt.date()

def parse_date_filter(start_date: Optional[str] = None, end_date: Optional[str] = None):
    now = datetime.datetime.now()
    if not start_date or not end_date:
        today_date = now.date() - datetime.timedelta(days=1) if now.hour < 6 else now.date()
        s, e = get_business_day_bounds(today_date)
        return s, e
    
    try:
        s_date = datetime.datetime.strptime(start_date, "%Y-%m-%d").date()
        e_date = datetime.datetime.strptime(end_date, "%Y-%m-%d").date()
        s_bound, _ = get_business_day_bounds(s_date)
        _, e_bound = get_business_day_bounds(e_date)
        return s_bound, e_bound
    except ValueError:
        today_date = now.date() - datetime.timedelta(days=1) if now.hour < 6 else now.date()
        s, e = get_business_day_bounds(today_date)
        return s, e

def filter_date_range(query, start, end, local_id: Optional[str] = None):
    query = query.filter(
        func.datetime(models.Sale.CheckOutDate) >= func.datetime(start),
        func.datetime(models.Sale.CheckOutDate) < func.datetime(end),
        models.Sale.IsDeleted == False
    )
    if local_id and local_id != "all":
        query = query.join(models.Element).join(models.Map).filter(models.Map.LocalId == local_id)
    return query

# --- ROUTES ---

@router.post("/sync")
def trigger_sync(background_tasks: BackgroundTasks):
    """
    Triggers a synchronization with the external MissTipsi databases in the background.
    """
    background_tasks.add_task(sync_data.sync_tables)
    return {"status": "sync_started", "message": "La sincronización ha comenzado en segundo plano."}

@router.get("/locals")
def get_locals(db: Session = Depends(get_db)):
    return db.query(models.Local).all()

@router.get("/kpis/summary")
def get_kpi_summary(
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None, 
    local_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    s_bound, e_bound = parse_date_filter(start_date, end_date)
    
    yesterday_date = s_bound.date() - datetime.timedelta(days=1)
    yesterday_start, yesterday_end = get_business_day_bounds(yesterday_date)
    
    today_revenue = filter_date_range(db.query(func.sum(models.Sale.Total)), s_bound, e_bound, local_id).scalar() or 0
    yesterday_revenue = filter_date_range(db.query(func.sum(models.Sale.Total)), yesterday_start, yesterday_end, local_id).scalar() or 0
    total_guests = filter_date_range(db.query(func.sum(models.Sale.GuestNumber)), s_bound, e_bound, local_id).scalar() or 0
    total_sales_count = filter_date_range(db.query(func.count(models.Sale.Id)), s_bound, e_bound, local_id).scalar() or 0
    
    avg_ticket_pax = round(today_revenue / total_guests, 2) if total_guests > 0 else 0
    avg_ticket_table = round(today_revenue / total_sales_count, 2) if total_sales_count > 0 else 0
    
    today_invitations = filter_date_range(db.query(func.sum(models.SaleDetail.Amount * models.SaleDetail.UnitPrice)).join(models.Sale), s_bound, e_bound, local_id).filter(
        (models.SaleDetail.Invitation == True) | (models.SaleDetail.Total <= 0)
    ).scalar() or 0
    
    growth = 0
    if yesterday_revenue > 0:
        growth = round(((today_revenue - yesterday_revenue) / yesterday_revenue) * 100, 1)
    
    return {
        "today_revenue": round(today_revenue, 2),
        "yesterday_revenue": round(yesterday_revenue, 2),
        "revenue_growth": growth,
        "total_guests_today": total_guests,
        "avg_ticket_pax": avg_ticket_pax,
        "avg_ticket_table": avg_ticket_table,
        "total_invitations": round(abs(today_invitations), 2),
        "active_tables": 4
    }

@router.get("/trends/revenue")
def get_revenue_trends(
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None, 
    local_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    s_bound, e_bound = parse_date_filter(start_date, end_date)
    day_expr = func.date(models.Sale.CheckOutDate, '-6 hours')
    
    query_results = filter_date_range(db.query(day_expr.label('day'), func.sum(models.Sale.Total).label('revenue')), s_bound, e_bound, local_id).group_by(day_expr).order_by(day_expr).all()
    
    data_map = {}
    for row in query_results:
        if row.day:
            try:
                d = datetime.datetime.strptime(row.day, "%Y-%m-%d")
                label = d.strftime("%d %b")
                data_map[label] = float(row.revenue or 0)
            except: continue
    
    labels, values = [], []
    curr, end_limit = s_bound.date(), e_bound.date()
    while curr < end_limit:
        label = curr.strftime("%d %b")
        labels.append(label)
        values.append(round(data_map.get(label, 0.0), 2))
        curr += datetime.timedelta(days=1)
    return {"labels": labels, "values": values}

@router.get("/hours/distribution")
def get_hourly_distribution(
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None, 
    local_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    s_bound, e_bound = parse_date_filter(start_date, end_date)
    hour_expr = func.strftime('%H', models.Sale.CheckOutDate)
    
    hours_data = filter_date_range(db.query(
        hour_expr.label('hour'),
        func.sum(models.Sale.Total).label('revenue'),
        func.sum(models.Sale.GuestNumber).label('guests'),
        func.count(models.Sale.Id).label('count')
    ), s_bound, e_bound, local_id).group_by(hour_expr).all()
    
    result = {h: {"revenue": 0, "guests": 0, "avg_ticket": 0} for h in range(24)}
    for row in hours_data:
        h = int(row.hour)
        rev, gst = float(row.revenue or 0), int(row.guests or 0)
        result[h] = {"revenue": round(rev, 2), "guests": gst, "avg_ticket": round(rev / gst, 2) if gst > 0 else 0}
        
    business_hours = list(range(6, 24)) + list(range(0, 6))
    return {
        "hours": [f"{h:02d}:00" for h in business_hours],
        "revenue": [result[h]["revenue"] for h in business_hours],
        "guests": [result[h]["guests"] for h in business_hours],
        "avg_ticket": [result[h]["avg_ticket"] for h in business_hours]
    }

@router.get("/tickets/recent")
def get_recent_tickets(
    page: int = 1, 
    limit: int = 10, 
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None, 
    local_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    s_bound, e_bound = parse_date_filter(start_date, end_date)
    query = filter_date_range(db.query(models.Sale), s_bound, e_bound, local_id).options(
        joinedload(models.Sale.waiter),
        joinedload(models.Sale.element)
    )
    total_items = query.count()
    total_pages = (total_items + limit - 1) // limit if limit > 0 else 1
    sales = query.order_by(models.Sale.CheckOutDate.desc()).offset((page - 1) * limit).limit(limit).all()
    
    result = []
    for s in sales:
        items = [{
            "description": line.Description, 
            "amount": float(line.Amount or 0), 
            "unitPrice": float(line.UnitPrice or 0), 
            "total": float(line.Total or 0),
            "observation": line.Observation
        } for line in s.lines]
        
        duration = 0
        if s.CheckInDate and s.CheckOutDate:
            duration = int((s.CheckOutDate - s.CheckInDate).total_seconds() / 60)

        result.append({
            "id": s.Id, 
            "number": s.OrderNumber or s.Id[:8], 
            "time": s.CheckOutDate.strftime("%H:%M") if s.CheckOutDate else "--:--",
            "checkIn": s.CheckInDate.strftime("%H:%M") if s.CheckInDate else "--:--",
            "duration": duration,
            "table": s.element.Name if s.element else "Barra", 
            "waiter": f"{s.waiter.Name} {s.waiter.LastName or ''}".strip() if s.waiter else "Sin asignar",
            "guests": s.GuestNumber or 0,
            "amount": round(s.Total, 2), 
            "subtotal": round(s.SubTotal or s.Total, 2),
            "status": "Pagado" if s.CheckOutDate else "Abierto", 
            "items": items
        })
    return {"data": result, "pagination": {"page": page, "limit": limit, "total_items": total_items, "total_pages": total_pages}}

@router.get("/invitations/details")
def get_invitation_details(
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None, 
    local_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    s_bound, e_bound = parse_date_filter(start_date, end_date)
    # Filtro estricto: Solo invitaciones reales marcadas por el sistema
    details = filter_date_range(db.query(models.SaleDetail).join(models.Sale), s_bound, e_bound, local_id).filter(
        models.SaleDetail.Invitation == True
    ).all()
    
    return [{
        "id": d.Id, 
        "description": d.Description, 
        "amount": float(d.Amount or 0), 
        "unitPrice": float(d.UnitPrice or 0), 
        "total": float(d.Total or 0),
        "type": "Modificación" if (d.UnitPrice == 0 or d.ArticleId is None) else "Producto",
        "concept": d.Observation if d.Observation else "Sin especificar",
        "orderNumber": d.sale.OrderNumber if d.sale else "N/A", 
        "date": d.sale.CheckOutDate.strftime("%d/%m/%Y") if d.sale and d.sale.CheckOutDate else "--",
        "time": d.sale.CheckOutDate.strftime("%H:%M") if d.sale and d.sale.CheckOutDate else "--:--",
        "table": d.sale.element.Name if d.sale and d.sale.element else "Barra",
        "waiter": f"{d.sale.waiter.Name} {d.sale.waiter.LastName or ''}".strip() if d.sale and d.sale.waiter else "Sin asignar"
    } for d in details]

@router.get("/closures")
def get_closures(
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None, 
    local_id: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db)
):
    s_bound, e_bound = parse_date_filter(start_date, end_date)
    
    query = db.query(models.ClosingCash).options(
        joinedload(models.ClosingCash.local),
        joinedload(models.ClosingCash.employee)
    ).filter(
        models.ClosingCash.ClosingDate >= s_bound,
        models.ClosingCash.ClosingDate < e_bound
    )

    if local_id and local_id != "all":
        query = query.filter(models.ClosingCash.LocalId == local_id)

    total_count = query.count()
    closures = query.order_by(models.ClosingCash.ClosingDate.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return {
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size,
        "items": [{
            "id": getattr(c, "Id", "N/A"),
            "date": c.ClosingDate.strftime("%Y-%m-%d %H:%M") if hasattr(c, "ClosingDate") and c.ClosingDate and hasattr(c.ClosingDate, "strftime") else str(getattr(c, "ClosingDate", "N/A")),
            "businessDate": get_business_date(c.ClosingDate).strftime("%Y-%m-%d") if hasattr(c, "ClosingDate") and c.ClosingDate else "N/A",
            "local": c.local.Name if getattr(c, "local", None) else "Desconocido",
            "employee": f"{c.employee.Name} {c.employee.LastName or ''}".strip() if getattr(c, "employee", None) else "Sistema",
            "expected": round(float(getattr(c, "CalculatedCash", 0) or 0), 2),
            "counted": round(float(getattr(c, "FinalCash", 0) or 0), 2),
            "difference": round(float(getattr(c, "Inbalance", 0) or 0), 2),
            "total_diff": round(float(getattr(c, "Inbalance", 0) or 0), 2),
            "sales": round(float(getattr(c, "TotalSalesAmount", 0) or 0), 2),
            "tickets": int(getattr(c, "Tickets", 0) or 0)
        } for c in closures]
    }

@router.get("/cashflows")
def get_cashflows(
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None, 
    local_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    s_bound, e_bound = parse_date_filter(start_date, end_date)
    
    query = db.query(models.CashFlowOut).options(
        joinedload(models.CashFlowOut.staff),
        joinedload(models.CashFlowOut.local)
    ).filter(
        models.CashFlowOut.Date >= s_bound,
        models.CashFlowOut.Date < e_bound,
        models.CashFlowOut.IsDeleted == False
    )
    
    if local_id and local_id != "all":
        query = query.filter(models.CashFlowOut.LocalId == local_id)
        
    results = query.order_by(models.CashFlowOut.Date.desc()).all()
    
    return [{
        "id": cf.Id,
        "local": cf.local.Name if cf.local else "Desconocido",
        "date": cf.Date.strftime("%Y-%m-%d %H:%M") if cf.Date else "N/A",
        "amount": round(cf.CashFlowInAmount or 0, 2) if (cf.CashFlowInAmount and cf.CashFlowInAmount > 0) else -round(cf.CashFlowOutAmount or 0, 2),
        "subject": cf.Subject or "Sin concepto",
        "responsible": f"{cf.staff.Name} {cf.staff.LastName or ''}".strip() if cf.staff else "Sistema",
        "ticketNumber": cf.NumTicket
    } for cf in results]
