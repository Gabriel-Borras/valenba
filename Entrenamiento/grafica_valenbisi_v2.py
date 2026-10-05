import pandas as pd
import numpy as np
import pickle
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import os
import warnings
import holidays

warnings.filterwarnings('ignore')

# GENERAMOS EL CALENDARIO DE FESTIVOS DE VALENCIA
calendario_valencia = holidays.country_holidays('ES', subdiv='VC', years=[2023, 2024, 2025, 2026])

# ─────────────────────────────────────────────
#  FUNCIÓN DE BACK-TRANSFORM (logit → bicis)
# ─────────────────────────────────────────────
def back_transform(series_logit, cap, floor, eps):
    cap_adj = cap + 2 * eps  # debe coincidir con el forward transform del entrenador
    p = 1.0 / (1.0 + np.exp(-series_logit))
    return np.clip(p * cap_adj - eps, floor, cap)


print("\n" + "="*50)
print("📈 VISUALIZADOR DIARIO VALENBISI v2")
print("="*50)

estacion = input("👉 ¿Qué estación quieres visualizar? (ej: 110): ")
fecha    = input("👉 ¿Qué día? (YYYY-MM-DD, ej: 2026-05-15): ")

archivo_pkl = f'modelo_prophet_estacion{estacion}_meta.pkl'

if not os.path.exists(archivo_pkl):
    print(f"\n❌ Error: No se encuentra '{archivo_pkl}'.")
    print("   Asegúrate de haber entrenado primero con el entrenador v2.")
else:
    with open(archivo_pkl, 'rb') as f:
        meta = pickle.load(f)

    modelo = meta['modelo']
    cap    = meta['cap_fisico']
    floor  = meta['floor_fisico']
    eps    = meta['epsilon']

    # ── Dataframe con cada 15 min del día ──────────────────────────────
    fechas = pd.date_range(start=f"{fecha} 00:00:00",
                           end=f"{fecha} 23:45:00", freq='15min')
    futuro = pd.DataFrame({'ds': fechas})

    # ── Regresores cíclicos de hora ────────────────────────────────────
    hora = futuro['ds'].dt.hour + futuro['ds'].dt.minute / 60.0
    futuro['hora_sin'] = np.sin(2 * np.pi * hora / 24.0)
    futuro['hora_cos'] = np.cos(2 * np.pi * hora / 24.0)

    # ── Regresores de clima en "neutro" (día despejado, 20ºC) ──────────
    # Puedes cambiar estos valores para simular distintos climas
    temp_neutra   = 20.0

    lluvia_neutra = 0.0

    futuro['peso_lluvia_debil']    = np.interp(lluvia_neutra, [0.0,0.1,1.5,2.5], [0.0,1.0,1.0,0.0])
    futuro['peso_lluvia_moderada'] = np.interp(lluvia_neutra, [1.5,2.5,4.0,5.5], [0.0,1.0,1.0,0.0])
    futuro['peso_lluvia_fuerte']   = np.interp(lluvia_neutra, [4.0,5.5,100.0],   [0.0,1.0,1.0])
    futuro['peso_temp_fria']       = np.interp(temp_neutra,   [5.0,10.0,16.0],   [1.0,1.0,0.0])
    futuro['peso_temp_ideal']      = np.interp(temp_neutra,   [12.0,18.0,24.0,28.0],[0.0,1.0,1.0,0.0])
    futuro['peso_temp_calor']      = np.interp(temp_neutra,   [24.0,30.0,45.0],  [0.0,1.0,1.0])

    # Añadir al futuro si es laborable o no
    # Creamos los filtros 
    
    es_entresemana = futuro['ds'].dt.dayofweek < 5
    es_festivo = futuro['ds'].dt.date.apply(lambda fecha: fecha in calendario_valencia)
    futuro['es_laborable'] = es_entresemana & ~es_festivo
    futuro['es_fiesta'] = ~futuro['es_laborable']




    print("⏳ Generando predicción...")
    prediccion = modelo.predict(futuro)

    # ── Back-transform: logit → bicis reales ──────────────────────────
    prediccion['bicis']       = back_transform(prediccion['yhat'],       cap, floor, eps)
    prediccion['bicis_lower'] = back_transform(prediccion['yhat_lower'], cap, floor, eps)
    prediccion['bicis_upper'] = back_transform(prediccion['yhat_upper'], cap, floor, eps)

    # ── Gráfica ────────────────────────────────────────────────────────
    fig, ax = plt.subplots(figsize=(13, 6))

    ax.plot(prediccion['ds'], prediccion['bicis'],
            color='#1f77b4', linewidth=2.5, label='Predicción de bicicletas')

    ax.fill_between(prediccion['ds'],
                    prediccion['bicis_lower'],
                    prediccion['bicis_upper'],
                    color='#1f77b4', alpha=0.2, label='Margen de incertidumbre')

    # Líneas de referencia para los extremos físicos
    ax.axhline(y=cap,   color='green', linewidth=1, linestyle='--', alpha=0.6, label=f'Capacidad máxima ({cap})')
    ax.axhline(y=floor, color='red',   linewidth=1, linestyle='--', alpha=0.6, label='Vacía (0)')

    ax.set_title(f'🚲 Predicción Valenbisi — Estación {estacion}   |   {fecha}', fontsize=15)
    ax.set_xlabel('Hora del día', fontsize=12)
    ax.set_ylabel('Bicicletas disponibles', fontsize=12)
    ax.set_ylim(-1, cap + 3)
    ax.grid(True, linestyle='--', alpha=0.5)
    ax.legend(loc='upper right')

    ax.xaxis.set_major_formatter(mdates.DateFormatter('%H:%M'))
    ax.xaxis.set_major_locator(mdates.HourLocator(interval=2))
    plt.xticks(rotation=30)

    plt.tight_layout()
    plt.show()

    # ── Resumen numérico en consola ────────────────────────────────────
    print(f"\n📊 Resumen del día {fecha} — Estación {estacion}")
    print(f"   Máximo predicho:  {prediccion['bicis'].max():.1f} bicis  ({prediccion.loc[prediccion['bicis'].idxmax(), 'ds'].strftime('%H:%M')})")
    print(f"   Mínimo predicho:  {prediccion['bicis'].min():.1f} bicis  ({prediccion.loc[prediccion['bicis'].idxmin(), 'ds'].strftime('%H:%M')})")
    print(f"   Media del día:    {prediccion['bicis'].mean():.1f} bicis")