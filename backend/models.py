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

class Department(Base):
    __tablename__ = "dashboard_departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    
    divisions = relationship("Division", back_populates="department")
    users = relationship("User", back_populates="department")
    positions = relationship("JobPosition", back_populates="department")

class Division(Base):
    __tablename__ = "dashboard_divisions"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True, nullable=False)
    department_id = Column(Integer, ForeignKey("dashboard_departments.id"))
    
    department = relationship("Department", back_populates="divisions")
    users = relationship("User", back_populates="division")

class JobPosition(Base):
    __tablename__ = "dashboard_positions"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True, nullable=False)
    department_id = Column(Integer, ForeignKey("dashboard_departments.id"))
    
    # Permissions (mirrored from Role but will be the new standard)
    can_view_ventas = Column(Boolean, default=False)
    can_view_compras = Column(Boolean, default=False)
    can_view_produccion = Column(Boolean, default=False)
    can_view_finanzas = Column(Boolean, default=False)
    can_view_almacen = Column(Boolean, default=False)
    can_view_inventario = Column(Boolean, default=False)
    can_manage_users = Column(Boolean, default=False)
    
    # New permissions mentioned in plan
    can_view_rrhh = Column(Boolean, default=False)
    can_view_calidad = Column(Boolean, default=False)
    
    # Hierarchy flags
    is_responsable = Column(Boolean, default=False)
    is_asistente = Column(Boolean, default=False)
    
    department = relationship("Department", back_populates="positions")
    users = relationship("User", back_populates="position")

class Company(Base):
    __tablename__ = "dashboard_companies"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False) # 'CENVAL', 'CENVALSA_IND', 'SARATUR'
    name = Column(String(100), unique=True, index=True, nullable=False)
    
    users = relationship("User", back_populates="company")

class User(Base):
    __tablename__ = "dashboard_users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    # Legacy role string - keeping for now
    role = Column(String(20), default="comercial", nullable=False)
    
    # Dynamic role relationship (Legacy/Legacy compatible)
    role_id = Column(Integer, ForeignKey("dashboard_roles.id"), nullable=True)
    role_obj = relationship("Role", back_populates="users")
    
    # New Hierarchical structure
    department_id = Column(Integer, ForeignKey("dashboard_departments.id"), nullable=True)
    division_id = Column(Integer, ForeignKey("dashboard_divisions.id"), nullable=True)
    position_id = Column(Integer, ForeignKey("dashboard_positions.id"), nullable=True)
    
    department = relationship("Department", back_populates="users")
    division = relationship("Division", back_populates="users")
    position = relationship("JobPosition", back_populates="users")
    
    company_id = Column(Integer, ForeignKey("dashboard_companies.id"), nullable=True)
    company = relationship("Company", back_populates="users")
    
    # Optional field to link a dashboard user to a specific Sage200 sales representative
    sales_rep_id = Column(String(50), nullable=True)
    
    # Type of user: CENVAL or DISTRIBUIDOR
    user_type = Column(String(20), default="CENVAL", nullable=False)
    # JSON string for data restrictions (e.g. allowed supplier IDs)
    data_filters = Column(String(1000), nullable=True)

    is_active = Column(Boolean, default=True)
    must_change_password = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Vacation(Base):
    __tablename__ = "dashboard_vacations"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("dashboard_users.id"), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    type = Column(String(50), default="Vacaciones") # 'Vacaciones', 'Baja', 'Asuntos Propios'
    notes = Column(String(500), nullable=True)
    duration_minutes = Column(Integer, nullable=True)  # Solo para 'Asuntos Propios'
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", backref="vacations")


class ModuleSetting(Base):
    __tablename__ = "module_settings"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)
    is_active = Column(Boolean, default=True)
    last_modified = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PurchaseTracking(Base):
    __tablename__ = "purchase_tracking"
    
    # Primary key based on Sage order identification
    codigo_empresa = Column(Integer, primary_key=True)
    ejercicio_pedido = Column(Integer, primary_key=True)
    serie_pedido = Column(String(10), primary_key=True)
    numero_pedido = Column(Integer, primary_key=True)
    
    # Tracking fields
    incoterm = Column(String(100))
    medio_transporte = Column(String(50)) # AIR, OCEAN, LAND
    agencia_transporte = Column(String(255))
    ref_envio = Column(String(255)) # Booking ref
    bultos = Column(Integer)
    volumen = Column(String(50))
    peso = Column(String(50))
    
    # Dates
    fecha_establecida_inicial = Column(DateTime)
    fecha_real_proveedor = Column(DateTime)
    fecha_recogida_real = Column(DateTime)
    fecha_salida_origen = Column(DateTime)
    fecha_llegada_espana = Column(DateTime)
    fecha_llegada_nosotros = Column(DateTime)
    fecha_recepcion_almacen = Column(DateTime)
    
    anotaciones = Column(String(2000))
    last_modified = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
