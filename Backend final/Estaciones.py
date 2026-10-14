import json
import os
import re
import time
import threading
import requests

# Base y carga local inmediata de las 276 estaciones
base_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(base_dir, 'Datos_estaciones.json')

if os.path.exists(json_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        # Diccionario interno con IDs como enteros
        STATIONS_METADATA = {int(k): v for k, v in data.items()}
else:
    STATIONS_METADATA = {}

# Configuración de sincronización y caché inteligente en tiempo real
CITYBIKES_JCD_URL = "https://api.citybik.es/v2/networks/valenbisi"
VALENCIA_OPENDATA_URL = (
    "https://geoportal.valencia.es/server/rest/services/OPENDATA/Trafico/MapServer/228/query"
    "?where=1=1&outFields=*&f=geojson"
)
CACHE_TTL = 30  # 30 segundos para garantizar frescura en tiempo real

# Inicializamos la caché en memoria con las 276 estaciones locales (garantía de fallback inmediato y 0ms)
_cached_stations_list = sorted(list(STATIONS_METADATA.values()), key=lambda s: int(s['id']))
_last_cache_time = 0.0
_is_syncing = False
_lock = threading.Lock()

def _sincronizar_opendata():
    """
    Consulta en tiempo real los datos en directo de Valenbisi:
    1. Fuente primaria: Feed directo de JCDecaux (vía CityBikes API) que refleja la app oficial con 0 retraso.
    2. Fuente secundaria: GeoPortal del Ayuntamiento de Valencia (Open Data ArcGIS).
    3. Fallback: Datos_estaciones.json local sin bloquear.
    """
    global _cached_stations_list, _last_cache_time, _is_syncing, STATIONS_METADATA
    with _lock:
        if _is_syncing:
            return
        _is_syncing = True

    try:
        # Clonamos las 276 estaciones maestras
        nuevas_estaciones = {int(k): dict(v) for k, v in STATIONS_METADATA.items()}
        enriquecidas = 0
        sincronizado = False

        # --- INTENTO 1: CityBikes (JCDecaux Oficial en Directo) ---
        try:
            resp_jcd = requests.get(
                CITYBIKES_JCD_URL,
                headers={"User-Agent": "ValenbaPredictor/3.0 (https://valenba.app)"},
                timeout=3.5
            )
            if resp_jcd.status_code == 200:
                jcd_data = resp_jcd.json()
                stations_jcd = jcd_data.get("network", {}).get("stations", [])
                for st in stations_jcd:
                    uid = st.get("extra", {}).get("uid")
                    if uid is not None and str(uid).isdigit():
                        num = int(uid)
                        if num in nuevas_estaciones:
                            nuevas_estaciones[num]["currentBikes"] = int(st.get("free_bikes", 0))
                            nuevas_estaciones[num]["freeDocks"] = int(st.get("empty_slots", 0))
                            slots = st.get("extra", {}).get("slots")
                            if slots is not None:
                                try:
                                    slot_num = int(slots)
                                    if slot_num > 0:
                                        nuevas_estaciones[num]["cap"] = slot_num
                                except (ValueError, TypeError):
                                    pass
                            nuevas_estaciones[num]["isOpen"] = bool(st.get("extra", {}).get("renting", True))
                            nuevas_estaciones[num]["updatedAt"] = st.get("timestamp") or time.strftime("%Y-%m-%dT%H:%M:%SZ")
                            enriquecidas += 1
                if enriquecidas > 200:
                    sincronizado = True
                    print(f"[Estaciones] Sincronización exitosa con JCDecaux ({enriquecidas} estaciones en directo).")
        except Exception as e_jcd:
            print(f"[Estaciones] Aviso: JCDecaux feed temporalmente no disponible ({e_jcd}). Intentando Geoportal...")

        # --- INTENTO 2: Geoportal Ayuntamiento de Valencia (Fallback) ---
        if not sincronizado:
            try:
                resp = requests.get(
                    VALENCIA_OPENDATA_URL,
                    headers={"User-Agent": "ValenbaPredictor/3.0 (https://valenba.app)"},
                    timeout=3.5
                )
                if resp.status_code == 200:
                    geojson = resp.json()
                    features = geojson.get("features", [])
                    for feat in features:
                        props = feat.get("properties", {})
                        num = props.get("number")
                        if num is not None and str(num).isdigit():
                            num_int = int(num)
                            if num_int in nuevas_estaciones:
                                if "available" in props and props["available"] is not None:
                                    try:
                                        nuevas_estaciones[num_int]["currentBikes"] = int(props["available"])
                                    except (ValueError, TypeError):
                                        pass
                                if "total" in props and props["total"] is not None and int(props["total"]) > 0:
                                    try:
                                        nuevas_estaciones[num_int]["cap"] = int(props["total"])
                                    except (ValueError, TypeError):
                                        pass
                                if "free" in props and props["free"] is not None:
                                    try:
                                        nuevas_estaciones[num_int]["freeDocks"] = int(props["free"])
                                    except (ValueError, TypeError):
                                        pass
                                if "open" in props:
                                    nuevas_estaciones[num_int]["isOpen"] = (props["open"] == "T")
                                if "updated_at" in props:
                                    nuevas_estaciones[num_int]["updatedAt"] = str(props["updated_at"])
                                enriquecidas += 1
                    if enriquecidas > 200:
                        sincronizado = True
                        print(f"[Estaciones] Sincronización exitosa con Geoportal Valencia ({enriquecidas} estaciones).")
            except Exception as e_geo:
                print(f"[Estaciones] Aviso: Geoportal falló ({e_geo}).")

        if sincronizado:
            with _lock:
                _cached_stations_list = sorted(list(nuevas_estaciones.values()), key=lambda s: int(s["id"]))
                _last_cache_time = time.time()
                # Mantener STATIONS_METADATA siempre con la disponibilidad viva
                for sid, sinfo in nuevas_estaciones.items():
                    STATIONS_METADATA[sid] = sinfo
        else:
            with _lock:
                _last_cache_time = time.time() - (CACHE_TTL - 15)

    except Exception as e:
        print(f"[Estaciones] Error en sincronización: {e}")
        with _lock:
            _last_cache_time = time.time() - (CACHE_TTL - 15)
    finally:
        with _lock:
            _is_syncing = False

# Lanzar sincronización en segundo plano al importar el módulo
_init_thread = None
try:
    _init_thread = threading.Thread(target=_sincronizar_opendata, daemon=True)
    _init_thread.start()
except Exception:
    pass

def obtener_estaciones(forzar_sync: bool = False):
    """
    Devuelve la lista completa de las 276 estaciones de Valencia con sus coordenadas
    (lat, lng), id, name, address, cap, y currentBikes en tiempo real.
    """
    global _last_cache_time, _init_thread
    
    # En el arranque inicial, si el hilo de fondo sigue descargando, esperamos hasta 2s para servir datos reales
    if _last_cache_time == 0.0 and _init_thread and _init_thread.is_alive():
        _init_thread.join(timeout=2.0)

    ahora = time.time()
    necesita_actualizar = forzar_sync or (ahora - _last_cache_time > CACHE_TTL)
    
    # Si sigue sin sincronizar, intentar síncronamente
    if _last_cache_time == 0.0:
        _sincronizar_opendata()
    elif necesita_actualizar:
        hilo = threading.Thread(target=_sincronizar_opendata, daemon=True)
        hilo.start()
        
    with _lock:
        return list(_cached_stations_list)

def obtener_calles():
    """Devuelve la lista amigable de 'ID - Dirección' de todas las estaciones para el datalist"""
    calles_list = []
    for sid, info in STATIONS_METADATA.items():
        calles_list.append(f"{sid} - {info['name']}")
    return sorted(calles_list, key=lambda x: int(x.split(" - ")[0]))

def resolver_calle_id(calle_str: str) -> int:
    """
    Función calle-id: Resuelve de forma robusta la entrada del buscador 
    para retornar el ID numérico correspondiente de la estación.
    """
    calle_str = str(calle_str).strip()
    
    # Caso 1: Es un número entero exacto (ej: "92")
    if calle_str.isdigit():
        return int(calle_str)
        
    # Caso 2: Tiene el formato "ID - Nombre" (ej: "92 - Blasco Ibáñez - Aragón")
    match = re.search(r'^\s*(\d+)\s*-', calle_str)
    if match:
        return int(match.group(1))
        
    # Caso 3: Es un nombre parcial de calle/dirección (ej: "UPV Galileo" o "Juan Llorens")
    calle_lower = calle_str.lower()
    for sid, info in STATIONS_METADATA.items():
        name_lower = info.get("name", "").lower()
        address_lower = info.get("address", "").lower()
        if calle_lower in name_lower or calle_lower in address_lower:
            return int(sid)
            
    # Caso 4: Buscar cualquier número dentro del string
    match_any = re.search(r'\d+', calle_str)
    if match_any:
        return int(match_any.group())
        
    raise ValueError(f"No se pudo resolver el ID de la estación para la entrada: '{calle_str}'")
