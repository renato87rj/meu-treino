'use client';
import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { WorkoutPlan, WorkoutRecord } from '../../types/workout';
import type { BodyMeasurement, MeasurementKey } from '../../types/profile';
import { MEASUREMENT_LABELS, MEASUREMENT_UNITS } from '../../types/profile';
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

const BODY_METRIC_KEYS: MeasurementKey[] = ['weightKg', 'chestCm', 'waistCm', 'hipCm', 'armCm', 'thighCm'];

interface Props {
  history: WorkoutRecord[];
  workoutPlans: WorkoutPlan[];
  measurements?: BodyMeasurement[];
}

function BodyLineChart({ data, unit }: { data: { label: string; value: number }[]; unit: string }) {
  if (data.length < 2) {
    return (
      <p className="text-[13px] text-[#4a4568] text-center py-4">
        Registre pelo menos 2 medições para ver o gráfico
      </p>
    );
  }

  const values = data.map(d => d.value);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;

  const W = 280;
  const H = 80;
  const PAD_X = 8;
  const PAD_Y = 10;
  const usableW = W - PAD_X * 2;
  const usableH = H - PAD_Y * 2;

  const points = data.map((d, i) => ({
    x: PAD_X + (i / (data.length - 1)) * usableW,
    y: PAD_Y + (1 - (d.value - minV) / range) * usableH,
    value: d.value,
    label: d.label,
  }));

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');

  // gradient fill path
  const fillPath = [
    `M ${points[0].x} ${H}`,
    `L ${points[0].x} ${points[0].y}`,
    ...points.slice(1).map(p => `L ${p.x} ${p.y}`),
    `L ${points[points.length - 1].x} ${H}`,
    'Z',
  ].join(' ');

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 80 }}>
        <defs>
          <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fillPath} fill="url(#bodyGrad)" />
        <polyline
          points={polyline}
          fill="none"
          stroke="#7c3aed"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={i === points.length - 1 ? 3.5 : 2.5}
              fill={i === points.length - 1 ? '#a78bfa' : '#7c3aed'}
              stroke={i === points.length - 1 ? '#0a0714' : 'none'}
              strokeWidth="1.5"
            />
            {i === points.length - 1 && (
              <text x={p.x} y={p.y - 6} textAnchor="middle"
                fontSize="7" fill="#a78bfa" fontWeight="600">
                {p.value}{unit}
              </text>
            )}
          </g>
        ))}
      </svg>
      {/* X axis labels — first and last */}
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-[#3a3060]">{points[0].label}</span>
        <span className="text-[9px] text-[#3a3060]">{points[points.length - 1].label}</span>
      </div>
    </div>
  );
}

export default function EvolutionView({ history, workoutPlans, measurements = [] }: Props) {
  const today = useMemo(() => new Date(), []);
  const [weekOffset, setWeekOffset] = useState(0);
  
  const selectedWeekStart = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - d.getDay() - weekOffset * 7);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [today, weekOffset]);
  
  const selectedWeekEnd = useMemo(() => {
    const d = new Date(selectedWeekStart);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [selectedWeekStart]);

  const todayDow = today.getDay();

  /* ── Card semanal ── */
  const weekData = useMemo(() => {
    const ws = selectedWeekStart;
    const we = selectedWeekEnd;
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

    // Volume planejado (total sets dos planos originais, não apenas dos registros completados)
    const uniquePlanIds = [...new Set(weekRecords.map(r => r.planId))];
    const plannedSets = uniquePlanIds.reduce((acc, planId) => {
      const originalPlan = workoutPlans.find(p => p.id === planId);
      return acc + (originalPlan ? originalPlan.exercises.reduce((sum, ex) => sum + ex.sets, 0) : 0);
    }, 0);
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
  }, [history, workoutPlans, selectedWeekStart, selectedWeekEnd]);

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
    // Calcular séries feitas por grupo muscular na semana selecionada
    const completedMap: Record<string, number> = {};
    const weekRecords = history.filter(r => {
      const d = new Date(r.date);
      return d >= selectedWeekStart && d <= selectedWeekEnd;
    });
    
    weekRecords.forEach(r => {
      const db = exerciseDatabase.find(e =>
        e.name.toLowerCase() === r.exerciseName.toLowerCase()
      );
      const group = db?.group ?? 'Outro';
      completedMap[group] = (completedMap[group] ?? 0) + (r.completedSets?.length ?? 0);
    });

    // Calcular séries planejadas por grupo muscular (dos planos originais)
    const plannedMap: Record<string, number> = {};
    const uniquePlanIds = [...new Set(weekRecords.map(r => r.planId))];
    uniquePlanIds.forEach(planId => {
      const originalPlan = workoutPlans.find(p => p.id === planId);
      if (originalPlan) {
        originalPlan.exercises.forEach(ex => {
          const db = exerciseDatabase.find(e =>
            e.name.toLowerCase() === ex.name.toLowerCase()
          );
          const group = db?.group ?? 'Outro';
          plannedMap[group] = (plannedMap[group] ?? 0) + ex.sets;
        });
      }
    });

    // Combinar dados: mostrar feito vs planejado
    const allGroups = [...new Set([...Object.keys(completedMap), ...Object.keys(plannedMap)])];
    return allGroups
      .map(group => {
        const done = completedMap[group] ?? 0;
        const planned = plannedMap[group] ?? 0;
        return { group, done, planned };
      })
      .sort((a, b) => (b.done + b.planned) - (a.done + a.planned))
      .slice(0, 10);
  }, [history, workoutPlans, selectedWeekStart, selectedWeekEnd]);

  const [selectedMetric, setSelectedMetric] = useState<MeasurementKey>('weightKg');

  const bodyChartData = useMemo(() => {
    const last12 = measurements.slice(-12);
    return last12
      .filter(m => m[selectedMetric] != null)
      .map(m => ({
        label: new Date(m.measuredAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        value: m[selectedMetric] as number,
      }));
  }, [measurements, selectedMetric]);

  const bodyDelta = useMemo(() => {
    const filtered = measurements.filter(m => m[selectedMetric] != null);
    if (filtered.length < 2) return null;
    const first = filtered[0][selectedMetric] as number;
    const last = filtered[filtered.length - 1][selectedMetric] as number;
    return +(last - first).toFixed(1);
  }, [measurements, selectedMetric]);

  const canGoNext = weekOffset > 0;
  const isCurrentWeek = weekOffset === 0;

  return (
    <div className="pt-4 space-y-4">

      {/* ═══════ Card semanal navegável ═══════ */}
      <div className="card-elevated p-4">
        {/* Header com navegação */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset(o => o + 1)}
              className="w-7 h-7 rounded-full flex items-center justify-center
                         bg-purple-500/15 border border-purple-500/20 active:scale-95 transition-transform"
            >
              <ChevronLeft size={14} className="text-purple-400" />
            </button>
            <p className="text-[10px] text-purple-400 font-semibold tracking-[.8px] uppercase">
              {isCurrentWeek ? 'semana atual' : 'semana anterior'}
            </p>
            <button
              onClick={() => setWeekOffset(o => Math.max(0, o - 1))}
              disabled={!canGoNext}
              className="w-7 h-7 rounded-full flex items-center justify-center
                         bg-purple-500/15 border border-purple-500/20 active:scale-95 transition-transform
                         disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} className="text-purple-400" />
            </button>
          </div>
          <p className="text-[11px] text-[#4a4568]">{weekData.rangeLabel}</p>
        </div>

        {/* Totais: treinos e séries (com comparação planejado) */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="rounded-[12px] p-3 border border-purple-500/[0.15] bg-white/[0.03]">
            <div className="flex items-end gap-1">
              <span className="text-[28px] font-bold text-white leading-none">{weekData.totalSessions}</span>
            </div>
            <p className="text-[10px] text-[#7c6f9e] mt-1.5">treinos</p>
          </div>
          <div className="rounded-[12px] p-3 border border-purple-500/[0.15] bg-white/[0.03]">
            <div className="flex items-baseline gap-1">
              <span className="text-[28px] font-bold text-white leading-none">{weekData.totalSets}</span>
              <span className="text-[14px] text-[#4a4568]">/ {weekData.plannedSets}</span>
            </div>
            <p className="text-[10px] text-[#7c6f9e] mt-1.5">séries feitas</p>
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

        {/* Indicador visual de progresso */}
        {weekData.plannedSets > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-[#7c6f9e]">Progresso semanal</span>
              <span className="text-[11px] font-medium text-white">
                {Math.round((weekData.totalSets / weekData.plannedSets) * 100)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-[#1e1640] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(100, (weekData.totalSets / weekData.plannedSets) * 100)}%`,
                  background: weekData.totalSets >= weekData.plannedSets * 0.9 
                    ? '#4ade80' 
                    : weekData.totalSets >= weekData.plannedSets * 0.6 
                      ? '#fbbf24' 
                      : '#f87171'
                }}
              />
            </div>
            <p className="text-[10px] text-[#4a4568] mt-1.5">
              Meta: {weekData.plannedSets} séries · Feitas: {weekData.totalSets} séries
            </p>
          </div>
        )}
      </div>

      {/* ═══════ Volume por semana (histórico) ═══════ */}
      <div className="card-elevated p-4">
        <p className="text-[10px] text-purple-400 font-semibold tracking-[.8px] uppercase mb-4">
          histórico de volume
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
            {muscleData.map(({ group, done, planned }) => (
              <div key={group}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] font-medium text-white">{group}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#7c6f9e]">Feito:</span>
                    <span className="text-[11px] font-medium text-white">{done}</span>
                    <span className="text-[11px] text-[#4a4568]">|</span>
                    <span className="text-[11px] text-[#7c6f9e]">Meta:</span>
                    <span className="text-[11px] font-medium text-purple-300">{planned}</span>
                  </div>
                </div>
                <div className="h-[6px] rounded-full bg-[#1e1640] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${planned > 0 ? Math.min(100, (done / planned) * 100) : 0}%`,
                      background: done >= planned * 0.9 ? '#4ade80' : done >= planned * 0.6 ? '#fbbf24' : '#f87171'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══════ Evolução Corporal ═══════ */}
      <div className="card-elevated p-4 mb-4">
        <p className="text-[10px] text-purple-400 font-semibold tracking-[.8px] uppercase mb-3">
          evolução corporal
        </p>

        {measurements.length === 0 ? (
          <p className="text-[13px] text-[#4a4568] text-center py-4">
            Nenhuma medição registrada ainda.
            <br />
            <span className="text-[11px] text-[#3a3060]">Adicione em Meu Perfil → Medidas</span>
          </p>
        ) : (
          <>
            {/* Seletor de métrica */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4">
              {BODY_METRIC_KEYS.map(k => {
                const hasData = measurements.some(m => m[k] != null);
                return (
                  <button
                    key={k}
                    onClick={() => setSelectedMetric(k)}
                    disabled={!hasData}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                      selectedMetric === k
                        ? 'bg-purple-600 text-white'
                        : hasData
                        ? 'bg-white/[0.05] text-[#7c6f9e] border border-white/[0.08] hover:border-purple-500/30'
                        : 'bg-white/[0.02] text-[#2d2040] border border-white/[0.04] cursor-not-allowed'
                    }`}
                  >
                    {MEASUREMENT_LABELS[k].split(' ')[0]}
                  </button>
                );
              })}
            </div>

            {/* Resumo: atual + delta */}
            {bodyChartData.length > 0 && (
              <div className="flex items-end justify-between mb-3">
                <div>
                  <span className="text-[28px] font-bold text-white leading-none">
                    {bodyChartData[bodyChartData.length - 1].value}
                  </span>
                  <span className="text-[13px] text-[#4a4568] ml-1">{MEASUREMENT_UNITS[selectedMetric]}</span>
                  <p className="text-[10px] text-[#7c6f9e] mt-1">{MEASUREMENT_LABELS[selectedMetric]}</p>
                </div>
                {bodyDelta !== null && (
                  <div className={`text-right`}>
                    <span className={`text-[16px] font-bold ${
                      bodyDelta === 0 ? 'text-[#7c6f9e]' :
                      selectedMetric === 'waistCm'
                        ? bodyDelta < 0 ? 'text-green-400' : 'text-orange-400'
                        : bodyDelta > 0 ? 'text-green-400' : 'text-orange-400'
                    }`}>
                      {bodyDelta > 0 ? '+' : ''}{bodyDelta} {MEASUREMENT_UNITS[selectedMetric]}
                    </span>
                    <p className="text-[10px] text-[#4a4568] mt-0.5">vs. início</p>
                  </div>
                )}
              </div>
            )}

            {/* Gráfico */}
            <BodyLineChart data={bodyChartData} unit={MEASUREMENT_UNITS[selectedMetric]} />

            {/* Total de medições */}
            <p className="text-[10px] text-[#3a3060] text-right mt-2">
              {measurements.length} medição{measurements.length !== 1 ? 'ões' : ''} registrada{measurements.length !== 1 ? 's' : ''}
            </p>
          </>
        )}
      </div>

    </div>
  );
}
