import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Dumbbell, CheckCircle, ArrowRightLeft, Moon } from 'lucide-react';

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
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

  // Set de dateKeys que possuem treinos registrados
  const workoutDays = useMemo(() => {
    const days = new Set();
    history.forEach(record => {
      days.add(new Date(record.date).toLocaleDateString('pt-BR'));
    });
    return days;
  }, [history]);

  // Registros do dia selecionado agrupados por planId
  const dayData = useMemo(() => {
    const dateKey = toDateKey(selectedDate);
    const dayRecords = history.filter(r =>
      new Date(r.date).toLocaleDateString('pt-BR') === dateKey
    );

    // Agrupar por planId
    const planMap = {};
    dayRecords.forEach(record => {
      const key = record.planId;
      if (!planMap[key]) {
        planMap[key] = {
          planId: record.planId,
          planName: record.planName,
          records: []
        };
      }
      planMap[key].records.push(record);
    });

    return { dayRecords, planMap };
  }, [history, selectedDate]);

  // Gerar dias do mês para o calendário
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    // getDay() retorna 0=Dom, queremos 0=Seg
    let startWeekday = firstDay.getDay() - 1;
    if (startWeekday < 0) startWeekday = 6;

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells = [];

    // Células vazias antes do dia 1
    for (let i = 0; i < startWeekday; i++) {
      cells.push(null);
    }
    // Dias do mês
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(viewYear, viewMonth, d));
    }
    return cells;
  }, [viewMonth, viewYear]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const goToToday = () => {
    setSelectedDate(today);
    setViewMonth(today.getMonth());
    setViewYear(today.getFullYear());
  };

  // Buscar o plano atual (pode não existir mais, mas tentamos)
  const findPlan = (planId) => workoutPlans.find(p => p.id === planId);

  // Formatar data selecionada por extenso
  const formatSelectedDate = () => {
    const dayOfWeek = selectedDate.toLocaleDateString('pt-BR', { weekday: 'long' });
    const day = selectedDate.getDate();
    const month = MONTHS[selectedDate.getMonth()].toLowerCase();
    // Capitalizar primeiro caractere
    const weekday = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
    return `${weekday}, ${day} de ${month}`;
  };

  const { dayRecords, planMap } = dayData;
  const hasRecords = dayRecords.length > 0;

  return (
    <div>
      {/* Calendário */}
      <div className="bg-white/5 backdrop-blur-md rounded-xl border border-purple-500/20 mb-5 overflow-hidden">
        {/* Header do mês */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-purple-500/15">
          <button onClick={prevMonth} className="p-1 rounded-md hover:bg-white/10 text-purple-400 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button onClick={goToToday} className="text-white font-semibold text-xs hover:text-purple-300 transition-colors">
            {MONTHS[viewMonth]} {viewYear}
          </button>
          <button onClick={nextMonth} className="p-1 rounded-md hover:bg-white/10 text-purple-400 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 px-1.5 pt-1.5">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-purple-400/50 text-[10px] font-medium py-0.5">
              {d}
            </div>
          ))}
        </div>

        {/* Grid dos dias */}
        <div className="grid grid-cols-7 gap-px px-1.5 pb-2">
          {calendarDays.map((date, i) => {
            if (!date) {
              return <div key={`empty-${i}`} className="h-8" />;
            }

            const key = toDateKey(date);
            const hasWorkout = workoutDays.has(key);
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, today);
            const isFuture = date > today;

            return (
              <button
                key={key}
                onClick={() => setSelectedDate(date)}
                disabled={isFuture}
                className={`h-8 flex items-center justify-center rounded-md text-xs transition-all relative
                  ${isSelected
                    ? 'bg-purple-600 text-white font-semibold shadow-md shadow-purple-600/30'
                    : isToday
                    ? 'bg-purple-500/15 text-purple-300 font-medium ring-1 ring-purple-500/40'
                    : hasWorkout
                    ? 'bg-green-500/15 text-green-400 font-medium hover:bg-green-500/25'
                    : isFuture
                    ? 'text-purple-400/20 cursor-default'
                    : 'text-purple-300/60 hover:bg-white/5'
                  }`}
              >
                {date.getDate()}
                {hasWorkout && !isSelected && (
                  <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-green-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Data selecionada */}
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-purple-300 font-semibold text-sm">{formatSelectedDate()}</h3>
        {hasRecords && (
          <span className="text-green-400/70 text-xs">
            · {dayRecords.length} {dayRecords.length === 1 ? 'exercício' : 'exercícios'}
          </span>
        )}
      </div>

      {/* Diário do dia */}
      {!hasRecords ? (
        <div className="text-center py-12">
          <Moon className="mx-auto text-purple-400/20 mb-3" size={48} />
          <p className="text-purple-300/50 text-sm">Dia de descanso</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.values(planMap).map(({ planId, planName, records }) => {
            const plan = findPlan(planId);
            // Exercícios do plano (se o plano ainda existir)
            const planExercises = plan ? plan.exercises : [];
            // Map de exerciseName → record (para lookup rápido)
            const recordByName = {};
            records.forEach(r => { recordByName[r.exerciseName] = r; });

            // Montar lista: exercícios do plano + substitutos registrados que não estão no plano
            const substituteRecords = records.filter(r =>
              r.substitute && !planExercises.some(ex => ex.name === r.exerciseName)
            );

            return (
              <div key={planId}>
                {/* Header da ficha */}
                <div className="flex items-center gap-2 bg-purple-600/20 backdrop-blur-md rounded-lg px-3 py-2 border border-purple-500/30 mb-2">
                  <Dumbbell className="text-purple-400" size={16} />
                  <span className="text-purple-200 font-medium text-sm">{planName}</span>
                  <span className="text-purple-400/70 text-xs ml-auto">
                    {records.length}/{planExercises.length + substituteRecords.length}
                  </span>
                </div>

                <div className="space-y-2 ml-1">
                  {/* Exercícios do plano */}
                  {planExercises.map(exercise => {
                    const record = recordByName[exercise.name];
                    const done = !!record;

                    return (
                      <div
                        key={exercise.id}
                        className={`rounded-xl p-3 border transition-all ${
                          done
                            ? 'bg-green-500/8 border-green-500/25'
                            : 'bg-white/4 border-purple-500/10 opacity-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-medium text-sm ${done ? 'text-white' : 'text-purple-300/70'}`}>
                              {exercise.name}
                            </h4>
                          </div>
                          {done ? (
                            <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                          ) : (
                            <span className="text-purple-400/30 text-xs flex-shrink-0">—</span>
                          )}
                        </div>

                        {done ? (
                          <div className="mt-1.5">
                            {record.weight != null && (
                              <p className="text-purple-300/80 text-xs mb-1">
                                {record.weight} kg
                              </p>
                            )}
                            {record.completedSets && record.completedSets.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {record.completedSets.map((set, i) => (
                                  <span
                                    key={i}
                                    className="bg-green-500/10 border border-green-500/15 text-green-400/80 text-xs px-1.5 py-0.5 rounded"
                                  >
                                    S{i + 1}:{set?.reps != null ? set.reps : '—'}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-purple-400/30 text-xs mt-0.5">
                            {exercise.sets}x{exercise.reps}
                            {exercise.weight ? ` · ${exercise.weight} kg` : ''}
                          </p>
                        )}
                      </div>
                    );
                  })}

                  {/* Exercícios substitutos */}
                  {substituteRecords.map(record => (
                    <div
                      key={record.id}
                      className="rounded-xl p-3 border bg-green-500/8 border-orange-500/25"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium text-sm">{record.exerciseName}</h4>
                          <span className="inline-flex items-center gap-1 text-xs text-orange-400/80">
                            <ArrowRightLeft size={10} />
                            {record.sourcePlanName}
                          </span>
                        </div>
                        <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                      </div>
                      <div className="mt-1.5">
                        {record.weight != null && (
                          <p className="text-purple-300/80 text-xs mb-1">
                            {record.weight} kg
                          </p>
                        )}
                        {record.completedSets && record.completedSets.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {record.completedSets.map((set, i) => (
                              <span
                                key={i}
                                className="bg-green-500/10 border border-green-500/15 text-green-400/80 text-xs px-1.5 py-0.5 rounded"
                              >
                                S{i + 1}:{set?.reps != null ? set.reps : '—'}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
