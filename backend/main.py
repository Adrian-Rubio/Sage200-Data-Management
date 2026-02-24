from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db, engine
from sqlalchemy import text
from routers import sales, filters, orders, users, purchases, production
import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Sage200 Dashboard API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sales.router)
app.include_router(filters.router)
app.include_router(orders.router)
app.include_router(users.router)
app.include_router(purchases.router)
app.include_router(production.router)

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
