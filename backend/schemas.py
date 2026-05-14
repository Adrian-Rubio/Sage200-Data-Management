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
    can_view_almacen: bool = False
    can_view_inventario: bool = False
    can_manage_users: bool = False

class RoleCreate(RoleBase):
    pass

class Role(RoleBase):
    id: int
    class Config:
        orm_mode = True

class DepartmentBase(BaseModel):
    name: str

class Department(DepartmentBase):
    id: int
    class Config:
        orm_mode = True

class DivisionBase(BaseModel):
    name: str
    department_id: int

class Division(DivisionBase):
    id: int
    class Config:
        orm_mode = True

class JobPositionBase(BaseModel):
    name: str
    department_id: int
    can_view_ventas: bool = False
    can_view_compras: bool = False
    can_view_produccion: bool = False
    can_view_finanzas: bool = False
    can_view_almacen: bool = False
    can_view_inventario: bool = False
    can_manage_users: bool = False
    can_view_rrhh: bool = False
    can_view_calidad: bool = False
    is_responsable: bool = False
    is_asistente: bool = False

class JobPosition(JobPositionBase):
    id: int
    class Config:
        orm_mode = True

class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: str = "comercial" # Still keeping for compatibility
    role_id: Optional[int] = None
    department_id: Optional[int] = None
    division_id: Optional[int] = None
    position_id: Optional[int] = None
    sales_rep_id: Optional[str] = None
    user_type: str = "CENVAL"
    data_filters: Optional[str] = None
    is_active: bool = True
    must_change_password: Optional[bool] = False

class UserCreate(UserBase):
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    role_obj: Optional[Role] = None
    department: Optional[Department] = None
    division: Optional[Division] = None
    position: Optional[JobPosition] = None

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class PasswordChange(BaseModel):
    password: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
    role_id: Optional[int] = None
    sales_rep_id: Optional[str] = None
    user_type: Optional[str] = None

class ModuleSettingBase(BaseModel):
    name: str
    is_active: bool

class ModuleSettingUpdate(BaseModel):
    is_active: bool

class ModuleSetting(ModuleSettingBase):
    id: int
    last_modified: datetime
    class Config:
        orm_mode = True
