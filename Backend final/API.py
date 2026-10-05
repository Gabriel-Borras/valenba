from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import Estaciones as stations
import Calculador_predicción as calculadora
import db

# 1. Instanciamos la aplicación FastAPI
app = FastAPI(title="Valenbisi Prediction API Service", version="3.0")

# Inicializamos la base de datos SQLite de producción
db.init_db()

# 2. Habilitamos CORS para que cualquier cliente frontend pueda conectarse
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Esquemas de petición
class PrediccionRequest(BaseModel):
    estacion: str
    fecha_solicitada: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class FavoriteRequest(BaseModel):
    email: str
    station_id: str
    custom_name: Optional[str] = None

@app.get("/")
def home():
    return {
        "message": "Servicio API de Predicción de Valenbisi activo y funcionando correctamente",
        "status": "online"
    }

@app.get("/calles") 
def get_calles():
    """Devuelve las calles descriptivas formateadas en 'ID - Nombre' para el autocompletado del buscador"""
    return stations.obtener_calles()

@app.get("/api/estaciones")
def get_estaciones():
    """Devuelve todas las estaciones (metadatos, coordenadas, etc.) para renderizar en el mapa"""
    return stations.obtener_estaciones()

@app.post("/predecir")
def predecir(req: PrediccionRequest):
    """
    Endpoint de predicción intermediario.
    Resuelve el ID de estación usando calle-id y delega el cálculo a la calculadora.
    """
    try:
        station_id = stations.resolver_calle_id(req.estacion)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    try:
        resultado = calculadora.ejecutar_prediccion(station_id, req.fecha_solicitada)
        return resultado
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=f"Error al calcular la predicción: {str(e)}")

# ─── ENDPOINTS DE AUTENTICACIÓN Y USUARIOS (PRODUCCIÓN) ───

@app.post("/api/auth/register")
def register(req: RegisterRequest):
    try:
        user = db.register_user(req.name, req.email, req.password)
        return {"success": True, "user": user}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno al registrar usuario.")

@app.post("/api/auth/login")
def login(req: LoginRequest):
    user = db.authenticate_user(req.email, req.password)
    if not user:
        raise HTTPException(status_code=401, detail="Correo electrónico o contraseña incorrectos.")
    favorites = db.get_user_favorites(user["email"])
    return {"success": True, "user": user, "favorites": favorites}

@app.get("/api/user/favorites")
def get_favorites(email: str):
    return db.get_user_favorites(email)

@app.post("/api/user/favorites")
def toggle_favorite(req: FavoriteRequest):
    is_favorite = db.toggle_user_favorite(req.email, req.station_id, req.custom_name)
    favorites = db.get_user_favorites(req.email)
    return {"success": True, "is_favorite": is_favorite, "favorites": favorites}
