import pandas as pd

# 1. Cargar tu dataset
df = pd.read_csv("Meteo_Extra_sinresample.csv")

# 2. Modificar la columna 'ds' (que es la que tiene las fechas en tu archivo)
# Esto estandariza el formato (quita las 'T')
df['ds'] = pd.to_datetime(df['ds'], errors='coerce', format='mixed')

# 3. Limpieza técnica obligatoria (para evitar colapsos al estirar el tiempo)
df = df.dropna(subset=['ds'])
df = df.drop_duplicates(subset=['ds'], keep='first')

# 4. Establecer 'ds' como índice temporal
df = df.set_index('ds')

# 5. Hacer el resample cada 15 minutos
# Solo asfreq() = Las filas intermedias se quedan con valores NaN (vacías)
df_15min = df.resample('15min').asfreq()

# 6. Sacar la fecha del índice para recuperarla como columna
df_15min = df_15min.reset_index()

# 7. Guardar el archivo final
df_15min.to_csv("Meteo_Valencia_15min_Vacios_Extra.csv", index=False)

# Ver las primeras 5 filas para comprobar que funciona
print(df_15min.head(5))