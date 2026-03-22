import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ArrowRightLeft, Moon } from 'lucide-react';

const WEEKDAYS_SHORT = ['D','S','T','Q','Q','S','S'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function toDateKey(date) {
  return date.toLocaleDateString('pt-BR');
}

function isSameDay(a, b) {
  return a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();
}

export default function HistoryView({ history, workoutPlans }) {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const workoutDays = useMemo(() => {
    const days = new Set();
    history.forEach(record => {
      days.add(new Date(record.date).toLocaleDateString('pt-BR'));
    });
    return days;
  }, [history]);

  const dayData = useMemo(() => {
    const dateKey = toDateKey(selectedDate);
    const dayRecords = history.filter(r =>
      new Date(r.date).toLocaleDateString('pt-BR') === dateKey
    );
    const planMap = {};
    dayRecords.forEach(record => {
      const key = record.planId;
      if (!planMap[key]) {
        planMap[key] = { planId: record.planId, planName: record.planName, records: [] };
      }
      planMap[key].records.push(record);
    });
    return { dayRecords, planMap };
  }, [history, selectedDate]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    let startWeekday = firstDay.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));
    return cells;
  }, [viewMonth, viewYear]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const goToToday = () => {
    setSelectedDate(today);
    setViewMonth(today.getMonth());
    setViewYear(today.getFullYear());
  };

  const formatSelectedDate = () => {
    const dayOfWeek = selectedDate.toLocaleDateString('pt-BR', { weekday: 'long' });
    const day = selectedDate.getDate();
    const month = MONTHS[selectedDate.getMonth()].toLowerCase();
    const weekday = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
    return `${weekday}, ${day} de ${month}`;
  };

  const { dayRecords, planMap } = dayData;
  const hasRecords = dayRecords.length > 0;
  const groupedByPlan = Object.values(planMap);

  return (
    <div className="pt-4">
      {/* Calendário */}
      <div className="card p-4 mb-4">
        {/* Cabeçalho do calendário */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <button onClick={prevMonth}
              className="w-7 h-7 rounded-full flex items-center justify-center
                         bg-purple-500/15 border border-purple-500/20 active:scale-95 transition-transform">
              <ChevronLeft size={13} className="text-purple-400" />
            </button>
            <button onClick={nextMonth}
              className="w-7 h-7 rounded-full flex items-center justify-center
                         bg-purple-500/15 border border-purple-500/20 active:scale-95 transition-transform">
              <ChevronRight size={13} className="text-purple-400" />
            </button>
          </div>

          <h2 className="text-[16px] font-semibold text-white tracking-tight">
            {MONTHS[viewMonth]} {viewYear}
          </h2>

          <button onClick={goToToday}
            className="text-[11px] font-semibold text-purple-400
                       bg-purple-500/15 border border-purple-500/20 px-3 py-1 rounded-full
                       active:scale-95 transition-transform">
            hoje
          </button>
        </div>

        {/* Labels dos dias da semana */}
        <div className="grid grid-cols-7 mb-1.5">
          {WEEKDAYS_SHORT.map((d, i) => (
            <div key={i} className="text-center text-[10px] text-[#4a4568] font-medium tracking-wider py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Células dos dias */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, i) => {
            if (!date) return <div key={`empty-${i}`} />;
            const key = toDateKey(date);
            const hasWorkout = workoutDays.has(key);
            const isToday = isSameDay(date, today);
            const isSelected = isSameDay(date, selectedDate);
            const isFuture = date > today;

            return (
              <button
                key={key}
                disabled={isFuture}
                onClick={() => setSelectedDate(date)}
                className={`aspect-square rounded-[10px] flex flex-col items-center justify-center
                            relative text-[13px] font-medium transition-all active:scale-95 ${
                  isSelected   ? 'bg-purple-600 text-white' :
                  isToday      ? 'border border-purple-500 text-white' :
                  isFuture     ? 'text-[#2d2040] cursor-default' :
                  hasWorkout   ? 'text-white' :
                  'text-[#7c6f9e]'
                }`}>
                {date.getDate()}
                {hasWorkout && !isSelected && (
                  <div className="absolute bottom-1 w-1 h-1 rounded-full bg-green-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Painel de detalhes do dia */}
      <div className="rounded-[18px] p-4 border border-purple-500/[0.15]"
           style={{ background: 'rgba(255,255,255,0.04)' }}>

        {/* Header do painel */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-semibold text-white">{formatSelectedDate()}</h3>
          {hasRecords && (
            <span className="text-[10px] font-semibold text-green-400 bg-green-500/10
                             border border-green-500/20 px-2.5 py-1 rounded-full">
              {dayRecords.length} exercícios
            </span>
          )}
        </div>

        {/* Dia sem treino */}
        {!hasRecords ? (
          <div className="flex flex-col items-center py-8 gap-2">
            <Moon size={28} className="text-[#3a3060]" />
            <p className="text-[13px] text-[#4a4568]">dia de descanso</p>
          </div>
        ) : (
          /* Exercícios agrupados por ficha */
          groupedByPlan.map(({ planId, planName, records }) => (
            <div key={planId} className="mb-3 last:mb-0">
              <p className="text-[10px] font-semibold text-purple-400 tracking-[.6px] uppercase mb-2">
                {planName}
              </p>
              {records.map(record => (
                <div key={record.id}
                  className="rounded-[12px] p-3 mb-2 border border-purple-500/[0.14]"
                  style={{ background: 'rgba(124, 58, 237, 0.06)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[13px] font-semibold text-white leading-tight">
                        {record.exerciseName}
                      </p>
                      <p className="text-[11px] text-[#7c6f9e] mt-0.5">
                        {record.plannedSets || record.completedSets?.length || '?'} séries
                        {record.weight ? ` · ${record.weight} kg` : ''}
                      </p>
                    </div>
                    {record.substitute && (
                      <span className="inline-flex items-center gap-1 text-[9px] text-purple-300
                                        bg-purple-500/15 border border-purple-500/20 px-2 py-0.5 rounded-full flex-shrink-0">
                        <ArrowRightLeft size={8} />
                        substituto
                      </span>
                    )}
                  </div>
                  {/* Tags das séries */}
                  {record.completedSets?.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mt-2.5">
                      {record.completedSets.map((s, i) => (
                        <span key={i}
                          className="text-[10px] text-purple-300 px-2 py-0.5 rounded-full
                                     bg-[#1e1640] border border-purple-500/20">
                          S{i + 1}: {s?.reps != null ? s.reps : '—'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
