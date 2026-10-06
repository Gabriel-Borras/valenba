import React, { useMemo, useState } from 'react';
import { CalendarClock, Clock, Sparkles, SlidersHorizontal, Sun, Moon, Sunrise, Sunset, ChevronDown } from 'lucide-react';

interface TimeScrubberProps {
  value: string;
  onChange: (value: string) => void;
  minDate: string;
  maxDate: string;
}

export const TimeScrubber: React.FC<TimeScrubberProps> = ({
  value,
  onChange,
  minDate,
  maxDate
}) => {
  const [showManualInput, setShowManualInput] = useState(false);

  // Helper para formatear Date a formato YYYY-MM-DDTHH:mm
  const formatISO = (d: Date): string => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const currentDate = useMemo(() => {
    if (!value) return new Date();
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [value]);

  const now = useMemo(() => new Date(), []);

  // Minutos desde ahora (para el slider continuo)
  const diffMinutes = useMemo(() => {
    const diff = Math.round((currentDate.getTime() - Date.now()) / (60 * 1000));
    return Math.max(0, diff);
  }, [currentDate]);

  // Rango máximo del scrubber: 72 horas (4320 min) o hasta maxDate (6 días = 8640 min)
  const maxSliderMinutes = 6 * 24 * 60; // 6 días

  // Manejar cambio en el slider continuo
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const minutes = parseInt(e.target.value, 10);
    // Redondear a múltiplos de 15 minutos para una experiencia limpia
    const roundedMinutes = Math.round(minutes / 15) * 15;
    const target = new Date(Date.now() + roundedMinutes * 60 * 1000);
    onChange(formatISO(target));
  };

  // Presets rápidos
  const applyPresetMinutes = (minutes: number) => {
    const target = new Date(Date.now() + minutes * 60 * 1000);
    onChange(formatISO(target));
  };

  const applyTomorrowAt = (hour: number, minute: number = 0) => {
    const target = new Date();
    target.setDate(target.getDate() + 1);
    target.setHours(hour, minute, 0, 0);
    onChange(formatISO(target));
  };

  // Moment of day & icon
  const timeContext = useMemo(() => {
    const h = currentDate.getHours();
    const isPeak = (h >= 8 && h <= 9) || (h >= 14 && h <= 15) || (h >= 19 && h <= 20);

    let period = 'Tarde';
    let icon = <Sun className="w-3.5 h-3.5 text-amber-500" />;

    if (h >= 6 && h < 12) {
      period = 'Mañana';
      icon = <Sunrise className="w-3.5 h-3.5 text-orange-400" />;
    } else if (h >= 12 && h < 16) {
      period = 'Mediodía';
      icon = <Sun className="w-3.5 h-3.5 text-amber-500" />;
    } else if (h >= 16 && h < 21) {
      period = 'Tarde';
      icon = <Sunset className="w-3.5 h-3.5 text-rose-400" />;
    } else {
      period = 'Noche';
      icon = <Moon className="w-3.5 h-3.5 text-indigo-400" />;
    }

    return { period, icon, isPeak };
  }, [currentDate]);

  // Formato de texto para el día
  const dayDescription = useMemo(() => {
    const today = new Date();
    const isToday =
      today.getDate() === currentDate.getDate() &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow =
      tomorrow.getDate() === currentDate.getDate() &&
      tomorrow.getMonth() === currentDate.getMonth() &&
      tomorrow.getFullYear() === currentDate.getFullYear();

    const weekday = currentDate.toLocaleDateString('es-ES', { weekday: 'long' });
    const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    const dayNum = currentDate.getDate();
    const month = currentDate.toLocaleDateString('es-ES', { month: 'short' });

    if (isToday) return `Hoy, ${capitalizedWeekday} ${dayNum}`;
    if (isTomorrow) return `Mañana, ${capitalizedWeekday} ${dayNum}`;
    return `${capitalizedWeekday} ${dayNum} ${month}`;
  }, [currentDate]);

  const formattedHours = currentDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Texto relativo (ej. "+2h 30m en el futuro")
  const relativeText = useMemo(() => {
    if (diffMinutes < 5) return 'Tiempo actual (En vivo)';
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    if (hours === 0) return `En +${mins} minutos`;
    if (mins === 0) return `En +${hours} hora${hours > 1 ? 's' : ''}`;
    return `En +${hours}h ${mins}m`;
  }, [diffMinutes]);

  return (
    <div className="space-y-3 bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-sm">
      {/* CABECERA: Display Grande de Tiempo + Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-mono font-black text-xl shadow-md tracking-tight">
            {formattedHours}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-slate-800">{dayDescription}</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
                {timeContext.icon}
                {timeContext.period}
              </span>
              {timeContext.isPeak && (
                <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">
                  ⚡ Punta
                </span>
              )}
            </div>
            <p className="text-xs text-blue-600 font-bold mt-0.5">{relativeText}</p>
          </div>
        </div>

        {/* Toggle para ajuste manual / fecha específica */}
        <button
          type="button"
          onClick={() => setShowManualInput(!showManualInput)}
          className="self-start sm:self-auto text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5 transition-all"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          <span>{showManualInput ? 'Ocultar selector manual' : 'Selector manual'}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${showManualInput ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* INPUT MANUAL OPCIONAL (DESPLEGABLE) */}
      {showManualInput && (
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500" htmlFor="manual_datetime">
            Fecha y hora exactas
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CalendarClock className="h-4 w-4 text-slate-400" />
            </div>
            <input
              id="manual_datetime"
              type="datetime-local"
              min={minDate}
              max={maxDate}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#2f3b5c] outline-none font-medium"
            />
          </div>
        </div>
      )}

      {/* CHIPS DE ACCESO RÁPIDO (PRESETS) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0 mr-1">
          Rápido:
        </span>
        <button
          type="button"
          onClick={() => applyPresetMinutes(0)}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border ${
            diffMinutes < 15
              ? 'bg-[#2f3b5c] text-white border-[#2f3b5c] shadow-xs'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          Ahora
        </button>
        <button
          type="button"
          onClick={() => applyPresetMinutes(30)}
          className="px-2.5 py-1.5 rounded-xl font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap transition-all"
        >
          +30 min
        </button>
        <button
          type="button"
          onClick={() => applyPresetMinutes(60)}
          className="px-2.5 py-1.5 rounded-xl font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap transition-all"
        >
          +1 hora
        </button>
        <button
          type="button"
          onClick={() => applyPresetMinutes(180)}
          className="px-2.5 py-1.5 rounded-xl font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap transition-all"
        >
          +3 horas
        </button>
        <button
          type="button"
          onClick={() => applyTomorrowAt(9, 0)}
          className="px-2.5 py-1.5 rounded-xl font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap transition-all"
        >
          Mañana 09:00
        </button>
        <button
          type="button"
          onClick={() => applyTomorrowAt(14, 0)}
          className="px-2.5 py-1.5 rounded-xl font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap transition-all"
        >
          Mañana 14:00
        </button>
      </div>

      {/* CONTROL DESLIZANTE CONTINUO (TIME SCRUBBER) */}
      <div className="space-y-2 pt-1">
        <div className="flex justify-between items-center text-[11px] font-bold text-slate-400">
          <span>Ahora</span>
          <span>+24h (Mañana)</span>
          <span>+48h</span>
          <span>+6 Días</span>
        </div>

        <div className="relative py-1">
          <input
            type="range"
            min={0}
            max={maxSliderMinutes}
            step={15}
            value={diffMinutes}
            onChange={handleSliderChange}
            className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2f3b5c] focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};
