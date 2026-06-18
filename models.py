import uuid
from sqlalchemy import Column, Integer, String, Float, Numeric, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from database import Base

class Referencia(Base):
    __tablename__ = "referencias"

    # Usamos String genérico que se adapta a UUID en sqlite y postgres
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nombre = Column(String, unique=True, index=True, nullable=False)
    codigo = Column(String, unique=True, index=True, nullable=False)
    categoria = Column(String)
    unidad = Column(String, default='unidad')
    peso_unitario_gr = Column(Float, default=0.0)
    precio_unitario = Column(Numeric(12, 2), default=0)
    stock_actual = Column(Integer, default=0)
    stock_minimo = Column(Integer, default=5)
    qr_path = Column(String)
    creado_en = Column(DateTime(timezone=True), server_default=func.now())

    movimientos = relationship("Movimiento", back_populates="referencia")

class Movimiento(Base):
    __tablename__ = "movimientos"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    referencia_id = Column(String(36), ForeignKey("referencias.id"))
    tipo = Column(String) # 'entrada' o 'salida'
    cantidad = Column(Integer, nullable=False)
    responsable = Column(String)
    observacion = Column(String)
    fecha = Column(DateTime(timezone=True), server_default=func.now())

    referencia = relationship("Referencia", back_populates="movimientos")

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    rol = Column(String) # 'admin' o 'operario'
