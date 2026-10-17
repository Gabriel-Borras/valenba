import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Bike, Star, X, MapPin, AlertTriangle } from 'lucide-react';
import { MapStation } from '../defaultStations';
import { Translations } from '../translations';

interface FavoriteStation {
  id: string | number;
  customName?: string;
}

interface StationComboboxProps {
  stations: MapStation[];
  value: string;
  onChange: (value: string) => void;
  favorites: FavoriteStation[];
  onToggleFavorite: (id: string | number) => void;
  t: Translations;
  brokenStations?: number[];
  placeholder?: string;
  onSelectStation?: (station: MapStation) => void;
  showOnlyFavorites?: boolean;
  onToggleOnlyFavorites?: () => void;
}

export const StationCombobox: React.FC<StationComboboxProps> = ({
  stations,
  value,
  onChange,
  favorites,
  onToggleFavorite,
  t,
  brokenStations = [105, 146, 168, 299],
  placeholder,
  onSelectStation,
  showOnlyFavorites = false,
  onToggleOnlyFavorites
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Helper para limpiar el ID numérico
  const extractId = (val: string): string => {
    if (!val) return '';
    const match = val.trim().match(/^\s*(\d+)\s*-/);
    if (match) return match[1];
    if (/^\d+$/.test(val.trim())) return val.trim();
    return val.trim();
  };

  const currentId = extractId(value);
  const isSelectedFav = currentId !== '' && favorites.some(f => f.id.toString() === currentId);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrado de estaciones basado en la búsqueda
  const filteredStations = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return stations.slice(0, 50); // Primeras 50 si no hay filtro
    }
    return stations.filter(station => {
      const matchId = station.id.toString().includes(q);
      const matchName = station.name.toLowerCase().includes(q);
      const matchAddr = station.address ? station.address.toLowerCase().includes(q) : false;
      return matchId || matchName || matchAddr;
    }).slice(0, 60);
  }, [stations, query]);

  // Manejar selección de estación
  const handleSelect = (station: MapStation) => {
    const formatted = `${station.id} - ${station.name}`;
    onChange(formatted);
    setQuery('');
    setIsOpen(false);
    if (onSelectStation) {
      onSelectStation(station);
    }
  };

  // Teclado (flechas, enter, escape)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1 < filteredStations.length ? prev + 1 : prev));
      scrollIndexIntoView(highlightedIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 >= 0 ? prev - 1 : 0));
      scrollIndexIntoView(highlightedIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredStations[highlightedIndex]) {
        handleSelect(filteredStations[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const scrollIndexIntoView = (index: number) => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll('.combobox-item');
    if (items[index]) {
      items[index].scrollIntoView({ block: 'nearest' });
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
    inputRef.current?.focus();
    setIsOpen(true);
  };

  const effectivePlaceholder = placeholder || t.comboboxPlaceholder;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Campo de Entrada Principal */}
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#2f3b5c]/50">
          <Search className="w-5 h-5" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={isOpen ? query : (value || '')}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            onChange(val);
            if (!isOpen) setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => {
            setQuery(value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder={value ? value : effectivePlaceholder}
          className="w-full pl-11 pr-24 py-3.5 bg-[#FAF9F5] hover:bg-white focus:bg-white border-2 border-[#2f3b5c]/15 focus:border-[#2f3b5c] rounded-2xl text-[#18233C] placeholder-[#2f3b5c]/40 font-bold text-sm sm:text-base shadow-2xs transition-all outline-none"
        />

        {/* Botones de acción derecha (Limpiar + Favorito) */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5">
          {(value || query) && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 transition-colors"
              title={t.comboboxClear}
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {currentId && (
            <button
              type="button"
              onClick={() => onToggleFavorite(currentId)}
              className="p-1.5 rounded-xl hover:bg-amber-50 transition-all focus:outline-none"
              title={isSelectedFav ? t.comboboxRemoveFav : t.comboboxAddFav}
            >
              <Star
                className={`w-5 h-5 transition-all ${
                  isSelectedFav
                    ? 'text-amber-500 fill-amber-400 scale-110'
                    : 'text-slate-300 hover:text-amber-400'
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Menú Desplegable Flotante */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className="absolute left-0 right-0 top-full mt-2 z-[500] bg-white rounded-2xl border-2 border-[#2f3b5c]/15 shadow-2xl shadow-[#18233C]/15 overflow-hidden"
          >
            {/* Cabecera del desplegable con estadísticas rápidas */}
            <div className="px-4 py-2.5 bg-[#FAF9F5] border-b border-[#2f3b5c]/10 flex items-center justify-between text-xs">
              <span className="font-black text-[#2f3b5c]/70 uppercase tracking-wider text-[10px] font-mono">
                {query 
                  ? `${t.comboboxMatches} (${filteredStations.length})` 
                  : (showOnlyFavorites ? `${filteredStations.length} ${t.mapFavoriteStations}` : t.comboboxTotalStations)}
              </span>
              <div className="flex items-center gap-2">
                {favorites.length > 0 && onToggleOnlyFavorites && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleOnlyFavorites();
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                      showOnlyFavorites
                        ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-amber-700 hover:border-amber-200'
                    }`}
                    title={showOnlyFavorites ? t.viewAllStations : t.filterOnlyFavorites}
                  >
                    <Star className={`w-3 h-3 ${showOnlyFavorites ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                    <span>{showOnlyFavorites ? t.viewAllStations : t.filterOnlyFavorites}</span>
                  </button>
                )}
                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                  {t.comboboxKeyboardHint}
                </span>
              </div>
            </div>

            {/* Sección rápida de Favoritas si existen y el input está vacío */}
            {!query && favorites.length > 0 && (
              <div className="p-2.5 bg-amber-50/40 border-b border-amber-200/50">
                <div className="flex items-center gap-1.5 px-2 mb-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-900">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  <span>{t.comboboxFavsTitle}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 px-1">
                  {favorites.map(fav => {
                    const st = stations.find(s => s.id.toString() === fav.id.toString());
                    const name = fav.customName || (st ? st.name : `Estación ${fav.id}`);
                    return (
                      <button
                        key={fav.id}
                        type="button"
                        onClick={() => st ? handleSelect(st) : onChange(`${fav.id} - ${name}`)}
                        className="px-2.5 py-1 rounded-xl bg-white border border-amber-300/80 hover:border-[#2f3b5c] text-[#18233C] text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all"
                      >
                        <span className="text-[#2f3b5c] font-mono font-extrabold text-[10px]">#{fav.id}</span>
                        <span className="truncate max-w-[140px]">{name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lista de Resultados con Scroll */}
            <div ref={listRef} className="max-h-72 overflow-y-auto divide-y divide-slate-100">
              {filteredStations.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <Bike className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-slate-600">{t.comboboxNoResults}</p>
                  <p className="text-xs text-slate-400">{t.comboboxNoResultsHint}</p>
                </div>
              ) : (
                filteredStations.map((station, idx) => {
                  const isHighlighted = idx === highlightedIndex;
                  const isSelected = currentId === station.id.toString();
                  const isFav = favorites.some(f => f.id.toString() === station.id.toString());
                  const isBroken = brokenStations.includes(parseInt(station.id.toString(), 10));
                  const bikes = station.currentBikes;
                  const docks = station.freeDocks;

                  return (
                    <div
                      key={station.id}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      onClick={() => handleSelect(station)}
                      className={`combobox-item px-4 py-3 cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                        isHighlighted ? 'bg-[#FAF9F5]' : isSelected ? 'bg-[#2f3b5c]/5' : 'hover:bg-[#FAF9F5]/60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* ID Badge estilo billete */}
                        <span className={`px-2 py-1 rounded-lg font-mono text-xs font-extrabold shrink-0 ${
                          isSelected ? 'bg-[#2f3b5c] text-white' : 'bg-[#FAF9F5] border border-[#2f3b5c]/15 text-[#2f3b5c]'
                        }`}>
                          #{station.id}
                        </span>

                        {/* Nombre y Dirección */}
                        <div className="truncate">
                          <p className="text-sm font-bold text-[#18233C] truncate leading-tight">
                            {station.name}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5 font-medium">
                            {station.address && station.address !== station.name ? (
                              <>
                                <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                                <span className="truncate">{station.address}</span>
                              </>
                            ) : (
                              <span>{t.predCapacity}: {station.cap} {t.mapTotalBases}</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Estado en tiempo real y Anclajes */}
                      <div className="flex items-center gap-2.5 shrink-0">
                        {isBroken ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#be0000] bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                            <AlertTriangle className="w-3 h-3" /> {t.mapMaintenanceTag}
                          </span>
                        ) : bikes !== undefined ? (
                          <div className="text-right">
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-mono font-extrabold px-2 py-0.5 rounded-lg border ${
                                bikes > 5
                                  ? 'bg-[#55b73e]/10 text-[#2b6cb0] border-[#55b73e]/30 !text-[#22543d]'
                                  : bikes > 0
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-red-50 text-[#be0000] border-red-200'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${
                                bikes > 5 ? 'bg-[#55b73e]' : bikes > 0 ? 'bg-amber-500' : 'bg-[#be0000]'
                              }`} />
                              {bikes} {t.bikesTag}
                            </span>
                            <span className="block text-[10px] text-slate-500 font-mono font-semibold mt-0.5">
                              {docks !== undefined ? `${docks} ${t.liveFreeDocks}` : `${station.cap} ${t.mapTotalBases}`}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-mono font-semibold">
                            {station.cap} {t.mapTotalBases}
                          </span>
                        )}

                        {/* Botón rápido de favorito en fila */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(station.id);
                          }}
                          className="p-1 rounded-lg text-slate-300 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                          title={isFav ? t.comboboxRemoveFav : t.comboboxAddFav}
                        >
                          <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-500' : ''}`} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
