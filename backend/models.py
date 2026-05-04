from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class Role(Base):
    __tablename__ = "dashboard_roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(String(255))
    
    # Permissions
    can_view_ventas = Column(Boolean, default=False)
    can_view_compras = Column(Boolean, default=False)
    can_view_produccion = Column(Boolean, default=False)
    can_view_finanzas = Column(Boolean, default=False)
    can_view_almacen = Column(Boolean, default=False)
    can_view_inventario = Column(Boolean, default=False)
    can_manage_users = Column(Boolean, default=False)
    
    users = relationship("User", back_populates="role_obj")

class User(Base):
    __tablename__ = "dashboard_users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    # Legacy role string - keeping for now
    role = Column(String(20), default="comercial", nullable=False)
    
    # Dynamic role relationship
    role_id = Column(Integer, ForeignKey("dashboard_roles.id"), nullable=True)
    role_obj = relationship("Role", back_populates="users")
    
    # Optional field to link a dashboard user to a specific Sage200 sales representative
    sales_rep_id = Column(String(50), nullable=True)
    
    # Type of user: CENVAL or DISTRIBUIDOR
    user_type = Column(String(20), default="CENVAL", nullable=False)
    # JSON string for data restrictions (e.g. allowed supplier IDs)
    data_filters = Column(String(1000), nullable=True)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ModuleSetting(Base):
    __tablename__ = "module_settings"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)
    is_active = Column(Boolean, default=True)
    last_modified = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
