import pandas as pd
import numpy as np
import requests
import time

# Caché en memoria para no saturar la API del clima
cache_clima = {
    "datos": None,
    "timestamp": 0
}

def preparar_datos_prediccion(fecha_usuario):
    """
    Busca la previsión del tiempo para una fecha futura, aplica la lógica 
    difusa y devuelve el formato exacto que necesita Prophet.
    Formato de entrada esperado: 'YYYY-MM-DD HH:MM' (ej. '2026-04-20 18:00')
    """
    
    # 1. Convertimos el texto del usuario a un objeto de fecha oficial y redondeamos a la hora
    fecha_objetivo = pd.to_datetime(fecha_usuario).floor('h')
    
    # 2. Llamada a la API con caché de 10 minutos (600 segundos) y timeout de 5 segundos
    ahora = time.time()
    if cache_clima["datos"] is None or (ahora - cache_clima["timestamp"]) > 600:
        url = "https://api.open-meteo.com/v1/forecast?latitude=39.4697&longitude=-0.3774&hourly=apparent_temperature,precipitation,wind_speed_10m&timezone=Europe%2FMadrid"
        try:
            respuesta = requests.get(url, timeout=5).json()
            cache_clima["datos"] = respuesta
            cache_clima["timestamp"] = ahora
        except Exception as e:
            # Fallback a caché vieja si existe, si no relanzamos el error
            if cache_clima["datos"] is not None:
                respuesta = cache_clima["datos"]
            else:
                raise RuntimeError(f"Error de red con Open-Meteo: {e}")
    else:
        respuesta = cache_clima["datos"]
    
    # 3. BUSCADOR: Convertimos la lista de tiempos de la API a fechas y buscamos la nuestra
    tiempos_api = pd.to_datetime(respuesta['hourly']['time'])
    
    try:
        # Encontramos la posición (índice) exacta de la hora solicitada
        indice = tiempos_api.get_loc(fecha_objetivo)
    except KeyError:
        return "❌ Error: La fecha solicitada está fuera del rango de predicción de la API (máx 7 días)."

    # 4. Extraemos los datos brutos solo de esa posición
    temp_prevista = respuesta['hourly']['apparent_temperature'][indice]
    lluvia_prevista = respuesta['hourly']['precipitation'][indice]
    
    

    # 5. EL TRADUCTOR (Nuestra lógica difusa de siempre)
    peso_lluvia_debil = np.interp(lluvia_prevista, [0.0, 0.1, 1.5, 2.5], [0.0, 1.0, 1.0, 0.0])
    peso_lluvia_moderada = np.interp(lluvia_prevista, [1.5, 2.5, 4.0, 5.5], [0.0, 1.0, 1.0, 0.0])
    peso_lluvia_fuerte = np.interp(lluvia_prevista, [4.0, 5.5, 100.0], [0.0, 1.0, 1.0])

    peso_temp_fria = np.interp(temp_prevista, [5.0, 10.0, 16.0], [1.0, 1.0, 0.0])
    peso_temp_ideal = np.interp(temp_prevista,[12.0, 18.0, 24.0, 28.0], [0.0, 1.0, 1.0, 0.0])
    peso_temp_calor = np.interp(temp_prevista, [24.0, 30.0, 45.0], [0.0, 1.0, 1.0])

    # 6. EMPAQUETADO FINAL (Creando la fila para Prophet)
    # Convertimos al formato original del usuario (que podía incluir minutos como :15 o :30)
    fecha_exacta = pd.to_datetime(fecha_usuario)
    
    df_prediccion = pd.DataFrame({
        'ds': [fecha_exacta],
        'temp': [temp_prevista],
        'prec': [lluvia_prevista],
        'peso_lluvia_debil': [round(peso_lluvia_debil, 2)],
        'peso_lluvia_moderada': [round(peso_lluvia_moderada, 2)],
        'peso_lluvia_fuerte': [round(peso_lluvia_fuerte, 2)],
        'peso_temp_fria': [round(peso_temp_fria, 2)],
        'peso_temp_ideal': [round(peso_temp_ideal, 2)],
        'peso_temp_calor': [round(peso_temp_calor, 2)]
    })
    
    return df_prediccion


