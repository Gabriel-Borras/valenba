import pandas as pd
import numpy as np

# 1. Cargar el dataset crudo
archivo_entrada = "Meteorologia/CSVclimaExtra.csv"
df = pd.read_csv(archivo_entrada)

df['peso_lluvia_debil'] = np.interp(df['Precipitation (mm)'], [0.0, 0.1, 1.5, 2.5], [0.0, 1.0, 1.0, 0.0])
df['peso_lluvia_moderada'] = np.interp(df['Precipitation (mm)'], [1.5, 2.5, 4.0, 5.5], [0.0, 1.0, 1.0, 0.0])
df['peso_lluvia_fuerte'] = np.interp(df['Precipitation (mm)'], [4.0, 5.5, 100.0], [0.0, 1.0, 1.0])

# 4. Calcular Lógica Difusa - VIENTO
df['peso_viento_flojo'] = np.interp(df['Wind_speed_10m (km/h)'], [0.0, 10.0, 15.0], [1.0, 1.0, 0.0])
df['peso_viento_moderado'] = np.interp(df['Wind_speed_10m (km/h)'], [10.0, 15.0, 20.0, 25.0], [0.0, 1.0, 1.0, 0.0])
df['peso_viento_fuerte'] = np.interp(df['Wind_speed_10m (km/h)'], [20.0, 25.0, 200.0], [0.0, 1.0, 1.0])
# 1. TEMPERATURA FRÍA (Bajo confort por frío)
# 100% peso hasta los 10 grados, baja hasta morir en los 16.
df['peso_temp_fria'] = np.interp(df['apTemp'], [5.0, 10.0, 16.0], [1.0, 1.0, 0.0])

# 2. TEMPERATURA IDEAL (Máximo uso de la bici)
# Sube desde 12, es perfecta entre 18 y 26, cae hacia los 30.
df['peso_temp_ideal'] = np.interp(df['apTemp'], [12.0, 18.0, 24.0, 28.0], [0.0, 1.0, 1.0, 0.0])

# 3. TEMPERATURA CALOR (Bajo confort por calor/sudor)
# Empieza a asomar a los 26, a los 32 ya es peso máximo.
df['peso_temp_calor'] = np.interp(df['apTemp'], [24.0, 30.0, 45.0], [0.0, 1.0, 1.0])

# IMPORTANTE: Redondeo para evitar los decimales infinitos (el error que vimos)
cols_temp = ['peso_temp_fria', 'peso_temp_ideal', 'peso_temp_calor']
df[cols_temp] = df[cols_temp].round(2)

# El parámetro float_format='%.2f' obliga a Python a escribir SOLO 2 decimales en el texto del CSV
df.to_csv("Meteo_Extra_sinresample.csv", index=False)