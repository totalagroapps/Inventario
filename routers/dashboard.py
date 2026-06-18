from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date, timedelta

from database import get_db
import models
import schemas
import auth

router = APIRouter(
    prefix="/api/dashboard",
    tags=["dashboard"],
)

@router.get("/resumen", response_model=schemas.DashboardResumen)
def get_dashboard_resumen(
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(auth.get_current_active_user)
):
    total_referencias = db.query(models.Referencia).count()
    con_stock = db.query(models.Referencia).filter(models.Referencia.stock_actual > 0).count()
    sin_stock = total_referencias - con_stock
    
    # Entradas y salidas de hoy
    hoy_inicio = datetime.combine(date.today(), datetime.min.time())
    
    entradas_hoy = db.query(func.sum(models.Movimiento.cantidad)).filter(
        models.Movimiento.tipo == "entrada",
        models.Movimiento.fecha >= hoy_inicio
    ).scalar() or 0
    
    salidas_hoy = db.query(func.sum(models.Movimiento.cantidad)).filter(
        models.Movimiento.tipo == "salida",
        models.Movimiento.fecha >= hoy_inicio
    ).scalar() or 0
    
    # Bajo mínimo
    refs_bajo_minimo = db.query(models.Referencia).filter(
        models.Referencia.stock_actual <= models.Referencia.stock_minimo,
        models.Referencia.stock_actual > 0
    ).all()
    
    bajo_minimo_list = [
        schemas.DashboardBajoMinimo(
            id=r.id, nombre=r.nombre, codigo=r.codigo, 
            stock_actual=r.stock_actual, stock_minimo=r.stock_minimo
        ) for r in refs_bajo_minimo
    ]
    
    # Valor inventario total
    referencias_con_precio = db.query(models.Referencia).all()
    valor_total = sum([float(r.precio_unitario) * r.stock_actual for r in referencias_con_precio])
    
    # Últimos movimientos
    ultimos_movs = db.query(models.Movimiento).order_by(models.Movimiento.fecha.desc()).limit(10).all()
    
    return schemas.DashboardResumen(
        total_referencias=total_referencias,
        con_stock=con_stock,
        sin_stock=sin_stock,
        entradas_hoy=entradas_hoy,
        salidas_hoy=salidas_hoy,
        bajo_minimo=bajo_minimo_list,
        valor_inventario_total=valor_total,
        movimientos_recientes=ultimos_movs
    )
