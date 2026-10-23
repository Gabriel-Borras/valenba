import React, { useMemo, useState, useEffect } from 'react';
import { CalendarClock, ChevronDown } from 'lucide-react';
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

  // Reloj reactivo: se actualiza periódicamente
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

  // Si la fecha seleccionada quedó en el pasado al pasar las 00:00, auto-ajustar
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
    return 0;
  }, [currentDate, threeDays]);

  // Minuto del día actual (0 a 1425)
  const currentMinuteOfDay = useMemo(() => {
    return currentDate.getHours() * 60 + currentDate.getMinutes();
  }, [currentDate]);

  const minMinuteOfDay = selectedDayIndex === 0 ? nowMinuteRounded : 0;

  const handleSelectDay = (dayIndex: number) => {
    const targetBase = new Date(threeDays[dayIndex].date);
    let hour = currentDate.getHours();
    let minute = currentDate.getMinutes();

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

  const handleMinuteSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const minutes = parseInt(e.target.value, 10);
    const target = new Date(threeDays[selectedDayIndex].date);
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    target.setHours(hour, minute, 0, 0);
    onChange(formatISO(target));
  };

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

  const formattedHours = currentDate.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit'
  });

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
    <div className="bg-[#FAF9F5]/70 rounded-xl border border-slate-200/80 p-3.5 space-y-3">
      {/* 1. Selector de Día Minimalista */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/50 rounded-xl">
        {threeDays.map((d) => {
          const isSelected = selectedDayIndex === d.index;
          return (
            <button
              key={d.index}
              type="button"
              onClick={() => handleSelectDay(d.index)}
              className={`py-1.5 px-2 rounded-lg text-center font-bold text-xs transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white text-[#2f3b5c] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="block leading-tight">{d.label}</span>
              <span className={`text-[10px] font-mono leading-none block mt-0.5 ${isSelected ? 'text-[#1a84ce]' : 'text-slate-400'}`}>
                {d.dateStr}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. Visualización de Hora y Deslizador */}
      <div className="space-y-2 pt-1">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-[#2f3b5c] tabular-nums tracking-tight">
              {formattedHours}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">
              {relativeHorizon}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowManualInput(!showManualInput)}
            className="text-xs text-slate-500 hover:text-[#2f3b5c] flex items-center gap-1 transition-colors cursor-pointer py-1"
          >
            <CalendarClock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px]">{showManualInput ? t.hideManualSelector : t.manualSelector}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showManualInput ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Input manual desplegable */}
        {showManualInput && (
          <div className="pt-1 pb-1 animate-in fade-in duration-150">
            <input
              id="manual_datetime"
              type="datetime-local"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full text-xs font-mono p-2 border border-slate-300 rounded-lg bg-white text-[#2f3b5c] outline-none focus:border-[#2f3b5c]"
            />
          </div>
        )}

        {/* Slider continuo */}
        <div className="pt-1">
          <input
            type="range"
            min={minMinuteOfDay}
            max={1425}
            step={15}
            value={currentMinuteOfDay}
            onChange={handleMinuteSliderChange}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2f3b5c]"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-1">
            <span>{selectedDayIndex === 0 ? t.presetNow : '00:00'}</span>
            <span>12:00</span>
            <span>23:45</span>
          </div>
        </div>
      </div>

      {/* 3. Atajos Rápidos */}
      <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-200/60 scrollbar-none">
        <button
          type="button"
          onClick={() => applyPresetMinutes(0)}
          className="px-2 py-0.5 rounded-md font-mono text-[11px] font-medium bg-white hover:bg-[#2f3b5c] hover:text-white text-slate-600 border border-slate-200/80 whitespace-nowrap transition-colors cursor-pointer"
        >
          {t.presetNow}
        </button>
        <button
          type="button"
          onClick={() => applyPresetMinutes(30)}
          className="px-2 py-0.5 rounded-md font-mono text-[11px] font-medium bg-white hover:bg-[#2f3b5c] hover:text-white text-slate-600 border border-slate-200/80 whitespace-nowrap transition-colors cursor-pointer"
        >
          {t.preset30m}
        </button>
        <button
          type="button"
          onClick={() => applyPresetMinutes(60)}
          className="px-2 py-0.5 rounded-md font-mono text-[11px] font-medium bg-white hover:bg-[#2f3b5c] hover:text-white text-slate-600 border border-slate-200/80 whitespace-nowrap transition-colors cursor-pointer"
        >
          {t.preset1h}
        </button>
        <button
          type="button"
          onClick={() => applyPresetMinutes(180)}
          className="px-2 py-0.5 rounded-md font-mono text-[11px] font-medium bg-white hover:bg-[#2f3b5c] hover:text-white text-slate-600 border border-slate-200/80 whitespace-nowrap transition-colors cursor-pointer"
        >
          {t.preset3h}
        </button>
        <button
          type="button"
          onClick={() => applyTomorrowAt(9, 0)}
          className="px-2 py-0.5 rounded-md font-mono text-[11px] font-medium bg-white hover:bg-[#2f3b5c] hover:text-white text-slate-600 border border-slate-200/80 whitespace-nowrap transition-colors cursor-pointer"
        >
          {t.presetTomorrow9}
        </button>
        <button
          type="button"
          onClick={() => applyTomorrowAt(14, 0)}
          className="px-2 py-0.5 rounded-md font-mono text-[11px] font-medium bg-white hover:bg-[#2f3b5c] hover:text-white text-slate-600 border border-slate-200/80 whitespace-nowrap transition-colors cursor-pointer"
        >
          {t.presetTomorrow14}
        </button>
      </div>
    </div>
  );
};
