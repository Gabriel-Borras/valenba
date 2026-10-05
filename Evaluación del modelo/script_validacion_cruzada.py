import os
import glob
import pickle
import numpy as np
import pandas as pd
from prophet.diagnostics import cross_validation
import logging

# Desactivar logs pesados de Prophet durante la validación cruzada
logging.getLogger('prophet').setLevel(logging.WARNING)

def sigmoid_back_transform(y_logit, cap, floor, eps):
    cap_adj = cap + 2 * eps
    p = 1.0 / (1.0 + np.exp(-y_logit))
    y_reconstruct = p * cap_adj - eps
    return np.clip(y_reconstruct, floor, cap)

def validacion_cruzada_rigurosa():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    carpeta_modelos = os.path.abspath(os.path.join(base_dir, '..', 'Entrenamiento', 'Modelos_Entrenados'))
    archivos_pkl = glob.glob(os.path.join(carpeta_modelos, "*_meta.pkl"))
    
    resultados = []
    
    print(f"Iniciando Validación Cruzada Rigurosa para {len(archivos_pkl)} estaciones.")
    print("⚠️ ATENCIÓN: Este proceso entrena cada modelo internamente varias veces. Tardará HORAS en completarse.\n")
    
    for i, archivo in enumerate(archivos_pkl, 1):
        try:
            with open(archivo, 'rb') as f:
                meta = pickle.load(f)
                
            m = meta['modelo']
            cap = meta['cap_fisico']
            floor = meta['floor_fisico']
            eps = meta['epsilon']
            estacion = meta['estacion']
            
            # Apagar incertidumbre para que la validación vaya 100 veces más rápido
            m.uncertainty_samples = 0
            
            print(f"[{i}/{len(archivos_pkl)}] Validando estación {estacion} (entrenando simulaciones históricas)...", flush=True)
            
            # Ejecutar validación cruzada nativa de Prophet.
            # Prophet coge la configuración exacta de 'm' (incluyendo regresores)
            # y re-entrena cortando los datos.
            # Ajustar 'initial', 'period' y 'horizon' a vuestro rango de datos real si es necesario.
            # Por defecto: 90 días de entrenamiento inicial, evalúa cada 30 días, horizonte de 7 días.
            df_cv = cross_validation(m, initial='90 days', period='30 days', horizon='7 days', parallel=None)
            
            # IMPORTANTE: df_cv contiene predicciones ('yhat') y reales ('y') generadas en espacio LOGIT.
            # Debemos aplicar el back-transform antes de calcular el error absoluto.
            y_real = sigmoid_back_transform(df_cv['y'].values, cap, floor, eps)
            y_pred = sigmoid_back_transform(df_cv['yhat'].values, cap, floor, eps)
            
            # Calculamos MAE y RMSE real global de todos los cortes
            mae = np.mean(np.abs(y_real - y_pred))
            rmse = np.sqrt(np.mean((y_real - y_pred)**2))
            
            resultados.append({
                'estacion': estacion,
                'Capacidad': int(cap),
                'CV_MAE_bicis': round(mae, 2),
                'CV_RMSE_bicis': round(rmse, 2),
                'estado': 'OK'
            })
            print(f"   ↳ OK! MAE validado: {mae:.2f} bicis.")
            
            # Guardamos iterativamente por si el script se corta a medias
            df_resultados = pd.DataFrame(resultados)
            ruta_resultados = os.path.abspath(os.path.join(base_dir, "Resultados_Evaluacion"))
            os.makedirs(ruta_resultados, exist_ok=True)
            df_resultados.to_csv(os.path.join(ruta_resultados, "metricas_cv_parcial.csv"), index=False)
            
        except Exception as e:
            print(f"   ↳ ❌ Error en {archivo}: {str(e)}")
            resultados.append({
                'estacion': archivo.split('estacion')[-1].split('_')[0],
                'Capacidad': None,
                'CV_MAE_bicis': None,
                'CV_RMSE_bicis': None,
                'estado': f'Error: {str(e)}'
            })
            
    # Guardado final
    df_resultados = pd.DataFrame(resultados)
    
    # Calcular y añadir fila de media global
    df_ok = df_resultados[df_resultados['estado'] == 'OK']
    if not df_ok.empty:
        fila_media = pd.DataFrame([{
            'estacion': 'MEDIA_GLOBAL',
            'Capacidad': round(df_ok['Capacidad'].mean(), 1),
            'CV_MAE_bicis': round(df_ok['CV_MAE_bicis'].mean(), 2),
            'CV_RMSE_bicis': round(df_ok['CV_RMSE_bicis'].mean(), 2),
            'estado': 'RESUMEN'
        }])
        df_resultados = pd.concat([fila_media, df_resultados], ignore_index=True)
        
    ruta_guardado = os.path.join(ruta_resultados, "metricas_validacion_cruzada_FINAL.csv")
    df_resultados.to_csv(ruta_guardado, index=False)
    
    print("\n" + "="*50)
    print(f"Validación Cruzada Completada.")
    print(f"Reporte guardado en: {ruta_guardado}")
    print("="*50)

if __name__ == "__main__":
    validacion_cruzada_rigurosa()
