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

# Configuración de sincronización y caché inteligente en memoria
VALENCIA_OPENDATA_URL = (
    "https://geoportal.valencia.es/server/rest/services/OPENDATA/Trafico/MapServer/228/query"
    "?where=1=1&outFields=*&f=geojson"
)
CACHE_TTL = 300  # 5 minutos (300 segundos)

# Inicializamos la caché en memoria con las 276 estaciones locales (garantía de fallback inmediato y 0ms)
_cached_stations_list = sorted(list(STATIONS_METADATA.values()), key=lambda s: int(s['id']))
_last_cache_time = 0.0
_is_syncing = False
_lock = threading.Lock()

def _sincronizar_opendata():
    """
    Consulta la API en tiempo real de Valenbisi del Ayuntamiento de Valencia.
    Enriquece las 276 estaciones con disponibilidad real (currentBikes, cap, freeDocks, isOpen).
    Si la API municipal falla o tarda, mantiene intacto el dataset base sin bloquear.
    """
    global _cached_stations_list, _last_cache_time, _is_syncing
    try:
        resp = requests.get(
            VALENCIA_OPENDATA_URL,
            headers={"User-Agent": "ValenbaPredictor/3.0 (https://valenba.app)"},
            timeout=4.0
        )
        if resp.status_code == 200:
            geojson = resp.json()
            features = geojson.get("features", [])
            
            # Clonamos las 276 estaciones maestras
            nuevas_estaciones = {int(k): dict(v) for k, v in STATIONS_METADATA.items()}
            enriquecidas = 0
            
            for feat in features:
                props = feat.get("properties", {})
                num = props.get("number")
                if num in nuevas_estaciones:
                    # Actualizar bicicletas disponibles en tiempo real
                    if "available" in props and props["available"] is not None:
                        try:
                            nuevas_estaciones[num]["currentBikes"] = int(props["available"])
                        except (ValueError, TypeError):
                            pass
                            
                    # Actualizar capacidad si viene informada
                    if "total" in props and props["total"] is not None and int(props["total"]) > 0:
                        try:
                            nuevas_estaciones[num]["cap"] = int(props["total"])
                        except (ValueError, TypeError):
                            pass
                            
                    # Campos informativos adicionales
                    if "free" in props and props["free"] is not None:
                        try:
                            nuevas_estaciones[num]["freeDocks"] = int(props["free"])
                        except (ValueError, TypeError):
                            pass
                            
                    if "open" in props:
                        nuevas_estaciones[num]["isOpen"] = (props["open"] == "T")
                        
                    if "updated_at" in props:
                        nuevas_estaciones[num]["updatedAt"] = str(props["updated_at"])
                        
                    enriquecidas += 1
            
            with _lock:
                _cached_stations_list = sorted(list(nuevas_estaciones.values()), key=lambda s: int(s["id"]))
                _last_cache_time = time.time()
                
            print(f"[Estaciones] Sincronización exitosa con Valenbisi Open Data ({enriquecidas} actualizadas de {len(nuevas_estaciones)} totales).")
        else:
            print(f"[Estaciones] Respuesta HTTP {resp.status_code} desde Open Data. Usando caché/fallback.")
            with _lock:
                _last_cache_time = time.time() - (CACHE_TTL - 60)
    except Exception as e:
        print(f"[Estaciones] Aviso: No se pudo conectar con la API de Valenbisi ({e}). Fallback activo a Datos_estaciones.json.")
        with _lock:
            # Esperar 60 segundos antes de reintentar para no saturar si hay corte de red
            _last_cache_time = time.time() - (CACHE_TTL - 60)
    finally:
        _is_syncing = False

# Lanzar sincronización en segundo plano al importar el módulo
try:
    _init_thread = threading.Thread(target=_sincronizar_opendata, daemon=True)
    _init_thread.start()
except Exception:
    pass

def obtener_estaciones(forzar_sync: bool = False):
    """
    Devuelve la lista completa de las 276 estaciones de Valencia con sus coordenadas
    (lat, lng), id, name, address, cap, y currentBikes.
    
    Responde de forma instantánea gracias a la caché en memoria y fallback local.
    """
    global _last_cache_time, _is_syncing
    
    ahora = time.time()
    necesita_actualizar = forzar_sync or (ahora - _last_cache_time > CACHE_TTL)
    
    if necesita_actualizar and not _is_syncing:
        _is_syncing = True
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
