from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

# ---- Referencias ----
class ReferenciaBase(BaseModel):
    nombre: str
    codigo: str
    categoria: Optional[str] = None
    unidad: Optional[str] = 'unidad'
    peso_unitario_gr: Optional[float] = 0.0
    precio_unitario: Optional[Decimal] = Decimal('0.00')
    stock_actual: Optional[int] = 0
    stock_minimo: Optional[int] = 5

class ReferenciaCreate(ReferenciaBase):
    pass

class ReferenciaUpdate(BaseModel):
    nombre: Optional[str] = None
    codigo: Optional[str] = None
    categoria: Optional[str] = None
    unidad: Optional[str] = None
    peso_unitario_gr: Optional[float] = None
    precio_unitario: Optional[Decimal] = None
    stock_actual: Optional[int] = None
    stock_minimo: Optional[int] = None

class Referencia(ReferenciaBase):
    id: str
    qr_path: Optional[str] = None
    creado_en: datetime

    class Config:
        from_attributes = True

# ---- Movimientos ----
class MovimientoBase(BaseModel):
    referencia_id: str
    tipo: str
    cantidad: int
    responsable: Optional[str] = None
    observacion: Optional[str] = None

class MovimientoCreate(MovimientoBase):
    pass

class Movimiento(MovimientoBase):
    id: str
    fecha: datetime
    referencia: Optional[Referencia] = None

    class Config:
        from_attributes = True

# ---- Dashboard ----
class DashboardBajoMinimo(BaseModel):
    id: str
    nombre: str
    codigo: str
    stock_actual: int
    stock_minimo: int

class DashboardResumen(BaseModel):
    total_referencias: int
    con_stock: int
    sin_stock: int
    entradas_hoy: int
    salidas_hoy: int
    bajo_minimo: List[DashboardBajoMinimo]
    valor_inventario_total: float
    movimientos_recientes: List[Movimiento]

# ---- Usuarios y Auth ----
class Token(BaseModel):
    access_token: str
    token_type: str
    rol: str

class TokenData(BaseModel):
    username: Optional[str] = None
    rol: Optional[str] = None

class UsuarioBase(BaseModel):
    username: str
    rol: str

class Usuario(UsuarioBase):
    id: str

    class Config:
        from_attributes = True
