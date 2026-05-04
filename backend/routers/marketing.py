import os
import json
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, Any

from scripts.marketing.ejecutar_todo import run_pipeline

router = APIRouter()

def sync_task():
    try:
        run_pipeline()
    except Exception as e:
        print(f"Error en background task de marketing: {e}")

@router.post("/sync")
def trigger_sync(background_tasks: BackgroundTasks):
    try:
        # Ejecutamos en background para no bloquear la respuesta
        background_tasks.add_task(sync_task)
        return {"status": "success", "message": "Sincronización iniciada en segundo plano"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/data")
def get_marketing_data() -> Dict[str, Any]:
    # Ruta al unified_data.json
    data_path = os.path.join(os.getcwd(), "data", "marketing", "unified_data.json")
    if not os.path.exists(data_path):
        return {"error": "Datos no encontrados. Ejecute una sincronización primero.", "sales": {"leads": []}}
    
    try:
        with open(data_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error leyendo datos: {str(e)}")
