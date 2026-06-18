import os
import openpyxl
import re
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
import models
from qr_generator import generar_qr

# Configuración de cifrado de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

CATEGORIAS_ORDEN = ["TORNILLO","PRISIONERO","TUERCA","ARANDELA","GUASA",
  "CHUMACERA","POLEA","VARILLA","PIÑÓN","CORREA","CUÑA","EJE","PERILLA",
  "RODAMIENTO","RODILLO","CADENA","ABRAZADERA","BANDA","CABLE","CAUCHO"]

def detectar_categoria(nombre):
    for cat in CATEGORIAS_ORDEN:
        if nombre.upper().startswith(cat):
            return cat
    return nombre.split()[0].upper()

def evaluar_formula(val):
    if isinstance(val, (int, float)):
        return int(val)
    if isinstance(val, str):
        val = val.strip()
        if val.startswith('='):
            expr = val[1:].replace(',','.')
            # solo permitir dígitos, +, -, *, /, espacios, paréntesis
            if re.match(r'^[\d\+\-\*\/\(\)\.\s]+$', expr):
                try:
                    return int(eval(expr))
                except Exception:
                    return 0
        elif val.isdigit():
            return int(val)
    return 0

def seed_db():
    print("Iniciando seed de la base de datos...")
    
    # Asegurar que las tablas existan
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # 1. Crear usuarios por defecto si no existen
    admin_user = db.query(models.Usuario).filter(models.Usuario.username == "admin").first()
    if not admin_user:
        admin = models.Usuario(
            username="admin",
            password_hash=pwd_context.hash("admin123"),
            rol="admin"
        )
        db.add(admin)
        print("Usuario 'admin' creado.")
        
    operario_user = db.query(models.Usuario).filter(models.Usuario.username == "operario").first()
    if not operario_user:
        operario = models.Usuario(
            username="operario",
            password_hash=pwd_context.hash("operario123"),
            rol="operario"
        )
        db.add(operario)
        print("Usuario 'operario' creado.")
    
    db.commit()

    # 2. Leer Excel e insertar referencias
    excel_path = "INVENTARIO_TORNILLERIA_FEBRERO.xlsm"
    
    if not os.path.exists(excel_path):
        print(f"ATENCIÓN: Archivo {excel_path} no encontrado. Saltando importación de referencias.")
        db.close()
        return

    print(f"Leyendo archivo Excel {excel_path}...")
    try:
        wb = openpyxl.load_workbook(excel_path, data_only=False) # leemos con formulas para evaluarlas
        sheet = wb.active
        
        # Omitimos fila 1 asumiendo headers
        # Formato esperado: Nombre (A), Cantidad total (B), Entregadas (C), Total disponibles (D), Peso Unit (E)
        # Adaptar índices según el Excel real si difiere. Asumimos col 1 a 5 para simplificar.
        
        contadores_categoria = {}
        
        for row in sheet.iter_rows(min_row=2, values_only=True):
            if not row[0]: # Si no hay nombre, saltar
                continue
                
            nombre_ref = str(row[0]).strip()
            # Validar si ya existe
            existente = db.query(models.Referencia).filter(models.Referencia.nombre == nombre_ref).first()
            if existente:
                continue # Idempotente
                
            # Evaluamos campos
            cantidad_total = evaluar_formula(row[1]) if len(row) > 1 and row[1] is not None else 0
            entregadas = evaluar_formula(row[2]) if len(row) > 2 and row[2] is not None else 0
            
            # El usuario solicitó que las referencias suban en 0 para alimentarlas manualmente
            stock_actual = 0
            
            peso_unit = 0.0
            if len(row) > 4 and row[4] is not None:
                try:
                    peso_unit = float(row[4])
                except ValueError:
                    pass
            
            categoria = detectar_categoria(nombre_ref)
            
            # Generar código
            if categoria not in contadores_categoria:
                contadores_categoria[categoria] = 1
            else:
                contadores_categoria[categoria] += 1
                
            codigo = f"{categoria[:3].upper()}-{contadores_categoria[categoria]:03d}"
            
            # Asegurar código único
            while db.query(models.Referencia).filter(models.Referencia.codigo == codigo).first():
                contadores_categoria[categoria] += 1
                codigo = f"{categoria[:3].upper()}-{contadores_categoria[categoria]:03d}"
            
            nueva_ref = models.Referencia(
                nombre=nombre_ref,
                codigo=codigo,
                categoria=categoria,
                peso_unitario_gr=peso_unit,
                stock_actual=stock_actual,
                # Asumimos que los que ya se entregaron cuentan como histórico pero el stock_actual ya está descontado
            )
            
            db.add(nueva_ref)
            db.commit()
            db.refresh(nueva_ref)
            
            # Generar QR
            qr_path = generar_qr(nueva_ref.id, nueva_ref.nombre, nueva_ref.codigo)
            nueva_ref.qr_path = qr_path
            db.commit()
            
            # No se registrarán movimientos históricos, el stock inicia en 0
            
            try:
                print(f"Insertada referencia: {codigo} - {nombre_ref.encode('ascii', 'replace').decode('ascii')}")
            except Exception:
                pass
            
    except Exception as e:
        print(f"Error procesando Excel: {e}")
    finally:
        db.close()
        print("Seed finalizado.")

if __name__ == "__main__":
    seed_db()
