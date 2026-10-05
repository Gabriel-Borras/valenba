import pandas as pd
import glob
import os
import re
from collections import defaultdict

# ==============================================================================
# 1. CONFIGURACIÓN Y LISTAS DE EXCLUSIÓN (BLACKLIST)
# ==============================================================================
base_dir = os.path.dirname(os.path.abspath(__file__))
carpeta_csvs = os.path.abspath(os.path.join(base_dir, '..', 'Datasets_Listos_Prophet')) 

# 🛑 1. ESTACIONES A IGNORAR (En texto para buscar en el nombre del archivo)
ESTACIONES_EXCLUIDAS = ['105', '146', '168', '299']

# 🛑 2. FECHAS DEL SERVIDOR CAÍDO (En formato YYYY-MM-DD para Pandas)
fechas_a_ignorar = [
    "2023-09-02", "2023-09-05", "2023-09-07", "2023-09-09", "2023-09-25",
    "2023-10-02", "2023-10-05", "2023-10-09", "2023-10-15", "2023-10-27", "2023-10-29",
    "2023-11-20", "2023-11-22", "2023-12-01", "2023-12-04", "2023-12-11", "2023-12-18", "2023-12-22",
    "2024-01-02", "2024-01-05", "2024-01-08", "2024-01-17", "2024-01-20", "2024-01-22", "2024-01-27", "2024-01-29",
    "2024-02-21", "2024-02-26", "2024-03-08", "2024-03-13", "2024-03-17", "2024-03-18", "2024-03-19", "2024-03-21", "2024-03-25", "2024-03-31",
    "2024-04-04", "2024-04-08", "2024-04-10", "2024-04-13", "2024-04-18", "2024-04-22", "2024-04-24", "2024-04-30",
    "2024-05-05", "2024-05-07", "2024-05-14", "2024-05-31",
    "2024-06-03", "2024-06-14", "2024-06-25", "2024-06-28",
    "2024-07-24", "2024-08-17", "2024-08-29",
    "2024-09-02", "2024-09-06", "2024-10-05", "2024-10-14", "2024-10-20", "2024-10-26", "2024-11-20", "2024-12-16",
    "2025-02-03", "2025-04-29"
]
# Convertimos las fechas a un conjunto matemático real
dias_excluidos = set(pd.to_datetime(fechas_a_ignorar).date)

print("\n" + "="*60)
print("🔍 AUDITORÍA DE SALUD DE DATOS (CON FILTROS APLICADOS)")
print("="*60)

ruta_busqueda = os.path.join(carpeta_csvs, '**', '*.csv')
archivos = glob.glob(ruta_busqueda, recursive=True)

if not archivos:
    print("❌ No se han encontrado archivos CSV en la ruta especificada.")
    exit()

print(f"Analizando fechas en {len(archivos)} archivos. Descartando Blacklist...\n")

# ==============================================================================
# 2. LECTURA Y EXTRACCIÓN DE FECHAS
# ==============================================================================
dias_por_estacion = {}
registro_global_dias = set()

archivos_procesados = 0
estaciones_ignoradas = 0

for archivo in archivos:
    nombre_archivo = os.path.basename(archivo)
    
    # --- FILTRO 1: Ignorar las estaciones de la Lista Negra ---
    numeros_en_nombre = re.findall(r'\d+', nombre_archivo)
    if any(est in numeros_en_nombre for est in ESTACIONES_EXCLUIDAS):
        estaciones_ignoradas += 1
        continue
    
    try:
        col_fecha = 'ds' if 'ds' in pd.read_csv(archivo, nrows=0).columns else None
        
        if col_fecha:
            df = pd.read_csv(archivo, usecols=[col_fecha])
            df[col_fecha] = pd.to_datetime(df[col_fecha], errors='coerce')
            df = df.dropna(subset=[col_fecha])
            
            dias_unicos = set(df[col_fecha].dt.date)
            
            if dias_unicos:
                dias_por_estacion[nombre_archivo] = dias_unicos
                registro_global_dias.update(dias_unicos)
                archivos_procesados += 1
                
    except Exception:
        pass 

# ==============================================================================
# 3. EL CRUCE CONTRA EL CALENDARIO MAESTRO LIMPIO
# ==============================================================================
if not registro_global_dias:
    print("❌ No se pudo extraer ninguna fecha válida tras aplicar los filtros.")
    exit()

fecha_min = min(registro_global_dias)
fecha_max = max(registro_global_dias)

# Creamos el calendario total y le RESTAMOS los 65 días que sabemos que fallan
calendario_maestro_bruto = set(pd.date_range(start=fecha_min, end=fecha_max).date)
calendario_maestro = calendario_maestro_bruto - dias_excluidos

print(f"📅 Rango del Calendario: {fecha_min.strftime('%d/%m/%Y')} -> {fecha_max.strftime('%d/%m/%Y')}")
print(f"📅 Días totales en rango: {len(calendario_maestro_bruto)}")
print(f"🛡️ Días exigidos tras eliminar los {len(dias_excluidos)} del servidor caído: {len(calendario_maestro)}")
print(f"🚫 Estaciones de la lista negra ignoradas: {estaciones_ignoradas}")
print("-" * 60)

reporte_estaciones = {}
conteo_fallos_por_dia = defaultdict(int)
estaciones_perfectas = 0

for estacion, dias_registrados in dias_por_estacion.items():
    # Detectamos qué días del calendario limpio le faltan a esta estación
    dias_faltantes = sorted(list(calendario_maestro - dias_registrados))
    
    if not dias_faltantes:
        estaciones_perfectas += 1
    else:
        reporte_estaciones[estacion] = dias_faltantes
        for dia in dias_faltantes:
            conteo_fallos_por_dia[dia] += 1

# ==============================================================================
# 4. SALIDA DE RESULTADOS POR CONSOLA
# ==============================================================================
print(f"\n✅ Análisis completado. Estaciones con datos perfectos (tras filtros): {estaciones_perfectas} de {archivos_procesados}")

# --- RESULTADO A: Días que faltan por estación ---
print("\n" + "="*40)
print("1️⃣ DÍAS FALTANTES POR ESTACIÓN (Top 10 más afectadas)")
print("="*40)

if not reporte_estaciones:
    print("🎉 ¡Increíble! Ninguna estación tiene días faltantes.")
else:
    estaciones_ordenadas = sorted(reporte_estaciones.items(), key=lambda x: len(x[1]), reverse=True)
    
    for estacion, dias_perdidos in estaciones_ordenadas[:10]:
        fechas_str = ", ".join([d.strftime('%d/%m/%Y') for d in dias_perdidos[:5]])
        mas_dias = f"... (+{len(dias_perdidos)-5} días más)" if len(dias_perdidos) > 5 else ""
        print(f"📍 {estacion} -> Faltan {len(dias_perdidos)} días | Ej: {fechas_str} {mas_dias}")
    
    if len(estaciones_ordenadas) > 10:
        print(f"... y {len(estaciones_ordenadas) - 10} estaciones más con pérdidas.")

# --- RESULTADO B: Caídas masivas ---
print("\n" + "="*40)
print("2️⃣ NUEVAS CAÍDAS MASIVAS DETECTADAS (Top 15 peores días)")
print("="*40)

if not conteo_fallos_por_dia:
    print("🎉 No hay caídas masivas en las fechas restantes.")
else:
    dias_ordenados = sorted(conteo_fallos_por_dia.items(), key=lambda x: x[1], reverse=True)
    
    for dia, num_estaciones in dias_ordenados[:15]:
        porcentaje = (num_estaciones / archivos_procesados) * 100
        print(f"📅 {dia.strftime('%d/%m/%Y')} -> Faltan datos en {num_estaciones} estaciones ({porcentaje:.1f}%)")

    # Exportación
    df_reporte_masivo = pd.DataFrame(dias_ordenados, columns=['Fecha', 'Estaciones_Afectadas'])
    df_reporte_masivo.to_csv("Reporte_Caidas_Masivas_Limpio.csv", index=False)
    print("\n💾 Se ha guardado el reporte limpio en 'Reporte_Caidas_Masivas_Limpio.csv'")
print("="*60 + "\n")