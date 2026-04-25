import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Moon, ArrowRightLeft } from 'lucide-react';

import type { WorkoutPlan, WorkoutRecord } from '../../types/workout';
import { calcProgression } from '../../utils/progression';

const WEEKDAYS_SHORT = ['D','S','T','Q','Q','S','S'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function toDateKey(date: Date): string {
  return date.toLocaleDateString('pt-BR');
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();
}

export default function HistoryView({ history, workoutPlans }: { history: WorkoutRecord[]; workoutPlans: WorkoutPlan[] }) {
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

  /* ── Dados do dia selecionado ── */
  const dayData = useMemo(() => {
    const dateKey = toDateKey(selectedDate);
    const dayRecords = history.filter(r =>
      new Date(r.date).toLocaleDateString('pt-BR') === dateKey
    );
    const planMap: Record<string, { planId: string; planName: string; records: WorkoutRecord[] }> = {};
    dayRecords.forEach(record => {
      const key = record.planId;
      if (!planMap[key]) {
        // Buscar nome atual do plano, fallback para nome salvo no histórico
        const currentPlan = workoutPlans.find(p => p.id === record.planId);
        const currentPlanName = currentPlan?.name || record.planName;
        planMap[key] = { planId: record.planId, planName: currentPlanName, records: [] };
      }
      planMap[key].records.push(record);
    });
    return { dayRecords, planMap };
  }, [history, selectedDate, workoutPlans]);

  /* ── Células do calendário ── */
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const startWeekday = firstDay.getDay();
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

      {/* ═══════ Calendário mensal ═══════ */}
      <div className="px-1 mb-4">
        <div className="flex items-center justify-between mb-3">
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
            {MONTHS[viewMonth].toLowerCase()} {viewYear}
          </h2>

          <button onClick={goToToday}
            className="text-[11px] font-semibold text-purple-400
                       bg-purple-500/15 border border-purple-500/20 px-3 py-1 rounded-full
                       active:scale-95 transition-transform">
            hoje
          </button>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS_SHORT.map((d, i) => (
            <div key={i} className="text-center text-[10px] text-[#4a4568] font-medium tracking-wider py-1">
              {d}
            </div>
          ))}
        </div>

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
                {hasWorkout && (
                  <div className={`absolute bottom-1 w-1 h-1 rounded-full ${
                    isSelected ? 'bg-white/70' : 'bg-green-400'
                  }`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════ Painel do dia ═══════ */}
      <div className="rounded-[18px] p-4 border border-purple-500/[0.15]"
           style={{ background: 'rgba(255,255,255,0.04)' }}>

        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-semibold text-white">{formatSelectedDate()}</h3>
          {hasRecords && (() => {
            const times = dayRecords.map(r => new Date(r.date).getTime());
            const earliest = new Date(Math.min(...times));
            const latest = new Date(Math.max(...times));
            const fmt = (d: Date) => `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
            return times.length >= 2 && earliest.getTime() !== latest.getTime() ? (
              <span className="text-[11px] text-[#4a4568]">
                {fmt(earliest)} – {fmt(latest)}
              </span>
            ) : (
              <span className="text-[11px] text-[#4a4568]">{fmt(earliest)}</span>
            );
          })()}
        </div>

        {!hasRecords ? (
          <div className="flex flex-col items-center py-8 gap-2">
            <Moon size={28} className="text-[#3a3060]" />
            <p className="text-[13px] text-[#4a4568]">dia de descanso</p>
          </div>
        ) : (
           groupedByPlan.map(({ planId, planName, records }) => {
            const totalPlanned = records.reduce((acc, r) => acc + (r.plannedSets ?? 0), 0);
            const totalDone = records.reduce((acc, r) => acc + (r.completedSets?.length ?? 0), 0);
            const volumePct = totalPlanned > 0 ? Math.round((totalDone / totalPlanned) * 100) : 0;

            const volumeState =
              volumePct >= 80 ? 'great' :
              volumePct >= 50 ? 'good' : 'low';

            const volumeColor = {
              great: '#4ade80',
              good: '#fbbf24',
              low: '#f87171'
            }[volumeState];

            const volumeLabel = {
              great: 'ÓTIMO',
              good: 'BOM',
              low: 'ABAIXO'
            }[volumeState];

            const CIRCUMFERENCE = 2 * Math.PI * 30;
            const dashOffset = CIRCUMFERENCE * (1 - volumePct / 100);

            const containerStyle = volumeState === 'great'
              ? { background: 'rgba(74, 222, 128, 0.05)', border: '0.5px solid rgba(74, 222, 128, 0.25)' }
              : volumeState === 'good'
                ? { background: 'rgba(251, 191, 36, 0.05)', border: '0.5px solid rgba(251, 191, 36, 0.2)' }
                : { background: 'rgba(239, 68, 68, 0.04)', border: '0.5px solid rgba(239, 68, 68, 0.2)' };

            const dividerColor = volumeState === 'great'
              ? 'rgba(139, 92, 246, 0.1)'
              : volumeState === 'good'
                ? 'rgba(251, 191, 36, 0.1)'
                : 'rgba(239, 68, 68, 0.1)';

            const times = records.map(r => new Date(r.date).getTime()).sort((a, b) => a - b);
            const durationMin = times.length >= 2
              ? Math.max(1, Math.round((times[times.length - 1] - times[0]) / 60000))
              : null;

            const maxWeight = Math.max(...records.map(r => Number(r.weight) || 0), 0);

            return (
              <div
                key={planId}
                className="mb-3 last:mb-0 rounded-[14px] p-[13px]"
                style={containerStyle}
              >
                {/* Seção superior */}
                <div className="flex items-center gap-3">
                  {/* Anel SVG */}
                  <svg width="76" height="76" viewBox="0 0 76 76" style={{ flexShrink: 0 }}>
                    <circle
                      cx="38" cy="38" r="30" fill="none"
                      stroke={volumeColor}
                      strokeOpacity="0.15"
                      strokeWidth="6"
                    />
                    <circle
                      cx="38" cy="38" r="30" fill="none"
                      stroke={volumeColor}
                      strokeWidth="6"
                      strokeDasharray={CIRCUMFERENCE}
                      strokeDashoffset={dashOffset}
                      strokeLinecap="round"
                      transform="rotate(-90 38 38)"
                    />
                    <text
                      x="38" y="34"
                      textAnchor="middle"
                      fontSize="15"
                      fontWeight="700"
                      fill="#fff"
                      fontFamily="-apple-system,system-ui,sans-serif"
                    >
                      {volumePct}%
                    </text>
                    <text
                      x="38" y="45"
                      textAnchor="middle"
                      fontSize="8.5"
                      fontWeight="600"
                      letterSpacing=".3"
                      fill={volumeColor}
                      fontFamily="-apple-system,system-ui,sans-serif"
                    >
                      {volumeLabel}
                    </text>
                  </svg>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold text-white tracking-[-0.3px] mb-[2px] truncate">
                      {planName}
                    </p>
                    <p className="text-[11px] text-[#7c6f9e] mb-2">
                      {durationMin != null ? `${durationMin} min · ` : ''}{records.length} exercícios
                    </p>

                    <div className="flex gap-3.5">
                      <div>
                        <div className="text-[14px] font-bold text-white tracking-[-0.3px] leading-none">
                          {totalDone}
                        </div>
                        <div className="text-[10px] text-[#7c6f9e] mt-[1px]">séries feitas</div>
                      </div>
                      <div>
                        <div className="text-[14px] font-bold text-white tracking-[-0.3px] leading-none">
                          {totalPlanned}
                        </div>
                        <div className="text-[10px] text-[#7c6f9e] mt-[1px]">planejadas</div>
                      </div>
                      <div>
                        <div className="text-[14px] font-bold text-white tracking-[-0.3px] leading-none">
                          {maxWeight > 0 ? (
                            <>
                              {maxWeight}
                              <span className="text-[9px] font-normal text-[#7c6f9e] ml-0.5">kg</span>
                            </>
                          ) : (
                            '—'
                          )}
                        </div>
                        <div className="text-[10px] text-[#7c6f9e] mt-[1px]">carga máx</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divisor */}
                <div className="my-[10px] h-[0.5px]" style={{ background: dividerColor }} />

                {/* Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {records.map(record => {
                    const isSub = !!record.substitute;
                    const prevRecord = history
                      .filter(r =>
                        r.exerciseName === record.exerciseName &&
                        r.planId === record.planId &&
                        new Date(r.date).getTime() < new Date(record.date).getTime()
                      )
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                    const progression = prevRecord ? calcProgression(record, prevRecord) : null;
                    return (
                      <span
                        key={record.id}
                        className="inline-flex items-center gap-1 rounded-full px-[9px] py-1"
                        style={isSub
                          ? {
                            background: 'rgba(124, 58, 237, 0.08)',
                            border: '0.5px solid rgba(124, 58, 237, 0.3)'
                          }
                          : {
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '0.5px solid rgba(139, 92, 246, 0.18)'
                          }
                        }
                      >
                        {isSub && <ArrowRightLeft size={9} style={{ stroke: '#a78bfa' }} />}
                        <span className="text-[11px] font-medium text-[#d4b8ff]">{record.exerciseName}</span>
                        <span className="text-[10px] text-[#7c6f9e]">{(record.plannedSets ?? record.completedSets?.length ?? 0)}s</span>
                        {progression?.kind === 'up' && (
                          <span className="text-[9px] font-bold text-green-400 ml-0.5">{progression.label}</span>
                        )}
                        {progression?.kind === 'down' && (
                          <span className="text-[9px] font-bold text-red-400 ml-0.5">{progression.label}</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
