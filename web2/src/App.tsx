import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bike, 
  MapPin, 
  CalendarClock, 
  AlertTriangle, 
  Info,
  ChevronRight,
  Map as MapIcon,
  User,
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
  LocateFixed,
  BookOpen,
  Navigation,
  Layers,
  ArrowRight
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

// Fórmula geodésica Haversine para calcular distancia en metros entre dos coordenadas
const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

// Marcador Píldora Dinámico con número de bicicletas en tiempo real (Inspirado en Valenbisi / Transit)
const getStationIcon = (
  stationId: string,
  cap: number,
  isSelected: boolean,
  isFavorite?: boolean,
  currentBikes?: number,
  isBroken?: boolean
) => {
  const bikesNum = currentBikes !== undefined ? currentBikes : cap;
  let pillVariant = 'marker-pill-normal';
  let arrowVariant = 'marker-pill-arrow-normal';
  let statusIndicatorHtml = '<span class="w-2 h-2 rounded-full bg-[#55b73e] shrink-0"></span>';

  if (isBroken) {
    pillVariant = 'marker-pill-broken';
    arrowVariant = 'marker-pill-arrow-broken';
    statusIndicatorHtml = '<span class="w-2 h-2 rounded-full bg-slate-300 shrink-0"></span>';
  } else if (isFavorite) {
    pillVariant = 'marker-pill-favorite';
    arrowVariant = 'marker-pill-arrow-favorite';
    statusIndicatorHtml =
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="#78350f" stroke="#78350f" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
  } else if (bikesNum === 0) {
    pillVariant = 'marker-pill-empty';
    arrowVariant = 'marker-pill-arrow-empty';
    statusIndicatorHtml = '<span class="w-1.5 h-1.5 rounded-full bg-white/90 shrink-0"></span>';
  } else if (bikesNum <= 4) {
    pillVariant = 'marker-pill-low';
    arrowVariant = 'marker-pill-arrow-normal';
    statusIndicatorHtml = '<span class="w-2 h-2 rounded-full bg-[#fbbf24] shrink-0"></span>';
  }

  const selectedClass = isSelected ? 'selected' : '';
  const displayValue = isBroken ? '—' : bikesNum;

  return L.divIcon({
    html: `
      <div class="relative flex flex-col items-center justify-center">
        ${isSelected ? `<span class="absolute -top-1 inline-flex h-8 w-11 animate-ping rounded-full ${isFavorite ? 'bg-amber-400/35' : 'bg-[#2f3b5c]/30'}"></span>` : ''}
        <div class="relative marker-pill ${pillVariant} ${selectedClass}">
          ${statusIndicatorHtml}
          <span>${displayValue}</span>
        </div>
        <div class="marker-pill-arrow ${arrowVariant}"></div>
      </div>
    `,
    className: 'custom-bike-marker',
    iconSize: [44, 32],
    iconAnchor: [22, 30],
    popupAnchor: [0, -30],
    tooltipAnchor: [0, -28]
  });
};

// Map visual view-changer helper component
function ChangeMapView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [center, zoom, map]);
  return null;
}

// Valencia Center Coordinates
const VALENCIA_CENTER: [number, number] = [39.4699, -0.3763];

// --- CONFIGURACIÓN & REGLAS DE NEGOCIO ---
const ESTACIONES_ROTAS = [105, 146, 168, 299];
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
  // --- ESTADO DE VISTA MAPA VS PREDICCIÓN ---
  const [showMap, setShowMap] = useState<boolean>(true);
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
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);

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
        if (!privacyConsent) {
          setAuthError(t.drawerPrivacyRequired);
          return;
        }
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
        setFavorites([]);
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
        } else {
          setFavorites([]);
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
    try {
      const guestSaved = localStorage.getItem('valenba_favorites_guest');
      setFavorites(guestSaved ? JSON.parse(guestSaved) : []);
    } catch {
      setFavorites([]);
    }
    setAuthSuccess(null);
    setAuthError(null);
  };

  // --- ESTADO DEL MAPA ---
  const [mapStations, setMapStations] = useState<MapStation[]>(DEFAULT_STATIONS);
  const [mapCenter, setMapCenter] = useState<[number, number]>(VALENCIA_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(14);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [mapFilterMode, setMapFilterMode] = useState<'all' | 'bikes' | 'docks'>('all');
  const [mapStyle, setMapStyle] = useState<'light' | 'voyager' | 'osm'>('light');
  const [isLocating, setIsLocating] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState('');

  // EFECTO PARA CARGOS DE DATOS REALES DEL MAPA Y FAVORITAS (POLLING ACTIVO 30s)
  useEffect(() => {
    let isMounted = true;
    const fetchStations = () => {
      fetch(getApiUrl('/api/estaciones'))
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setMapStations(data);
          }
        })
        .catch(err => {
          console.warn('API /api/estaciones no disponible, manteniendo dataset base local:', err);
        });
    };

    // 1. Carga inicial
    fetchStations();

    // 2. Polling cada 30 segundos para refrescar bicicletas en tiempo real
    const interval = setInterval(fetchStations, 30000);

    // 3. Sincronización inmediata al volver a enfocar la pestaña
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchStations();
      }
    };
    window.addEventListener('focus', fetchStations);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', fetchStations);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Sincronizar favoritas de la base de datos si el usuario está logueado
  useEffect(() => {
    if (currentUser?.email) {
      fetch(getApiUrl(`/api/user/favorites?email=${encodeURIComponent(currentUser.email)}`))
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setFavorites(data);
          }
        })
        .catch(console.error);
    }
  }, [currentUser?.email]);

  // --- TELEMETRÍA EN DIRECTO DE LA RED VALENBISI ---
  const networkStats = useMemo(() => {
    let activeCount = 0;
    let totalBikes = 0;
    let totalFreeDocks = 0;
    for (const s of mapStations) {
      const numId = parseInt(s.id, 10);
      const isBroken = !isNaN(numId) && ESTACIONES_ROTAS.includes(numId);
      if (!isBroken && s.isOpen !== false) {
        activeCount++;
      }
      const bikes = s.currentBikes !== undefined ? s.currentBikes : 0;
      const docks = s.freeDocks !== undefined ? s.freeDocks : Math.max(0, s.cap - bikes);
      totalBikes += bikes;
      totalFreeDocks += docks;
    }
    return { activeCount, totalBikes, totalFreeDocks };
  }, [mapStations]);

  // --- LIMITES DE FECHA Y RELOJ REACTIVO ---
  const [currentSystemTime, setCurrentSystemTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const updateTime = () => setCurrentSystemTime(new Date());
    const interval = setInterval(updateTime, 5000);
    window.addEventListener('focus', updateTime);
    document.addEventListener('visibilitychange', updateTime);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', updateTime);
      document.removeEventListener('visibilitychange', updateTime);
    };
  }, []);

  const { minDate, maxDate, defaultDateTime } = useMemo(() => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const format = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    
    const now = currentSystemTime;
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
  }, [currentSystemTime]);

  // --- ESTADO DEL FORMULARIO ---
  const [stationId, setStationId] = useState<string>('');
  const [dateTime, setDateTime] = useState<string>(() => defaultDateTime);

  // Auto-ajuste si la fecha elegida quedó en el pasado tras cruzar medianoche
  useEffect(() => {
    if (dateTime) {
      const selected = new Date(dateTime).getTime();
      if (!isNaN(selected) && selected < currentSystemTime.getTime() - 2 * 60 * 1000) {
        setDateTime(defaultDateTime);
      }
    }
  }, [currentSystemTime, defaultDateTime, dateTime]);

  // --- INTERFACES ---
  interface FavoriteStation {
    id: string | number;
    customName?: string;
  }

  // --- ESTADO DE FAVORITOS ---
  const [favorites, setFavorites] = useState<FavoriteStation[]>(() => {
    try {
      const userStr = localStorage.getItem('valenba_current_user');
      const user = userStr ? JSON.parse(userStr) : null;
      const key = user?.email ? `valenba_favorites_${user.email}` : 'valenba_favorites_guest';
      const saved = localStorage.getItem(key) || (user?.email ? null : localStorage.getItem('valenbisi_favorites'));
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
    const key = currentUser?.email ? `valenba_favorites_${currentUser.email}` : 'valenba_favorites_guest';
    localStorage.setItem(key, JSON.stringify(favorites));
  }, [favorites, currentUser?.email]);

  // Si no quedan favoritas, desactivar el filtro de solo favoritas automáticamente
  useEffect(() => {
    if (favorites.length === 0 && showOnlyFavorites) {
      setShowOnlyFavorites(false);
    }
  }, [favorites.length, showOnlyFavorites]);

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

  // Memoized filtered stations list based on favorites toggle, filter mode (bikes/docks), and search query
  const displayedStations = useMemo(() => {
    const q = mapSearchQuery.trim().toLowerCase();
    return mapStations.filter(station => {
      if (showOnlyFavorites) {
        const isFav = favorites.some(f => f.id && getCleanId(f.id.toString()) === station.id.toString());
        if (!isFav) return false;
      }
      if (mapFilterMode === 'bikes') {
        const bikes = station.currentBikes !== undefined ? station.currentBikes : station.cap;
        if (bikes <= 0) return false;
      } else if (mapFilterMode === 'docks') {
        const bikes = station.currentBikes !== undefined ? station.currentBikes : 0;
        const docks = station.freeDocks !== undefined ? station.freeDocks : Math.max(0, station.cap - bikes);
        if (docks <= 0) return false;
      }
      if (q) {
        const matchName = station.name && station.name.toLowerCase().includes(q);
        const matchId = station.id && station.id.toString().includes(q);
        const matchAddr = station.address && station.address.toLowerCase().includes(q);
        return matchName || matchId || matchAddr;
      }
      return true;
    });
  }, [mapStations, showOnlyFavorites, mapFilterMode, favorites, mapSearchQuery]);

  const currentStationStr = typeof stationId === 'string' ? stationId.trim() : (stationId ? (stationId as any).toString().trim() : '');
  const cleanCurrentStationId = getCleanId(currentStationStr);
  const isCurrentFavorite = cleanCurrentStationId !== '' && favorites.some(f => f.id && getCleanId(f.id.toString()) === cleanCurrentStationId);

  const selectedStationObj = useMemo(() => {
    if (!cleanCurrentStationId) return null;
    return mapStations.find(s => s.id.toString() === cleanCurrentStationId) || null;
  }, [cleanCurrentStationId, mapStations]);

  // Geolocalización: encontrar la estación operativa más cercana al usuario
  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        let closest: MapStation | null = null;
        let minDist = Infinity;
        for (const s of mapStations) {
          const numId = parseInt(s.id, 10);
          if (!isNaN(numId) && ESTACIONES_ROTAS.includes(numId)) continue;
          const d = getDistanceMeters(latitude, longitude, s.lat, s.lng);
          if (d < minDist) {
            minDist = d;
            closest = s;
          }
        }
        if (closest) {
          setStationId(`${closest.id} - ${closest.name}`);
          setMapCenter([closest.lat, closest.lng]);
          setMapZoom(16);
          setShowMap(true);
        }
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

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
    current_bikes?: number;
    free_docks?: number;
    is_open?: boolean;
    updated_at?: string;
  } | null>(null);

  // Estación alternativa más cercana ("Plan B" geodésico) para la estación predicha
  const planBStation = useMemo(() => {
    const targetId = prediction?.station_id || cleanCurrentStationId;
    if (!targetId) return null;
    const origin = mapStations.find(s => s.id.toString() === targetId.toString());
    if (!origin) return null;

    let best: { station: MapStation; distanceMeters: number; walkMins: number } | null = null;
    for (const candidate of mapStations) {
      if (candidate.id.toString() === origin.id.toString()) continue;
      const numId = parseInt(candidate.id, 10);
      if (!isNaN(numId) && ESTACIONES_ROTAS.includes(numId)) continue;
      if (candidate.isOpen === false) continue;
      // Priorizar estaciones con bicicletas disponibles en tiempo real
      if (candidate.currentBikes !== undefined && candidate.currentBikes === 0) continue;

      const dist = getDistanceMeters(origin.lat, origin.lng, candidate.lat, candidate.lng);
      if (!best || dist < best.distanceMeters) {
        best = {
          station: candidate,
          distanceMeters: dist,
          walkMins: Math.max(1, Math.round(dist / 75))
        };
      }
    }
    return best;
  }, [prediction?.station_id, cleanCurrentStationId, mapStations]);

  // Función reutilizable para ejecutar predicción sobre cualquier estación
  const runPredictionForStation = async (targetStationStr: string) => {
    setError(null);
    setPrediction(null);

    const cleanId = getCleanId(targetStationStr);
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
        estacion: targetStationStr,
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
      const stationTitle = favInfo?.customName || (matchedStation ? `${matchedStation.id} - ${matchedStation.name}` : (parseInt(cleanId, 10).toString() !== "NaN" ? `Estación ${cleanId}` : targetStationStr));

      setPrediction({
        ...data,
        station_id: cleanId,
        station_title: stationTitle,
        is_favorite: !!favInfo,
        custom_name: favInfo?.customName,
        yhat: data.bicicletas_disponibles,
        yhat_lower: data.yhat_lower,
        yhat_upper: data.yhat_upper,
        cap: data.cap || (matchedStation ? matchedStation.cap : 30),
        occupancy: data.occupancy,
        probabilidad_disponible: data.probabilidad_disponible,
        current_bikes: data.current_bikes !== undefined ? data.current_bikes : matchedStation?.currentBikes,
        free_docks: data.free_docks !== undefined ? data.free_docks : matchedStation?.freeDocks,
        is_open: data.is_open !== undefined ? data.is_open : matchedStation?.isOpen,
        updated_at: data.updated_at || matchedStation?.updatedAt
      });
      setShowMap(false);

    } catch (err) {
      setError('Error al conectar con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  // --- LÓGICA DE API ---
  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    await runPredictionForStation(stationId);
  };

  // --- RENDERIZADO DE INTERFAZ ---
  return (
    <div className="min-h-screen bg-valenba-canvas font-sans text-slate-800 pb-16 md:pb-0 flex flex-col">
      {/* HEADER INSTITUCIONAL / FUNCIONAL ESTILO VALENBISI */}
      <header className="bg-white/95 backdrop-blur-md shadow-2xs border-b border-slate-200/90 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="flex items-center gap-2.5 cursor-pointer group"
              onClick={() => setShowMap(true)}
            >
              <div className="w-10 h-10 bg-[#2f3b5c] group-hover:bg-[#1a84ce] transition-colors rounded-xl flex items-center justify-center shadow-xs">
                <Bike className="text-white w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-[#2f3b5c] tracking-tight leading-none">
                  valen<span className="text-[#1a84ce]">BA</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-400 tracking-widest uppercase mt-0.5">
                  VALÈNCIA • {networkStats.activeCount} EST.
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Selector compacto de idioma en cabecera (estilo Valenbisi oficial) */}
            <div className="hidden md:flex items-center bg-[#FAF9F5] p-1 rounded-xl border border-slate-200/90">
              {(['es', 'va', 'en'] as Language[]).map((langCode) => {
                const isActive = currentLang === langCode;
                const label = langCode === 'va' ? 'VAL' : langCode.toUpperCase();
                return (
                  <button
                    key={langCode}
                    type="button"
                    onClick={() => changeLanguage(langCode)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-extrabold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#2f3b5c] text-white shadow-2xs'
                        : 'text-slate-500 hover:text-[#2f3b5c]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Botón directo a Metodología */}
            <button
              type="button"
              onClick={() => setShowHowItWorks(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200/90 bg-[#FAF9F5] hover:bg-slate-100 text-xs font-bold text-[#2f3b5c] transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#1a84ce]" />
              <span>{t.methodologyBtn}</span>
            </button>

            {/* Botón de Perfil / Acceso */}
            <button 
              onClick={() => setIsUserDrawerOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200/90 bg-white hover:border-[#2f3b5c]/40 hover:bg-[#FAF9F5] transition-all text-slate-700 shadow-2xs cursor-pointer"
              title={currentUser ? `Perfil de ${currentUser.name}` : t.navUserLogin}
            >
              <div className="w-7 h-7 rounded-lg bg-[#2f3b5c] text-white flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser ? currentUser.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5 text-white" />}
              </div>
              <span className="hidden sm:inline text-xs font-bold truncate max-w-[120px]">
                {currentUser ? currentUser.name : t.navUserLogin}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* BANNER CORPORATIVO VALENBISI CON TELEMETRÍA EN DIRECTO DE LA RED */}
      <div className="bg-[#2f3b5c] text-white py-5 md:py-6 px-4 border-b border-[#1d263d] relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '28px 28px'
          }}
        />
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
              {t.heroTitle}
            </h1>
          </div>

          {/* Telemetría agregada en vivo de las 276 estaciones */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 px-3 py-1.5 rounded-xl backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-[#55b73e] animate-pulse shrink-0" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-100">
                {t.networkLiveBadge}:
              </span>
              <span className="text-xs font-mono font-extrabold text-white tabular-nums">
                {networkStats.activeCount} est.
              </span>
            </div>

            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 px-3 py-1.5 rounded-xl backdrop-blur-xs">
              <span className="text-xs font-mono font-extrabold text-[#7be362] tabular-nums">
                🚲 {networkStats.totalBikes.toLocaleString()}
              </span>
              <span className="text-[11px] font-medium text-blue-100">
                {t.networkBikesAvailable}
              </span>
            </div>

            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 px-3 py-1.5 rounded-xl backdrop-blur-xs">
              <span className="text-xs font-mono font-extrabold text-sky-300 tabular-nums">
                🅿️ {networkStats.totalFreeDocks.toLocaleString()}
              </span>
              <span className="text-[11px] font-medium text-blue-100">
                {t.networkFreeDocks}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl w-full mx-auto px-4 py-6 md:py-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 flex-1">
        
        {/* COLUMNA IZQUIERDA: CONFIGURADOR TÁCTIL DE CONSULTA */}
        <motion.section 
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-5 bg-white rounded-2xl shadow-md shadow-slate-900/5 border-2 border-[#2f3b5c]/12 overflow-hidden self-start"
        >
          <div className="p-5 sm:p-7">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
              <h2 className="text-lg sm:text-xl font-black text-[#2f3b5c] flex items-center gap-2 tracking-tight">
                <MapPin className="w-5 h-5 text-[#1a84ce]" />
                {t.formTitle}
              </h2>
              <button
                type="button"
                onClick={handleLocateMe}
                disabled={isLocating}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2f3b5c] hover:text-white bg-[#FAF9F5] hover:bg-[#2f3b5c] px-3 py-1.5 rounded-xl border border-[#2f3b5c]/20 transition-all cursor-pointer shadow-2xs"
                title={t.locateMeBtn}
              >
                <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-[#1a84ce]' : 'text-[#1a84ce] group-hover:text-white'}`} />
                <span>{isLocating ? t.locatingMsg : t.locateMeBtn}</span>
              </button>
            </div>

            <form onSubmit={handlePredict} className="space-y-6">
              
              {/* PASO 01: SELECTOR DE ESTACIÓN */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="flex items-center gap-2 text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    <span className="font-mono text-[11px] bg-[#2f3b5c] text-white px-2 py-0.5 rounded-md">
                      01
                    </span>
                    <span>{t.formStationLabel}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {favorites.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowOnlyFavorites(prev => !prev)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                          showOnlyFavorites 
                            ? 'bg-amber-400/20 border-amber-400 text-amber-900 shadow-2xs' 
                            : 'bg-[#FAF9F5] border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-amber-700'
                        }`}
                        title={showOnlyFavorites ? t.viewAllStations : t.filterOnlyFavorites}
                      >
                        <Star className={`w-3.5 h-3.5 ${showOnlyFavorites ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                        <span>{showOnlyFavorites ? t.viewAllStations : `${t.filterOnlyFavorites} (${favorites.length})`}</span>
                      </button>
                    )}
                  </div>
                </div>

                <StationCombobox
                  stations={showOnlyFavorites ? displayedStations : mapStations}
                  value={stationId}
                  onChange={setStationId}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                  t={t}
                  brokenStations={ESTACIONES_ROTAS}
                  placeholder={t.formStationPlaceholder}
                  showOnlyFavorites={showOnlyFavorites}
                  onToggleOnlyFavorites={() => setShowOnlyFavorites(prev => !prev)}
                  onSelectStation={(st) => {
                    setMapCenter([st.lat, st.lng]);
                    setMapZoom(16);
                  }}
                />

                {/* TARJETA EN VIVO DE LA ESTACIÓN SELECCIONADA (PREVIEW INSTANTÁNEO) */}
                {selectedStationObj && (
                  <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#2f3b5c]/15 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-md bg-[#2f3b5c] text-white shrink-0">
                          #{selectedStationObj.id}
                        </span>
                        <span className="text-xs font-extrabold text-[#2f3b5c] truncate">
                          {selectedStationObj.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleFavorite(selectedStationObj.id)}
                        className="p-1 rounded-lg hover:bg-slate-200/70 transition-colors shrink-0 cursor-pointer"
                        title={t.favoriteBtn}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            isCurrentFavorite
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-400 hover:text-amber-500'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-0.5">
                      <div className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/80">
                        <span className="block text-[10px] font-bold uppercase text-slate-400">
                          {t.availableBikes}
                        </span>
                        <span
                          className={`font-mono text-sm font-extrabold tabular-nums ${
                            (selectedStationObj.currentBikes ?? 0) === 0
                              ? 'text-[#be0000]'
                              : (selectedStationObj.currentBikes ?? 0) <= 4
                              ? 'text-amber-600'
                              : 'text-[#3b8a28]'
                          }`}
                        >
                          🚲 {selectedStationObj.currentBikes ?? '—'}
                        </span>
                      </div>

                      <div className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/80">
                        <span className="block text-[10px] font-bold uppercase text-slate-400">
                          {t.liveFreeDocks}
                        </span>
                        <span className="font-mono text-sm font-extrabold text-[#1a84ce] tabular-nums">
                          🅿️{' '}
                          {selectedStationObj.freeDocks !== undefined
                            ? selectedStationObj.freeDocks
                            : Math.max(0, selectedStationObj.cap - (selectedStationObj.currentBikes || 0))}
                        </span>
                      </div>

                      <div className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/80">
                        <span className="block text-[10px] font-bold uppercase text-slate-400">
                          {t.predCapacity}
                        </span>
                        <span className="font-mono text-sm font-extrabold text-slate-700 tabular-nums">
                          {selectedStationObj.cap} {t.mapTotalBases}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* FAVORITAS (CHIPS DE ACCESO RÁPIDO) */}
                {favorites.length > 0 && (
                  <div className="pt-1 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase mr-1">
                      {t.favoritesPrefix}
                    </span>
                    {favorites.map(fav => {
                      const favIdStr = fav.id.toString();
                      const isSelected = getCleanId(currentStationStr) === getCleanId(favIdStr);
                      const isEditing = editingFavId === favIdStr;
                      
                      if (isEditing) {
                        return (
                          <div key={`edit-${fav.id}`} className="flex items-center bg-white border border-[#2f3b5c] rounded-lg overflow-hidden shadow-2xs pl-2.5 pr-1 py-0.5">
                            <span className="text-xs font-mono font-bold text-slate-400 mr-1.5">#{fav.id}</span>
                            <input
                              type="text"
                              value={editingName}
                              onChange={e => setEditingName(e.target.value)}
                              placeholder={t.namePrompt}
                              className="text-xs font-medium text-slate-700 outline-none w-20 bg-transparent"
                              autoFocus
                              onKeyDown={e => e.key === 'Enter' && saveEditingFav(favIdStr, e as any)}
                            />
                            <button type="button" onClick={(e) => saveEditingFav(favIdStr, e)} className="p-1 hover:bg-green-50 text-green-600 rounded transition-colors">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button type="button" onClick={cancelEditingFav} className="p-1 hover:bg-red-50 text-red-600 rounded transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={fav.id}
                          type="button"
                          onClick={() => {
                            setStationId(favIdStr);
                            const st = mapStations.find(s => s.id.toString() === favIdStr);
                            if (st) {
                              setMapCenter([st.lat, st.lng]);
                              setMapZoom(16);
                            }
                          }}
                          className={`text-xs font-bold pl-2.5 pr-2 py-1 rounded-lg border transition-colors flex items-center gap-1.5 group cursor-pointer ${
                            isSelected 
                              ? 'bg-amber-50 border-amber-400 text-amber-900'
                              : 'bg-[#FAF9F5] border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300'
                          }`}
                        >
                          <Star className={`w-3 h-3 shrink-0 ${isSelected ? 'fill-amber-500 text-amber-500' : 'text-amber-500/70 group-hover:text-amber-500'}`} />
                          <span className="truncate max-w-[110px]">
                            {fav.customName || `#${fav.id}`}
                          </span>
                          <div 
                            onClick={(e) => startEditingFav(fav, e)}
                            className={`p-0.5 rounded hover:bg-slate-200 transition-colors opacity-0 group-hover:opacity-100 ${isSelected ? 'hover:bg-amber-200' : ''}`}
                            title={t.renameStation}
                          >
                            <Edit2 className="w-2.5 h-2.5 text-slate-500" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* PASO 02: SELECTOR TEMPORAL CONTINUO (TIME SCRUBBER) */}
              <div className="space-y-2.5">
                <label className="flex items-center gap-2 text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  <span className="font-mono text-[11px] bg-[#2f3b5c] text-white px-2 py-0.5 rounded-md">
                    02
                  </span>
                  <span>{t.formDateLabel}</span>
                </label>
                <TimeScrubber
                  value={dateTime}
                  onChange={setDateTime}
                  minDate={minDate}
                  maxDate={maxDate}
                  t={t}
                  lang={currentLang}
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
                    <div className="bg-red-50 border-2 border-[#be0000]/25 text-[#be0000] px-4 py-3 rounded-xl flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-[#be0000] shrink-0 mt-0.5" />
                      <p className="text-xs font-bold leading-relaxed">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* BOTÓN TÁCTIL MECÁNICO DE CONSULTA */}
              <button
                id="boton_predecir"
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#2f3b5c] hover:bg-[#232d48] text-white py-4 px-6 rounded-xl font-extrabold text-base tracking-wide shadow-[0_4px_0_0_#18233C] hover:shadow-[0_3px_0_0_#18233C] hover:translate-y-[1px] active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center gap-2.5 disabled:opacity-70 disabled:cursor-not-allowed group cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t.formCalculating}</span>
                  </>
                ) : (
                  <>
                    <span>{t.formSubmitBtn}</span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.section>


        {/* COLUMNA DERECHA: MAPA INTERACTIVO CON PÍLDORAS EN VIVO Y BENTO DE PREDICCIÓN */}
        <div className="lg:col-span-7 flex flex-col space-y-4">

          {/* Barra superior para alternar entre Mapa y Predicción cuando existe una predicción */}
          {prediction && (
            <div className="flex items-center justify-between bg-white p-1.5 rounded-xl border-2 border-[#2f3b5c]/12 shadow-2xs">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowMap(false)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    !showMap 
                      ? 'bg-[#2f3b5c] text-white shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-[#FAF9F5]'
                  }`}
                >
                  <BarChart className="w-3.5 h-3.5" />
                  <span>{t.tabViewPrediction}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowMap(true)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    showMap 
                      ? 'bg-[#2f3b5c] text-white shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-[#FAF9F5]'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>{t.tabViewMap}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#2f3b5c] hover:bg-[#FAF9F5] transition-all cursor-pointer"
              >
                {showMap ? (
                  <>
                    <BarChart className="w-3.5 h-3.5 text-[#1a84ce]" />
                    <span>{t.tabViewPrediction}</span>
                  </>
                ) : (
                  <>
                    <MapIcon className="w-3.5 h-3.5 text-[#1a84ce]" />
                    <span>{t.btnBackToMap}</span>
                  </>
                )}
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {(!prediction || showMap) ? (
              <motion.div 
                key="map"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                className="bg-white rounded-2xl shadow-md shadow-slate-900/5 border-2 border-[#2f3b5c]/15 overflow-hidden relative flex flex-col h-[580px] lg:h-[650px] isolate"
              >
                {/* BARRA SUPERIOR FLOTANTE DE FILTROS DEL MAPA */}
                <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between pointer-events-none gap-2">
                  {/* Filtros rápidos de disponibilidad en el mapa (Todas / Con bicis / Con anclajes / Favoritas) */}
                  <div className="bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-slate-200/90 pointer-events-auto flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setMapFilterMode('all')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                        mapFilterMode === 'all'
                          ? 'bg-[#2f3b5c] text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {t.filterAll} ({displayedStations.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapFilterMode('bikes')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                        mapFilterMode === 'bikes'
                          ? 'bg-[#55b73e] text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>🚲</span>
                      <span className="hidden sm:inline">{t.filterWithBikes}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapFilterMode('docks')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                        mapFilterMode === 'docks'
                          ? 'bg-[#1a84ce] text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>🅿️</span>
                      <span className="hidden sm:inline">{t.filterWithDocks}</span>
                    </button>

                    {favorites.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowOnlyFavorites(prev => !prev)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                          showOnlyFavorites
                            ? 'bg-amber-400 text-amber-950'
                            : 'text-slate-600 hover:bg-amber-50'
                        }`}
                      >
                        <Star className={`w-3 h-3 ${showOnlyFavorites ? 'fill-amber-950 text-amber-950' : 'fill-amber-400 text-amber-500'}`} />
                        <span>{favorites.length}</span>
                      </button>
                    )}
                  </div>

                  {/* Controles derechos del mapa: Selector de capa cartográfica + Ver predicción */}
                  <div className="flex items-center gap-1.5 pointer-events-auto">
                    <div className="bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-slate-200/90 flex items-center gap-0.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1 hidden sm:inline" />
                      {([
                        { id: 'light', label: t.mapStyleLight },
                        { id: 'voyager', label: t.mapStyleVoyager },
                        { id: 'osm', label: t.mapStyleOsm }
                      ] as const).map((layer) => (
                        <button
                          key={layer.id}
                          type="button"
                          onClick={() => setMapStyle(layer.id)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                            mapStyle === layer.id
                              ? 'bg-[#2f3b5c] text-white'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {layer.label}
                        </button>
                      ))}
                    </div>

                    {prediction && (
                      <button
                        type="button"
                        onClick={() => setShowMap(false)}
                        className="bg-[#2f3b5c] hover:bg-[#1a233a] text-white px-3 py-1.5 rounded-xl shadow-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        title={t.tabViewPrediction}
                      >
                        <BarChart className="w-3.5 h-3.5 text-sky-300" />
                        <span className="hidden sm:inline">{t.tabViewPrediction}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* LEYENDA INFERIOR FLOTANTE ESTILO VALENBISI */}
                <div className="absolute bottom-3 left-3 z-20 pointer-events-none">
                  <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-slate-200/90 pointer-events-auto flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-700">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#55b73e]" />
                      <span>{t.legendAvailable}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                      <span>{t.legendLowBikes}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#be0000]" />
                      <span>{t.legendEmpty}</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                      <span>{t.legendFavorite}</span>
                    </span>
                  </div>
                </div>

                {/* CONTENEDOR LEAFLET */}
                <div className="flex-1 w-full h-full relative z-0">
                  <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                    <ChangeMapView center={mapCenter} zoom={mapZoom} />
                    {mapStyle === 'osm' ? (
                      <TileLayer
                        key="osm-standard"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
                        maxZoom={19}
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                    ) : mapStyle === 'voyager' ? (
                      <TileLayer
                        key={`carto-voyager-${CARTO_API_KEY ? 'keyed' : 'free'}`}
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        subdomains="abcd"
                        maxZoom={20}
                        url={`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png${CARTO_API_KEY ? `?key=${encodeURIComponent(CARTO_API_KEY)}` : ''}`}
                      />
                    ) : (
                      <TileLayer
                        key={`carto-positron-${CARTO_API_KEY ? 'keyed' : 'free'}`}
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        subdomains="abcd"
                        maxZoom={20}
                        url={`https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png${CARTO_API_KEY ? `?key=${encodeURIComponent(CARTO_API_KEY)}` : ''}`}
                      />
                    )}
                    {displayedStations.map((station) => {
                      const isSelected = Boolean(stationId && getCleanId(stationId) === station.id.toString());
                      const isFavorite = favorites.some((f) => f.id && station.id && f.id.toString() === station.id.toString());
                      const isBroken = ESTACIONES_ROTAS.includes(parseInt(station.id, 10));
                      const freeDocks =
                        station.freeDocks !== undefined
                          ? station.freeDocks
                          : Math.max(0, station.cap - (station.currentBikes || 0));

                      return (
                        <Marker 
                          key={`${station.id}-${isSelected}-${isFavorite}-${station.currentBikes ?? 'na'}`} 
                          position={[station.lat, station.lng]}
                          icon={getStationIcon(
                            station.id,
                            station.cap,
                            isSelected,
                            isFavorite,
                            station.currentBikes,
                            isBroken
                          )}
                          eventHandlers={{
                            click: () => {
                              setStationId(`${station.id} - ${station.name}`);
                              setMapCenter([station.lat, station.lng]);
                              setMapZoom(16);
                            },
                          }}
                        >
                          {/* HOVER TOOLTIP */}
                          <Tooltip direction="top" offset={[0, -26]} opacity={0.98} sticky>
                            <div className="font-sans text-xs p-1.5 space-y-1 min-w-[175px]">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-[#2f3b5c] text-white">
                                  #{station.id}
                                </span>
                                <span className="font-mono text-[10px] font-bold text-slate-400">
                                  {t.predCapacity}: {station.cap}
                                </span>
                              </div>
                              <p className="font-extrabold text-[#2f3b5c] leading-snug pt-0.5">{station.name}</p>
                              {station.currentBikes !== undefined && (
                                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 font-mono text-[11px] font-bold">
                                  <span className={station.currentBikes === 0 ? 'text-[#be0000]' : 'text-[#3b8a28]'}>
                                    🚲 {station.currentBikes} {t.availableBikes}
                                  </span>
                                  <span className="text-[#1a84ce]">
                                    🅿️ {freeDocks} {t.liveFreeDocks}
                                  </span>
                                </div>
                              )}
                              {isBroken && (
                                <span className="inline-flex items-center gap-1 text-[#be0000] font-bold uppercase text-[9px] bg-red-50 px-1.5 py-0.5 rounded mt-1">
                                  ⚠️ {t.mapMaintenanceTag}
                                </span>
                              )}
                            </div>
                          </Tooltip>

                          {/* POPUP CARD */}
                          <Popup>
                            <div className="p-1.5 min-w-[190px] font-sans space-y-2">
                              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                                <span className="font-mono text-[11px] font-extrabold px-1.5 py-0.5 rounded bg-[#2f3b5c] text-white">
                                  #{station.id}
                                </span>
                                <span className="font-mono text-[11px] font-bold text-slate-500">
                                  {station.cap} {t.mapTotalBases}
                                </span>
                              </div>
                              <h3 className="font-extrabold text-[#2f3b5c] text-xs leading-snug">{station.name}</h3>
                              
                              {station.currentBikes !== undefined && (
                                <div className="grid grid-cols-2 gap-1.5 bg-[#FAF9F5] p-2 rounded-lg border border-slate-200/80 text-center">
                                  <div>
                                    <span className="block font-mono text-sm font-black text-[#3b8a28]">
                                      🚲 {station.currentBikes}
                                    </span>
                                    <span className="block text-[9px] font-bold uppercase text-slate-500">
                                      {t.availableBikes}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="block font-mono text-sm font-black text-[#1a84ce]">
                                      🅿️ {freeDocks}
                                    </span>
                                    <span className="block text-[9px] font-bold uppercase text-slate-500">
                                      {t.liveFreeDocks}
                                    </span>
                                  </div>
                                </div>
                              )}

                              <button 
                                onClick={() => {
                                  setStationId(`${station.id} - ${station.name}`);
                                }}
                                className="text-[11px] font-extrabold bg-[#2f3b5c] hover:bg-[#1a233a] text-white px-3 py-2 rounded-lg transition-colors w-full flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{t.mapSelectBtn}</span>
                              </button>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 space-y-5"
              >
                {/* BENTO 1: TARJETA PRINCIPAL DE PRONÓSTICO (BICIS + ANCLAJES LIBRES) */}
                <div className="bg-white rounded-2xl shadow-md shadow-slate-900/5 p-6 sm:p-7 border-2 border-[#2f3b5c]/15 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-[#2f3b5c]" />
                  
                  {/* Encabezado de la estación */}
                  <div className="flex justify-between items-start mb-6 gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {prediction.station_id && (
                          <span className="font-mono text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-[#2f3b5c] text-white">
                            #{prediction.station_id}
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider ${
                          prediction.model_available === false 
                            ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                            : 'bg-[#FAF9F5] text-[#2f3b5c] border border-slate-200'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${
                            prediction.model_available === false ? 'bg-amber-500' : 'bg-[#55b73e]'
                          }`} />
                          {prediction.model_available === false ? t.mapModelUnavailable : t.limit72hBadge}
                        </span>
                      </div>

                      <h3 className="text-xl sm:text-2xl font-black text-[#2f3b5c] flex items-center gap-2 flex-wrap min-w-0 leading-tight">
                        <span className="break-words">
                          {prediction.station_title || (prediction.station_id ? `Estación ${prediction.station_id}` : '')}
                        </span>
                        {prediction.station_id && (
                          <button
                            type="button"
                            onClick={() => toggleFavorite(prediction.station_id!)}
                            className="p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            title={t.favoriteBtn}
                          >
                            <Star
                              className={`w-5 h-5 shrink-0 ${
                                favorites.some(f => f.id.toString() === prediction.station_id?.toString())
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-300 hover:text-amber-400'
                              }`}
                            />
                          </button>
                        )}
                      </h3>
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end gap-2">
                      <div className="bg-[#FAF9F5] px-3 py-1.5 rounded-xl border border-slate-200/80 text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {t.predCapacity}
                        </p>
                        <p className="text-lg font-mono font-extrabold text-[#2f3b5c] tabular-nums leading-tight">
                          {prediction.cap} <span className="text-xs font-normal text-slate-500">{t.mapTotalBases}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* COMPARATIVA EN TIEMPO REAL ("AHORA EN LA ESTACIÓN") */}
                  <div className="mb-6 p-3.5 rounded-xl bg-[#FAF9F5] border border-slate-200/90 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#55b73e] animate-pulse shrink-0" />
                      <div>
                        <span className="text-[11px] font-extrabold text-[#2f3b5c] uppercase tracking-wider block">
                          {t.liveNowTitle}
                        </span>
                        <p className="text-xs text-slate-600 mt-0.5 font-mono">
                          {prediction.current_bikes !== undefined ? (
                            <>
                              <strong className="text-[#3b8a28] font-extrabold text-sm">🚲 {prediction.current_bikes}</strong> {t.liveBikesNow}
                              {prediction.free_docks !== undefined && (
                                <> • <strong className="text-[#1a84ce] font-extrabold text-sm">🅿️ {prediction.free_docks}</strong> {t.liveFreeDocks}</>
                              )}
                            </>
                          ) : (
                            <span className="text-slate-400 text-xs">Sincronizando...</span>
                          )}
                        </p>
                      </div>
                    </div>
                    {prediction.updated_at && (
                      <span className="text-[11px] font-mono font-semibold text-slate-400">
                        {t.liveUpdated}: {new Date(prediction.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  {prediction.model_available === false ? (
                    <div className="text-center py-6 px-4">
                      <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-amber-200">
                        <Clock className="w-7 h-7 text-amber-600" />
                      </div>
                      <p className="text-base font-bold text-slate-700">{t.predModelDev}</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* DOBLE KPI SIMÉTRICO: COGER BICI VS DEJAR BICI */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* KPI 1: Bicicletas Disponibles Estimadas */}
                        <div
                          id="texto_resultado"
                          className="p-5 rounded-2xl bg-[#FAF9F5] border-2 border-[#2f3b5c]/15 flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-[#2f3b5c] uppercase tracking-wider">
                              🚲 {t.predBikesAvailable}
                            </span>
                            <span className="text-[11px] font-mono font-bold text-slate-400">
                              {new Date(dateTime).toLocaleDateString([], { day: 'numeric', month: 'short' })},{' '}
                              {new Date(dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="my-3 flex items-baseline gap-2">
                            <span className="text-5xl sm:text-6xl font-mono font-extrabold text-[#2f3b5c] tracking-tight tabular-nums">
                              {prediction.yhat}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-400">
                              / {prediction.cap}
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold text-slate-500">
                            {t.predFor}{' '}
                            <strong className="text-slate-700 font-mono">
                              {new Date(dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </strong>
                          </p>
                        </div>

                        {/* KPI 2: Anclajes Libres Estimados (para devolver bici) */}
                        <div className="p-5 rounded-2xl bg-[#FAF9F5] border border-slate-200/90 flex flex-col justify-between">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-[#1a84ce] uppercase tracking-wider">
                              🅿️ {t.predFreeDocksEst}
                            </span>
                            <span className="text-[11px] font-mono font-bold text-slate-400">
                              {prediction.occupancy !== null ? `${Math.round(prediction.occupancy)}% ocup.` : ''}
                            </span>
                          </div>
                          <div className="my-3 flex items-baseline gap-2">
                            <span className="text-5xl sm:text-6xl font-mono font-extrabold text-[#1a84ce] tracking-tight tabular-nums">
                              {Math.max(0, Math.round((prediction.cap - (Number(prediction.yhat) || 0)) * 10) / 10)}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-400">
                              / {prediction.cap}
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold text-slate-500">
                            {t.liveFreeDocks} ({t.predCapacity}: {prediction.cap})
                          </p>
                        </div>
                      </div>

                      {/* BARRA PROPORCIONAL DE OCUPACIÓN ESTIMADA */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-extrabold text-slate-600">
                          <span>{t.predOccupancyEst}</span>
                          <span className="font-mono tabular-nums">
                            {prediction.occupancy !== null ? Math.round(prediction.occupancy) : 0}%
                          </span>
                        </div>
                        <div className="h-4 w-full bg-slate-200/80 rounded-lg overflow-hidden relative p-0.5">
                          <motion.div 
                            className={`h-full rounded-md ${
                              prediction.occupancy !== null && prediction.occupancy > 70 ? 'bg-[#55b73e]' :
                              prediction.occupancy !== null && prediction.occupancy < 15 ? 'bg-[#be0000]' :
                              'bg-[#2f3b5c]'
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, Math.max(0, prediction.occupancy || 0))}%` }}
                            transition={{ duration: 0.7, ease: 'easeOut' }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] font-mono font-bold text-slate-400">
                          <span>0 ({t.legendEmpty})</span>
                          <span>{prediction.cap} ({t.mapTotalBases})</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* BENTO 2: BANDA DE CONFIANZA 95% (ESTILO OUR WORLD IN DATA) + FIABILIDAD */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {prediction.model_available !== false ? (
                    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border-2 border-[#2f3b5c]/12 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#2f3b5c]">
                            {t.predConfidenceBandTitle}
                          </h4>
                          <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-[#2f3b5c]/10 text-[#2f3b5c] tabular-nums">
                            [{prediction.yhat_lower} — {prediction.yhat_upper}]
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {t.predConfidenceBandDesc}
                        </p>
                      </div>

                      {/* Visualizador gráfico de banda de intervalo [yhat_lower, yhat_upper] sobre [0, cap] */}
                      <div className="space-y-1.5 pt-1">
                        <div className="relative h-5 w-full bg-[#FAF9F5] rounded-lg border border-slate-200 overflow-hidden">
                          {(() => {
                            const cap = Math.max(1, prediction.cap || 30);
                            const low = Math.max(0, Math.min(cap, Number(prediction.yhat_lower) || 0));
                            const high = Math.max(low, Math.min(cap, Number(prediction.yhat_upper) || 0));
                            const mid = Math.max(0, Math.min(cap, Number(prediction.yhat) || 0));
                            const leftPct = (low / cap) * 100;
                            const widthPct = Math.max(3, ((high - low) / cap) * 100);
                            const midPct = (mid / cap) * 100;
                            return (
                              <>
                                <div
                                  className="absolute top-0 bottom-0 bg-[#1a84ce]/25 border-x-2 border-[#1a84ce]"
                                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                                />
                                <div
                                  className="absolute top-0 bottom-0 w-1 bg-[#2f3b5c]"
                                  style={{ left: `calc(${midPct}% - 2px)` }}
                                />
                              </>
                            );
                          })()}
                        </div>
                        <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400 tabular-nums">
                          <span>Mín: {prediction.yhat_lower}</span>
                          <span className="text-[#2f3b5c]">Est: {prediction.yhat}</span>
                          <span>Máx: {prediction.yhat_upper}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                        <Info className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-1">{t.predWeatherConditions}</h4>
                        <p className="text-sm font-mono text-slate-600">
                          {prediction.temp}ºC • {prediction.prec}mm
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Probabilidad / Fiabilidad de encontrar bici */}
                  <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border-2 border-[#2f3b5c]/12 flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-mono font-black ${
                      prediction.model_available === false ? 'bg-amber-50 text-amber-500' :
                      (prediction.probabilidad_disponible ?? 0) > 75 ? 'bg-[#55b73e]/15 text-[#3b8a28]' :
                      (prediction.probabilidad_disponible ?? 0) < 25 ? 'bg-[#be0000]/10 text-[#be0000]' :
                      'bg-amber-50 text-amber-600'
                    }`}>
                      <Percent className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#2f3b5c] mb-1">
                        {t.predSuccessProb}
                      </h4>
                      {prediction.model_available === false ? (
                        <p className="text-xs text-slate-500 mt-1 leading-normal font-medium">
                          {t.predModelDev}
                        </p>
                      ) : (
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-mono font-extrabold text-[#2f3b5c] tracking-tight tabular-nums">
                              {prediction.probabilidad_disponible}%
                            </span>
                            <span className={`text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded ${
                              (prediction.probabilidad_disponible ?? 0) > 75 ? 'bg-[#55b73e]/15 text-[#3b8a28]' :
                              (prediction.probabilidad_disponible ?? 0) < 25 ? 'bg-[#be0000]/15 text-[#be0000]' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {(prediction.probabilidad_disponible ?? 0) > 75 ? t.predSuccessHigh :
                               (prediction.probabilidad_disponible ?? 0) < 25 ? t.predSuccessLow :
                               t.predSuccessMedium}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed mt-1.5">
                            {t.predSuccessHint}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* BENTO 3: ESTACIÓN ALTERNATIVA MÁS CERCANA ("PLAN B" GEODÉSICO) */}
                {planBStation && (
                  <div className="bg-[#FAF9F5] rounded-2xl p-5 border-2 border-[#2f3b5c]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-[#2f3b5c]">
                          <Navigation className="w-3.5 h-3.5 text-[#1a84ce]" />
                          {t.planBTitle}
                        </span>
                        <span className="font-mono text-[11px] font-extrabold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 tabular-nums">
                          {planBStation.distanceMeters} m • ~{planBStation.walkMins} {t.planBWalkTime}
                        </span>
                      </div>

                      <p className="text-sm font-extrabold text-[#2f3b5c] truncate">
                        #{planBStation.station.id} — {planBStation.station.name}
                      </p>

                      <div className="flex items-center gap-3 text-xs font-mono font-bold pt-0.5">
                        <span className="text-[#3b8a28]">
                          🚲 {planBStation.station.currentBikes ?? planBStation.station.cap} {t.availableBikes}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[#1a84ce]">
                          🅿️{' '}
                          {planBStation.station.freeDocks !== undefined
                            ? planBStation.station.freeDocks
                            : Math.max(0, planBStation.station.cap - (planBStation.station.currentBikes || 0))}{' '}
                          {t.liveFreeDocks}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const nextStr = `${planBStation.station.id} - ${planBStation.station.name}`;
                        setStationId(nextStr);
                        setMapCenter([planBStation.station.lat, planBStation.station.lng]);
                        setMapZoom(16);
                        runPredictionForStation(nextStr);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-[#2f3b5c] text-[#2f3b5c] hover:text-white border-2 border-[#2f3b5c]/20 font-extrabold text-xs transition-all shrink-0 cursor-pointer shadow-2xs"
                    >
                      <span>{t.planBSwitchBtn}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* FOOTER CORPORATIVO (DE LADO A LADO) */}
      <footer className="mt-16 w-full bg-[#2f3b5c] text-white border-t border-slate-700/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <span className="text-lg font-black tracking-tight text-white font-sans">
              valen<span className="text-sky-300">BA</span>
            </span>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-300">
              <button
                type="button"
                onClick={() => setShowLegalModal(true)}
                className="hover:text-white underline cursor-pointer"
              >
                {t.footerLegalNotice}
              </button>
              <button
                type="button"
                onClick={() => setShowLegalModal(true)}
                className="hover:text-white underline cursor-pointer"
              >
                {t.footerPrivacyPolicy}
              </button>
              <button
                type="button"
                onClick={() => setShowHowItWorks(true)}
                className="hover:text-white underline cursor-pointer"
              >
                {t.methodologyBtn}
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {t.footerDisclaimer}
          </p>

          <div className="text-[11px] text-slate-400 pt-1 font-sans">
            © {new Date().getFullYear()} Valenba. {t.footerRights}
          </div>
        </div>
      </footer>

      {/* MODAL AVISO LEGAL Y PRIVACIDAD RGPD */}
      <AnimatePresence>
        {showLegalModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowLegalModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-5 border border-slate-200"
            >
              <div className="flex justify-between items-start pb-3 border-b border-slate-200">
                <div>
                  <h2 className="text-lg font-bold text-[#2f3b5c]">
                    {t.legalModalTitle}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Reglamento General de Protección de Datos (RGPD UE 2016/679) & LOPD-GDD
                  </p>
                </div>
                <button 
                  onClick={() => setShowLegalModal(false)} 
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">{t.legalResponsibleTitle}</h3>
                  <p>{t.legalResponsibleText}</p>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 mb-1">{t.legalPurposeTitle}</h3>
                  <p>{t.legalPurposeText}</p>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 mb-1">{t.legalRightsTitle}</h3>
                  <p>{t.legalRightsText}</p>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 mb-1">{t.legalSecurityTitle}</h3>
                  <p>{t.legalSecurityText}</p>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 mb-1">{t.legalBrandNoticeTitle}</h3>
                  <p>{t.legalBrandNoticeText}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowLegalModal(false)}
                  className="bg-[#2f3b5c] hover:bg-[#1a233a] text-white font-bold text-xs px-5 py-2 rounded-xl transition-all cursor-pointer"
                >
                  {t.legalCloseBtn}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE METODOLOGÍA Y ARQUITECTURA DE DATOS (ESTILO EDITORIAL SUIZO) */}
      <AnimatePresence>
        {showHowItWorks && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowHowItWorks(false)}
          >
            <motion.div 
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-2xl w-full max-h-[88vh] overflow-y-auto border-2 border-[#2f3b5c]/15 space-y-6"
            >
              <div className="flex justify-between items-start pb-4 border-b border-slate-200">
                <div>
                  <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded bg-[#2f3b5c] text-white">
                    VALENBA • SPEC v2.4
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-[#2f3b5c] mt-2">
                    {t.methodologyTitle}
                  </h2>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">
                    {t.methodologySubtitle}
                  </p>
                </div>
                <button
                  onClick={() => setShowHowItWorks(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 text-slate-700">
                <section className="p-4 rounded-xl bg-[#FAF9F5] border border-slate-200/90 space-y-1.5">
                  <h3 className="text-sm font-extrabold text-[#2f3b5c] font-mono">
                    {t.methSec1Title}
                  </h3>
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                    {t.methSec1Text}
                  </p>
                </section>

                <section className="p-4 rounded-xl bg-[#FAF9F5] border border-slate-200/90 space-y-1.5">
                  <h3 className="text-sm font-extrabold text-[#2f3b5c] font-mono">
                    {t.methSec2Title}
                  </h3>
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                    {t.methSec2Text}
                  </p>
                </section>

                <section className="p-4 rounded-xl bg-[#FAF9F5] border border-slate-200/90 space-y-1.5">
                  <h3 className="text-sm font-extrabold text-[#2f3b5c] font-mono">
                    {t.methSec3Title}
                  </h3>
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                    {t.methSec3Text}
                  </p>
                </section>

                <section className="p-4 rounded-xl bg-[#FAF9F5] border border-slate-200/90 space-y-1.5">
                  <h3 className="text-sm font-extrabold text-[#2f3b5c] font-mono">
                    {t.methSec4Title}
                  </h3>
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                    {t.methSec4Text}
                  </p>
                </section>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setShowHowItWorks(false)}
                  className="bg-[#2f3b5c] hover:bg-[#1a233a] text-white px-6 py-2.5 rounded-xl font-extrabold text-xs transition-colors cursor-pointer"
                >
                  {t.methCloseBtn}
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
            className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-sm flex justify-end"
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
                            setShowMap(true);
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
                                    const match = mapStations.find(s => s.id.toString() === fav.id.toString());
                                    if (match) {
                                      setMapCenter([match.lat, match.lng]);
                                      setMapZoom(16);
                                    }
                                    setShowMap(true);
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
                        onClick={() => { setAuthMode('login'); setAuthError(null); setAuthSuccess(null); setPrivacyConsent(false); }}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                          authMode === 'login' ? 'bg-white text-[#2f3b5c] shadow-sm' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        {t.drawerLoginTab}
                      </button>
                      <button
                        onClick={() => { setAuthMode('register'); setAuthError(null); setAuthSuccess(null); setPrivacyConsent(false); }}
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

                      {/* Casilla de Aceptación RGPD / Política de Privacidad */}
                      {authMode === 'register' && (
                        <div className="flex items-start gap-2.5 pt-1 pb-1">
                          <input
                            id="reg-privacy-consent"
                            type="checkbox"
                            checked={privacyConsent}
                            onChange={(e) => setPrivacyConsent(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#2f3b5c] focus:ring-[#2f3b5c]/30 cursor-pointer shrink-0"
                            required
                          />
                          <label htmlFor="reg-privacy-consent" className="text-[11px] text-slate-500 leading-snug cursor-pointer select-none">
                            {t.drawerPrivacyConsent}{' '}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowLegalModal(true);
                              }}
                              className="text-[#2f3b5c] font-bold underline hover:text-blue-700 ml-1 inline-flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>{t.footerLegalNotice}</span>
                            </button>
                          </label>
                        </div>
                      )}

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
                          setPrivacyConsent(false);
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
