"""
╔══════════════════════════════════════════════════════════════════════════════╗
║     ENTRENADOR VALENBISI v3 — MULTIPROCESSING (6 WORKERS)                  ║
║                                                                              ║
║  Versión paralela de Entrena_y_guarda.py.                                   ║
║  Entrena 6 estaciones simultáneamente usando los 8 núcleos del CPU.         ║
║  Solo genera archivos .pkl (sin JSON redundante).                           ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import pandas as pd
import numpy as np
from prophet import Prophet
import pickle
import os
import warnings
import time
from concurrent.futures import ProcessPoolExecutor, as_completed

warnings.filterwarnings('ignore')

# ─────────────────────────────────────────────
#  PARÁMETROS GLOBALES
# ─────────────────────────────────────────────
EPSILON = 0.5
NUM_WORKERS = 6  # Dejamos 2 núcleos libres para Windows

# Rutas (relativas al script)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RUTA_DATASETS = os.path.abspath(os.path.join(BASE_DIR, '..', 'Datasets', 'Datasets_Listos_Prophet'))
CARPETA_MODELOS = os.path.abspath(os.path.join(BASE_DIR, 'Modelos_Entrenados'))

# ─────────────────────────────────────────────
#  FUNCIONES DE TRANSFORMACIÓN
# ─────────────────────────────────────────────

def logit_transform(y, cap, floor, eps=EPSILON):
    rango = cap - floor
    y_clamped = np.clip(y, floor, cap)
    y_adj = y_clamped + eps
    cap_adj = cap + 2 * eps
    p = y_adj / cap_adj
    return np.log(p / (1.0 - p))


def agregar_regresores_ciclicos(df):
    hora = df['ds'].dt.hour + df['ds'].dt.minute / 60.0
    df = df.copy()
    df['hora_sin'] = np.sin(2 * np.pi * hora / 24.0)
    df['hora_cos'] = np.cos(2 * np.pi * hora / 24.0)
    return df


# ─────────────────────────────────────────────
#  FUNCIÓN DE ENTRENAMIENTO (1 estación)
#  Esta función se ejecuta en un proceso hijo
# ─────────────────────────────────────────────

def entrenar_estacion(estacion):
    """Entrena y guarda el modelo Prophet para una sola estación.
    Devuelve una tupla (estacion, éxito: bool, mensaje: str)."""
    try:
        archivo_csv = os.path.join(RUTA_DATASETS, f'prophet_estacion_{estacion}_completo.csv')
        archivo_pkl = os.path.join(CARPETA_MODELOS, f'modelo_prophet_estacion{estacion}_meta.pkl')

        if not os.path.exists(archivo_csv):
            return (estacion, False, "CSV no encontrado")

        # 1. CARGA Y LIMPIEZA
        df = pd.read_csv(archivo_csv)
        df['ds'] = pd.to_datetime(df['ds'])

        regresores_clima = [
            'peso_lluvia_debil', 'peso_lluvia_moderada', 'peso_lluvia_fuerte',
            'peso_temp_fria', 'peso_temp_calor', 'peso_temp_ideal'
        ]
        columnas_necesarias = ['y'] + regresores_clima
        df = df.dropna(subset=columnas_necesarias)

        CAP_FISICO = int(df['cap'].max()) if 'cap' in df.columns else 30
        FLOOR_FISICO = int(df['floor'].min()) if 'floor' in df.columns else 0

        # 2. TRANSFORMACIÓN LOGIT
        y_original_stats = df['y'].describe()
        df['y'] = logit_transform(df['y'], CAP_FISICO, FLOOR_FISICO)

        # 3. REGRESORES CÍCLICOS
        df = agregar_regresores_ciclicos(df)

        # 4. CONFIGURACIÓN DEL MODELO
        modelo = Prophet(
            growth='linear',
            changepoint_prior_scale=0.001,
            n_changepoints=10,
            seasonality_prior_scale=15.0,
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False,
            interval_width=0.90,
            uncertainty_samples=10000,
        )

        modelo.add_country_holidays(country_name='ES')
        modelo.add_regressor('hora_sin')
        modelo.add_regressor('hora_cos')
        for reg in regresores_clima:
            modelo.add_regressor(reg)
        modelo.add_seasonality(name='diaria_laborable', period=1, fourier_order=30, condition_name='es_laborable')
        modelo.add_seasonality(name='diaria_fiesta', period=1, fourier_order=10, condition_name='es_fiesta')

        # 5. ENTRENAMIENTO
        modelo.fit(df)

        # 6. GUARDADO (solo .pkl)
        meta = {
            'modelo': modelo,
            'cap_fisico': CAP_FISICO,
            'floor_fisico': FLOOR_FISICO,
            'epsilon': EPSILON,
            'estacion': estacion,
            'regresores_clima': regresores_clima,
            'regresores_ciclicos': ['hora_sin', 'hora_cos'],
            'transformacion': 'logit',
            'y_original_media': float(y_original_stats['mean']),
            'y_original_std': float(y_original_stats['std']),
        }
        with open(archivo_pkl, 'wb') as fpkl:
            pickle.dump(meta, fpkl)

        return (estacion, True, f"Cap={CAP_FISICO}, Registros={len(df)}")

    except Exception as e:
        return (estacion, False, str(e))


# ─────────────────────────────────────────────
#  MAIN — ORQUESTADOR PARALELO
# ─────────────────────────────────────────────

if __name__ == '__main__':
    os.makedirs(CARPETA_MODELOS, exist_ok=True)

    # Filtrar solo las estaciones que tienen CSV disponible
    estaciones = []
    for est in range(1, 277):
        csv_path = os.path.join(RUTA_DATASETS, f'prophet_estacion_{est}_completo.csv')
        if os.path.exists(csv_path):
            estaciones.append(est)

    total = len(estaciones)
    print(f"╔══════════════════════════════════════════════════════════╗")
    print(f"║  ENTRENAMIENTO PARALELO — {total} estaciones con {NUM_WORKERS} workers  ║")
    print(f"╚══════════════════════════════════════════════════════════╝")
    print(f"  📂 Datasets : {RUTA_DATASETS}")
    print(f"  📂 Modelos  : {CARPETA_MODELOS}\n")

    completadas = 0
    fallidas = []
    inicio = time.time()

    with ProcessPoolExecutor(max_workers=NUM_WORKERS) as executor:
        # Lanzar todas las tareas
        futuros = {executor.submit(entrenar_estacion, est): est for est in estaciones}

        # Recoger resultados conforme van terminando
        for futuro in as_completed(futuros):
            estacion, exito, mensaje = futuro.result()
            completadas += 1
            transcurrido = time.time() - inicio
            velocidad = completadas / transcurrido * 60  # estaciones/min

            if exito:
                print(f"  ✅ Estación {estacion:>3} OK  ({completadas}/{total})  "
                      f"[{transcurrido:.0f}s — {velocidad:.1f} est/min]  {mensaje}")
            else:
                fallidas.append((estacion, mensaje))
                print(f"  ❌ Estación {estacion:>3} FALLO  ({completadas}/{total})  → {mensaje}")

    # Resumen final
    duracion = time.time() - inicio
    minutos = int(duracion // 60)
    segundos = int(duracion % 60)

    print(f"\n{'='*60}")
    print(f"  🏁 ENTRENAMIENTO FINALIZADO en {minutos}m {segundos}s")
    print(f"  ✅ Exitosas : {total - len(fallidas)}")
    print(f"  ❌ Fallidas  : {len(fallidas)}")
    if fallidas:
        print(f"\n  Estaciones fallidas:")
        for est, msg in sorted(fallidas):
            print(f"    · Estación {est}: {msg}")
    print(f"{'='*60}")
