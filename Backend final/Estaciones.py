import json
import os
import re

# Cargar metadatos de las 276 estaciones al importar el módulo
base_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(base_dir, 'Datos_estaciones.json')

if os.path.exists(json_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        # Diccionario interno con IDs como enteross
        STATIONS_METADATA = {int(k): v for k, v in data.items()}
else:
    STATIONS_METADATA = {}

def obtener_estaciones():
    """Devuelve la lista de diccionarios de metadatos de todas las estaciones para el mapa"""
    return list(STATIONS_METADATA.values())

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
    calle_str = calle_str.strip()
    
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
