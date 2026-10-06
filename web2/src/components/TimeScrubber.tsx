import React, { useMemo, useState } from 'react';
import { CalendarClock, SlidersHorizontal, Sun, Moon, Sunrise, Sunset, ChevronDown } from 'lucide-react';

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
      
      const weekday = d.toLocaleDateString('es-ES', { weekday: 'long' });
      const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
      const dayNum = d.getDate();
      const month = d.toLocaleDateString('es-ES', { month: 'short' });

      let label = capitalizedWeekday;
      if (i === 0) label = 'Hoy';
      else if (i === 1) label = 'Mañana';

      days.push({
        index: i,
        date: d,
        label,
        dateStr: `${dayNum} ${month}`,
        weekday: capitalizedWeekday
      });
    }
    return days;
  }, [now]);

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

  // Contexto del momento del día (Mañana, Mediodía, Tarde, Noche) - SIN indicador de Hora Punta
  const timeContext = useMemo(() => {
    const h = currentDate.getHours();

    let period = 'Tarde';
    let icon = <Sun className="w-4 h-4 text-amber-500" />;

    if (h >= 6 && h < 12) {
      period = 'Mañana';
      icon = <Sunrise className="w-4 h-4 text-orange-400" />;
    } else if (h >= 12 && h < 16) {
      period = 'Mediodía';
      icon = <Sun className="w-4 h-4 text-amber-500" />;
    } else if (h >= 16 && h < 21) {
      period = 'Tarde';
      icon = <Sunset className="w-4 h-4 text-rose-400" />;
    } else {
      period = 'Noche';
      icon = <Moon className="w-4 h-4 text-indigo-400" />;
    }

    return { period, icon };
  }, [currentDate]);

  const formattedHours = currentDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="space-y-4 bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-sm">
      {/* 1. CABECERA: Hora en color corporativo (azul #2f3b5c), SIN fondo negro, SIN 'en +X horas', SIN 'punta' */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-3">
          {/* Hora en color azul corporativo sin fondo negro */}
          <span className="text-3xl sm:text-4xl font-black font-mono text-[#2f3b5c] tracking-tight">
            {formattedHours}
          </span>

          {/* Badge del momento del día (Mañana / Tarde / Noche) */}
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60 shadow-xs">
            {timeContext.icon}
            <span>{timeContext.period}</span>
          </span>
        </div>

        {/* Botón para ajuste manual opcional */}
        <button
          type="button"
          onClick={() => setShowManualInput(!showManualInput)}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5 transition-all"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">{showManualInput ? 'Ocultar manual' : 'Selector manual'}</span>
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

      {/* 2. FLECHA ROSA: SELECTOR DE DÍA (HOY, MAÑANA Y DÍA DE LA SEMANA) */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400">
          Día del pronóstico:
        </label>
        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60">
          {threeDays.map((d) => {
            const isSelected = selectedDayIndex === d.index;
            return (
              <button
                key={d.index}
                type="button"
                onClick={() => handleSelectDay(d.index)}
                className={`py-2 px-2 rounded-xl text-center font-bold text-xs transition-all flex flex-col items-center justify-center gap-0.5 ${
                  isSelected
                    ? 'bg-[#2f3b5c] text-white shadow-md ring-2 ring-[#2f3b5c]/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                <span className="text-xs font-black leading-tight">{d.label}</span>
                <span className={`text-[10px] font-medium leading-none ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                  {d.dateStr}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. FLECHA AMARILLA: DESLIZADOR PARA SELECCIONAR LA HORA DEL DÍA */}
      <div className="space-y-2 pt-1">
        <div className="flex justify-between items-center text-[11px] font-bold text-slate-400">
          <span>{selectedDayIndex === 0 ? 'Ahora' : '00:00'}</span>
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
            className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2f3b5c] focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* 4. CHIPS DE ACCESO RÁPIDO (PRESETS) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1 scrollbar-none text-xs border-t border-slate-100">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0 mr-1">
          Rápido:
        </span>
        <button
          type="button"
          onClick={() => applyPresetMinutes(0)}
          className="px-2.5 py-1 rounded-xl font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap transition-all"
        >
          Ahora
        </button>
        <button
          type="button"
          onClick={() => applyPresetMinutes(30)}
          className="px-2.5 py-1 rounded-xl font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap transition-all"
        >
          +30 min
        </button>
        <button
          type="button"
          onClick={() => applyPresetMinutes(60)}
          className="px-2.5 py-1 rounded-xl font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap transition-all"
        >
          +1 hora
        </button>
        <button
          type="button"
          onClick={() => applyPresetMinutes(180)}
          className="px-2.5 py-1 rounded-xl font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap transition-all"
        >
          +3 horas
        </button>
        <button
          type="button"
          onClick={() => applyTomorrowAt(9, 0)}
          className="px-2.5 py-1 rounded-xl font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap transition-all"
        >
          Mañana 09:00
        </button>
        <button
          type="button"
          onClick={() => applyTomorrowAt(14, 0)}
          className="px-2.5 py-1 rounded-xl font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap transition-all"
        >
          Mañana 14:00
        </button>
      </div>
    </div>
  );
};
