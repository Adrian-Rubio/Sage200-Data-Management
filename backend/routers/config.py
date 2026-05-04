from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models, schemas, auth
from database import get_db

router = APIRouter(prefix="/api/config", tags=["config"])

def check_admin_role(current_user: models.User = Depends(auth.get_current_active_user)):
    has_permission = (current_user.role == "admin") or (
        current_user.role_obj and current_user.role_obj.name == "admin"
    ) or (
        current_user.role_obj and current_user.role_obj.can_manage_users
    )
    if not has_permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de administrador para esta acción"
        )
    return current_user

@router.get("/modules", response_model=List[schemas.ModuleSetting])
def get_module_settings(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    # Retorna todos los settings de módulos
    return db.query(models.ModuleSetting).all()

@router.put("/modules/{name}", response_model=schemas.ModuleSetting)
def update_module_setting(name: str, setting: schemas.ModuleSettingUpdate, db: Session = Depends(get_db), admin: models.User = Depends(check_admin_role)):
    db_setting = db.query(models.ModuleSetting).filter(models.ModuleSetting.name == name).first()
    
    if not db_setting:
        # Si no existe, lo creamos (esto ayuda a inicializar si faltan en la DB)
        db_setting = models.ModuleSetting(name=name, is_active=setting.is_active)
        db.add(db_setting)
    else:
        db_setting.is_active = setting.is_active
    
    db.commit()
    db.refresh(db_setting)
    return db_setting

@router.post("/modules/initialize", status_code=status.HTTP_200_OK)
def initialize_modules(db: Session = Depends(get_db), admin: models.User = Depends(check_admin_role)):
    # Lista predefinida de módulos para asegurar que existen en la DB
    default_modules = [
        "Ventas", "Compras", "Producción", "Contabilidad", 
        "Inventario", "Almacén", "Marketing", "Restauración"
    ]
    
    for mod_name in default_modules:
        exists = db.query(models.ModuleSetting).filter(models.ModuleSetting.name == mod_name).first()
        if not exists:
            db.add(models.ModuleSetting(name=mod_name, is_active=True))
            
    db.commit()
    return {"message": "Módulos inicializados correctamente"}
