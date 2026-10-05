import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bike, 
  MapPin, 
  CalendarClock, 
  AlertTriangle, 
  Info,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Map as MapIcon,
  Home,
  User,
  Menu,
  BarChart,
  Star,
  Edit2,
  Check,
  X,
  Clock,
  Percent
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconMarker from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

//@ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: iconMarker,
  shadowUrl: iconShadow,
});

// Custom Leaflet Dynamic Icon function
const getStationIcon = (stationId: string, cap: number, isSelected: boolean, isFavorite?: boolean) => {
  const pinClass = isFavorite ? 'marker-pin-favorite' : 'marker-pin-normal';
  const arrowClass = isFavorite ? 'marker-arrow-favorite' : 'marker-arrow-normal';
  const selectedClass = isSelected ? 'selected' : '';

  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        ${isSelected ? `<span class="absolute inline-flex h-10 w-10 animate-ping rounded-full ${isFavorite ? 'bg-yellow-400/20' : 'bg-slate-500/20'} opacity-75"></span>` : ''}
        <div class="relative marker-pin ${pinClass} ${selectedClass}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bike"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>
        </div>
        <div class="marker-arrow ${arrowClass}"></div>
      </div>
    `,
    className: 'custom-bike-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
    tooltipAnchor: [0, -36]
  });
};

// Map visual view-changer helper component
function ChangeMapView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom]);
  return null;
}

// Mock Valencia Stations
const VALENCIA_CENTER: [number, number] = [39.4699, -0.3763];
const MOCK_STATIONS = [
  { id: '92', name: 'Blasco Ibáñez - Aragón', lat: 39.47586032883543, lng: -0.35596831583559707, cap: 20, currentBikes: 10 },
  { id: '111', name: 'UPV Galileo', lat: 39.48066419504159, lng: -0.3395082613341325, cap: 30, currentBikes: 15 },
  { id: '113', name: 'UPV Caminos', lat: 39.48127634089521, lng: -0.3436112694462359, cap: 38, currentBikes: 19 },
  { id: '114', name: 'UPV Informática', lat: 39.4818043438759, lng: -0.346591279156021, cap: 30, currentBikes: 15 }
];

// --- CONFIGURACIÓN & REGLAS DE NEGOCIO ---
const ESTACIONES_ROTAS = [105, 146, 168, 299];
const URL_BACKEND = '/api/predict'; // Reemplazar con endpoint real (ej. ngrok, AWS, heroku)
const CARTO_API_KEY = 'cb1_4b0r_1_40b4b36cd0db9ee62d5d48d2';

export default function App() {
  // --- ESTADO DE NAVEGACION ---
  const [currentView, setCurrentView] = useState<'home' | 'map'>('home');
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // --- ESTADO DEL MAPA ---
  interface MapStation {
    id: string;
    name: string;
    lat: number;
    lng: number;
    cap: number;
    currentBikes: number;
  }
  const [mapStations, setMapStations] = useState<MapStation[]>(MOCK_STATIONS);
  const [mapCenter, setMapCenter] = useState<[number, number]>(VALENCIA_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(14);
  const [tileStyle, setTileStyle] = useState<'voyager' | 'positron' | 'osm'>('positron');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);



  // EFECTO PARA CARGOS DE DATOS REALES DEL MAPA
  useEffect(() => {
    fetch(`http://${window.location.hostname}:8000/api/estaciones`)
      .then(res => res.json())
      .then(data => setMapStations(data))
      .catch(console.error);
  }, []);

  // --- ESTADO DEL FORMULARIO ---
  const [stationId, setStationId] = useState<string>('');
  const [dateTime, setDateTime] = useState<string>('');

  // --- LIMITES DE FECHA ---
  const { minDate, maxDate } = useMemo(() => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const format = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    
    const now = new Date();
    const future = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000); // 6 days in future (within open-meteo 7-day forecast)
    
    return { minDate: format(now), maxDate: format(future) };
  }, []);

  // --- INTERFACES ---
  interface FavoriteStation {
    id: string | number;
    customName?: string;
  }

  // --- ESTADO DE FAVORITOS ---
  const [favorites, setFavorites] = useState<FavoriteStation[]>(() => {
    try {
      const saved = localStorage.getItem('valenbisi_favorites');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map(item => {
            if (typeof item === 'number' || typeof item === 'string') {
              const str = item.toString().trim();
              const match = str.match(/^\s*(\d+)\s*-/);
              const cleanId = match ? match[1] : str;
              return { id: cleanId };
            }
            if (item && typeof item === 'object' && 'id' in item) {
              const str = item.id.toString().trim();
              const match = str.match(/^\s*(\d+)\s*-/);
              const cleanId = match ? match[1] : str;
              return { id: cleanId, customName: item.customName };
            }
            return null;
          }).filter(Boolean) as FavoriteStation[];
        }
      }
      return [];
    } catch (e) {
      return [];
    }
  });

  const [calles, setCalles] = useState<string[]>([]);
  useEffect(() => {
    // GET a /calles silencioso
    fetch(`http://${window.location.hostname}:8000/calles`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCalles(data);
      })
      .catch(() => {});
  }, []);

  const [editingFavId, setEditingFavId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    localStorage.setItem('valenbisi_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Helper to extract numeric ID from input string (e.g. "114 - UPV Informática" -> "114")
  const getCleanId = (val: string): string => {
    if (!val) return '';
    const trimmed = val.trim();
    const match = trimmed.match(/^\s*(\d+)\s*-/);
    if (match) return match[1];
    if (/^\d+$/.test(trimmed)) return trimmed;
    const station = mapStations.find(s => s.name && s.name.toLowerCase().trim() === trimmed.toLowerCase());
    if (station) return station.id.toString();
    return trimmed;
  };

  // Memoized filtered stations list based on the "showOnlyFavorites" toggle
  const displayedStations = useMemo(() => {
    return mapStations.filter(station => {
      if (!showOnlyFavorites) return true;
      return favorites.some(f => f.id && f.id.toString() === station.id.toString());
    });
  }, [mapStations, showOnlyFavorites, favorites]);

  const currentStationStr = typeof stationId === 'string' ? stationId.trim() : (stationId ? (stationId as any).toString().trim() : '');
  const cleanCurrentStationId = getCleanId(currentStationStr);
  const isCurrentFavorite = cleanCurrentStationId !== '' && favorites.some(f => f.id && getCleanId(f.id.toString()) === cleanCurrentStationId);

  const toggleFavorite = (id: string | number) => {
    if (id === null || id === undefined) return;
    const cleanId = getCleanId(id.toString());
    if (!cleanId) return;
    setFavorites(prev => {
      if (prev.some(f => f.id && getCleanId(f.id.toString()) === cleanId)) {
        return prev.filter(f => f.id && getCleanId(f.id.toString()) !== cleanId);
      } else {
        return [...prev, { id: cleanId }];
      }
    });
  };

  const startEditingFav = (fav: FavoriteStation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFavId(fav.id.toString());
    setEditingName(fav.customName || '');
  };

  const saveEditingFav = (id: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setFavorites(prev => prev.map(f => f.id.toString() === id ? { ...f, customName: editingName.trim() || undefined } : f));
    setEditingFavId(null);
  };

  const cancelEditingFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFavId(null);
  };

  // --- ESTADO DE LA APLICACIÓN ---
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<{
    station_id?: string;
    yhat: number | null;
    yhat_lower: number | null;
    yhat_upper: number | null;
    cap: number;
    occupancy: number | null; // Porcentaje
    model_available?: boolean;
    temp?: number;
    prec?: number;
    probabilidad_disponible?: number | null;
  } | null>(null);

  // --- LÓGICA DE API (Fetch Simulado para Integración Futura) ---
  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPrediction(null);

    // 1. Validación de Frontend
    const cleanId = getCleanId(stationId);
    if (!cleanId) {
      setError('Por favor introduce una estación válida.');
      return;
    }
    const parsedStationId = parseInt(cleanId, 10);
    if (!isNaN(parsedStationId) && ESTACIONES_ROTAS.includes(parsedStationId)) {
      setError(`La estación ${parsedStationId} se encuentra actualmente inactiva por mantenimiento.`);
      return;
    }
    if (!dateTime) {
      setError('Selecciona una fecha y hora para la predicción.');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        estacion: stationId,
        fecha_solicitada: dateTime
      };

      const response = await fetch(`http://${window.location.hostname}:8000/predecir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Error al conectar con el servidor');
      
      const data = await response.json();
      
      setPrediction({
        ...data,
        station_id: cleanId,
        yhat: data.bicicletas_disponibles,
        yhat_lower: data.yhat_lower,
        yhat_upper: data.yhat_upper,
        cap: data.cap || 30,
        occupancy: data.occupancy,
        probabilidad_disponible: data.probabilidad_disponible
      });

    } catch (err) {
      setError('Error al conectar con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  // --- RENDERIZADO DE INTERFAZ ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-16 md:pb-0 flex flex-col">
      {/* HEADER TIPO VALENBISI */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#2f3b5c] rounded-full flex items-center justify-center">
                <Bike className="text-white w-6 h-6" />
              </div>
              <span className="text-2xl font-black text-[#2f3b5c] tracking-tight italic">
                valenbisi
              </span>
            </div>
            
            <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-700">
              <button onClick={() => setCurrentView('map')} className={`transition-colors ${currentView === 'map' ? 'text-[#2f3b5c] border-b-2 border-[#2f3b5c]' : 'hover:text-[#2f3b5c]'}`}>MAPA</button>
              <button onClick={() => setShowHowItWorks(true)} className="hover:text-[#2f3b5c] transition-colors">¿CÓMO FUNCIONA?</button>
            </nav>
          </div>

          <div className="flex items-center gap-6">
            <button className="hidden md:flex items-center justify-center w-10 h-10 rounded-full border border-slate-300 hover:bg-slate-50 transition-colors">
              <User className="w-5 h-5 text-[#2f3b5c]" />
            </button>
            <button className="md:hidden p-2">
              <Menu className="w-6 h-6 text-slate-700" />
            </button>
          </div>
        </div>
      </header>

      {/* RENDERIZADO CONDICIONAL DE VISTAS */}
      {currentView === 'home' ? (
        <>
          {/* HERO SECTION / BANNER PREDICCIÓN */}
          <div className="bg-[#2f3b5c] text-white py-12 px-4 shadow-inner relative overflow-hidden">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
            <div className="max-w-7xl mx-auto relative z-10">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Previsión de Disponibilidad
              </h1>
              <p className="text-lg text-slate-300 max-w-2xl font-medium">
                Nuestro motor de IA analiza datos históricos y meteorológicos para estimar
                si habrá bicicletas disponibles cuando las necesites.
              </p>
            </div>
          </div>

          {/* CONTENIDO PRINCIPAL */}
          <main className="max-w-7xl mx-auto px-4 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-5 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
        >
          <div className="p-6 md:p-8">
            <h2 className="text-2xl font-extrabold text-[#2f3b5c] mb-6 flex items-center gap-2">
              <MapIcon className="w-6 h-6" />
              Configurar Predicción
            </h2>

            <form onSubmit={handlePredict} className="space-y-6">
              
              {/* INPUT ESTACIÓN */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider" htmlFor="input_calle">
                    Calle o ID de la Estación
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="input_calle"
                    list="lista_calles"
                    type="text"
                    required
                    value={stationId}
                    onChange={(e) => setStationId(e.target.value)}
                    className="block w-full pl-10 pr-12 py-3 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#2f3b5c] focus:border-transparent transition-all outline-none font-medium text-lg"
                    placeholder="Ej. Calle de la Paz o 114"
                  />
                  <datalist id="lista_calles">
                    {calles.map((calle, idx) => (
                      <option key={idx} value={calle}>{calle}</option>
                    ))}
                  </datalist>
                  {stationId && currentStationStr && (
                    <button
                      type="button"
                      onClick={() => toggleFavorite(currentStationStr)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none group"
                      title={isCurrentFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
                    >
                      <Star 
                        className={`w-6 h-6 transition-all ${
                          isCurrentFavorite 
                            ? 'text-yellow-400 fill-yellow-400 drop-shadow-sm scale-110' 
                            : 'text-slate-300 hover:text-yellow-400 hover:scale-110'
                        }`} 
                      />
                    </button>
                  )}
                </div>
                <div className="flex justify-between items-start">
                  <p className="text-xs text-slate-500 font-medium">Consulta el ID en el mapa oficial.</p>
                </div>
                
                {/* FAVORITAS (CHIPS) */}
                {favorites.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-2 items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase">Favoritas:</span>
                    {favorites.map(fav => {
                      const favIdStr = fav.id.toString();
                      const isSelected = getCleanId(currentStationStr) === getCleanId(favIdStr);
                      const isEditing = editingFavId === favIdStr;
                      
                      if (isEditing) {
                        return (
                          <div key={`edit-${fav.id}`} className="flex items-center bg-white border border-blue-400 rounded-full overflow-hidden shadow-sm pl-3 pr-1 py-0.5">
                            <span className="text-xs font-bold text-slate-400 mr-2">#{fav.id}</span>
                            <input
                              type="text"
                              value={editingName}
                              onChange={e => setEditingName(e.target.value)}
                              placeholder="Nombre..."
                              className="text-xs font-medium text-slate-700 outline-none w-20 bg-transparent"
                              autoFocus
                              onKeyDown={e => e.key === 'Enter' && saveEditingFav(favIdStr, e as any)}
                            />
                            <button type="button" onClick={(e) => saveEditingFav(favIdStr, e)} className="p-1 hover:bg-green-50 text-green-600 rounded-full transition-colors">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button type="button" onClick={cancelEditingFav} className="p-1 hover:bg-red-50 text-red-600 rounded-full transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={fav.id}
                          type="button"
                          onClick={() => setStationId(favIdStr)}
                          className={`text-xs font-bold pl-3 pr-2 py-1.5 rounded-full border transition-colors flex items-center gap-1.5 group ${
                            isSelected 
                              ? 'bg-yellow-50 border-yellow-300 text-yellow-800'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'fill-yellow-500 text-yellow-500' : 'text-slate-400 group-hover:text-yellow-500'}`} />
                          <span className="truncate max-w-[100px]">
                            {fav.customName || `Estación ${fav.id}`}
                          </span>
                          <div 
                            onClick={(e) => startEditingFav(fav, e)}
                            className={`p-0.5 rounded-full hover:bg-slate-200 transition-colors opacity-0 group-hover:opacity-100 ${isSelected ? 'hover:bg-yellow-200' : ''}`}
                            title="Renombrar estación"
                          >
                            <Edit2 className="w-3 h-3 text-slate-500" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* INPUT FECHA Y HORA */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider" htmlFor="input_fecha">
                  Fecha y Hora Target
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarClock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="input_fecha"
                    type="datetime-local"
                    required
                    min={minDate}
                    max={maxDate}
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#2f3b5c] focus:border-transparent transition-all outline-none font-medium text-lg"
                  />
                </div>
              </div>

              {/* ERROR ALERT */}
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3 mt-4">
                      <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-sm font-medium">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* BOTÓN DE ACCIÓN TIPO VALENBISI */}
              <button
                id="boton_predecir"
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#2f3b5c] hover:bg-[#1a233a] active:bg-[#0f1424] text-white py-4 rounded-full font-bold text-lg shadow-lg shadow-[#2f3b5c]/30 hover:shadow-[#2f3b5c]/50 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group mt-6"
              >
                {isLoading ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Calculando predicción...
                  </>
                ) : (
                  <>
                    Ejecutar Modelo Predictivo
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.section>


        {/* COLUMNA DERECHA: DASHBOARD DE RESULTADOS Y MAPA */}
        <div className="lg:col-span-7 flex flex-col space-y-6">

          <AnimatePresence mode="wait">
            {!prediction ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                className="flex-1 min-h-[300px] border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/50"
              >
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <BarChart className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-600 mb-2">Esperando datos de entrada</h3>
                <p className="max-w-md text-slate-500 text-sm">
                  Introduce el ID de una estación y los parámetros ambientales para visualizar
                  la predicción generada por nuestro modelo.
                </p>
              </motion.div>
            ) : (
              <motion.div 
                key="results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 space-y-6"
              >
                {/* KPI PRINCIPAL */}
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-[#2f3b5c]"></div>
                  
                  <div className="flex justify-between items-start mb-8 gap-4">
                    <div className="min-w-0 flex-1">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${
                        prediction.model_available === false 
                          ? 'bg-amber-50 text-amber-700' 
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          prediction.model_available === false ? 'bg-amber-500' : 'bg-blue-500 animate-pulse'
                        }`}></div>
                        {prediction.model_available === false ? 'Modelo no disponible' : 'Predicción IA Completada'}
                      </span>
                      <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2 flex-wrap min-w-0">
                        <span className="break-words block max-w-full">
                          {(() => {
                            const favInfo = favorites.find(f => f.id.toString() === getCleanId(stationId));
                            return favInfo?.customName || (parseInt(getCleanId(stationId), 10).toString() !== "NaN" ? `Estación ${getCleanId(stationId)}` : stationId);
                          })()}
                        </span>
                        {(() => {
                          const favInfo = favorites.find(f => f.id.toString() === getCleanId(stationId));
                          return (
                            <>
                              {favInfo && (
                                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400 drop-shadow-sm shrink-0" title="Guardada en favoritos" />
                              )}
                              {favInfo?.customName && parseInt(getCleanId(stationId), 10).toString() !== "NaN" && (
                                <span className="text-lg font-medium text-slate-400 shrink-0">
                                  (#{getCleanId(stationId)})
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </h3>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-slate-500 whitespace-nowrap">Capacidad Total</p>
                      <p className="text-2xl font-black text-slate-800">{prediction.cap}</p>
                    </div>
                  </div>

                  {prediction.model_available === false ? (
                    <div className="text-center py-6 px-4">
                      <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100">
                        <Clock className="w-8 h-8 text-amber-600" />
                      </div>
                      <p className="text-lg font-bold text-slate-700">Modelo predictivo en desarrollo</p>
                      <p className="text-sm text-slate-500 max-w-sm mx-auto mt-2">
                        Esta estación estará disponible para predicciones próximamente una vez se complete el entrenamiento del modelo.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                      {/* NÚMERO GIGANTE (yhat) */}
                      <div className="text-center flex-shrink-0" id="texto_resultado">
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Bicis Disponibles</p>
                        <div className="text-7xl md:text-8xl font-black text-[#2f3b5c] tracking-tighter tabular-nums drop-shadow-sm">
                          {prediction.yhat}
                        </div>
                        <p className="text-slate-600 font-medium mt-2">Bicicletas estimadas: {prediction.yhat}</p>
                      </div>

                      {/* GRÁFICO TIPO GAUGE / BARRA DE PROGRESO */}
                      <div className="flex-1 w-full min-w-0 space-y-4">
                        <div className="flex justify-between text-sm font-bold text-slate-600 mb-1">
                          <span>Ocupación de Bornetas</span>
                          <span>{prediction.occupancy !== null ? Math.round(prediction.occupancy) : 0}%</span>
                        </div>
                        <div className="h-6 w-full bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
                          <motion.div 
                            className={`absolute top-0 left-0 h-full rounded-full ${
                              prediction.occupancy !== null && prediction.occupancy > 85 ? 'bg-emerald-500' :
                              prediction.occupancy !== null && prediction.occupancy < 15 ? 'bg-red-500' :
                              'bg-[#2f3b5c]'
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${prediction.occupancy || 0}%` }}
                            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                          />
                        </div>
                        <div className="flex justify-between text-xs font-semibold text-slate-400 uppercase">
                          <span>Vacía (0)</span>
                          <span>Llena ({prediction.cap})</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* CONTEXTO Y CONFIANZA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Intervalo de Confianza */}
                  {prediction.model_available !== false ? (
                    <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-6 h-6 text-orange-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-1">Intervalo de Confianza</h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          Debido al ruido humano y fluctuación, esperamos entre <strong className="text-slate-800">{prediction.yhat_lower}</strong> y <strong className="text-slate-800">{prediction.yhat_upper}</strong> bicicletas reales en ese momento.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                        <Info className="w-6 h-6 text-amber-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-1">Clima Estimado</h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          Para la fecha consultada, esperamos una temperatura de <strong className="text-slate-800">{prediction.temp}ºC</strong> y <strong className="text-slate-800">{prediction.prec}mm</strong> de precipitación.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Probabilidad de Disponibilidad */}
                  <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      prediction.model_available === false ? 'bg-amber-50 text-amber-500' :
                      prediction.probabilidad_disponible !== undefined && prediction.probabilidad_disponible !== null && prediction.probabilidad_disponible > 75 ? 'bg-emerald-50 text-emerald-600' :
                      prediction.probabilidad_disponible !== undefined && prediction.probabilidad_disponible !== null && prediction.probabilidad_disponible < 25 ? 'bg-red-50 text-red-600' :
                      'bg-orange-50 text-orange-600'
                    }`}>
                      <Percent className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 mb-1">Probabilidad de Éxito</h4>
                      {prediction.model_available === false ? (
                        <p className="text-xs text-slate-500 mt-1 leading-normal font-medium">
                          Modelo en desarrollo. Requiere entrenamiento previo para calcular la probabilidad de encontrar bicicletas.
                        </p>
                      ) : (
                        <div className="mt-1">
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-slate-800 tracking-tight">
                              {prediction.probabilidad_disponible}%
                            </span>
                            <span className="text-xs font-semibold text-slate-400">disponible</span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-normal mt-1">
                            Probabilidad estimada de encontrar al menos <strong className="text-slate-700">1 bicicleta</strong> disponible.
                          </p>
                          <div className="mt-2 flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${
                              prediction.probabilidad_disponible !== undefined && prediction.probabilidad_disponible !== null && prediction.probabilidad_disponible > 75 ? 'bg-emerald-500 animate-pulse' :
                              prediction.probabilidad_disponible !== undefined && prediction.probabilidad_disponible !== null && prediction.probabilidad_disponible < 25 ? 'bg-red-500 animate-pulse' :
                              'bg-orange-500 animate-pulse'
                            }`} />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              {prediction.probabilidad_disponible !== undefined && prediction.probabilidad_disponible !== null && prediction.probabilidad_disponible > 75 ? 'Alta' :
                               prediction.probabilidad_disponible !== undefined && prediction.probabilidad_disponible !== null && prediction.probabilidad_disponible < 25 ? 'Baja' :
                               'Media'
                              }
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
        </>
      ) : (
      <main className="w-full max-w-7xl mx-auto px-4 py-4 md:py-6 flex-1 flex flex-col">
        {/* Map view header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 md:mb-6 gap-3">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-[#2f3b5c] tracking-tight">Mapa Interactivo de Estaciones</h2>
            <p className="text-xs md:text-sm text-slate-500 font-medium">Haz clic en una estación para seleccionarla y realizar predicciones directas</p>
          </div>
          <button 
            onClick={() => setCurrentView('home')}
            className="self-start sm:self-center inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition-colors shrink-0"
          >
            ← Ir al Panel de Previsión
          </button>
        </div>

        {/* Map view Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[500px]">
          
          {/* Left Panel: Selected station info & list selector */}
          <div className="order-2 lg:order-1 lg:col-span-4 bg-white rounded-3xl p-6 shadow-xl border border-slate-100 flex flex-col space-y-6 lg:max-h-[calc(100vh-210px)] overflow-y-auto z-10">
            {/* selected station detail */}
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-3">Estación Seleccionada</span>
              {(() => {
                const selectedStation = mapStations.find(s => s.id && stationId && s.id.toString() === getCleanId(stationId));
                if (!selectedStation) {
                  return (
                    <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-5 text-center text-slate-400">
                      <MapIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold leading-relaxed">
                        Selecciona un marcador en el mapa o haz clic en la lista inferior para configurar la predicción.
                      </p>
                    </div>
                  );
                }

                const broken = ESTACIONES_ROTAS.includes(parseInt(selectedStation.id, 10));

                return (
                  <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 bg-[#2f3b5c] rounded-xl flex items-center justify-center shrink-0">
                          <Bike className="text-white w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-[#2f3b5c] text-sm md:text-base leading-tight truncate">{selectedStation.name}</h4>
                          <span className="text-xs font-mono text-slate-400">ID Estación: {selectedStation.id}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => toggleFavorite(selectedStation.id)}
                        className="p-1 hover:bg-slate-100 rounded-full transition-colors shrink-0"
                      >
                        <Star className={`w-5 h-5 ${favorites.some(f => f.id.toString() === selectedStation.id) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
                      </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-xl border border-slate-100">
                        <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Capacidad de Anclajes</p>
                        <p className="text-lg font-black text-[#2f3b5c]">{selectedStation.cap} <span className="text-xs text-slate-400 font-normal">bornes totales</span></p>
                      </div>
                    </div>

                    {broken && (
                      <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex gap-2 text-xs text-red-700">
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <p>Esta estación está inactiva por mantenimiento técnico.</p>
                      </div>
                    )}

                    {/* Quick prediction configuration */}
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider focus:outline-none" htmlFor="map_datetime">
                          Fecha/Hora de Previsión:
                        </label>
                        <input
                          id="map_datetime"
                          type="datetime-local"
                          min={minDate}
                          max={maxDate}
                          value={dateTime}
                          onChange={(e) => setDateTime(e.target.value)}
                          className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg outline-none bg-white focus:ring-2 focus:ring-[#2f3b5c]/20"
                        />
                      </div>
                      <button
                        onClick={(e) => {
                          if (broken) return;
                          handlePredict(e);
                          setCurrentView('home');
                        }}
                        disabled={!dateTime || broken}
                        className="w-full bg-[#2f3b5c] hover:bg-[#1a233a] disabled:opacity-50 text-white text-xs py-2.5 rounded-xl font-bold transition-transform active:scale-95 flex items-center justify-center gap-1.5 shadow-md shadow-[#2f3b5c]/10"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Ejecutar Modelo Predictivo
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Show only favorites toggle */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 rounded-2xl border border-slate-100/80 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center shrink-0">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-500" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-700 leading-tight truncate">Ver solo Favoritas</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Filtrar estaciones en el mapa</p>
                  </div>
                </div>
                
                {/* Switch toggle checkbox */}
                <label className="relative inline-flex items-center cursor-pointer shrink-0" htmlFor="show_only_favorites_toggle">
                  <input 
                    id="show_only_favorites_toggle"
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={showOnlyFavorites}
                    onChange={(e) => setShowOnlyFavorites(e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-400"></div>
                </label>
              </div>
            </div>

            <hr className="border-slate-100" />



            {/* List selector of all dataset stations */}
            <div className="flex-1 flex flex-col min-h-0">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-3">
                {showOnlyFavorites ? `Estaciones Favoritas (${displayedStations.length})` : `Estaciones del Dataset (${displayedStations.length})`}
              </span>
              <div className="space-y-2 overflow-y-auto pr-1 flex-1 min-h-[180px]">
                {displayedStations.map((station) => {
                  const isSelected = stationId && stationId.toString() === station.id.toString();
                  const isBroken = ESTACIONES_ROTAS.includes(parseInt(station.id, 10));
                  return (
                    <button
                      key={station.id}
                      onClick={() => {
                        setStationId(station.id.toString());
                        setMapCenter([station.lat, station.lng]);
                        setMapZoom(16);
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isSelected 
                          ? 'border-[#2f3b5c] bg-slate-50 ring-2 ring-[#2f3b5c]/10' 
                          : 'border-slate-100 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#2f3b5c] text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          <Bike className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-800 truncate leading-tight">{station.name}</p>
                          <span className="text-[10px] font-mono text-slate-400">ID: {station.id} {isBroken && '• Mantenimiento'}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-extrabold px-2 py-1 rounded-full bg-slate-100 text-[#2f3b5c]">
                          {station.cap} bornes
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Right Panel: Map Frame */}
          <div className="order-1 lg:order-2 lg:col-span-8 flex flex-col relative bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden w-full h-[550px] lg:h-auto min-h-[450px]">


            <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%', zIndex: 0 }}>
              <ChangeMapView center={mapCenter} zoom={mapZoom} />
              <TileLayer
                attribution={
                  tileStyle === 'osm' 
                    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' 
                    : '&copy; <a href="https://carto.com/attributions">CARTO</a>'
                }
                url={
                  tileStyle === 'voyager' 
                    ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?api_key=${CARTO_API_KEY}`
                    : tileStyle === 'positron'
                    ? `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?api_key=${CARTO_API_KEY}`
                    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                }
              />
              {displayedStations.map((station) => {
                const isSelected = stationId && getCleanId(stationId) === station.id.toString();
                const isPredictedStation = prediction?.station_id && prediction.station_id.toString() === station.id.toString() && dateTime;
                const isFavorite = favorites.some((f) => f.id && station.id && f.id.toString() === station.id.toString());
                
                return (
                  <Marker 
                    key={`${station.id}-${isSelected}-${isFavorite}`} 
                    position={[station.lat, station.lng]}
                    icon={getStationIcon(station.id, station.cap, isSelected, isFavorite)}
                    eventHandlers={{
                      click: () => {
                        setStationId(station.id.toString());
                        setMapCenter([station.lat, station.lng]);
                        setMapZoom(16);
                      },
                    }}
                  >
                    {/* HOVER TOOLTIP */}
                    <Tooltip direction="top" offset={[0, -28]} opacity={0.98} sticky>
                      <div className="font-sans text-xs p-1.5 space-y-1">
                        <p className="font-black text-[#2f3b5c] leading-tight">{station.name}</p>
                        <p className="text-slate-500 font-bold">
                          Estación #{station.id} • Capacidad: <span className="text-slate-800 font-extrabold">{station.cap} bases</span>
                        </p>
                        {ESTACIONES_ROTAS.includes(parseInt(station.id, 10)) && (
                          <span className="inline-flex items-center gap-1 text-red-500 font-bold uppercase text-[9px] bg-red-50 px-1.5 py-0.5 rounded-md mt-1">⚠️ En Mantenimiento</span>
                        )}
                      </div>
                    </Tooltip>

                    {/* POPUP CARD ACTIONS */}
                    <Popup>
                      <div className="text-center p-1.5 min-w-[150px] font-sans">
                        <h3 className="font-extrabold text-[#2f3b5c] mb-1.5 text-xs leading-tight">{station.name}</h3>
                        
                        {isPredictedStation ? (
                          <div className="bg-blue-50 border border-blue-100 rounded-xl p-2 mb-2">
                             <p className="text-[9px] font-bold text-blue-800 uppercase mb-0.5">Previsión ({new Date(dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})</p>
                             {prediction.model_available === false ? (
                               <p className="text-xs text-amber-600 font-bold">Modelo no disponible</p>
                             ) : (
                               <p className="text-xs text-slate-700">
                                 Bicis Estimadas: <strong className="text-blue-600 font-black text-sm">{prediction.yhat}</strong> / {prediction.cap}
                               </p>
                             )}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-600 mb-2 leading-tight">
                            Capacidad total:<br/>
                            <strong className="text-[#2f3b5c] text-sm font-black">{station.cap}</strong> bases.
                          </p>
                        )}
                        
                        <button 
                          onClick={() => {
                            setStationId(station.id.toString());
                            setCurrentView('home');
                          }}
                          className="text-[10px] font-bold bg-[#2f3b5c] hover:bg-[#151a29] text-white px-3 py-1.5 rounded-lg transition-colors w-full"
                        >
                          Seleccionar Estación
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}


            </MapContainer>
          </div>

        </div>
      </main>
      )}

      {/* NAVEGACIÓN MÓVIL (BOTTOM TABS) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center z-50 h-16 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setCurrentView('home')} 
          className={`flex flex-col items-center justify-center w-1/2 h-full ${currentView === 'home' ? 'text-[#2f3b5c]' : 'text-slate-400'}`}
        >
          <Home className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold tracking-wide">PRONÓSTICO</span>
        </button>
        <button 
          onClick={() => setCurrentView('map')} 
          className={`flex flex-col items-center justify-center w-1/2 h-full ${currentView === 'map' ? 'text-[#2f3b5c]' : 'text-slate-400'}`}
        >
          <MapIcon className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold tracking-wide">MAPA</span>
        </button>
      </div>

      {/* MODAL CÓMO FUNCIONA */}
      <AnimatePresence>
        {showHowItWorks && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowHowItWorks(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-black text-[#2f3b5c] flex items-center gap-2">
                  <Info className="w-6 h-6 text-blue-500 shrink-0" />
                  ¿Cómo funciona y entorno local?
                </h2>
                <button onClick={() => setShowHowItWorks(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors shrink-0">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6 text-slate-600">
                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Arquitectura del Proyecto</h3>
                  <p>
                    Esta aplicación es el frontend en React (Vite) que se conecta a una API externa (por defecto en <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm text-[#2f3b5c] font-mono break-all">http://127.0.0.1:8000</code>) donde residen los modelos predictivos de Machine Learning (ej. Prophet) para estimar la disponibilidad de bicicletas en base a coordenadas y capacidad de la estación.
                  </p>
                </section>

                <hr className="border-slate-100" />

                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Ejecutar el Frontend en Local</h3>
                  <ol className="list-decimal pl-5 space-y-2 text-sm md:text-base">
                    <li>Clona el repositorio en tu ordenador.</li>
                    <li>Abre una terminal en la carpeta del proyecto.</li>
                    <li>Instala las dependencias ejecutando: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[#2f3b5c] font-mono">npm install</code></li>
                    <li>Inicia el servidor de desarrollo: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[#2f3b5c] font-mono">npm run dev</code></li>
                    <li>Abre <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[#2f3b5c] font-mono">http://localhost:3000</code> en tu navegador.</li>
                  </ol>
                </section>

                <hr className="border-slate-100" />

                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Configurar el Backend (Python/FastAPI)</h3>
                  <p className="mb-3 text-sm md:text-base">
                    Para que las predicciones funcionen en local, necesitas levantar un servidor backend en el puerto 8000, que reciba las peticiones del modelo.
                  </p>
                  <ol className="list-decimal pl-5 space-y-2 text-sm md:text-base">
                    <li>Crea un entorno virtual de Python: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[#2f3b5c] font-mono">python -m venv venv</code></li>
                    <li>Activa el entorno: 
                      <ul className="list-disc pl-5 mt-1 text-slate-500">
                        <li>Windows: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[#2f3b5c] font-mono break-all">venv\Scripts\activate</code></li>
                        <li>Mac/Linux: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[#2f3b5c] font-mono break-all">source venv/bin/activate</code></li>
                      </ul>
                    </li>
                    <li>Instala las librerías necesarias (ej. fastapi, uvicorn, prophet, pandas): <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[#2f3b5c] font-mono break-all">pip install -r requirements.txt</code></li>
                    <li>Inicia el servidor backend: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[#2f3b5c] font-mono break-all">uvicorn main:app --reload --port 8000</code></li>
                  </ol>
                </section>
                
                <hr className="border-slate-100" />
                
                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Integrar datos reales (JSON o CSV)</h3>
                  <p className="text-sm md:text-base leading-relaxed">
                    Si tienes un dataset de coordenadas, puedes alimentar el mapa modificando el código. Ve a <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[#2f3b5c] font-mono">App.tsx</code> y descomenta el bloque <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[#2f3b5c] font-mono">fetch('/dataset_coordenadas.json')</code> en el <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[#2f3b5c] font-mono">useEffect</code> del mapa para cargar un archivo local ubicado en la carpeta <strong>public</strong>. O expón un endpoint en FastAPI para servir un JSON con el array de estaciones generadas desde tu CSV.
                  </p>
                </section>
              </div>

              <div className="mt-8">
                <button 
                  onClick={() => setShowHowItWorks(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 md:py-4 rounded-xl font-bold transition-colors"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
