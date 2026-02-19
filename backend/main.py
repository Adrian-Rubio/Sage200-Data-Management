from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from .database import get_db, engine
from sqlalchemy import text

app = FastAPI(title="Sage200 Dashboard API")

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
