from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from .database import Base
import datetime

class Local(Base):
    __tablename__ = "Locals"
    
    Id = Column(String, primary_key=True, index=True)
    Name = Column(String)
    
    # Relationships
    maps = relationship("Map", back_populates="local")

class Map(Base):
    __tablename__ = "Maps"
    
    Id = Column(String, primary_key=True, index=True)
    Name = Column(String)
    LocalId = Column(String, ForeignKey("Locals.Id"))
    
    # Relationships
    local = relationship("Local", back_populates="maps")
    elements = relationship("Element", back_populates="map")

class Element(Base):
    __tablename__ = "Elements"
    
    Id = Column(String, primary_key=True, index=True)
    Name = Column(String)
    MapId = Column(String, ForeignKey("Maps.Id"), nullable=True)
    
    # Relationships
    sales = relationship("Sale", back_populates="element")
    map = relationship("Map", back_populates="elements")

class Sale(Base):
    __tablename__ = "Sales"

    Id = Column(String, primary_key=True, index=True)
    ElementId = Column(String, ForeignKey("Elements.Id"), nullable=True)
    WaiterId = Column(String, ForeignKey("Staff.Id"), nullable=True)
    CheckInDate = Column(DateTime)
    CheckOutDate = Column(DateTime)
    GuestNumber = Column(Integer)
    Total = Column(Float)
    SubTotal = Column(Float)
    IsDeleted = Column(Boolean, default=False)
    OrderNumber = Column(Integer)

    # Relationships
    lines = relationship("SaleDetail", back_populates="sale")
    element = relationship("Element", back_populates="sales")
    waiter = relationship("Employee", back_populates="sales")

class Ticket(Base):
    __tablename__ = "Tickets"

    Id = Column(String, primary_key=True, index=True)
    TicketNumber = Column(String)
    Total = Column(Float)
    TaxAmount = Column(Float)
    CheckOutDate = Column(DateTime)
    CreationDate = Column(DateTime, default=datetime.datetime.utcnow)
    
class SaleDetail(Base):
    __tablename__ = "SaleDetails"

    Id = Column(String, primary_key=True, index=True)
    TicketId = Column(String, ForeignKey("Tickets.Id"), nullable=True)
    SaleId = Column(String, ForeignKey("Sales.Id"))
    ArticleId = Column(String, ForeignKey("SaleArticle.Id"), nullable=True)
    Description = Column(String)
    Amount = Column(Float)
    UnitPrice = Column(Float)
    Total = Column(Float)
    Invitation = Column(Boolean, default=False)
    Observation = Column(String, nullable=True)
    
    # Relationships
    sale = relationship("Sale", back_populates="lines")
    article = relationship("Article", back_populates="sale_details")

class Article(Base):
    __tablename__ = "SaleArticle"

    Id = Column(String, primary_key=True, index=True)
    Name = Column(String)
    Inactive = Column(Boolean, default=False)
    IsDeleted = Column(Boolean, default=False)
    
    # Relationships
    sale_details = relationship("SaleDetail", back_populates="article")

class Category(Base):
    __tablename__ = "SaleFamily"

    Id = Column(String, primary_key=True, index=True)
    Name = Column(String)
    ParentFamilyId = Column(String)
    IsDeleted = Column(Boolean, default=False)

class Employee(Base):
    __tablename__ = "Staff"

    Id = Column(String, primary_key=True, index=True)
    Name = Column(String)
    LastName = Column(String)
    IsDeleted = Column(Boolean, default=False)
    IsOff = Column(Boolean, default=False)

    # Relationships
    sales = relationship("Sale", back_populates="waiter")
    closures = relationship("ClosingCash", back_populates="employee")
    cash_flows = relationship("CashFlowOut", back_populates="staff")

class ClosingCash(Base):
    __tablename__ = "ClosingCashes"

    Id = Column(String, primary_key=True, index=True)
    LocalId = Column(String, ForeignKey("Locals.Id"), nullable=True)
    ClosingStaffId = Column(String, ForeignKey("Staff.Id"), nullable=True)
    ClosingDate = Column(DateTime)
    CalculatedCash = Column(Float)
    FinalCash = Column(Float)
    Inbalance = Column(Float)
    TotalSalesAmount = Column(Float)
    Tickets = Column(Integer)

    # Relationships
    local = relationship("Local")
    employee = relationship("Employee")

class CashFlowOut(Base):
    __tablename__ = "CashFlowOut"
    Id = Column(String, primary_key=True, index=True)
    LocalId = Column(String, ForeignKey("Locals.Id"), nullable=True)
    StaffId = Column(String, ForeignKey("Staff.Id"), nullable=True)
    ClosingCashId = Column(String)
    CashFlowOutAmount = Column(Float)
    CashFlowInAmount = Column(Float)
    Date = Column(DateTime)
    Subject = Column(String) # Concepto
    ProviderId = Column(String)
    IsDeleted = Column(Boolean, default=False)
    NumTicket = Column(String)
    CreationDate = Column(DateTime)
    ModificationDate = Column(DateTime)
    PaymentMethodId = Column(String)

    # Relationships
    local = relationship("Local")
    staff = relationship("Employee", back_populates="cash_flows")
