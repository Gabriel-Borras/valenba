import React, { useMemo, useState, useEffect } from 'react';
import { CalendarClock, SlidersHorizontal, Sun, Moon, Sunrise, Sunset, ChevronDown } from 'lucide-react';
import { Translations, Language } from '../translations';

interface TimeScrubberProps {
  value: string;
  onChange: (value: string) => void;
  minDate: string;
  maxDate: string;
  t: Translations;
  lang?: Language;
}

export const TimeScrubber: React.FC<TimeScrubberProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  t,
  lang = 'va'
}) => {
  const [showManualInput, setShowManualInput] = useState(false);

  const locale = lang === 'va' ? 'ca-ES' : lang === 'en' ? 'en-US' : 'es-ES';

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

  // Reloj reactivo: se actualiza periódicamente para refrescar automáticamente los días al cruzar la medianoche
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    const interval = setInterval(tick, 5000);
    window.addEventListener('focus', tick);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', tick);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);

  // Si la fecha seleccionada quedó en el pasado al pasar las 00:00, auto-ajustar a hoy
  useEffect(() => {
    if (value) {
      const selectedTime = new Date(value).getTime();
      const currentLimit = now.getTime() - 2 * 60 * 1000;
      if (selectedTime < currentLimit) {
        const nextValid = new Date(now);
        const rem = 15 - (nextValid.getMinutes() % 15);
        nextValid.setMinutes(nextValid.getMinutes() + (rem === 0 ? 15 : rem));
        nextValid.setSeconds(0, 0);
        onChange(formatISO(nextValid));
      }
    }
  }, [now, value, onChange]);

  // Minuto actual redondeado al siguiente múltiplo de 15
  const nowMinuteRounded = useMemo(() => {
    const currentMins = now.getHours() * 60 + now.getMinutes();
    return Math.min(1425, Math.ceil(currentMins / 15) * 15);
  }, [now]);

  // Generar los 3 días disponibles: Hoy (0), Mañana (1), y Día de la semana (2)
  const threeDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      
      const weekday = d.toLocaleDateString(locale, { weekday: 'long' });
      const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
      const dayNum = d.getDate();
      const month = d.toLocaleDateString(locale, { month: 'short' });

      let label = capitalizedWeekday;
      if (i === 0) label = t.today;
      else if (i === 1) label = t.tomorrow;

      days.push({
        index: i,
        date: d,
        label,
        dateStr: `${dayNum} ${month}`,
        weekday: capitalizedWeekday
      });
    }
    return days;
  }, [now, locale, t.today, t.tomorrow]);

  // Determinar qué día está seleccionado actualmente (0, 1 o 2)
  const selectedDayIndex = useMemo(() => {
    const curYear = currentDate.getFullYear();
    const curMonth = currentDate.getMonth();
    const curDate = currentDate.getDate();

    for (let i = 0; i < 3; i++) {
      const d = threeDays[i].date;
      if (
        d.getFullYear() === curYear &&
        d.getMonth() === curMonth &&
        d.getDate() === curDate
      ) {
        return i;
      }
    }
    return 0; // Por defecto Hoy
  }, [currentDate, threeDays]);

  // Minuto del día actual (0 a 1425)
  const currentMinuteOfDay = useMemo(() => {
    return currentDate.getHours() * 60 + currentDate.getMinutes();
  }, [currentDate]);

  // Mínimo minuto permitido para el slider:
  // Si es Hoy, empieza desde ahora (redondeado a 15 min); si es Mañana o el Día 3, empieza desde 0 (00:00).
  const minMinuteOfDay = selectedDayIndex === 0 ? nowMinuteRounded : 0;

  // Manejar cambio en el selector de los 3 días (Flecha Rosa)
  const handleSelectDay = (dayIndex: number) => {
    const targetBase = new Date(threeDays[dayIndex].date);
    let hour = currentDate.getHours();
    let minute = currentDate.getMinutes();

    // Si selecciona Hoy y la hora actual era anterior al momento actual, ajustar al momento actual
    if (dayIndex === 0) {
      const selectedTotalMins = hour * 60 + minute;
      if (selectedTotalMins < nowMinuteRounded) {
        hour = Math.floor(nowMinuteRounded / 60);
        minute = nowMinuteRounded % 60;
      }
    }

    targetBase.setHours(hour, minute, 0, 0);
    onChange(formatISO(targetBase));
  };

  // Manejar cambio en el deslizador de hora del día (Flecha Amarilla)
  const handleMinuteSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const minutes = parseInt(e.target.value, 10);
    const target = new Date(threeDays[selectedDayIndex].date);
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    target.setHours(hour, minute, 0, 0);
    onChange(formatISO(target));
  };

  // Presets rápidos adaptados al rango de 3 días
  const applyPresetMinutes = (minutesFromNow: number) => {
    const target = new Date(Date.now() + minutesFromNow * 60 * 1000);
    onChange(formatISO(target));
  };

  const applyTomorrowAt = (hour: number, minute: number = 0) => {
    const target = new Date();
    target.setDate(target.getDate() + 1);
    target.setHours(hour, minute, 0, 0);
    onChange(formatISO(target));
  };

  // Contexto del momento del día (Mañana, Mediodía, Tarde, Noche)
  const timeContext = useMemo(() => {
    const h = currentDate.getHours();

    let period = t.periodAfternoon;
    let icon = <Sun className="w-4 h-4 text-amber-500" />;

    if (h >= 6 && h < 12) {
      period = t.periodMorning;
      icon = <Sunrise className="w-4 h-4 text-orange-400" />;
    } else if (h >= 12 && h < 16) {
      period = t.periodMidday;
      icon = <Sun className="w-4 h-4 text-amber-500" />;
    } else if (h >= 16 && h < 21) {
      period = t.periodAfternoon;
      icon = <Sunset className="w-4 h-4 text-rose-400" />;
    } else {
      period = t.periodNight;
      icon = <Moon className="w-4 h-4 text-indigo-400" />;
    }

    return { period, icon };
  }, [currentDate, t]);

  const formattedHours = currentDate.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Horizonte relativo (+Xh Ym) para percepción inmediata de distancia temporal
  const relativeHorizon = useMemo(() => {
    const diffMs = currentDate.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins <= 15) return t.presetNow;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hours === 0) return `+${mins}m`;
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remH = hours % 24;
      return remH > 0 ? `+${days}d ${remH}h` : `+${days}d`;
    }
    return mins > 0 ? `+${hours}h ${mins}m` : `+${hours}h`;
  }, [currentDate, now, t.presetNow]);

  return (
    <div className="space-y-4 bg-[#FAF9F5] rounded-2xl border-2 border-[#2f3b5c]/15 p-4 sm:p-5 shadow-xs">
      {/* 1. CABECERA: Hora en color corporativo (#2f3b5c) + horizonte relativo */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-3xl sm:text-4xl font-extrabold font-mono text-[#2f3b5c] tracking-tight tabular-nums">
            {formattedHours}
          </span>

          {/* Badge del momento del día */}
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-white text-slate-700 border border-slate-200 shadow-2xs">
            {timeContext.icon}
            <span>{timeContext.period}</span>
          </span>

          {/* Píldora de horizonte relativo (+Xh Ym) */}
          <span className="inline-flex items-center text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#2f3b5c]/10 text-[#2f3b5c] tabular-nums">
            {relativeHorizon}
          </span>
        </div>

        {/* Botón para ajuste manual opcional */}
        <button
          type="button"
          onClick={() => setShowManualInput(!showManualInput)}
          className="text-xs font-bold text-slate-600 hover:text-[#2f3b5c] bg-white hover:bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/90 flex items-center gap-1.5 transition-all shrink-0 shadow-2xs cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">{showManualInput ? t.hideManualSelector : t.manualSelector}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${showManualInput ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* INPUT MANUAL OPCIONAL (DESPLEGABLE) */}
      {showManualInput && (
        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500" htmlFor="manual_datetime">
            {t.exactDateTime}
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
              className="block w-full pl-9 pr-3 py-2 text-sm font-mono border border-slate-300 rounded-xl bg-[#FAF9F5] focus:bg-white focus:ring-2 focus:ring-[#2f3b5c] outline-none font-bold text-[#2f3b5c]"
            />
          </div>
        </div>
      )}

      {/* 2. SELECTOR DE DÍA (HOY, MAÑANA Y DÍA 3) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            {t.forecastDay}
          </label>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
            {t.limit72hBadge}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-200/60 rounded-xl border border-slate-200/90">
          {threeDays.map((d) => {
            const isSelected = selectedDayIndex === d.index;
            return (
              <button
                key={d.index}
                type="button"
                onClick={() => handleSelectDay(d.index)}
                className={`py-2 px-2 rounded-lg text-center font-bold text-xs transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#2f3b5c] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/90'
                }`}
              >
                <span className="text-xs font-extrabold leading-tight">{d.label}</span>
                <span className={`text-[10px] font-mono font-semibold leading-none ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                  {d.dateStr}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. DESLIZADOR PARA SELECCIONAR LA HORA DEL DÍA */}
      <div className="space-y-2 pt-1">
        <div className="flex justify-between items-center text-[11px] font-mono font-bold text-slate-400 tabular-nums">
          <span>{selectedDayIndex === 0 ? t.presetNow : '00:00'}</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>23:45</span>
        </div>

        <div className="relative py-1">
          <input
            type="range"
            min={minMinuteOfDay}
            max={1425}
            step={15}
            value={currentMinuteOfDay}
            onChange={handleMinuteSliderChange}
            className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2f3b5c] focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* 4. CHIPS DE ACCESO RÁPIDO (PRESETS) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-0.5 scrollbar-none text-xs border-t border-slate-200/70">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
          {t.quickPresets}
        </span>
        <button
          type="button"
          onClick={() => applyPresetMinutes(0)}
          className="px-2.5 py-1 rounded-lg font-mono font-bold bg-white hover:bg-[#2f3b5c] hover:text-white text-slate-700 border border-slate-200/90 whitespace-nowrap transition-colors cursor-pointer"
        >
          {t.presetNow}
        </button>
        <button
          type="button"
          onClick={() => applyPresetMinutes(30)}
          className="px-2.5 py-1 rounded-lg font-mono font-bold bg-white hover:bg-[#2f3b5c] hover:text-white text-slate-700 border border-slate-200/90 whitespace-nowrap transition-colors cursor-pointer"
        >
          {t.preset30m}
        </button>
        <button
          type="button"
          onClick={() => applyPresetMinutes(60)}
          className="px-2.5 py-1 rounded-lg font-mono font-bold bg-white hover:bg-[#2f3b5c] hover:text-white text-slate-700 border border-slate-200/90 whitespace-nowrap transition-colors cursor-pointer"
        >
          {t.preset1h}
        </button>
        <button
          type="button"
          onClick={() => applyPresetMinutes(180)}
          className="px-2.5 py-1 rounded-lg font-mono font-bold bg-white hover:bg-[#2f3b5c] hover:text-white text-slate-700 border border-slate-200/90 whitespace-nowrap transition-colors cursor-pointer"
        >
          {t.preset3h}
        </button>
        <button
          type="button"
          onClick={() => applyTomorrowAt(9, 0)}
          className="px-2.5 py-1 rounded-lg font-mono font-bold bg-white hover:bg-[#2f3b5c] hover:text-white text-slate-700 border border-slate-200/90 whitespace-nowrap transition-colors cursor-pointer"
        >
          {t.presetTomorrow9}
        </button>
        <button
          type="button"
          onClick={() => applyTomorrowAt(14, 0)}
          className="px-2.5 py-1 rounded-lg font-mono font-bold bg-white hover:bg-[#2f3b5c] hover:text-white text-slate-700 border border-slate-200/90 whitespace-nowrap transition-colors cursor-pointer"
        >
          {t.presetTomorrow14}
        </button>
      </div>
    </div>
  );
};
