import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Moon, ArrowRightLeft } from 'lucide-react';

import type { WorkoutPlan, WorkoutRecord } from '../../types/workout';

const WEEKDAYS_SHORT = ['D','S','T','Q','Q','S','S'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
const MONTHS_SHORT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

function toDateKey(date: Date): string {
  return date.toLocaleDateString('pt-BR');
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + (6 - d.getDay()));
  d.setHours(23, 59, 59, 999);
  return d;
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

  /* ── Dados da semana atual ── */
  const weekData = useMemo(() => {
    const ws = startOfWeek(today);
    const we = endOfWeek(today);

    const weekRecords = history.filter(r => {
      const d = new Date(r.date);
      return d >= ws && d <= we;
    });

    const totalSets = weekRecords.reduce((acc, r) => acc + (r.completedSets?.length ?? 0), 0);
    const totalSessions = new Set(weekRecords.map(r => new Date(r.date).toLocaleDateString('pt-BR'))).size;

    // Duração: diferença entre primeiro e último registro de cada dia
    let totalMinutes = 0;
    const recordsByDay: Record<string, WorkoutRecord[]> = {};
    weekRecords.forEach(r => {
      const dk = new Date(r.date).toLocaleDateString('pt-BR');
      if (!recordsByDay[dk]) recordsByDay[dk] = [];
      recordsByDay[dk].push(r);
    });
    Object.values(recordsByDay).forEach(dayRecs => {
      // Se o registro já tem durationMinutes, usar
      const withDuration = dayRecs.find(r => r.durationMinutes != null);
      if (withDuration) { totalMinutes += withDuration.durationMinutes!; return; }
      const times = dayRecs.map(r => new Date(r.date).getTime()).sort((a, b) => a - b);
      if (times.length >= 2) {
        totalMinutes += Math.max(1, Math.round((times[times.length - 1] - times[0]) / 60000));
      }
    });

    // Séries por dia (0=dom … 6=sáb)
    const setsByDay = Array(7).fill(0);
    weekRecords.forEach(r => {
      setsByDay[new Date(r.date).getDay()] += r.completedSets?.length ?? 0;
    });
    const maxSets = Math.max(...setsByDay, 1);
    const barHeights = setsByDay.map(s => Math.round((s / maxSets) * 100));

    const hasWorkoutByDay = Array(7).fill(false);
    weekRecords.forEach(r => { hasWorkoutByDay[new Date(r.date).getDay()] = true; });

    // Label do intervalo
    const startDay = ws.getDate();
    const endDay = we.getDate();
    const sm = MONTHS_SHORT[ws.getMonth()];
    const em = MONTHS_SHORT[we.getMonth()];
    const rangeLabel = sm === em
      ? `${startDay} – ${endDay} ${em}`
      : `${startDay} ${sm} – ${endDay} ${em}`;

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    return { totalSessions, totalSets, hours, mins, setsByDay, barHeights, hasWorkoutByDay, rangeLabel };
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
  const todayDow = today.getDay();

  return (
    <div className="pt-4">

      {/* ═══════ Card semanal ═══════ */}
      <div className="card-elevated p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] text-purple-400 font-semibold tracking-[.8px] uppercase">
            semana atual
          </p>
          <p className="text-[11px] text-[#4a4568]">{weekData.rangeLabel}</p>
        </div>

        {/* Totais */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-[12px] p-3 border border-purple-500/[0.15] bg-white/[0.03]">
            <span className="text-[28px] font-bold text-white leading-none">{weekData.totalSessions}</span>
            <p className="text-[10px] text-[#7c6f9e] mt-1.5">treinos</p>
          </div>
          <div className="rounded-[12px] p-3 border border-purple-500/[0.15] bg-white/[0.03]">
            <span className="text-[28px] font-bold text-white leading-none">{weekData.totalSets}</span>
            <p className="text-[10px] text-[#7c6f9e] mt-1.5">séries</p>
          </div>
          <div className="rounded-[12px] p-3 border border-purple-500/[0.15] bg-white/[0.03]">
            <div className="flex items-baseline">
              <span className="text-[28px] font-bold text-white leading-none">{weekData.hours}</span>
              <span className="text-[13px] text-[#4a4568] font-medium">h</span>
              <span className="text-[28px] font-bold text-white leading-none ml-0.5">
                {String(weekData.mins).padStart(2, '0')}
              </span>
            </div>
            <p className="text-[10px] text-[#7c6f9e] mt-1.5">duração</p>
          </div>
        </div>

        {/* Barras por dia da semana */}
        <div className="flex items-end gap-1.5" style={{ height: 68 }}>
          {weekData.barHeights.map((h, i) => {
            const isFuture = i > todayDow;
            const hasSets = weekData.setsByDay[i] > 0;
            return (
              <div key={i} className="flex-1 h-full flex flex-col justify-end">
                <div
                  className={`w-full rounded-t-[5px] transition-all ${
                    isFuture ? 'bg-purple-500/15' :
                    hasSets  ? 'bg-purple-500' : 'bg-[#1e1640]'
                  }`}
                  style={{ height: `${hasSets ? Math.max(h, 10) : 5}%`, minHeight: 3 }}
                />
              </div>
            );
          })}
        </div>

        {/* Dots + Labels */}
        <div className="grid grid-cols-7 gap-1.5 mt-2">
          {WEEKDAYS_SHORT.map((d, i) => {
            const isFuture = i > todayDow;
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                {weekData.hasWorkoutByDay[i]
                  ? <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  : <div className="w-1.5 h-1.5" />
                }
                <span className={`text-[9px] font-medium ${
                  isFuture ? 'text-[#2d2040]' : 'text-[#7c6f9e]'
                }`}>{d}</span>
              </div>
            );
          })}
        </div>
      </div>

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
