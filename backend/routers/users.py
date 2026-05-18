from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from typing import List
from datetime import timedelta

import models, schemas, auth
from database import get_db

router = APIRouter()

@router.post("/auth/login", response_model=schemas.Token)
def login_for_access_token(response: Response, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    # Compute permissions for the token
    # Priority 1: New Position-based structure
    if user.position:
        is_it_dept = user.department and user.department.name.lower() in ["departamento de it", "it"]
        is_true_admin = (
            user.username == "adrian.rubio" 
            or "administrador" in user.position.name.lower()
            or "admin" in user.position.name.lower()
            or user.role == "admin"
        )
        perms = {
            "ventas": True if is_it_dept else user.position.can_view_ventas,
            "compras": True if is_it_dept else user.position.can_view_compras,
            "produccion": True if is_it_dept else user.position.can_view_produccion,
            "finanzas": True if is_it_dept else user.position.can_view_finanzas,
            "almacen": True if is_it_dept else user.position.can_view_almacen,
            "inventario": True if is_it_dept else user.position.can_view_inventario,
            "rrhh": True if is_it_dept else user.position.can_view_rrhh,
            "calidad": True if is_it_dept else user.position.can_view_calidad,
            "admin": True if is_true_admin else False
        }
        role_name = user.position.name
        is_responsable = True if is_it_dept else user.position.is_responsable
        is_asistente = user.position.is_asistente
    # Priority 2: Legacy user types
    elif user.user_type in ["DISTRIBUIDOR", "SOCIO"]:
        perms = {
            "ventas": False, "compras": False, "produccion": False, 
            "finanzas": False, "almacen": False, "inventario": True, "admin": False,
            "rrhh": False, "calidad": False
        }
        role_name = user.user_type
        is_responsable = False
        is_asistente = False
    # Priority 3: Legacy Admin
    elif user.role == "admin" or (user.role_obj and user.role_obj.name == "admin"):
        perms = {
            "ventas": True, "compras": True, "produccion": True, 
            "finanzas": True, "almacen": True, "inventario": True, "admin": True,
            "rrhh": True, "calidad": True
        }
        role_name = "Administrador"
        is_responsable = True
        is_asistente = False
    # Priority 4: Legacy Role
    else:
        is_true_admin = (
            user.username == "adrian.rubio"
            or user.role == "admin"
            or (user.role_obj and user.role_obj.name == "admin")
        )
        perms = {
            "ventas": user.role_obj.can_view_ventas if user.role_obj else True,
            "compras": user.role_obj.can_view_compras if user.role_obj else True,
            "produccion": user.role_obj.can_view_produccion if user.role_obj else False,
            "finanzas": user.role_obj.can_view_finanzas if user.role_obj else False,
            "almacen": user.role_obj.can_view_almacen if user.role_obj else False,
            "inventario": user.role_obj.can_view_inventario if user.role_obj else True,
            "admin": True if is_true_admin else False,
            "rrhh": False, "calidad": False
        }
        role_name = user.role_obj.name if user.role_obj else user.role
        is_responsable = False
        is_asistente = False

    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={
            "sub": user.username, 
            "role": user.role, 
            "role_id": user.role_id,
            "role_name": role_name,
            "department": user.department.name if user.department else None,
            "division": user.division.name if user.division else None,
            "is_responsable": is_responsable,
            "is_asistente": is_asistente,
            "user_type": user.user_type,
            "permissions": perms,
            "sales_rep_id": user.sales_rep_id,
            "data_filters": user.data_filters,
            "must_change_password": user.must_change_password
        }, 
        expires_delta=access_token_expires
    )

    # Secure HTTPOnly Cookie approach
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,  # Impide que Javascript lea la cookie (anti-XSS)
        secure=False,   # Set to True only when fully HTTPS, False if HTTP
        samesite="lax", # Proteccion anti-CSRF
        max_age=auth.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token", httponly=True, samesite="lax")
    return {"message": "Logged out successfully"}

def check_admin_role(current_user: models.User = Depends(auth.get_current_active_user)):
    # Permite acceso si es el usuario "admin" original o si su cargo o rol dinámico tiene el permiso de gestión
    print("CHECKING ADMIN ROLE:", current_user.username, current_user.role, getattr(current_user.position, 'name', None))
    is_true_admin = (
        current_user.username == "adrian.rubio"
        or (current_user.role == "admin")
        or (current_user.role_obj and current_user.role_obj.name == "admin")
        or (current_user.position and (
            "administrador" in current_user.position.name.lower()
            or "admin" in current_user.position.name.lower()
        ))
    )
    
    if not is_true_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operación no permitida: Se requiere permiso de gestión de usuarios"
        )
    return current_user

@router.post("/users", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db), admin: models.User = Depends(check_admin_role)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    db_email = db.query(models.User).filter(models.User.email == user.email).first()
    if db_email:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        role=user.role,
        role_id=user.role_id,
        sales_rep_id=user.sales_rep_id,
        user_type=user.user_type,
        data_filters=user.data_filters,
        is_active=user.is_active,
        must_change_password=user.must_change_password,
        department_id=user.department_id,
        division_id=user.division_id,
        position_id=user.position_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/users", response_model=List[schemas.UserResponse])
def list_users(db: Session = Depends(get_db), admin: models.User = Depends(check_admin_role)):
    return db.query(models.User).all()

# Role Management Endpoints
@router.get("/roles", response_model=List[schemas.Role])
def list_roles(db: Session = Depends(get_db), admin: models.User = Depends(check_admin_role)):
    return db.query(models.Role).all()

@router.post("/roles", response_model=schemas.Role, status_code=status.HTTP_201_CREATED)
def create_role(role: schemas.RoleCreate, db: Session = Depends(get_db), admin: models.User = Depends(check_admin_role)):
    db_role = models.Role(**role.dict())
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role

@router.put("/users/{user_id}", response_model=schemas.UserResponse)
def update_user(user_id: int, user_update: schemas.UserCreate, db: Session = Depends(get_db), admin: models.User = Depends(check_admin_role)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check email/username collision
    if db_user.username != user_update.username:
        if db.query(models.User).filter(models.User.username == user_update.username).first():
            raise HTTPException(status_code=400, detail="Username already registered")
    if db_user.email != user_update.email:
        if db.query(models.User).filter(models.User.email == user_update.email).first():
            raise HTTPException(status_code=400, detail="Email already registered")

    db_user.username = user_update.username
    db_user.email = user_update.email
    if user_update.password:
        db_user.hashed_password = auth.get_password_hash(user_update.password)
    db_user.role = user_update.role
    db_user.role_id = user_update.role_id
    db_user.sales_rep_id = user_update.sales_rep_id
    db_user.user_type = user_update.user_type
    db_user.data_filters = user_update.data_filters
    db_user.is_active = user_update.is_active
    db_user.must_change_password = user_update.must_change_password
    db_user.department_id = user_update.department_id
    db_user.division_id = user_update.division_id
    db_user.position_id = user_update.position_id
    
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db), admin: models.User = Depends(check_admin_role)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(db_user)
    db.commit()
    return None

@router.put("/roles/{role_id}", response_model=schemas.Role)
def update_role(role_id: int, role_update: schemas.RoleCreate, db: Session = Depends(get_db), admin: models.User = Depends(check_admin_role)):
    db_role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not db_role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    for key, value in role_update.dict().items():
        setattr(db_role, key, value)
    
    db.commit()
    db.refresh(db_role)
    return db_role

@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(role_id: int, db: Session = Depends(get_db), admin: models.User = Depends(check_admin_role)):
    db_role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not db_role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Check if role is in use
    users_with_role = db.query(models.User).filter(models.User.role_id == role_id).first()
    if users_with_role:
        raise HTTPException(status_code=400, detail="No se puede borrar el rol porque hay usuarios asignados a él.")
        
    db.delete(db_role)
    db.commit()
    return None

@router.get("/users/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(auth.get_current_active_user)):
    return current_user

@router.post("/auth/change-password")
def change_password(data: schemas.PasswordChange, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    # In this case we only care about the password
    if not data.password:
        raise HTTPException(status_code=400, detail="Password is required")
    
    current_user.hashed_password = auth.get_password_hash(data.password)
    current_user.must_change_password = False
    db.commit()
    return {"message": "Contraseña actualizada correctamente"}

# Hierarchical structure endpoints
@router.get("/departments", response_model=List[schemas.Department])
def list_departments(db: Session = Depends(get_db), admin: models.User = Depends(check_admin_role)):
    return db.query(models.Department).all()

@router.post("/departments", response_model=schemas.Department)
def create_department(dept: schemas.DepartmentBase, db: Session = Depends(get_db), admin: models.User = Depends(check_admin_role)):
    db_dept = models.Department(**dept.dict())
    db.add(db_dept)
    db.commit()
    db.refresh(db_dept)
    return db_dept

@router.get("/divisions", response_model=List[schemas.Division])
def list_divisions(db: Session = Depends(get_db), admin: models.User = Depends(check_admin_role)):
    return db.query(models.Division).all()

@router.post("/divisions", response_model=schemas.Division)
def create_division(div: schemas.DivisionBase, db: Session = Depends(get_db), admin: models.User = Depends(check_admin_role)):
    db_div = models.Division(**div.dict())
    db.add(db_div)
    db.commit()
    db.refresh(db_div)
    return db_div

@router.get("/positions", response_model=List[schemas.JobPosition])
def list_positions(db: Session = Depends(get_db), admin: models.User = Depends(check_admin_role)):
    return db.query(models.JobPosition).all()

@router.post("/positions", response_model=schemas.JobPosition)
def create_position(pos: schemas.JobPositionBase, db: Session = Depends(get_db), admin: models.User = Depends(check_admin_role)):
    db_pos = models.JobPosition(**pos.dict())
    db.add(db_pos)
    db.commit()
    db.refresh(db_pos)
    return db_pos
