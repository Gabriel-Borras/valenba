import pandas as pd
import glob
import os
import holidays

# --- 1. CONFIGURACIÓN DE RUTAS Y BLACKLIST ---
carpeta_csvs = r"C:\Users\04gab\OneDrive - UPV\Escritorio\PR1\CSV" 
archivo_clima = r'C:\Users\04gab\OneDrive - UPV\Escritorio\PR1\Meta-actual\pruebas gabi\Meteo_Valencia_Definitivo_Todos.csv' 
carpeta_salida = 'Datasets_Listos_Prophet'

# 🛑 ESTACIONES A IGNORAR DESDE EL PRINCIPIO (Blacklist)
ESTACIONES_EXCLUIDAS = [105, 146, 168, 299]  # Estaciones rotas, modificadas o inexistentes en este momento

# GENERAMOS EL CALENDARIO DE FESTIVOS DE VALENCIA
calendario_valencia = holidays.country_holidays('ES', subdiv='VC', years=[2023, 2024, 2025, 2026])

# --- 2. CARGAR DATOS METEOROLÓGICOS ---
print("Cargando datos del tiempo...")
if not os.path.exists(archivo_clima):
    print(f"❌ Error: No se encuentra el archivo {archivo_clima}")
    exit()

df_tiempo = pd.read_csv(archivo_clima) 
df_tiempo['ds'] = pd.to_datetime(df_tiempo['ds'])
df_tiempo = df_tiempo.sort_values('ds')


# --- 3. LEER TODOS LOS CSV DE VALENBISI ---
archivos = glob.glob(os.path.join(carpeta_csvs, '**', '*.csv'), recursive=True)

print(f"\nSe han encontrado {len(archivos)} archivos CSV.")
print("Extrayendo datos a la RAM (Con blindaje anticolumnas definitivo)...")

lista_dfs = []
archivos_con_error = 0
errores_mostrados = 0 

for idx, archivo in enumerate(archivos):
    # Feedback visual cada 5000 archivos
    if idx % 5000 == 0 and idx > 0:
        print(f"-> Leídos {idx} de {len(archivos)} archivos... (Errores silenciados: {archivos_con_error})")
        
    try:
        try:
            df_temp = pd.read_csv(archivo, sep=';', on_bad_lines='skip', low_memory=False)
        except UnicodeDecodeError:
            df_temp = pd.read_csv(archivo, sep=';', encoding='latin-1', on_bad_lines='skip', low_memory=False)
            
        if len(df_temp.columns) == 1:
            try:
                df_temp = pd.read_csv(archivo, sep=',', on_bad_lines='skip', low_memory=False)
            except UnicodeDecodeError:
                df_temp = pd.read_csv(archivo, sep=',', encoding='latin-1', on_bad_lines='skip', low_memory=False)
            
        df_temp.columns = df_temp.columns.str.strip().str.lower()
        
        # --- EL NUEVO DETECTOR DE COLUMNAS (A PRUEBA DE BALAS) ---
        col_estacion = next((col for col in df_temp.columns if any(p in col for p in ['numero', 'number_'])), None)
        col_fecha = next((col for col in df_temp.columns if any(p in col for p in ['fecha', 'update', 'timestamp'])), None)
        col_bicis = next((col for col in df_temp.columns if any(p in col for p in ['disponible', 'available', 'libres'])), None)
        
        # ¡AQUÍ ESTABA EL FALLO! Añadimos 'totales' y 'espacios' a la búsqueda
        col_total = next((col for col in df_temp.columns if any(p in col for p in ['plazas', 'total', 'totales', 'espacios_totales', 'capacity'])), None)
        
        if col_estacion and col_fecha and col_bicis and col_total:
            # Extraemos todo de golpe
            df_limpio = df_temp[[col_estacion, col_fecha, col_bicis, col_total]].copy()
            df_limpio.columns = ['estacion', 'ds', 'y', 'cap']
            
            # Filtramos la Lista Negra
            df_limpio = df_limpio[~df_limpio['estacion'].isin(ESTACIONES_EXCLUIDAS)]
            
            lista_dfs.append(df_limpio)
        else:
            archivos_con_error += 1
            if errores_mostrados < 5:
                print(f"⚠️ AVISO: Archivo descartado. Falta alguna columna vital.")
                print(f"   Columnas detectadas: {list(df_temp.columns)}")
                errores_mostrados += 1
            
    except Exception:
        archivos_con_error += 1


# --- 4. ENSAMBLAJE Y FILTRADO ---
print("\nUniendo datos y limpiando fechas...")
if not lista_dfs:
    print("❌ Error fatal: No se pudo extraer ningún dato.")
    exit()

df_maestro = pd.concat(lista_dfs, ignore_index=True)

# Parseo de fechas blindado
df_maestro['ds'] = pd.to_datetime(df_maestro['ds'], dayfirst=True, format='mixed', errors='coerce', utc=True)
df_maestro['ds'] = df_maestro['ds'].dt.tz_localize(None)


# 
# Borramos los errores (fechas corruptas)
df_maestro = df_maestro.dropna(subset=['ds'])

# 🚨 AQUÍ ESTÁ EL CAMBIO: Ampliamos el historial a Enero de 2023
df_maestro = df_maestro[df_maestro['ds'] >= '2023-01-01']

print(f"📉 Filas listas para empaquetar: {len(df_maestro)}")

# AÑADIR COLUMNAS LABORABLE O FIN DE SEMANA.

#generamos filtros
print("📅 Calculando días laborables y festivos...")
es_entresemana = df_maestro['ds'].dt.dayofweek < 5
es_festivo = df_maestro['ds'].dt.date.apply(lambda fecha: fecha in calendario_valencia)
df_maestro['es_laborable'] = es_entresemana & ~es_festivo
df_maestro['es_fiesta'] = ~df_maestro['es_laborable']


# --- 5. GENERAR ARCHIVOS POR ESTACIÓN ---
os.makedirs(carpeta_salida, exist_ok=True)
estaciones_unicas = df_maestro['estacion'].dropna().unique()

print(f"\nProcesando {len(estaciones_unicas)} estaciones limpias (Lista negra excluida)...")

for est in estaciones_unicas:
    df_est = df_maestro[df_maestro['estacion'] == est].copy()
    df_est = df_est.sort_values('ds').drop_duplicates(subset=['ds'])
    df_est['floor'] = 0
    
    # Cruce con el clima por cercanía de tiempo (merge_asof)
    df_final = pd.merge_asof(
        df_est, 
        df_tiempo, 
        on='ds', 
        direction='backward',
        tolerance=pd.Timedelta('15min')
    )
    
    # Guardar
    nombre_archivo = os.path.join(carpeta_salida, f'prophet_estacion_{int(est)}_completo.csv')
    df_final.drop(columns=['estacion']).to_csv(nombre_archivo, index=False)

print(f"\n✅ ¡PROCESO COMPLETADO! Los datasets están en la carpeta: {carpeta_salida}")
