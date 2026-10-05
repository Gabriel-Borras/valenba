import pandas as pd
import numpy as np

# 1. Cargar el dataset que acabas de crear (el que tiene los huecos vacíos)
df = pd.read_csv("Meteo_Valencia_15min_Vacios_Extra.csv")

# 2. Asegurarnos de que 'ds' es formato fecha
df['ds'] = pd.to_datetime(df['ds'])

# 3. INTERPOLACIÓN (Rellenar los vacíos trazando la línea matemática)
columnas_fisicas = ['apTemp', 'Precipitation (mm)', 'Wind_speed_10m (km/h)']
df[columnas_fisicas] = df[columnas_fisicas].interpolate(method='linear')

# 4. LÓGICA DIFUSA (Se calcula ahora que ya tenemos datos cada 15 min)
# Lluvia
df['peso_lluvia_debil'] = np.interp(df['Precipitation (mm)'], [0.0, 0.1, 0.5, 1.2], [0.0, 1.0, 1.0, 0.0])
df['peso_lluvia_moderada'] = np.interp(df['Precipitation (mm)'], [0.5, 1.2, 2.0, 3.0], [0.0, 1.0, 1.0, 0.0])
df['peso_lluvia_fuerte'] = np.interp(df['Precipitation (mm)'], [2.0, 3.0, 100.0], [0.0, 1.0, 1.0])

# Viento
df['peso_viento_flojo'] = np.interp(df['Wind_speed_10m (km/h)'], [0.0, 8.0, 15.0], [1.0, 1.0, 0.0])
df['peso_viento_moderado'] = np.interp(df['Wind_speed_10m (km/h)'], [8.0, 15.0, 20.0, 25.0], [0.0, 1.0, 1.0, 0.0])
df['peso_viento_fuerte'] = np.interp(df['Wind_speed_10m (km/h)'], [20.0, 25.0, 200.0], [0.0, 1.0, 1.0])

# Temperatura
df['peso_temp_fria'] = np.interp(df['apTemp'], [5.0, 10.0, 16.0], [1.0, 1.0, 0.0])
df['peso_temp_ideal'] = np.interp(df['apTemp'], [12.0, 18.0, 26.0, 30.0], [0.0, 1.0, 1.0, 0.0])
df['peso_temp_calor'] = np.interp(df['apTemp'], [26.0, 32.0, 45.0], [0.0, 1.0, 1.0])

# 5. REDONDEO (Cortar decimales para que Excel y Prophet no fallen)
cols_pesos = [c for c in df.columns if 'peso_' in c]
df[cols_pesos] = df[cols_pesos].round(2)
df[columnas_fisicas] = df[columnas_fisicas].round(2)

# 6. GUARDAR EL ARCHIVO FINAL Y DEFINITIVO
df.to_csv("Extra_Meteo_Valencia_15min_FINAL.csv", index=False, float_format='%.2f')

# Visualizar el resultado (verás cómo los minutos :15, :30 y :45 ya tienen datos)
print(df[['ds', 'apTemp', 'peso_temp_ideal']].head(6))