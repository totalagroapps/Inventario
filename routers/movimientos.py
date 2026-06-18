from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List, Optional
import csv
import io
from datetime import datetime

from database import get_db
import models
import schemas
import auth

router = APIRouter(
    prefix="/api/movimientos",
    tags=["movimientos"],
)

@router.get("/", response_model=List[schemas.Movimiento])
def get_movimientos(
    referencia_id: Optional[str] = None,
    tipo: Optional[str] = None,
    desde: Optional[datetime] = None,
    hasta: Optional[datetime] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(auth.get_current_active_user)
):
    query = db.query(models.Movimiento).order_by(models.Movimiento.fecha.desc())
    
    if referencia_id:
        query = query.filter(models.Movimiento.referencia_id == referencia_id)
    if tipo:
        query = query.filter(models.Movimiento.tipo == tipo)
    if desde:
        query = query.filter(models.Movimiento.fecha >= desde)
    if hasta:
        query = query.filter(models.Movimiento.fecha <= hasta)
        
    return query.limit(limit).all()

@router.post("/", response_model=schemas.Movimiento)
def create_movimiento(
    movimiento: schemas.MovimientoCreate,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(auth.get_current_active_user)
):
    if movimiento.cantidad <= 0:
        raise HTTPException(status_code=400, detail="La cantidad debe ser mayor a 0")
        
    db_ref = db.query(models.Referencia).filter(models.Referencia.id == movimiento.referencia_id).first()
    if not db_ref:
        raise HTTPException(status_code=404, detail="Referencia no encontrada")
        
    if movimiento.tipo == "entrada":
        db_ref.stock_actual += movimiento.cantidad
    elif movimiento.tipo == "salida":
        if db_ref.stock_actual < movimiento.cantidad:
            raise HTTPException(status_code=400, detail="Stock insuficiente para esta salida")
        db_ref.stock_actual -= movimiento.cantidad
    else:
        raise HTTPException(status_code=400, detail="Tipo de movimiento inválido")
        
    nuevo_mov = models.Movimiento(**movimiento.model_dump())
    if not nuevo_mov.responsable:
        nuevo_mov.responsable = current_user.username
        
    db.add(nuevo_mov)
    db.commit()
    db.refresh(nuevo_mov)
    
    return nuevo_mov

@router.get("/export/csv")
def export_csv(
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(auth.get_current_admin_user)
):
    movimientos = db.query(models.Movimiento).join(models.Referencia).order_by(models.Movimiento.fecha.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Fecha', 'Referencia Codigo', 'Referencia Nombre', 'Tipo', 'Cantidad', 'Responsable', 'Observación'])
    
    for m in movimientos:
        writer.writerow([
            m.fecha.strftime("%Y-%m-%d %H:%M:%S"),
            m.referencia.codigo,
            m.referencia.nombre,
            m.tipo,
            m.cantidad,
            m.responsable,
            m.observacion
        ])
        
    response = Response(content=output.getvalue(), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=movimientos_inventario.csv"
    return response
