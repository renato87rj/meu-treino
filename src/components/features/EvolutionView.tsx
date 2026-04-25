'use client';
import React, { useMemo } from 'react';
import type { WorkoutPlan, WorkoutRecord } from '../../types/workout';
import exerciseDatabase from '../../data/exerciseDatabase';

const WEEKDAYS_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTHS_SHORT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

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
function startOfWeekOffset(weeksAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() - weeksAgo * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

interface Props {
  history: WorkoutRecord[];
  workoutPlans: WorkoutPlan[];
}

export default function EvolutionView({ history, workoutPlans }: Props) {
  const today = new Date();
  const todayDow = today.getDay();

  /* ── Card semanal ── */
  const weekData = useMemo(() => {
    const ws = startOfWeek(today);
    const we = endOfWeek(today);
    const weekRecords = history.filter(r => {
      const d = new Date(r.date);
      return d >= ws && d <= we;
    });

    const totalSets = weekRecords.reduce((acc, r) => acc + (r.completedSets?.length ?? 0), 0);
    const totalSessions = new Set(weekRecords.map(r => new Date(r.date).toLocaleDateString('pt-BR'))).size;

    let totalMinutes = 0;
    const recordsByDay: Record<string, WorkoutRecord[]> = {};
    weekRecords.forEach(r => {
      const dk = new Date(r.date).toLocaleDateString('pt-BR');
      if (!recordsByDay[dk]) recordsByDay[dk] = [];
      recordsByDay[dk].push(r);
    });
    Object.values(recordsByDay).forEach(dayRecs => {
      const withDuration = dayRecs.find(r => r.durationMinutes != null);
      if (withDuration) { totalMinutes += withDuration.durationMinutes!; return; }
      const times = dayRecs.map(r => new Date(r.date).getTime()).sort((a, b) => a - b);
      if (times.length >= 2) {
        totalMinutes += Math.max(1, Math.round((times[times.length - 1] - times[0]) / 60000));
      }
    });

    const avgMinutes = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;
    const avgH = Math.floor(avgMinutes / 60);
    const avgM = avgMinutes % 60;

    const setsByDay = Array(7).fill(0);
    weekRecords.forEach(r => {
      setsByDay[new Date(r.date).getDay()] += r.completedSets?.length ?? 0;
    });
    const maxSets = Math.max(...setsByDay, 1);
    const barHeights = setsByDay.map(s => Math.round((s / maxSets) * 100));
    const hasWorkoutByDay = Array(7).fill(false);
    weekRecords.forEach(r => { hasWorkoutByDay[new Date(r.date).getDay()] = true; });

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    const sm = MONTHS_SHORT[ws.getMonth()];
    const em = MONTHS_SHORT[we.getMonth()];
    const rangeLabel = sm === em
      ? `${ws.getDate()} – ${we.getDate()} ${em}`
      : `${ws.getDate()} ${sm} – ${we.getDate()} ${em}`;

    // Volume planejado (total sets planejados nos planos × exercícios) vs realizado
    const plannedSets = weekRecords.reduce((acc, r) => acc + (r.plannedSets ?? 0), 0);
    const ratio = plannedSets > 0 ? totalSets / plannedSets : null;
    const volumeStatus: 'green' | 'yellow' | 'red' | null =
      ratio === null ? null :
      ratio >= 0.9 ? 'green' :
      ratio >= 0.6 ? 'yellow' : 'red';

    return {
      totalSessions, totalSets, hours, mins, avgH, avgM, avgMinutes,
      setsByDay, barHeights, hasWorkoutByDay, rangeLabel,
      plannedSets, ratio, volumeStatus,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history]);

  /* ── Volume por semana (últimas 8 semanas) ── */
  const weeklyVolume = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const ws = startOfWeekOffset(7 - i);
      const we = new Date(ws);
      we.setDate(we.getDate() + 6);
      we.setHours(23, 59, 59, 999);
      const recs = history.filter(r => {
        const d = new Date(r.date);
        return d >= ws && d <= we;
      });
      const sets = recs.reduce((acc, r) => acc + (r.completedSets?.length ?? 0), 0);
      const label = `${ws.getDate()}/${MONTHS_SHORT[ws.getMonth()]}`;
      return { label, sets };
    });
  }, [history]);

  const maxWeeklySets = Math.max(...weeklyVolume.map(w => w.sets), 1);

  /* ── Volume por grupo muscular ── */
  const muscleData = useMemo(() => {
    const groupMap: Record<string, number> = {};
    history.forEach(r => {
      const db = exerciseDatabase.find(e =>
        e.name.toLowerCase() === r.exerciseName.toLowerCase()
      );
      const group = db?.group ?? 'Outro';
      groupMap[group] = (groupMap[group] ?? 0) + (r.completedSets?.length ?? 0);
    });
    const total = Object.values(groupMap).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(groupMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([group, sets]) => ({ group, sets, pct: Math.round((sets / total) * 100) }));
  }, [history]);

  const volumeStatusColors = {
    green:  { bar: 'bg-green-500',  text: 'text-green-400',  label: 'Ótimo volume' },
    yellow: { bar: 'bg-yellow-400', text: 'text-yellow-400', label: 'Volume moderado' },
    red:    { bar: 'bg-red-500',    text: 'text-red-400',    label: 'Volume baixo' },
  };

  return (
    <div className="pt-4 space-y-4">

      {/* ═══════ Card semanal ═══════ */}
      <div className="card-elevated p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] text-purple-400 font-semibold tracking-[.8px] uppercase">semana atual</p>
          <p className="text-[11px] text-[#4a4568]">{weekData.rangeLabel}</p>
        </div>

        {/* Totais: treinos, séries, duração, tempo médio */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="rounded-[12px] p-3 border border-purple-500/[0.15] bg-white/[0.03]">
            <div className="flex items-end gap-1">
              <span className="text-[28px] font-bold text-white leading-none">{weekData.totalSessions}</span>
            </div>
            <p className="text-[10px] text-[#7c6f9e] mt-1.5">treinos</p>
          </div>
          <div className="rounded-[12px] p-3 border border-purple-500/[0.15] bg-white/[0.03]">
            <span className="text-[28px] font-bold text-white leading-none">{weekData.totalSets}</span>
            <p className="text-[10px] text-[#7c6f9e] mt-1.5">séries realizadas</p>
          </div>
          <div className="rounded-[12px] p-3 border border-purple-500/[0.15] bg-white/[0.03]">
            <div className="flex items-baseline">
              <span className="text-[28px] font-bold text-white leading-none">{weekData.hours}</span>
              <span className="text-[13px] text-[#4a4568] font-medium">h</span>
              <span className="text-[28px] font-bold text-white leading-none ml-0.5">{String(weekData.mins).padStart(2,'0')}</span>
            </div>
            <p className="text-[10px] text-[#7c6f9e] mt-1.5">duração total</p>
          </div>
          <div className="rounded-[12px] p-3 border border-purple-500/[0.15] bg-white/[0.03]">
            {weekData.avgMinutes > 0 ? (
              <div className="flex items-baseline">
                {weekData.avgH > 0 && (
                  <>
                    <span className="text-[28px] font-bold text-white leading-none">{weekData.avgH}</span>
                    <span className="text-[13px] text-[#4a4568] font-medium">h</span>
                  </>
                )}
                <span className="text-[28px] font-bold text-white leading-none">{String(weekData.avgM).padStart(2,'0')}</span>
                <span className="text-[13px] text-[#4a4568] font-medium">min</span>
              </div>
            ) : (
              <span className="text-[24px] font-bold text-[#3a3060] leading-none">—</span>
            )}
            <p className="text-[10px] text-[#7c6f9e] mt-1.5">tempo médio/treino</p>
          </div>
        </div>

        {/* Volume planejado vs realizado */}
        {weekData.volumeStatus && (
          <div className={`flex items-center justify-between rounded-[10px] px-3 py-2 mb-3 border ${
            weekData.volumeStatus === 'green'  ? 'border-green-500/20 bg-green-500/[0.06]' :
            weekData.volumeStatus === 'yellow' ? 'border-yellow-400/20 bg-yellow-400/[0.06]' :
                                                  'border-red-500/20 bg-red-500/[0.06]'
          }`}>
            <div>
              <p className={`text-[12px] font-semibold ${volumeStatusColors[weekData.volumeStatus].text}`}>
                {volumeStatusColors[weekData.volumeStatus].label}
              </p>
              <p className="text-[10px] text-[#7c6f9e] mt-0.5">
                {weekData.totalSets}/{weekData.plannedSets} séries planejadas
              </p>
            </div>
            <div className={`text-[18px] font-bold ${volumeStatusColors[weekData.volumeStatus].text}`}>
              {weekData.ratio !== null ? `${Math.round(weekData.ratio * 100)}%` : '—'}
            </div>
          </div>
        )}

        {/* Barras por dia */}
        <div className="flex items-end gap-1.5" style={{ height: 56 }}>
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
        <div className="grid grid-cols-7 gap-1.5 mt-2">
          {WEEKDAYS_SHORT.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              {weekData.hasWorkoutByDay[i]
                ? <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                : <div className="w-1.5 h-1.5" />
              }
              <span className={`text-[9px] font-medium ${
                i > todayDow ? 'text-[#2d2040]' : 'text-[#7c6f9e]'
              }`}>{d}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════ Volume por semana (últimas 8 semanas) ═══════ */}
      <div className="card-elevated p-4">
        <p className="text-[10px] text-purple-400 font-semibold tracking-[.8px] uppercase mb-4">
          volume por semana
        </p>
        {weeklyVolume.every(w => w.sets === 0) ? (
          <p className="text-[13px] text-[#4a4568] text-center py-4">Nenhum dado ainda</p>
        ) : (
          <>
            <div className="flex items-end gap-1.5" style={{ height: 80 }}>
              {weeklyVolume.map((w, i) => {
                const h = Math.round((w.sets / maxWeeklySets) * 100);
                const isCurrentWeek = i === 7;
                return (
                  <div key={i} className="flex-1 h-full flex flex-col justify-end items-center gap-1">
                    {w.sets > 0 && (
                      <span className="text-[8px] text-[#7c6f9e]">{w.sets}</span>
                    )}
                    <div
                      className={`w-full rounded-t-[5px] transition-all ${
                        isCurrentWeek ? 'bg-purple-500' : 'bg-purple-500/40'
                      }`}
                      style={{ height: `${w.sets > 0 ? Math.max(h, 8) : 3}%`, minHeight: 3 }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex gap-1.5 mt-1.5">
              {weeklyVolume.map((w, i) => (
                <div key={i} className="flex-1 text-center">
                  <span className={`text-[8px] font-medium ${i === 7 ? 'text-purple-400' : 'text-[#3a3060]'}`}>
                    {i === 7 ? 'atual' : w.label}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ═══════ Volume por grupo muscular ═══════ */}
      <div className="card-elevated p-4 mb-4">
        <p className="text-[10px] text-purple-400 font-semibold tracking-[.8px] uppercase mb-4">
          volume por músculo
        </p>
        {muscleData.length === 0 ? (
          <p className="text-[13px] text-[#4a4568] text-center py-4">Nenhum dado ainda</p>
        ) : (
          <div className="space-y-3">
            {muscleData.map(({ group, sets, pct }) => (
              <div key={group}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] font-medium text-white">{group}</span>
                  <span className="text-[11px] text-[#7c6f9e]">{sets} séries · {pct}%</span>
                </div>
                <div className="h-[6px] rounded-full bg-[#1e1640] overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
