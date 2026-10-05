import pandas as pd
import numpy as np
import pickle
import os
import holidays
import warnings
from Solicitud_API import preparar_datos_prediccion
from Estaciones import STATIONS_METADATA

warnings.filterwarnings('ignore')

# Calendario de festivos de Valencia (Comunidad Valenciana)
calendario_valencia = holidays.country_holidays('ES', subdiv='VC', years=[2023, 2024, 2025, 2026, 2027])

# Funciones de back-transform actualizadas con la lógica magnética y corrección de sesgo
def back_transform(y_logit, cap, floor, eps):
    # Función original mantenida por si la web la importaba directamente
    cap_adj = cap + 2 * eps
    p = 1.0 / (1.0 + np.exp(-y_logit))
    return np.clip(p * cap_adj - eps, floor, cap)

def back_transform_raw(series_logit, cap, eps):
    cap_adj = cap + 2 * eps
    p = 1.0 / (1.0 + np.exp(-series_logit))
    return p * cap_adj - eps

def apply_magnetism(raw_bikes, cap, floor, threshold):
    # Atracción suave (resta porcentual) hacia el suelo
    curva_baja = raw_bikes * (raw_bikes / threshold)
    
    # Atracción suave hacia el techo
    dist_techo = cap - raw_bikes
    curva_alta = cap - (dist_techo * (dist_techo / threshold))
    
    bicis = np.where(raw_bikes < threshold, curva_baja, raw_bikes)
    bicis = np.where(bicis > cap - threshold, curva_alta, bicis)
    return np.clip(bicis, floor, cap)
from functools import lru_cache

# Caché en memoria limitada para evitar accesos repetidos a disco y fugas de RAM
@lru_cache(maxsize=20)
def obtener_modelo_prophet(station_id: int):
    """Carga y cachea el modelo Prophet (.pkl) de la estación desde Modelos_Entrenados"""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    archivo_pkl = os.path.abspath(os.path.join(base_dir, '..', 'Entrenamiento', 'Modelos_Entrenados', f'modelo_prophet_estacion{station_id}_meta.pkl'))
    
    if not os.path.exists(archivo_pkl):
        return None
        
    with open(archivo_pkl, 'rb') as f:
        meta = pickle.load(f)
        
    return meta
def ejecutar_prediccion(station_id: int, fecha_solicitada: str) -> dict:
    """
    Ejecuta el cálculo predictivo para la estación y fecha indicadas.
    Si la estación no cuenta con modelo entrenado, devuelve un fallback elegante.
    """
    # 1. Verificar si hay modelo entrenado en disco
    meta = obtener_modelo_prophet(station_id)
    
    if not meta:
        # Fallback para estaciones sin modelo: obtenemos solo clima y capacidad física
        try:
            fecha_consulta = pd.to_datetime(fecha_solicitada)
            # preparar_datos_prediccion nos da un DataFrame, extraemos temp y prec
            futuro = preparar_datos_prediccion(fecha_consulta)
            temp = float(futuro['temp'].iloc[0])
            prec = float(futuro['prec'].iloc[0])
        except Exception:
            temp, prec = 20.0, 0.0  # Valores neutros en caso de fallo de API meteorológica
            
        station_info = STATIONS_METADATA.get(station_id, {"name": f"Estación {station_id}", "cap": 30})
        return {
            "model_available": False,
            "bicicletas_disponibles": None,
            "yhat_lower": None,
            "yhat_upper": None,
            "cap": int(station_info["cap"]),
            "occupancy": None,
            "temp": temp,
            "prec": prec,
            "probabilidad_disponible": None,
            "name": station_info["name"]
        }
        
    # 2. Si el modelo existe, procedemos a realizar la predicción exacta (copiada de calculadora_valenbisi_v2.py)
    modelo = meta['modelo']
    cap = meta['cap_fisico']
    floor = meta['floor_fisico']
    eps = meta['epsilon']
    
    # Ajustamos muestras de incertidumbre para la velocidad de la API en web
    modelo.uncertainty_samples = 5000
    
    # Obtener predicciones del clima
    fecha_consulta = pd.to_datetime(fecha_solicitada)
    futuro = preparar_datos_prediccion(fecha_consulta)
    temp = float(futuro['temp'].iloc[0])
    prec = float(futuro['prec'].iloc[0])
    
    # Calcular regresores cíclicos de hora
    hora = fecha_consulta.hour + fecha_consulta.minute / 60.0
    hora_sin = np.sin(2 * np.pi * hora / 24.0)
    hora_cos = np.cos(2 * np.pi * hora / 24.0)
    
    futuro['hora_sin'] = hora_sin
    futuro['hora_cos'] = hora_cos
    
    # Calcular si es laborable o festivo
    es_entresemana = futuro['ds'].dt.dayofweek < 5
    es_festivo = futuro['ds'].dt.date.apply(lambda f: f in calendario_valencia)
    futuro['es_laborable'] = es_entresemana & ~es_festivo
    futuro['es_fiesta'] = ~futuro['es_laborable']
    
    # 1. Predicción base (Media Cruda) y corrección magnética
    futuro_pred = modelo.predict(futuro)
    media_cruda_logit = futuro_pred['yhat'].iloc[0]
    media_cruda_bicis = back_transform_raw(media_cruda_logit, cap, eps)
    
    # Imán principal: 25% de la capacidad
    media_corregida_bicis = apply_magnetism(media_cruda_bicis, cap, floor, threshold=cap * 0.25)
    
    # 2. Escala parabólica de incertidumbre (Heterocedasticidad)
    centro = cap / 2.0
    escala_base = (media_corregida_bicis * (cap - media_corregida_bicis)) / (centro * centro)
    escala = 0.5 + 0.5 * escala_base
    
    # 3. Realizar simulación de Montecarlo con Prophet
    simulaciones = modelo.predictive_samples(futuro)
    muestras_cruda_bicis = back_transform_raw(simulaciones['yhat'][0], cap, eps)
    
    # 4. Centrar, escalar y desplazar las muestras
    muestras_centradas = muestras_cruda_bicis - media_cruda_bicis
    muestras_escaladas = muestras_centradas * escala
    muestras_desplazadas = muestras_escaladas + media_corregida_bicis
    
    # 5. Clip físico y filtro de Bicis Fantasma (10% de la capacidad)
    muestras_finales = np.clip(muestras_desplazadas, floor, cap)
    muestras_finales = apply_magnetism(muestras_finales, cap, floor, threshold=cap * 0.10)
    
    media_bicis = float(muestras_finales.mean())
    limite_inf = float(np.percentile(muestras_finales, 10))
    limite_sup = float(np.percentile(muestras_finales, 90))
    
    # Éxito si hay bicis seguras (> 12% de la capacidad)
    exitos = int((muestras_finales >= cap * 0.12).sum())
    total_simulaciones = len(muestras_finales)
    probabilidad = float((exitos / total_simulaciones) * 100.0)
    
    station_info = STATIONS_METADATA.get(station_id, {"name": f"Estación {station_id}"})
    
    return {
        "model_available": True,
        "bicicletas_disponibles": float(round(media_bicis, 1)),
        "yhat_lower": float(round(limite_inf, 1)),
        "yhat_upper": float(round(limite_sup, 1)),
        "cap": int(cap),
        "occupancy": float((media_bicis / cap) * 100.0),
        "temp": temp,
        "prec": prec,
        "probabilidad_disponible": float(round(probabilidad, 1)),
        "name": station_info["name"]
    }