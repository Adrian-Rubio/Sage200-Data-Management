from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

import models
import schemas
import auth
from database import get_db

router = APIRouter()

def is_rrhh_or_admin(user: models.User) -> bool:
    if not user:
        return False
    # Admin checks
    is_it_dept = user.department and user.department.name.lower() in ["departamento de it", "it"]
    is_true_admin = (
        user.username == "adrian.rubio"
        or (user.position and ("administrador" in user.position.name.lower() or "admin" in user.position.name.lower()))
        or user.role == "admin"
        or (user.position and user.position.can_manage_users)
    )
    if is_it_dept or is_true_admin:
        return True
    
    # RRHH checks
    is_rrhh_dept = user.department and user.department.name.lower() in ["departamento de rrhh", "rrhh"]
    is_rrhh_role = user.position and user.position.can_view_rrhh
    if is_rrhh_dept or is_rrhh_role:
        return True
        
    return False

@router.get("/vacations", response_model=List[schemas.VacationResponse])
def get_vacations(
    company_id: Optional[int] = None,
    department_id: Optional[int] = None,
    user_id: Optional[int] = None,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.Vacation).join(models.User)
    
    # Apply RBAC restrictions
    if not is_rrhh_or_admin(current_user):
        # Regular users can ONLY view their own vacations and the vacations of members of their same department
        if current_user.department_id:
            query = query.filter(
                models.User.company_id == current_user.company_id,
                models.User.department_id == current_user.department_id
            )
        else:
            query = query.filter(models.Vacation.user_id == current_user.id)
    else:
        # Admins/RRHH can filter by company, department, user
        if company_id:
            query = query.filter(models.User.company_id == company_id)
        if department_id:
            query = query.filter(models.User.department_id == department_id)
        if user_id:
            query = query.filter(models.Vacation.user_id == user_id)
            
    return query.order_by(models.Vacation.start_date.asc()).all()

@router.post("/vacations", response_model=schemas.VacationResponse, status_code=status.HTTP_201_CREATED)
def create_vacation(
    vacation: schemas.VacationCreate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if not is_rrhh_or_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para registrar vacaciones."
        )
        
    # Check if target user exists
    target_user = db.query(models.User).filter(models.User.id == vacation.user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El empleado especificado no existe."
        )
        
    db_vacation = models.Vacation(
        user_id=vacation.user_id,
        start_date=vacation.start_date,
        end_date=vacation.end_date,
        type=vacation.type,
        notes=vacation.notes
    )
    db.add(db_vacation)
    db.commit()
    db.refresh(db_vacation)
    return db_vacation

@router.put("/vacations/{vacation_id}", response_model=schemas.VacationResponse)
def update_vacation(
    vacation_id: int,
    vacation_update: schemas.VacationUpdate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if not is_rrhh_or_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para modificar vacaciones."
        )
        
    db_vacation = db.query(models.Vacation).filter(models.Vacation.id == vacation_id).first()
    if not db_vacation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El registro de vacaciones no existe."
        )
        
    if vacation_update.start_date is not None:
        db_vacation.start_date = vacation_update.start_date
    if vacation_update.end_date is not None:
        db_vacation.end_date = vacation_update.end_date
    if vacation_update.type is not None:
        db_vacation.type = vacation_update.type
    if vacation_update.notes is not None:
        db_vacation.notes = vacation_update.notes
        
    db.commit()
    db.refresh(db_vacation)
    return db_vacation

@router.delete("/vacations/{vacation_id}")
def delete_vacation(
    vacation_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if not is_rrhh_or_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para eliminar vacaciones."
        )
        
    db_vacation = db.query(models.Vacation).filter(models.Vacation.id == vacation_id).first()
    if not db_vacation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El registro de vacaciones no existe."
        )
        
    db.delete(db_vacation)
    db.commit()
    return {"detail": "Registro de vacaciones eliminado con éxito."}

@router.get("/companies", response_model=List[schemas.CompanyResponse])
def get_companies(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if is_rrhh_or_admin(current_user):
        return db.query(models.Company).order_by(models.Company.name.asc()).all()
    else:
        # Non-admin only gets their own company
        if current_user.company_id:
            return db.query(models.Company).filter(models.Company.id == current_user.company_id).all()
        return []

@router.get("/departments", response_model=List[schemas.Department])
def get_departments(
    company_id: Optional[int] = None,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if not is_rrhh_or_admin(current_user):
        # Non-admin gets only their department
        if current_user.department_id:
            return db.query(models.Department).filter(models.Department.id == current_user.department_id).all()
        return []
        
    # Admins/RRHH can filter dynamically based on company
    if company_id:
        return db.query(models.Department)\
                 .join(models.User)\
                 .filter(models.User.company_id == company_id)\
                 .distinct()\
                 .order_by(models.Department.name.asc())\
                 .all()
                 
    return db.query(models.Department).order_by(models.Department.name.asc()).all()

@router.get("/employees", response_model=List[schemas.UserSimpleResponse])
def get_employees(
    company_id: Optional[int] = None,
    department_id: Optional[int] = None,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.User).filter(models.User.is_active == True)
    
    if not is_rrhh_or_admin(current_user):
        # Regular users can only see users in their same department
        if current_user.department_id:
            query = query.filter(
                models.User.company_id == current_user.company_id,
                models.User.department_id == current_user.department_id
            )
        else:
            query = query.filter(models.User.id == current_user.id)
    else:
        # Admins/RRHH can filter
        if company_id:
            query = query.filter(models.User.company_id == company_id)
        if department_id:
            query = query.filter(models.User.department_id == department_id)
            
    return query.order_by(models.User.username.asc()).all()
