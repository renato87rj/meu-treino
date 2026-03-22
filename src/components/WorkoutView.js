import React, { useState } from 'react';
import { Dumbbell, CheckCircle, ChevronDown, ChevronUp, RotateCcw, Check } from 'lucide-react';

export default function WorkoutView({
  selectedPlan,
  completedToday,       // Set de exerciseId concluídos hoje
  todayRecords,         // array completo de registros de hoje
  setProgress,          // { [exerciseId]: { weight, sets: [{reps}] } }
  onConfirmSet,         // (plan, exercise, setIndex, reps) => bool
  onUpdateWeight,       // (exerciseId, weight) => void
  onCompleteExercise,   // (plan, exercise, setsData) => bool
  onUndoExercise        // (plan, exercise) => void
}) {
  // Controla quais cards estão expandidos
  const [expanded, setExpanded] = useState({});
  // Valores dos inputs de reps por série: { [exerciseId]: { [setIndex]: string } }
  const [repsInput, setRepsInput] = useState({});

  if (!selectedPlan) return null;

  const toggleExpand = (exerciseId) => {
    setExpanded(prev => ({ ...prev, [exerciseId]: !prev[exerciseId] }));
  };

  const isCompleted = (exerciseId) => completedToday.has(exerciseId);

  const getProgress = (exerciseId) => setProgress[exerciseId] || { weight: null, sets: [] };

  // Quantas séries já foram confirmadas para este exercício
  const confirmedSetsCount = (exerciseId) => getProgress(exerciseId).sets.length;

  const handleRepsChange = (exerciseId, setIndex, value) => {
    setRepsInput(prev => ({
      ...prev,
      [exerciseId]: { ...(prev[exerciseId] || {}), [setIndex]: value }
    }));
  };

  const handleConfirmSet = (exercise, setIndex) => {
    const reps = repsInput[exercise.id]?.[setIndex] || null;

    const completed = onConfirmSet(selectedPlan, exercise, setIndex, reps);

    if (completed) {
      // Exercício concluído — colapsa o card
      setExpanded(prev => ({ ...prev, [exercise.id]: false }));
    }

    // Limpa o input da série confirmada
    setRepsInput(prev => {
      const next = { ...prev };
      if (next[exercise.id]) {
        delete next[exercise.id][setIndex];
      }
      return next;
    });
  };

  const handleCompleteExercise = (exercise) => {
    const setsData = Array.from({ length: exercise.sets }, (_, i) => {
      return repsInput[exercise.id]?.[i] || null;
    });

    onCompleteExercise(selectedPlan, exercise, setsData);
    setExpanded(prev => ({ ...prev, [exercise.id]: false }));

    setRepsInput(prev => {
      const next = { ...prev };
      delete next[exercise.id];
      return next;
    });
  };

  const handleUndo = (exercise) => {
    const record = todayRecords.find(r => r.exerciseId === exercise.id);
    onUndoExercise(selectedPlan, exercise);
    setExpanded(prev => ({ ...prev, [exercise.id]: true }));

    // Pré-preenche os inputs com as reps do registro desfeito
    if (record?.completedSets) {
      const prefilled = {};
      record.completedSets.forEach((set, i) => {
        if (set?.reps != null) prefilled[i] = String(set.reps);
      });
      setRepsInput(prev => ({ ...prev, [exercise.id]: prefilled }));
    }
  };

  return (
    <div>
      {/* Badge da Ficha */}
      <div className="bg-purple-600/20 backdrop-blur-md rounded-xl p-4 mb-6 border border-purple-500/30">
        <div className="flex items-center gap-2">
          <Dumbbell className="text-purple-400" size={20} />
          <div>
            <p className="text-purple-300/70 text-xs">Treinando ficha</p>
            <h2 className="text-white font-semibold text-lg">{selectedPlan.name}</h2>
          </div>
        </div>
      </div>

      {/* Lista de Exercícios */}
      {selectedPlan.exercises.length === 0 ? (
        <div className="text-center py-16">
          <Dumbbell className="mx-auto text-purple-400/30 mb-4" size={64} />
          <p className="text-purple-300/70 text-lg">Nenhum exercício nesta ficha</p>
          <p className="text-purple-400/50 text-sm mt-2">Adicione exercícios na aba Fichas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {selectedPlan.exercises.map((exercise) => {
            const completed = isCompleted(exercise.id);
            const progress = getProgress(exercise.id);
            const isOpen = expanded[exercise.id] ?? false;
            const confirmedCount = confirmedSetsCount(exercise.id);
            // Índice da próxima série a confirmar
            const activeSetIndex = completed ? -1 : confirmedCount;

            return (
              <div
                key={exercise.id}
                className={`backdrop-blur-md rounded-xl border transition-all overflow-hidden ${
                  completed
                    ? 'border-green-500/50 bg-green-500/10'
                    : confirmedCount > 0
                    ? 'border-yellow-500/40 bg-white/10'
                    : 'border-purple-500/20 bg-white/10'
                }`}
              >
                {/* Cabeçalho do card — sempre visível */}
                <button
                  className="w-full flex items-center justify-between gap-3 p-4 text-left"
                  onClick={() => toggleExpand(exercise.id)}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-base break-words">{exercise.name}</h3>
                    <p className="text-purple-300 text-sm mt-0.5">
                      {exercise.sets} séries · {exercise.reps} reps
                      {exercise.weight ? ` · ${exercise.weight} kg` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {completed ? (
                      <span className="bg-green-500/20 text-green-400 text-xs font-medium px-3 py-1.5 rounded-full border border-green-500/30 flex items-center gap-1.5">
                        <CheckCircle size={13} />
                        Concluído
                      </span>
                    ) : confirmedCount > 0 ? (
                      <span className="bg-yellow-500/15 text-yellow-300 text-xs font-medium px-3 py-1.5 rounded-full border border-yellow-500/30">
                        {confirmedCount}/{exercise.sets} séries
                      </span>
                    ) : (
                      <span className="bg-purple-500/15 text-purple-300 text-xs font-medium px-3 py-1.5 rounded-full border border-purple-500/30">
                        Pendente
                      </span>
                    )}
                    {isOpen
                      ? <ChevronUp size={16} className="text-purple-400" />
                      : <ChevronDown size={16} className="text-purple-400" />
                    }
                  </div>
                </button>

                {/* Corpo expandido */}
                {isOpen && (
                  <div className="border-t border-purple-500/15 px-4 pb-4 pt-3">

                    {/* Linha de carga */}
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-purple-500/10">
                      <span className="text-purple-300/70 text-sm flex-1">Carga utilizada</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.5"
                        disabled={completed}
                        value={progress.weight ?? exercise.weight ?? ''}
                        onChange={e => onUpdateWeight(exercise.id, e.target.value)}
                        placeholder={exercise.weight ? String(exercise.weight) : '0'}
                        className="w-20 bg-white/6 border border-purple-500/30 rounded-lg px-3 py-1.5 text-sm text-white text-center disabled:opacity-50 focus:outline-none focus:border-purple-400/60"
                      />
                      <span className="text-purple-400/60 text-sm">kg</span>
                    </div>

                    {/* Header das colunas */}
                    <div className="grid grid-cols-[28px_1fr_36px] gap-2 mb-2 px-1">
                      <span className="text-purple-400/40 text-xs uppercase tracking-wide"></span>
                      <span className="text-purple-400/40 text-xs uppercase tracking-wide">Reps feitas</span>
                      <span className="text-purple-400/40 text-xs uppercase tracking-wide text-center">✓</span>
                    </div>

                    {/* Linhas das séries */}
                    {Array.from({ length: exercise.sets }, (_, i) => {
                      const isConfirmed = i < confirmedCount;
                      const isActive = i === activeSetIndex;
                      const isLocked = i > activeSetIndex;
                      const confirmedReps = progress.sets[i]?.reps;
                      const inputVal = repsInput[exercise.id]?.[i] ?? '';

                      return (
                        <div
                          key={i}
                          className={`grid grid-cols-[28px_1fr_36px] gap-2 mb-2 items-center transition-opacity ${
                            isLocked || completed ? 'opacity-30 pointer-events-none' : ''
                          }`}
                        >
                          {/* Número da série */}
                          <span className={`text-xs font-medium ${
                            isConfirmed ? 'text-green-400/70' : isActive ? 'text-purple-300' : 'text-purple-400/50'
                          }`}>
                            S{i + 1}
                          </span>

                          {/* Input de reps */}
                          {isConfirmed ? (
                            <div className="bg-green-500/10 border border-green-500/25 rounded-lg px-3 py-1.5 text-sm text-green-400 text-center">
                              {confirmedReps != null ? `${confirmedReps} reps` : '—'}
                            </div>
                          ) : (
                            <div>
                              <input
                                type="number"
                                inputMode="numeric"
                                min="1"
                                disabled={isLocked || completed}
                                value={inputVal}
                                onChange={e => handleRepsChange(exercise.id, i, e.target.value)}
                                placeholder={`ex: ${exercise.reps}`}
                                className="w-full bg-white/6 border border-purple-500/25 rounded-lg px-3 py-1.5 text-sm text-white text-center focus:outline-none focus:border-purple-400/60 placeholder:text-purple-400/30"
                              />
                            </div>
                          )}

                          {/* Botão confirmar */}
                          {isConfirmed ? (
                            <div className="w-8 h-8 rounded-full bg-green-500/15 border border-green-500/40 flex items-center justify-center">
                              <Check size={13} className="text-green-400" />
                            </div>
                          ) : (
                            <button
                              disabled={isLocked || completed}
                              onClick={() => handleConfirmSet(exercise, i)}
                              className="w-8 h-8 rounded-full bg-purple-500/15 border border-purple-500/35 flex items-center justify-center transition-all enabled:hover:bg-purple-500/30 enabled:hover:border-purple-400/60 enabled:active:scale-95 disabled:opacity-30"
                            >
                              <Check size={13} className="text-purple-300" />
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {/* Dica da série ativa */}
                    {!completed && activeSetIndex >= 0 && activeSetIndex < exercise.sets && (
                      <p className="text-center text-purple-400/35 text-xs mt-1">
                        Planejado: {exercise.reps} reps
                      </p>
                    )}

                    {/* Botão concluir exercício (dentro do card expandido) */}
                    {!completed && (
                      <button
                        onClick={() => handleCompleteExercise(exercise)}
                        className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-green-600/20 border border-green-500/30 text-green-400 text-sm font-medium hover:bg-green-600/30 transition-all active:scale-[0.98]"
                      >
                        <CheckCircle size={15} />
                        Concluir exercício
                      </button>
                    )}

                    {/* Botão desfazer (exercício concluído) */}
                    {completed && (
                      <button
                        onClick={() => handleUndo(exercise)}
                        className="mt-3 w-full flex items-center justify-center gap-2 text-xs text-purple-400/60 hover:text-purple-300 transition-colors py-1"
                      >
                        <RotateCcw size={12} />
                        Desfazer registro
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}