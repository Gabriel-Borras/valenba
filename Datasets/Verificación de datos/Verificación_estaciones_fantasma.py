import os
import pandas as pd
from datetime import date, timedelta

# 1. Tu ruta exacta
ruta_carpeta = r"C:/Users/User/OneDrive - UPV/Escritorio/PR1    2ndo cuatri 1 carrera/valenbici-master/valenbici-master"

# 2. Fechas de inicio y fin
fecha_inicio = date(2023, 9, 1)
fecha_fin = date(2025, 9, 1)

def obtener_estaciones_del_dia(fecha_str):
    ruta_dia = os.path.join(ruta_carpeta, fecha_str)
    if not os.path.exists(ruta_dia): return None
        
    try:
        archivos_csv = [f for f in os.listdir(ruta_dia) if f.endswith('.csv')]
        if not archivos_csv: return None
            
        ruta_archivo = os.path.join(ruta_dia, archivos_csv[0])
        # Separador punto y coma, como vimos en tu archivo
        df = pd.read_csv(ruta_archivo, sep=';')
        return set(df['Numero'].dropna().unique())
    except Exception:
        return None

print("Analizando los 2 años de datos para encontrar altas y bajas definitivas...")
print("Esto tomará un minuto...\n")

fecha_actual = fecha_inicio
fechas_validas_procesadas = []

# Diccionario mágico. Formato: {numero_estacion: {'primera': fecha, 'ultima': fecha}}
historial = {}

# RECORRIDO DE TODOS LOS DÍAS
while fecha_actual <= fecha_fin:
    fecha_str = fecha_actual.strftime("%d-%m-%Y")
    estaciones_hoy = obtener_estaciones_del_dia(fecha_str)
    
    if estaciones_hoy is not None:
        fechas_validas_procesadas.append(fecha_actual)
        
        for est in estaciones_hoy:
            if est not in historial:
                # Si es la primera vez que vemos esta estación, lo anotamos
                historial[est] = {'primera': fecha_actual, 'ultima': fecha_actual}
            else:
                # Si ya la conocíamos, actualizamos su último día de vida al actual
                historial[est]['ultima'] = fecha_actual
                
    fecha_actual += timedelta(days=1)

# ANÁLISIS DE RESULTADOS
if not fechas_validas_procesadas:
    print("Error: No se leyeron datos. Comprueba la ruta.")
else:
    # Obtenemos cuál fue el primer y el último día que realmente tuvimos datos
    primer_dia_dataset = fechas_validas_procesadas[0]
    ultimo_dia_dataset = fechas_validas_procesadas[-1]

    estaciones_eliminadas = []
    estaciones_añadidas = []

    for est, datos in historial.items():
        # Si su primera aparición fue DESPUÉS del inicio del dataset -> FUE AÑADIDA
        if datos['primera'] > primer_dia_dataset:
            estaciones_añadidas.append((est, datos['primera']))
        
        # Si su última aparición fue ANTES del final del dataset -> FUE ELIMINADA
        if datos['ultima'] < ultimo_dia_dataset:
            estaciones_eliminadas.append((est, datos['ultima']))

    # Ordenamos cronológicamente
    estaciones_añadidas.sort(key=lambda x: x[1])
    estaciones_eliminadas.sort(key=lambda x: x[1])

    # IMPRESIÓN POR CONSOLA
    print("="*60)
    print("🟢 ESTACIONES AÑADIDAS (Nuevas altas en el sistema)")
    print("="*60)
    if estaciones_añadidas:
        for est, fecha in estaciones_añadidas:
            print(f"➕ Estación {int(est):03d}: Inaugurada el {fecha.strftime('%d-%m-%Y')}")
    else:
        print("No se añadieron estaciones nuevas.")

    print("\n" + "="*60)
    print("❌ ESTACIONES ELIMINADAS (Bajas definitivas del sistema)")
    print("="*60)
    if estaciones_eliminadas:
        for est, fecha in estaciones_eliminadas:
            print(f"➖ Estación {int(est):03d}: Su último día activa fue el {fecha.strftime('%d-%m-%Y')}")
    else:
        print("No se eliminó ninguna estación.")

    # RESUMEN MATEMÁTICO (Para comprobar que todo cuadra)
    estaciones_al_inicio = len([e for e, d in historial.items() if d['primera'] == primer_dia_dataset])
    estaciones_al_final = len([e for e, d in historial.items() if d['ultima'] == ultimo_dia_dataset])
    
    print("\n" + "="*60)
    print("📊 BALANCE FINAL")
    print("="*60)
    print(f"Estaciones iniciales ({primer_dia_dataset.strftime('%d-%m-%Y')}): {estaciones_al_inicio}")
    print(f"Total estaciones añadidas: +{len(estaciones_añadidas)}")
    print(f"Total estaciones eliminadas: -{len(estaciones_eliminadas)}")
    print(f"--------------------------------------------------")
    print(f"Estaciones finales ({ultimo_dia_dataset.strftime('%d-%m-%Y')}):   {estaciones_al_final}")
    print("="*60)