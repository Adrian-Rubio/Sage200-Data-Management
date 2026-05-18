from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db, engine
from sqlalchemy import text
from routers import sales, filters, orders, users, purchases, production, almacen, finance, inventory, reports, rma, inventory_tracking, aprovisionamiento, budgets, entregas, marketing, dubes, config, purchases_cenvalsa, saratur
import models
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.requests import Request
import threading
import time
from dubes import sync_data as dubes_sync

models.Base.metadata.create_all(bind=engine)

# Configurar Rate Limiter
# Extraer la IP real del cliente si estamos detrás de un proxy (Squid/Nginx)
def get_real_ip(request: Request):
    if "x-forwarded-for" in request.headers:
        return request.headers["x-forwarded-for"].split(",")[0].strip()
    if "x-real-ip" in request.headers:
        return request.headers["x-real-ip"]
    return request.client.host or "127.0.0.1"

limiter = Limiter(key_func=get_real_ip, default_limits=["200/minute"])

app = FastAPI(title="Sage200 Dashboard API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- TAREAS EN SEGUNDO PLANO (DUBES) ---
def start_dubes_sync():
    while True:
        try:
            dubes_sync.sync_tables()
        except Exception as e:
            print(f"Error en sincronización de Dubes: {e}")
        time.sleep(600)

@app.on_event("startup")
def startup_event():
    # Iniciar sincronización de Dubes en un hilo separado
    thread = threading.Thread(target=start_dubes_sync, daemon=True)
    thread.start()

# Configure CORS (Endurecido)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://metricas.cenval.es", 
        "http://localhost:3000", 
        "http://localhost:5173",
        "http://localhost"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(entregas.router)
app.include_router(sales.router)
app.include_router(filters.router)
app.include_router(orders.router)
app.include_router(users.router, prefix="/api", tags=["Users"])
app.include_router(purchases.router)
app.include_router(purchases_cenvalsa.router)
app.include_router(production.router)
app.include_router(almacen.router)
app.include_router(finance.router)
app.include_router(inventory.router, prefix="/api/inventory", tags=["inventory"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(rma.router)
app.include_router(inventory_tracking.router, prefix="/api/inventory-tracking", tags=["Inventory Tracking"])
app.include_router(aprovisionamiento.router)
app.include_router(budgets.router, prefix="/api", tags=["budgets"])
app.include_router(marketing.router, prefix="/api/marketing", tags=["Marketing"])
app.include_router(dubes.router, prefix="/api/dubes", tags=["Dubes"])
app.include_router(saratur.router, prefix="/api/saratur", tags=["Saratur"])
app.include_router(config.router)
from routers import home
app.include_router(home.router, prefix="/api/home", tags=["Home"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Sage200 Dashboard API"}

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        # Try a simple query to check DB connection
        result = db.execute(text("SELECT 1"))
        return {"status": "ok", "db_connected": True}
    except Exception as e:
        return {"status": "error", "db_connected": False, "detail": str(e)}