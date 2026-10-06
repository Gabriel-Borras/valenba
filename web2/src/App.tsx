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
  Percent,
  Mail,
  Lock,
  LogOut,
  UserPlus,
  LogIn,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Search
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { DEFAULT_STATIONS, MapStation } from './defaultStations';
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

import { translations, Language } from './translations';
import { StationCombobox } from './components/StationCombobox';
import { TimeScrubber } from './components/TimeScrubber';

// Banderas SVG en alta resolución
const FlagES = () => (
  <svg className="w-5 h-3.5 rounded-sm shadow-sm border border-slate-200/80 shrink-0" viewBox="0 0 750 500">
    <rect width="750" height="500" fill="#c60b1e" />
    <rect width="750" height="250" y="125" fill="#ffc400" />
  </svg>
);

const FlagVA = () => (
  <svg className="w-5 h-3.5 rounded-sm shadow-sm border border-slate-200/80 shrink-0" viewBox="0 0 750 500">
    <rect width="750" height="500" fill="#ffc400" />
    <rect y="55.5" width="750" height="55.5" fill="#c60b1e" />
    <rect y="166.6" width="750" height="55.5" fill="#c60b1e" />
    <rect y="277.7" width="750" height="55.5" fill="#c60b1e" />
    <rect y="388.8" width="750" height="55.5" fill="#c60b1e" />
    <rect width="180" height="500" fill="#0047AB" />
    <path d="M40 320 L140 320 L130 200 L90 240 L50 200 Z" fill="#ffd700" opacity="0.9" />
    <circle cx="50" cy="190" r="10" fill="#ffd700" />
    <circle cx="90" cy="180" r="12" fill="#ffd700" />
    <circle cx="130" cy="190" r="10" fill="#ffd700" />
    <rect x="50" y="300" width="80" height="15" rx="3" fill="#c60b1e" />
  </svg>
);

const FlagUK = () => (
  <svg className="w-5 h-3.5 rounded-sm shadow-sm border border-slate-200/80 shrink-0" viewBox="0 0 60 30">
    <clipPath id="flag_uk_s">
      <path d="M0,0 v30 h60 v-30 z"/>
    </clipPath>
    <g clipPath="url(#flag_uk_s)">
      <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
      <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#flag_uk_s)" stroke="#C8102E" strokeWidth="4"/>
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
    </g>
  </svg>
);

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
const CARTO_API_KEY: string = String((import.meta as any).env?.VITE_CARTO_API_KEY || '').trim();

// Resolver de URL de API preparado para Producción (Vercel / Dominio propio / Local)
export const getApiUrl = (endpoint: string) => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) {
    const cleanBase = envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${cleanBase}${cleanEndpoint}`;
  }
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `http://${window.location.hostname}:8000${cleanEndpoint}`;
};

export default function App() {
  // --- ESTADO DE NAVEGACION ---
  const [currentView, setCurrentView] = useState<'home' | 'map'>('home');
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // --- ESTADO DE IDIOMA / TRADUCCIÓN ---
  const [currentLang, setCurrentLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('valenba_language') as Language;
      return (saved && ['va', 'es', 'en'].includes(saved)) ? saved : 'va';
    } catch {
      return 'va';
    }
  });

  const changeLanguage = (lang: Language) => {
    setCurrentLang(lang);
    try {
      localStorage.setItem('valenba_language', lang);
    } catch {}
  };

  const t = translations[currentLang];

  const LanguageSelector = () => (
    <div className="flex flex-col items-center gap-2 py-3 my-2 border-t border-b border-slate-100 bg-slate-50/70 rounded-2xl px-4">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {t.drawerSelectLang}
      </span>
      <div className="flex items-center justify-center gap-3">
        {/* España (Izquierda) */}
        <button
          type="button"
          onClick={() => changeLanguage('es')}
          title="Español"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
            currentLang === 'es'
              ? 'bg-white border-[#2f3b5c] shadow-md ring-2 ring-[#2f3b5c]/10 scale-105'
              : 'border-transparent hover:border-slate-200 hover:bg-white/80 opacity-60 hover:opacity-100'
          }`}
        >
          <FlagES />
          <span className={`text-xs font-black ${currentLang === 'es' ? 'text-[#2f3b5c]' : 'text-slate-500'}`}>ES</span>
        </button>

        {/* Valencia / Cuatribarra (En Medio - Por defecto) */}
        <button
          type="button"
          onClick={() => changeLanguage('va')}
          title="Valencià (Per defecte)"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
            currentLang === 'va'
              ? 'bg-white border-[#2f3b5c] shadow-md ring-2 ring-[#2f3b5c]/10 scale-105'
              : 'border-transparent hover:border-slate-200 hover:bg-white/80 opacity-60 hover:opacity-100'
          }`}
        >
          <FlagVA />
          <span className={`text-xs font-black ${currentLang === 'va' ? 'text-[#2f3b5c]' : 'text-slate-500'}`}>VAL</span>
        </button>

        {/* Reino Unido (Derecha) */}
        <button
          type="button"
          onClick={() => changeLanguage('en')}
          title="English"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
            currentLang === 'en'
              ? 'bg-white border-[#2f3b5c] shadow-md ring-2 ring-[#2f3b5c]/10 scale-105'
              : 'border-transparent hover:border-slate-200 hover:bg-white/80 opacity-60 hover:opacity-100'
          }`}
        >
          <FlagUK />
          <span className={`text-xs font-black ${currentLang === 'en' ? 'text-[#2f3b5c]' : 'text-slate-500'}`}>EN</span>
        </button>
      </div>
    </div>
  );

  // --- ESTADO DE USUARIO / AUTENTICACIÓN ---
  interface UserProfile {
    name: string;
    email: string;
    password?: string;
    createdAt?: string;
  }

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('valenba_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isUserDrawerOpen, setIsUserDrawerOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    const emailTrimmed = authEmail.trim().toLowerCase();
    const passTrimmed = authPassword.trim();

    if (!emailTrimmed || !passTrimmed) {
      setAuthError('Por favor completa todos los campos.');
      return;
    }

    try {
      if (authMode === 'register') {
        const nameTrimmed = authName.trim();
        if (!nameTrimmed) {
          setAuthError('Por favor indica tu nombre.');
          return;
        }
        if (passTrimmed.length < 4) {
          setAuthError('La contraseña debe tener al menos 4 caracteres.');
          return;
        }

        const res = await fetch(getApiUrl('/api/auth/register'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: nameTrimmed, email: emailTrimmed, password: passTrimmed })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || 'Error al crear la cuenta.');
        }

        const sessionUser = data.user;
        localStorage.setItem('valenba_current_user', JSON.stringify(sessionUser));
        setCurrentUser(sessionUser);
        setAuthSuccess('¡Cuenta registrada con éxito en la base de datos!');
        setAuthName('');
        setAuthEmail('');
        setAuthPassword('');
      } else {
        const res = await fetch(getApiUrl('/api/auth/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailTrimmed, password: passTrimmed })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || 'Credenciales incorrectas.');
        }

        const sessionUser = data.user;
        localStorage.setItem('valenba_current_user', JSON.stringify(sessionUser));
        setCurrentUser(sessionUser);
        if (Array.isArray(data.favorites)) {
          setFavorites(data.favorites);
        }
        setAuthSuccess(`¡Bienvenido de nuevo, ${sessionUser.name}!`);
        setAuthEmail('');
        setAuthPassword('');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Error de conexión con el servidor.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('valenba_current_user');
    setCurrentUser(null);
    setAuthSuccess(null);
    setAuthError(null);
  };

  // --- ESTADO DEL MAPA ---
  const [mapStations, setMapStations] = useState<MapStation[]>(DEFAULT_STATIONS);
  const [mapCenter, setMapCenter] = useState<[number, number]>(VALENCIA_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(14);
  const [tileStyle, setTileStyle] = useState<'voyager' | 'positron' | 'osm'>('positron');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState('');

  // EFECTO PARA CARGOS DE DATOS REALES DEL MAPA Y FAVORITAS
  useEffect(() => {
    fetch(getApiUrl('/api/estaciones'))
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setMapStations(data);
        }
      })
      .catch(err => {
        console.warn('API /api/estaciones no disponible, manteniendo dataset base local:', err);
      });
  }, []);

  // Sincronizar favoritas de la base de datos si el usuario está logueado
  useEffect(() => {
    if (currentUser?.email) {
      fetch(getApiUrl(`/api/user/favorites?email=${encodeURIComponent(currentUser.email)}`))
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setFavorites(data);
          }
        })
        .catch(console.error);
    }
  }, [currentUser?.email]);

  // --- LIMITES DE FECHA ---
  const { minDate, maxDate, defaultDateTime } = useMemo(() => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const format = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    
    const now = new Date();
    const remainder = 15 - (now.getMinutes() % 15);
    const roundedNow = new Date(now.getTime() + (remainder === 0 ? 15 : remainder) * 60 * 1000);
    // Limitar la predicción a 3 días vista (Hoy, Mañana y tercer día a las 23:59)
    const future = new Date(now);
    future.setDate(future.getDate() + 2);
    future.setHours(23, 59, 0, 0);
    
    return { 
      minDate: format(now), 
      maxDate: format(future),
      defaultDateTime: format(roundedNow)
    };
  }, []);

  // --- ESTADO DEL FORMULARIO ---
  const [stationId, setStationId] = useState<string>('');
  const [dateTime, setDateTime] = useState<string>(() => defaultDateTime);

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

  const [calles, setCalles] = useState<string[]>(() => 
    DEFAULT_STATIONS.map(s => `${s.id} - ${s.name}`)
  );
  useEffect(() => {
    // GET a /calles con fallback a DEFAULT_STATIONS
    fetch(getApiUrl('/calles'))
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setCalles(data);
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

  // Memoized filtered stations list based on the "showOnlyFavorites" toggle and search query
  const displayedStations = useMemo(() => {
    const q = mapSearchQuery.trim().toLowerCase();
    return mapStations.filter(station => {
      if (showOnlyFavorites) {
        const isFav = favorites.some(f => f.id && getCleanId(f.id.toString()) === station.id.toString());
        if (!isFav) return false;
      }
      if (q) {
        const matchName = station.name && station.name.toLowerCase().includes(q);
        const matchId = station.id && station.id.toString().includes(q);
        const matchAddr = station.address && station.address.toLowerCase().includes(q);
        return matchName || matchId || matchAddr;
      }
      return true;
    });
  }, [mapStations, showOnlyFavorites, favorites, mapSearchQuery]);

  const currentStationStr = typeof stationId === 'string' ? stationId.trim() : (stationId ? (stationId as any).toString().trim() : '');
  const cleanCurrentStationId = getCleanId(currentStationStr);
  const isCurrentFavorite = cleanCurrentStationId !== '' && favorites.some(f => f.id && getCleanId(f.id.toString()) === cleanCurrentStationId);

  const toggleFavorite = (id: string | number) => {
    if (id === null || id === undefined) return;
    const cleanId = getCleanId(id.toString());
    if (!cleanId) return;
    setFavorites(prev => {
      const exists = prev.some(f => f.id && getCleanId(f.id.toString()) === cleanId);
      const updated = exists 
        ? prev.filter(f => f.id && getCleanId(f.id.toString()) !== cleanId)
        : [...prev, { id: cleanId }];

      if (currentUser?.email) {
        fetch(getApiUrl('/api/user/favorites'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: currentUser.email, station_id: cleanId })
        }).catch(console.error);
      }
      return updated;
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
    station_title?: string;
    is_favorite?: boolean;
    custom_name?: string;
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

      const response = await fetch(getApiUrl('/predecir'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Error al conectar con el servidor');
      
      const data = await response.json();
      
      const favInfo = favorites.find(f => f.id.toString() === cleanId);
      const matchedStation = mapStations.find(s => s.id.toString() === cleanId);
      const stationTitle = favInfo?.customName || (matchedStation ? `${matchedStation.id} - ${matchedStation.name}` : (parseInt(cleanId, 10).toString() !== "NaN" ? `Estación ${cleanId}` : stationId));

      setPrediction({
        ...data,
        station_id: cleanId,
        station_title: stationTitle,
        is_favorite: !!favInfo,
        custom_name: favInfo?.customName,
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
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('home')}>
              <div className="w-10 h-10 bg-[#2f3b5c] rounded-full flex items-center justify-center">
                <Bike className="text-white w-6 h-6" />
              </div>
              <span className="text-2xl font-black text-[#2f3b5c] tracking-tight italic">
                valenBA
              </span>
            </div>
            
            <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-700">
              <button onClick={() => setCurrentView('map')} className={`transition-colors ${currentView === 'map' ? 'text-[#2f3b5c] border-b-2 border-[#2f3b5c]' : 'hover:text-[#2f3b5c]'}`}>{t.navMap}</button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsUserDrawerOpen(true)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-slate-700 shadow-sm"
              title={currentUser ? `Perfil de ${currentUser.name}` : t.navUserLogin}
            >
              <div className="w-8 h-8 rounded-full bg-[#2f3b5c] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                {currentUser ? currentUser.name.charAt(0).toUpperCase() : <User className="w-4 h-4 text-white" />}
              </div>
              <span className="hidden sm:inline text-xs font-bold truncate max-w-[130px]">
                {currentUser ? currentUser.name : t.navUserLogin}
              </span>
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
                {t.heroTitle}
              </h1>
              <p className="text-lg text-slate-300 max-w-2xl font-medium">
                {t.heroSubtitle}
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
              {t.formTitle}
            </h2>

            <form onSubmit={handlePredict} className="space-y-6">
              
              {/* SELECTOR DE ESTACIÓN PROPIO (REEMPLAZA A DATALIST NATIVO) */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">
                    {t.formStationLabel}
                  </label>
                  <span className="text-xs text-slate-400 font-medium">
                    276 estaciones activas
                  </span>
                </div>

                <StationCombobox
                  stations={mapStations}
                  value={stationId}
                  onChange={setStationId}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                  brokenStations={ESTACIONES_ROTAS}
                  placeholder={t.formStationPlaceholder}
                  onSelectStation={(st) => {
                    setMapCenter([st.lat, st.lng]);
                    setMapZoom(16);
                  }}
                />

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

              {/* SELECTOR TEMPORAL CONTINUO (TIME SCRUBBER #4) */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">
                  {t.formDateLabel}
                </label>
                <TimeScrubber
                  value={dateTime}
                  onChange={setDateTime}
                  minDate={minDate}
                  maxDate={maxDate}
                />
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
                    {t.formCalculating}
                  </>
                ) : (
                  <>
                    {t.formSubmitBtn}
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
                <h3 className="text-xl font-bold text-slate-600 mb-2">{t.waitingInputTitle}</h3>
                <p className="max-w-md text-slate-500 text-sm">
                  {t.waitingInputDesc}
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
                        {prediction.model_available === false ? t.mapModelUnavailable : 'IA OK'}
                      </span>
                      <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2 flex-wrap min-w-0">
                        <span className="break-words block max-w-full">
                          {prediction.station_title || (prediction.station_id ? `Estación ${prediction.station_id}` : '')}
                        </span>
                        {prediction.is_favorite && (
                          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400 drop-shadow-sm shrink-0" title="Favorita" />
                        )}
                        {prediction.custom_name && prediction.station_id && (
                          <span className="text-lg font-medium text-slate-400 shrink-0">
                            (#{prediction.station_id})
                          </span>
                        )}
                      </h3>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-slate-500 whitespace-nowrap">{t.predCapacity}</p>
                      <p className="text-2xl font-black text-slate-800">{prediction.cap}</p>
                    </div>
                  </div>

                  {prediction.model_available === false ? (
                    <div className="text-center py-6 px-4">
                      <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100">
                        <Clock className="w-8 h-8 text-amber-600" />
                      </div>
                      <p className="text-lg font-bold text-slate-700">{t.predModelDev}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                      {/* NÚMERO GIGANTE (yhat) */}
                      <div className="text-center flex-shrink-0" id="texto_resultado">
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">{t.predBikesAvailable}</p>
                        <div className="text-7xl md:text-8xl font-black text-[#2f3b5c] tracking-tighter tabular-nums drop-shadow-sm">
                          {prediction.yhat}
                        </div>
                        <p className="text-slate-600 font-medium mt-2">{t.predBikesAvailable}: {prediction.yhat}</p>
                      </div>

                      {/* GRÁFICO TIPO GAUGE / BARRA DE PROGRESO */}
                      <div className="flex-1 w-full min-w-0 space-y-4">
                        <div className="flex justify-between text-sm font-bold text-slate-600 mb-1">
                          <span>{t.predOccupancyEst}</span>
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
                          <span>{t.predSuccessLow} (0)</span>
                          <span>{t.predSuccessHigh} ({prediction.cap})</span>
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
                        <h4 className="text-sm font-bold text-slate-800 mb-1">{t.predUncertaintyMargin}</h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          [{prediction.yhat_lower} — {prediction.yhat_upper}] {t.predAvailableTag}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                        <Info className="w-6 h-6 text-amber-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-1">{t.predWeatherConditions}</h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {prediction.temp}ºC • {prediction.prec}mm
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
                      <h4 className="text-sm font-bold text-slate-800 mb-1">{t.predSuccessProb}</h4>
                      {prediction.model_available === false ? (
                        <p className="text-xs text-slate-500 mt-1 leading-normal font-medium">
                          {t.predModelDev}
                        </p>
                      ) : (
                        <div className="mt-1">
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-slate-800 tracking-tight">
                              {prediction.probabilidad_disponible}%
                            </span>
                            <span className="text-xs font-semibold text-slate-400">{t.predAvailableTag}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-normal mt-1">
                            {t.predSuccessHint}
                          </p>
                          <div className="mt-2 flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${
                              prediction.probabilidad_disponible !== undefined && prediction.probabilidad_disponible !== null && prediction.probabilidad_disponible > 75 ? 'bg-emerald-500 animate-pulse' :
                              prediction.probabilidad_disponible !== undefined && prediction.probabilidad_disponible !== null && prediction.probabilidad_disponible < 25 ? 'bg-red-500 animate-pulse' :
                              'bg-orange-500 animate-pulse'
                            }`} />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              {prediction.probabilidad_disponible !== undefined && prediction.probabilidad_disponible !== null && prediction.probabilidad_disponible > 75 ? t.predSuccessHigh :
                               prediction.probabilidad_disponible !== undefined && prediction.probabilidad_disponible !== null && prediction.probabilidad_disponible < 25 ? t.predSuccessLow :
                               t.predSuccessMedium
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
            <h2 className="text-2xl md:text-3xl font-black text-[#2f3b5c] tracking-tight">{t.mapTitle}</h2>
            <p className="text-xs md:text-sm text-slate-500 font-medium">{t.mapSubtitle}</p>
          </div>
          <button 
            onClick={() => setCurrentView('home')}
            className="self-start sm:self-center inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition-colors shrink-0"
          >
            {t.mapBackToForecast}
          </button>
        </div>

        {/* Map view Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[500px]">
          
          {/* Left Panel: Selected station info & list selector */}
          <div className="order-2 lg:order-1 lg:col-span-4 bg-white rounded-3xl p-6 shadow-xl border border-slate-100 flex flex-col space-y-6 lg:max-h-[calc(100vh-210px)] overflow-y-auto z-10">
            {/* selected station detail */}
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-3">{t.mapSelectedStation}</span>
              {(() => {
                const selectedStation = mapStations.find(s => s.id && stationId && s.id.toString() === getCleanId(stationId));
                if (!selectedStation) {
                  return (
                    <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-5 text-center text-slate-400">
                      <MapIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold leading-relaxed">
                        {t.mapSelectHint}
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
                          <span className="text-xs font-mono text-slate-400">ID: {selectedStation.id}</span>
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
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white p-3 rounded-xl border border-slate-100">
                        <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">{t.mapDocksCapacity}</p>
                        <p className="text-lg font-black text-[#2f3b5c]">{selectedStation.cap} <span className="text-xs text-slate-400 font-normal">{t.mapTotalDocks}</span></p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-100">
                        <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Tiempo Real</p>
                        <p className="text-lg font-black text-blue-600">{selectedStation.currentBikes !== undefined ? selectedStation.currentBikes : '—'} <span className="text-xs text-slate-400 font-normal">bicis</span></p>
                      </div>
                    </div>

                    {broken && (
                      <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex gap-2 text-xs text-red-700">
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <p>{t.mapMaintenanceNotice}</p>
                      </div>
                    )}

                    {/* Quick prediction configuration */}
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider focus:outline-none" htmlFor="map_datetime">
                          {t.formDateLabel}:
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
                        {t.formSubmitBtn}
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
                    <h4 className="text-xs font-bold text-slate-700 leading-tight truncate">{t.mapOnlyFavsTitle}</h4>
                    <p className="text-[10px] text-slate-400 font-medium">{t.mapOnlyFavsDesc}</p>
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
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">
                {showOnlyFavorites ? `${t.mapFavoriteStations} (${displayedStations.length})` : `${t.mapDatasetStations} (${displayedStations.length})`}
              </span>

              {/* Buscador de estaciones en el panel lateral */}
              <div className="relative mb-3">
                <input
                  type="text"
                  placeholder={currentLang === 'va' ? "Cercar per carrer o ID..." : currentLang === 'en' ? "Search by street or ID..." : "Buscar por calle o ID..."}
                  value={mapSearchQuery}
                  onChange={(e) => setMapSearchQuery(e.target.value)}
                  className="w-full text-xs pl-8 pr-7 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#2f3b5c]/20 outline-none transition-all placeholder:text-slate-400 font-medium"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                {mapSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setMapSearchQuery('')}
                    className="absolute right-2 top-2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="space-y-2 overflow-y-auto pr-1 flex-1 min-h-[180px]">
                {displayedStations.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs font-medium">
                    {currentLang === 'va' ? "No s'han trobat estacions" : currentLang === 'en' ? "No stations found" : "No se encontraron estaciones"}
                  </div>
                ) : (
                  displayedStations.map((station) => {
                    const isSelected = stationId && getCleanId(stationId) === station.id.toString();
                    const isBroken = ESTACIONES_ROTAS.includes(parseInt(station.id, 10));
                    return (
                      <button
                        key={station.id}
                        onClick={() => {
                          setStationId(`${station.id} - ${station.name}`);
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
                            <span className="text-[10px] font-mono text-slate-400">ID: {station.id} {isBroken && `• ${t.mapMaintenanceTag}`}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-extrabold px-2 py-1 rounded-full bg-slate-100 text-[#2f3b5c] block">
                            {station.cap} {t.mapTotalBases}
                          </span>
                          {station.currentBikes !== undefined && (
                            <span className="text-[9px] text-blue-600 font-bold block mt-0.5">
                              {station.currentBikes} bicis
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
          
          {/* Right Panel: Map Frame */}
          <div className="order-1 lg:order-2 lg:col-span-8 flex flex-col relative bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden w-full h-[550px] lg:h-auto min-h-[450px]">

            {/* Selector flotante de capas de mapa (CARTO Positron / Voyager / OSM) */}
            <div className="absolute top-3 right-3 z-[400] bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-xl p-1 shadow-md flex items-center gap-1 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setTileStyle('positron')}
                className={`px-2.5 py-1 rounded-lg transition-all ${tileStyle === 'positron' ? 'bg-[#2f3b5c] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                CARTO Claro
              </button>
              <button
                type="button"
                onClick={() => setTileStyle('voyager')}
                className={`px-2.5 py-1 rounded-lg transition-all ${tileStyle === 'voyager' ? 'bg-[#2f3b5c] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                CARTO Color
              </button>
              <button
                type="button"
                onClick={() => setTileStyle('osm')}
                className={`px-2.5 py-1 rounded-lg transition-all ${tileStyle === 'osm' ? 'bg-[#2f3b5c] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                OSM
              </button>
            </div>

            <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%', zIndex: 0 }}>
              <ChangeMapView center={mapCenter} zoom={mapZoom} />
              <TileLayer
                key={`${tileStyle}-${CARTO_API_KEY ? 'keyed' : 'free'}`}
                attribution={
                  tileStyle === 'osm' 
                    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' 
                    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                }
                subdomains="abcd"
                maxZoom={20}
                url={
                  tileStyle === 'voyager' 
                    ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png${CARTO_API_KEY ? `?key=${encodeURIComponent(CARTO_API_KEY)}` : ''}`
                    : tileStyle === 'positron'
                    ? `https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png${CARTO_API_KEY ? `?key=${encodeURIComponent(CARTO_API_KEY)}` : ''}`
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
                        setStationId(`${station.id} - ${station.name}`);
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
                          Estación #{station.id} • {t.predCapacity}: <span className="text-slate-800 font-extrabold">{station.cap} {t.mapTotalBases}</span>
                        </p>
                        {station.currentBikes !== undefined && (
                          <p className="text-blue-600 font-extrabold text-[11px]">
                            🚲 {station.currentBikes} bicis en tiempo real
                          </p>
                        )}
                        {ESTACIONES_ROTAS.includes(parseInt(station.id, 10)) && (
                          <span className="inline-flex items-center gap-1 text-red-500 font-bold uppercase text-[9px] bg-red-50 px-1.5 py-0.5 rounded-md mt-1">⚠️ {t.mapMaintenanceTag}</span>
                        )}
                      </div>
                    </Tooltip>

                    {/* POPUP CARD ACTIONS */}
                    <Popup>
                      <div className="text-center p-1.5 min-w-[150px] font-sans">
                        <h3 className="font-extrabold text-[#2f3b5c] mb-1.5 text-xs leading-tight">{station.name}</h3>
                        
                        {isPredictedStation ? (
                          <div className="bg-blue-50 border border-blue-100 rounded-xl p-2 mb-2">
                             <p className="text-[9px] font-bold text-blue-800 uppercase mb-0.5">{t.mapForecastPopup} ({new Date(dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})</p>
                             {prediction.model_available === false ? (
                               <p className="text-xs text-amber-600 font-bold">{t.mapModelUnavailable}</p>
                             ) : (
                               <p className="text-xs text-slate-700">
                                 {t.predBikesAvailable}: <strong className="text-blue-600 font-black text-sm">{prediction.yhat}</strong> / {prediction.cap}
                               </p>
                             )}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-600 mb-2 leading-tight">
                            {t.mapPopupCapacity}<br/>
                            <strong className="text-[#2f3b5c] text-sm font-black">{station.cap}</strong> {t.mapTotalBases}
                            {station.currentBikes !== undefined && (
                              <span className="block text-blue-600 font-bold mt-0.5">
                                ({station.currentBikes} bicis disponibles)
                              </span>
                            )}
                          </p>
                        )}
                        
                        <button 
                          onClick={() => {
                            setStationId(`${station.id} - ${station.name}`);
                            setCurrentView('home');
                          }}
                          className="text-[10px] font-bold bg-[#2f3b5c] hover:bg-[#151a29] text-white px-3 py-1.5 rounded-lg transition-colors w-full"
                        >
                          {t.mapSelectBtn}
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
          <span className="text-[10px] font-bold tracking-wide">{t.navForecast}</span>
        </button>
        <button 
          onClick={() => setCurrentView('map')} 
          className={`flex flex-col items-center justify-center w-1/2 h-full ${currentView === 'map' ? 'text-[#2f3b5c]' : 'text-slate-400'}`}
        >
          <MapIcon className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold tracking-wide">{t.navMap}</span>
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

      {/* DRAWER LATERAL DE USUARIO / AUTENTICACIÓN */}
      <AnimatePresence>
        {isUserDrawerOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-slate-900/40 backdrop-blur-sm flex justify-end"
            onClick={() => setIsUserDrawerOpen(false)}
          >
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 240 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col p-6 md:p-8 overflow-y-auto"
            >
              {/* Encabezado del Drawer */}
              <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#2f3b5c]/10 text-[#2f3b5c] flex items-center justify-center font-bold text-sm">
                    {currentUser ? currentUser.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[#2f3b5c] text-lg leading-tight">
                      {currentUser ? t.navUserProfile : t.drawerAccountTitle}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      {currentUser ? currentUser.email : t.drawerAccountSubtitle}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsUserDrawerOpen(false)} 
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contenido según estado: Logueado vs Formulario */}
              {currentUser ? (
                /* --- VISTA DE PERFIL DE USUARIO LOGUEADO --- */
                <div className="py-6 space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-6">
                    {/* Tarjeta de perfil */}
                    <div className="bg-gradient-to-br from-[#2f3b5c] to-[#1e263d] text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
                      <div className="relative z-10 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm">
                            {t.drawerValenbaUser}
                          </span>
                          <span className="text-xs text-slate-300 font-mono">
                            {t.drawerMemberSince} {currentUser.createdAt || '2026'}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-xl font-black">{currentUser.name}</h4>
                          <p className="text-xs text-slate-300 font-mono">{currentUser.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Resumen de Favoritas */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
                          {t.drawerFavsTitle} ({favorites.length})
                        </h4>
                        <button 
                          onClick={() => {
                            setCurrentView('map');
                            setShowOnlyFavorites(true);
                            setIsUserDrawerOpen(false);
                          }}
                          className="text-[11px] font-bold text-[#2f3b5c] hover:underline"
                        >
                          {t.drawerFavHint}
                        </button>
                      </div>

                      {favorites.length === 0 ? (
                        <p className="text-xs text-slate-400 font-medium py-2">
                          {t.drawerNoFavs}
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {favorites.map((fav) => {
                            const station = mapStations.find(s => s.id.toString() === fav.id.toString());
                            return (
                              <div key={fav.id} className="bg-white p-2.5 rounded-xl border border-slate-200/70 flex items-center justify-between gap-2 text-xs">
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-800 truncate">{fav.customName || station?.name || `Estación ${fav.id}`}</p>
                                  <span className="text-[10px] font-mono text-slate-400">ID: {fav.id}</span>
                                </div>
                                <button 
                                  onClick={() => {
                                    setStationId(fav.id.toString());
                                    setCurrentView('home');
                                    setIsUserDrawerOpen(false);
                                  }}
                                  className="text-[10px] font-bold bg-slate-100 hover:bg-[#2f3b5c] hover:text-white px-2.5 py-1 rounded-lg transition-colors shrink-0"
                                >
                                  {t.drawerPredictQuick}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Ventajas de la cuenta */}
                    <div className="space-y-2.5 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{t.drawerSyncActive}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{t.drawerUnlimitedAccess}</span>
                      </div>
                    </div>
                  </div>

                  {/* Selector de idioma y Botón Cerrar Sesión */}
                  <div className="pt-2 space-y-3">
                    <LanguageSelector />
                    <button
                      onClick={handleLogout}
                      className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      {t.drawerLogoutBtn}
                    </button>
                  </div>
                </div>
              ) : (
                /* --- VISTA DE FORMULARIO (LOGIN / REGISTRO) --- */
                <div className="py-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-5">
                    {/* Selector de Pestañas Login vs Registro */}
                    <div className="bg-slate-100 p-1 rounded-xl flex">
                      <button
                        onClick={() => { setAuthMode('login'); setAuthError(null); setAuthSuccess(null); }}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                          authMode === 'login' ? 'bg-white text-[#2f3b5c] shadow-sm' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        {t.drawerLoginTab}
                      </button>
                      <button
                        onClick={() => { setAuthMode('register'); setAuthError(null); setAuthSuccess(null); }}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                          authMode === 'register' ? 'bg-white text-[#2f3b5c] shadow-sm' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        {t.drawerRegisterTab}
                      </button>
                    </div>

                    {/* Mensajes de Alerta */}
                    {authError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                        <span>{authError}</span>
                      </div>
                    )}
                    {authSuccess && (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3 rounded-xl flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                        <span>{authSuccess}</span>
                      </div>
                    )}

                    {/* Formulario */}
                    <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                      {authMode === 'register' && (
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                            {t.drawerNameLabel}
                          </label>
                          <div className="relative">
                            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                            <input
                              type="text"
                              required
                              placeholder={t.drawerNamePlaceholder}
                              value={authName}
                              onChange={(e) => setAuthName(e.target.value)}
                              className="w-full text-xs pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl outline-none bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#2f3b5c]/20 focus:border-[#2f3b5c]"
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                          {t.drawerEmailLabel}
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                          <input
                            type="email"
                            required
                            placeholder={t.drawerEmailPlaceholder}
                            value={authEmail}
                            onChange={(e) => setAuthEmail(e.target.value)}
                            className="w-full text-xs pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl outline-none bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#2f3b5c]/20 focus:border-[#2f3b5c]"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                          {t.drawerPasswordLabel}
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            placeholder={t.drawerPasswordPlaceholder}
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            className="w-full text-xs pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl outline-none bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#2f3b5c]/20 focus:border-[#2f3b5c]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-[#2f3b5c] hover:bg-[#1f2840] text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-md shadow-[#2f3b5c]/20 flex items-center justify-center gap-2 mt-2"
                      >
                        {authMode === 'login' ? (
                          <>
                            <LogIn className="w-4 h-4" />
                            {t.drawerLoginBtn}
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4" />
                            {t.drawerRegisterBtn}
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* SELECTOR DE IDIOMA CON LAS 3 BANDERAS ENTRE EL BOTÓN Y EL PIE */}
                  <LanguageSelector />

                  {/* Pie del formulario */}
                  <div className="text-center pt-2">
                    <p className="text-xs text-slate-400 font-medium">
                      {authMode === 'login' ? t.drawerNoAccount : t.drawerHaveAccount}{' '}
                      <button
                        onClick={() => {
                          setAuthMode(authMode === 'login' ? 'register' : 'login');
                          setAuthError(null);
                          setAuthSuccess(null);
                        }}
                        className="font-bold text-[#2f3b5c] hover:underline"
                      >
                        {authMode === 'login' ? t.drawerRegisterLink : t.drawerLoginLink}
                      </button>
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
