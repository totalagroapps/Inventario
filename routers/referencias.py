from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os

from database import get_db
import models
import schemas
import auth
from qr_generator import generar_qr

router = APIRouter(
    prefix="/api/referencias",
    tags=["referencias"],
)

@router.get("/", response_model=List[schemas.Referencia])
def read_referencias(
    skip: int = 0, limit: int = 100, 
    categoria: Optional[str] = None, 
    buscar: Optional[str] = None,
    stock_bajo: Optional[bool] = False,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(auth.get_current_active_user)
):
    query = db.query(models.Referencia)
    
    if categoria:
        query = query.filter(models.Referencia.categoria == categoria)
    if buscar:
        query = query.filter(
            (models.Referencia.nombre.ilike(f"%{buscar}%")) | 
            (models.Referencia.codigo.ilike(f"%{buscar}%"))
        )
    if stock_bajo:
        query = query.filter(models.Referencia.stock_actual <= models.Referencia.stock_minimo)
        
    return query.offset(skip).limit(limit).all()

@router.post("/", response_model=schemas.Referencia)
def create_referencia(
    referencia: schemas.ReferenciaCreate, 
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(auth.get_current_admin_user)
):
    db_ref = db.query(models.Referencia).filter(
        (models.Referencia.nombre == referencia.nombre) | 
        (models.Referencia.codigo == referencia.codigo)
    ).first()
    if db_ref:
        raise HTTPException(status_code=400, detail="Referencia ya registrada con ese nombre o código")
        
    nueva_ref = models.Referencia(**referencia.model_dump())
    db.add(nueva_ref)
    db.commit()
    db.refresh(nueva_ref)
    
    qr_path = generar_qr(nueva_ref.id, nueva_ref.nombre, nueva_ref.codigo)
    nueva_ref.qr_path = qr_path
    db.commit()
    db.refresh(nueva_ref)
    
    return nueva_ref

@router.get("/reporte-peso")
def reporte_peso(
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(auth.get_current_admin_user)
):
    referencias = db.query(models.Referencia).all()
    reporte = []
    for ref in referencias:
        peso_total_kg = (ref.stock_actual * ref.peso_unitario_gr) / 1000.0
        precio_total = float(ref.stock_actual * ref.precio_unitario)
        reporte.append({
            "id": ref.id,
            "nombre": ref.nombre,
            "codigo": ref.codigo,
            "stock_actual": ref.stock_actual,
            "peso_unitario_gr": ref.peso_unitario_gr,
            "peso_total_kg": peso_total_kg,
            "precio_unitario": float(ref.precio_unitario),
            "precio_total": precio_total
        })
    return reporte

@router.get("/{referencia_id}", response_model=schemas.Referencia)
def read_referencia(
    referencia_id: str, 
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(auth.get_current_active_user)
):
    db_ref = db.query(models.Referencia).filter(models.Referencia.id == referencia_id).first()
    if db_ref is None:
        raise HTTPException(status_code=404, detail="Referencia no encontrada")
    return db_ref

@router.put("/{referencia_id}", response_model=schemas.Referencia)
def update_referencia(
    referencia_id: str, 
    referencia: schemas.ReferenciaUpdate, 
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(auth.get_current_admin_user)
):
    db_ref = db.query(models.Referencia).filter(models.Referencia.id == referencia_id).first()
    if db_ref is None:
        raise HTTPException(status_code=404, detail="Referencia no encontrada")
        
    update_data = referencia.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_ref, key, value)
        
    db.commit()
    db.refresh(db_ref)
    
    # Regenerar QR en caso de cambio de nombre o código
    if "nombre" in update_data or "codigo" in update_data:
        qr_path = generar_qr(db_ref.id, db_ref.nombre, db_ref.codigo)
        db_ref.qr_path = qr_path
        db.commit()
        db.refresh(db_ref)
        
    return db_ref

@router.delete("/{referencia_id}")
def delete_referencia(
    referencia_id: str, 
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(auth.get_current_admin_user)
):
    db_ref = db.query(models.Referencia).filter(models.Referencia.id == referencia_id).first()
    if db_ref is None:
        raise HTTPException(status_code=404, detail="Referencia no encontrada")
    
    db.delete(db_ref)
    db.commit()
    return {"ok": True}

@router.get("/{referencia_id}/qr")
def get_qr(
    referencia_id: str, 
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(auth.get_current_active_user)
):
    db_ref = db.query(models.Referencia).filter(models.Referencia.id == referencia_id).first()
    if db_ref is None or not db_ref.qr_path:
        raise HTTPException(status_code=404, detail="QR no encontrado")
        
    # Obtener la ruta absoluta
    # Asumiendo que qr_path es /static/qr/uuid.png
    filename = os.path.basename(db_ref.qr_path)
    file_path = os.path.join(os.path.dirname(__file__), "..", "static", "qr", filename)
    
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="image/png")
    raise HTTPException(status_code=404, detail="Archivo QR físico no encontrado")
