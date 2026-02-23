from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from typing import List
from datetime import timedelta

import models, schemas, auth
from database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
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
    perms = {
        "ventas": True, "compras": True, "produccion": True, "finanzas": True, "admin": True
    } if user.role == "admin" or (user.role_obj and user.role_obj.name == "admin") else {
        "ventas": user.role_obj.can_view_ventas if user.role_obj else True,
        "compras": user.role_obj.can_view_compras if user.role_obj else True,
        "produccion": user.role_obj.can_view_produccion if user.role_obj else False,
        "finanzas": user.role_obj.can_view_finanzas if user.role_obj else False,
        "admin": user.role_obj.can_manage_users if user.role_obj else False
    }

    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={
            "sub": user.username, 
            "role": user.role, 
            "role_id": user.role_id,
            "permissions": perms,
            "sales_rep_id": user.sales_rep_id
        }, 
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

def check_admin_role(current_user: models.User = Depends(auth.get_current_active_user)):
    # Permite acceso si es el usuario "admin" original o si su rol dinámico tiene el permiso de gestión
    print("CHECKING ADMIN ROLE:", current_user.role, getattr(current_user.role_obj, 'name', None), getattr(current_user.role_obj, 'can_manage_users', None))
    has_permission = (current_user.role == "admin") or (
        current_user.role_obj and current_user.role_obj.name == "admin"
    ) or (
        current_user.role_obj and current_user.role_obj.can_manage_users
    )
    
    if not has_permission:
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
        is_active=user.is_active
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
    db_user.is_active = user_update.is_active
    
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
