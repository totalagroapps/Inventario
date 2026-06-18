import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import timedelta

import models
import schemas
import auth
from database import get_db, engine, Base
from routers import referencias, movimientos, dashboard

# Crear tablas
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Inventario GAMS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(referencias.router)
app.include_router(movimientos.router)
app.include_router(dashboard.router)

@app.post("/auth/login", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.Usuario).filter(models.Usuario.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username, "rol": user.rol}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "rol": user.rol}

@app.get("/auth/me", response_model=schemas.Usuario)
async def read_users_me(current_user: models.Usuario = Depends(auth.get_current_active_user)):
    return current_user

# Mount static files (QR)
qr_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(qr_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=qr_dir), name="static")

# Mount PWA
pwa_dir = os.path.join(os.path.dirname(__file__), "pwa")
os.makedirs(pwa_dir, exist_ok=True)
app.mount("/pwa", StaticFiles(directory=pwa_dir, html=True), name="pwa")

# Mount Panel (React Vite build)
panel_dir = os.path.join(os.path.dirname(__file__), "panel", "dist")
os.makedirs(panel_dir, exist_ok=True)
app.mount("/panel", StaticFiles(directory=panel_dir, html=True), name="panel")

@app.get("/health")
def health_check():
    return {"status": "ok"}
