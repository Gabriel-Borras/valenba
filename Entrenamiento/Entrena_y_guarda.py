"""
╔══════════════════════════════════════════════════════════════════════════════╗
║         ENTRENADOR VALENBISI v2 — ARQUITECTURA LOGIT-PROPHET               ║
║                                                                              ║
║  CAMBIOS CLAVE RESPECTO A LA VERSIÓN ANTERIOR:                              ║
║                                                                              ║
║  1. TRANSFORMACIÓN LOGIT de 'y'                                             ║
║     En lugar de predecir bicis directamente [0,30], transformamos           ║
║     la variable al espacio logit (-∞, +∞). Así Prophet puede predecir      ║
║     valores extremos SIN que la curva logística lo frene ni que la          ║
║     regularización gaussiana lo atraiga hacia la media.                     ║
║     Back-transform final con sigmoide → valores reales en [floor, cap].     ║
║                                                                              ║
║  2. REGRESORES CÍCLICOS DE HORA (sin/cos)                                  ║
║     Añadimos sin(2π·hora/24) y cos(2π·hora/24) como regresores.            ║
║     Esto da al modelo una "brújula horaria" explícita, complementando       ║
║     la estacionalidad Fourier y evitando que el perfil diario se aplaste.  ║
║                                                                              ║
║  3. GROWTH='linear' (eliminamos logistic)                                   ║
║     Con el logit en 'y', ya no necesitamos el growth logístico que          ║
║     aplana la curva. El crecimiento lineal con changepoint muy bajo          ║
║     mantiene la tendencia casi plana (lo que queremos en 2026).            ║
║                                                                              ║
║  4. GUARDADO EN DOS FORMATOS                                                ║
║     - JSON (Prophet nativo) para compatibilidad con código existente        ║
║     - Pickle con metadatos de transformación para predicciones correctas    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""
 
import pandas as pd
import numpy as np
from prophet import Prophet
from prophet.serialize import model_to_json
import json
import pickle
import os
import warnings
 
warnings.filterwarnings('ignore')
 
# ─────────────────────────────────────────────
#  PARÁMETROS GLOBALES
# ─────────────────────────────────────────────
# CAP y FLOOR se leen del dataset (cada estación tiene su propia capacidad)
EPSILON = 0.5   # Margen para evitar log(0); "0.5 bici imaginaria"
 
# ─────────────────────────────────────────────
#  FUNCIONES DE TRANSFORMACIÓN
# ─────────────────────────────────────────────
 
def logit_transform(y, cap, floor, eps=EPSILON):
    """
    Transforma y ∈ [floor, cap]  →  espacio real (-∞, +∞)
 
    Pasos:
      1. Añadir epsilon para evitar log(0) en los extremos físicos.
      2. Normalizar a proporción p ∈ (0, 1).
      3. Aplicar logit: log(p / (1-p)).
 
    El resultado es una serie sin límites donde Prophet puede moverse
    libremente con su maquinaria aditiva normal.
    """
    rango = cap - floor
    # Clamp defensivo: nunca salir del rango físico
    y_clamped = np.clip(y, floor, cap)
    # Mapeamos [floor, cap] → (eps, rango-eps) para evitar -inf/+inf
    y_adj = y_clamped + eps
    # cap_adj usa 2*eps: así cuando y=cap → p = (cap+eps)/(cap+2*eps) < 1
    # Si usáramos cap+eps, y=cap daría p=1.0 exacto → logit(1) = +inf
    cap_adj = cap + 2 * eps
    # Proporción en (0, 1) garantizado
    p = y_adj / cap_adj
    # Logit
    return np.log(p / (1.0 - p))
 
 
def sigmoid_back_transform(y_logit, cap, floor, eps=EPSILON):
    """
    Invierte la transformación logit:
      y_logit ∈ (-∞, +∞)  →  y_original ∈ [floor, cap]
 
    Usar esta función para convertir las predicciones de Prophet
    de vuelta a número de bicis reales.
    """
    cap_adj = cap + 2 * eps  # debe coincidir con la fórmula del forward transform
    # Sigmoide: 1 / (1 + e^-x)
    p = 1.0 / (1.0 + np.exp(-y_logit))
    y_reconstruct = p * cap_adj - eps
    # Clamp final a límites físicos reales
    return np.clip(y_reconstruct, floor, cap)
 
 
def agregar_regresores_ciclicos(df):
    """
    Añade sin y cos de la hora del día como regresores explícitos.
 
    Por qué funciona: La estacionalidad de Fourier de Prophet modela
    el patrón promedio sobre TODOS los días. Los regresores cíclicos
    permiten que el modelo tenga una señal directa de 'qué hora es ahora',
    complementando el Fourier con una señal más cruda y sin regularizar.
    """
    hora = df['ds'].dt.hour + df['ds'].dt.minute / 60.0
    df = df.copy()
    df['hora_sin'] = np.sin(2 * np.pi * hora / 24.0)
    df['hora_cos'] = np.cos(2 * np.pi * hora / 24.0)
    return df
 
 
# ─────────────────────────────────────────────
#  INICIO DEL SCRIPT
# ─────────────────────────────────────────────

 
 
# ruta_carpeta  = r'C:\Users\04gab\OneDrive - UPV\Escritorio\PR1\Datasets_Listos_Prophet'
# archivo_csv   = os.path.join(ruta_carpeta, f'prophet_estacion_{estacion}_completo.csv')
# archivo_json  = f'modelo_prophet_estacion{estacion}.json'
# archivo_pkl   = f'modelo_prophet_estacion{estacion}_meta.pkl'


base_dir = os.path.dirname(os.path.abspath(__file__))
ruta_carpeta = os.path.abspath(os.path.join(base_dir, '..', 'Datasets', 'Datasets_Listos_Prophet'))
carpeta_modelos = os.path.abspath(os.path.join(base_dir, 'Modelos_Entrenados'))
os.makedirs(carpeta_modelos, exist_ok=True) # Crea la carpeta si no existe

for estacion in range(1,277): # Las estaciones van numeradas de la 1 a la 266
    archivo_csv   = os.path.join(ruta_carpeta, f'prophet_estacion_{estacion}_completo.csv')
    # Dejamos esta línea preparada con la ruta de la carpeta:
    archivo_pkl   = os.path.join(carpeta_modelos, f'modelo_prophet_estacion{estacion}_meta.pkl')
    if not os.path.exists(archivo_csv):
        print(f"\n❌ Error: No se encuentra '{archivo_csv}'.")
    else:
        # ──────────────────────────────
        #  1. CARGA Y LIMPIEZA
        # ──────────────────────────────
        print(f"\n📥 Cargando datos de la estación {estacion}...")
        df = pd.read_csv(archivo_csv)
        df['ds'] = pd.to_datetime(df['ds'])

        regresores_clima = [
            'peso_lluvia_debil', 'peso_lluvia_moderada', 'peso_lluvia_fuerte',
            'peso_temp_fria', 'peso_temp_calor', 'peso_temp_ideal'
        ]

        columnas_necesarias = ['y'] + regresores_clima
        df = df.dropna(subset=columnas_necesarias)

        # ── Cap y floor dinámicos: cada estación tiene su propia capacidad ──
        CAP_FISICO   = int(df['cap'].max())   if 'cap'   in df.columns else 30
        FLOOR_FISICO = int(df['floor'].min())  if 'floor' in df.columns else 0
        print(f"   ✔ Registros válidos: {len(df):,}")
        print(f"   ✔ Capacidad de la estación: {FLOOR_FISICO} – {CAP_FISICO} bicis")
        
        

        # ──────────────────────────────
        #  2. TRANSFORMACIÓN LOGIT DE y
        # ──────────────────────────────
        print("\n🔄 Aplicando transformación logit a 'y'...")
        y_original_stats = df['y'].describe()
        print(f"   Estadísticas originales de y:\n{y_original_stats.to_string()}")

        df['y'] = logit_transform(df['y'], CAP_FISICO, FLOOR_FISICO)  

        y_logit_stats = df['y'].describe()
        print(f"\n   Estadísticas de y (espacio logit):\n{y_logit_stats.to_string()}")
        print("   → Ahora Prophet puede explorar libremente sin atracción hacia la media.")

        # ──────────────────────────────
        #  3. REGRESORES CÍCLICOS DE HORA
        # ──────────────────────────────
        print("\n⏰ Añadiendo regresores cíclicos de hora (sin/cos)...")
        df = agregar_regresores_ciclicos(df)

        # ──────────────────────────────
        #  4. CONFIGURACIÓN DEL MODELO
        # ──────────────────────────────
        print("\n⚙️  Configurando Prophet (modo logit, sin growth logístico)...")

        modelo = Prophet(
            # ─── GROWTH ────────────────────────────────────────────────────────
            # LINEAR, no logístico. La transformación logit ya gestiona los
            # límites [0, 30]. No queremos una segunda capa de saturación.
            growth='linear',

            # ─── TENDENCIA ──────────────────────────────────────────────────────
            # Muy rígida: no queremos que la tendencia explique el patrón diario
            # ni que se dispare en 2026 con datos nuevos.
            changepoint_prior_scale=0.001,
            n_changepoints=10,

            # ─── ESTACIONALIDAD ─────────────────────────────────────────────────
            # Prior más moderado que el anterior (35 era muy agresivo y generaba
            # ruido). En el espacio logit, los coeficientes ya son más "libres",
            # así que no necesitamos tanto empuje.
            seasonality_prior_scale=15.0,

            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False,   # La añadimos manualmente abajo (Fourier 20)

            # ─── INCERTIDUMBRE ──────────────────────────────────────────────────
            interval_width=0.90,
            uncertainty_samples=10000,
        )

        # A) Estacionalidad diaria manual — Fourier 20
        #    (Reducida desde 25: en espacio logit, coeficientes más libres
        #     → menos términos son suficientes y evitamos sobreajuste intradiario)
        #modelo.add_seasonality(name='daily', period=1, fourier_order=20)

        # B) Festivos España
        modelo.add_country_holidays(country_name='ES')

        # C) Regresores cíclicos de hora (la "brújula horaria" explícita)
        modelo.add_regressor('hora_sin')
        modelo.add_regressor('hora_cos')

        # D) Regresores difusos del clima
        for reg in regresores_clima:
            
            modelo.add_regressor(reg)
        
        # E) AÑADIR SEMANA O FINDE (Curvas Condicionales)

        # Curva con picos marcados para ir a clase o trabajar
        modelo.add_seasonality(name='diaria_laborable', period=1, fourier_order=30, condition_name='es_laborable')
        
        # Curva suave y relajada para domingos y festivos
        modelo.add_seasonality(name='diaria_fiesta', period=1, fourier_order=10, condition_name='es_fiesta')


        # ──────────────────────────────
        #  5. ENTRENAMIENTO
        # ──────────────────────────────
        print("\n⏳ Entrenando... (esto puede tardar 1-3 minutos)")
        modelo.fit(df)
        print("   ✔ Entrenamiento completado.")

        # ──────────────────────────────
        #  6. GUARDADO
        # ──────────────────────────────
        # archivo_json = f'modelo_prophet_estacion{estacion}.json'
        # archivo_pkl  = f'modelo_prophet_estacion{estacion}_meta.pkl'

        # Añadimos os.path.join para que use la carpeta configurada arriba
        archivo_pkl  = os.path.join(carpeta_modelos, f'modelo_prophet_estacion{estacion}_meta.pkl')

        # 6b) Pickle con metadatos de transformación
        #     ¡IMPORTANTE! Para hacer predicciones correctas necesitas saber
        #     los parámetros de transformación usados durante el entrenamiento.
        meta = {
            'modelo': modelo,
            'cap_fisico': CAP_FISICO,
            'floor_fisico': FLOOR_FISICO,
            'epsilon': EPSILON,
            'estacion': estacion,
            'regresores_clima': regresores_clima,
            'regresores_ciclicos': ['hora_sin', 'hora_cos'],
            'transformacion': 'logit',
            # Guardamos también las estadísticas para diagnóstico
            'y_original_media': float(y_original_stats['mean']),
            'y_original_std': float(y_original_stats['std']),
        }
        with open(archivo_pkl, 'wb') as fpkl:
            pickle.dump(meta, fpkl)

        print("\n" + "*"*60)
        print(f"  ✅ ¡ENTRENAMIENTO EXITOSO — Estación {estacion}!")
        print(f"  📁 Metadatos (.pkl) : '{archivo_pkl}'  ← NECESARIO para predecir")
        print("*"*60)


