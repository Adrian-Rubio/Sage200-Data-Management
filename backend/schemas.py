from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None
    can_view_ventas: bool = False
    can_view_compras: bool = False
    can_view_produccion: bool = False
    can_view_finanzas: bool = False
    can_manage_users: bool = False

class RoleCreate(RoleBase):
    pass

class Role(RoleBase):
    id: int
    class Config:
        orm_mode = True

class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: str = "comercial" # Still keeping for compatibility
    role_id: Optional[int] = None
    sales_rep_id: Optional[str] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    role_obj: Optional[Role] = None

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
    role_id: Optional[int] = None
    sales_rep_id: Optional[str] = None
