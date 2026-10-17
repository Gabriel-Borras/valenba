import pandas as pd
import numpy as np
import requests
import time

# Caché en memoria para no saturar la API del clima
cache_clima = {
    "datos": None,
    "timestamp": 0
}


def _construir_df_difuso(fecha_exacta, temp_prevista: float, lluvia_prevista: float) -> pd.DataFrame:
    """Aplica la lógica difusa de temperatura y precipitación y construye el DataFrame para Prophet."""
    temp_prevista = float(temp_prevista if temp_prevista is not None else 20.0)
    lluvia_prevista = float(lluvia_prevista if lluvia_prevista is not None else 0.0)

    peso_lluvia_debil = np.interp(lluvia_prevista, [0.0, 0.1, 1.5, 2.5], [0.0, 1.0, 1.0, 0.0])
    peso_lluvia_moderada = np.interp(lluvia_prevista, [1.5, 2.5, 4.0, 5.5], [0.0, 1.0, 1.0, 0.0])
    peso_lluvia_fuerte = np.interp(lluvia_prevista, [4.0, 5.5, 100.0], [0.0, 1.0, 1.0])

    peso_temp_fria = np.interp(temp_prevista, [5.0, 10.0, 16.0], [1.0, 1.0, 0.0])
    peso_temp_ideal = np.interp(temp_prevista, [12.0, 18.0, 24.0, 28.0], [0.0, 1.0, 1.0, 0.0])
    peso_temp_calor = np.interp(temp_prevista, [24.0, 30.0, 45.0], [0.0, 1.0, 1.0])

    return pd.DataFrame({
        'ds': [fecha_exacta],
        'temp': [round(temp_prevista, 1)],
        'prec': [round(lluvia_prevista, 2)],
        'peso_lluvia_debil': [round(float(peso_lluvia_debil), 2)],
        'peso_lluvia_moderada': [round(float(peso_lluvia_moderada), 2)],
        'peso_lluvia_fuerte': [round(float(peso_lluvia_fuerte), 2)],
        'peso_temp_fria': [round(float(peso_temp_fria), 2)],
        'peso_temp_ideal': [round(float(peso_temp_ideal), 2)],
        'peso_temp_calor': [round(float(peso_temp_calor), 2)]
    })


def preparar_datos_prediccion(fecha_usuario):
    """
    Busca la previsión del tiempo para una fecha futura, aplica la lógica
    difusa y devuelve el formato exacto que necesita Prophet.
    Incluye validación estricta de respuesta de Open-Meteo y fallback automático
    para que un error 503 externo nunca bloquee la inferencia del modelo Prophet.
    """
    fecha_exacta = pd.to_datetime(fecha_usuario)
    fecha_objetivo = fecha_exacta.floor('h')

    ahora = time.time()
    respuesta = None

    # 1. Intentar usar caché válida o consultar Open-Meteo
    if (
        cache_clima["datos"] is not None
        and isinstance(cache_clima["datos"], dict)
        and "hourly" in cache_clima["datos"]
        and (ahora - cache_clima["timestamp"]) <= 600
    ):
        respuesta = cache_clima["datos"]
    else:
        url = (
            "https://api.open-meteo.com/v1/forecast"
            "?latitude=39.4697&longitude=-0.3774"
            "&hourly=apparent_temperature,precipitation,wind_speed_10m"
            "&timezone=Europe%2FMadrid"
        )
        try:
            r = requests.get(
                url,
                headers={"User-Agent": "ValenbaPredictor/3.0"},
                timeout=3.5
            )
            if r.status_code == 200:
                datos_json = r.json()
                if isinstance(datos_json, dict) and "hourly" in datos_json and "time" in datos_json["hourly"]:
                    cache_clima["datos"] = datos_json
                    cache_clima["timestamp"] = ahora
                    respuesta = datos_json
        except Exception:
            pass

        # Si Open-Meteo devolvió 503 o falló, reutilizar caché previa si era válida
        if respuesta is None and isinstance(cache_clima["datos"], dict) and "hourly" in cache_clima["datos"]:
            respuesta = cache_clima["datos"]

    # 2. Si tenemos datos horarios válidos de Open-Meteo, extraer la hora solicitada
    if respuesta is not None and "hourly" in respuesta:
        try:
            tiempos_api = pd.to_datetime(respuesta['hourly']['time'])
            if fecha_objetivo <= tiempos_api[0]:
                indice = 0
            elif fecha_objetivo >= tiempos_api[-1]:
                indice = len(tiempos_api) - 1
            else:
                diferencias = (tiempos_api - fecha_objetivo).abs()
                indice = int(diferencias.argmin())

            temp_prevista = respuesta['hourly']['apparent_temperature'][indice]
            lluvia_prevista = respuesta['hourly']['precipitation'][indice]
            return _construir_df_difuso(fecha_exacta, temp_prevista, lluvia_prevista)
        except Exception:
            pass

    # 3. Fallback secundario: curva térmica mediterránea de Valencia según mes y hora del día
    mes = fecha_exacta.month
    hora = fecha_exacta.hour + fecha_exacta.minute / 60.0
    temp_media_mes = {
        1: 12.0, 2: 13.0, 3: 15.5, 4: 17.5, 5: 20.5, 6: 24.5,
        7: 27.5, 8: 28.0, 9: 25.0, 10: 21.0, 11: 16.0, 12: 13.0
    }.get(mes, 20.0)
    oscilacion_diaria = -3.5 * np.cos(2 * np.pi * (hora - 4.0) / 24.0)
    temp_estimada = temp_media_mes + oscilacion_diaria

    return _construir_df_difuso(fecha_exacta, float(temp_estimada), 0.0)



