from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import Estaciones as stations
import Calculador_predicción as calculadora

# 1. Instanciamos la aplicación FastAPI
app = FastAPI(title="Valenbisi Prediction API Service", version="3.0")

# 2. Habilitamos CORS para que el frontend local pueda conectarse
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

@app.get("/")
def home():
    return {"message": "Servicio API de Predicción de Valenbisi activo y funcionando correctamente"}

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
    # Llama a la función calle-id para resolver el ID de la estación
    try:
        station_id = stations.resolver_calle_id(req.estacion)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    # Llama al script de la calculadora para realizar el cálculo predictivo
    try:
        resultado = calculadora.ejecutar_prediccion(station_id, req.fecha_solicitada)
        return resultado
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=f"Error al calcular la predicción: {str(e)}")
