import React, { useState, useMemo } from 'react';
import { Dumbbell, RotateCcw, Check, Plus, X, Search, ArrowRightLeft } from 'lucide-react';
import ExerciseAutocomplete from './ExerciseAutocomplete';

export default function WorkoutView({
  selectedPlan,
  allPlans,
  completedTodayIds,
  completedTodayNames,
  todayRecords,
  setProgress,
  onConfirmSet,
  onUpdateWeight,
  onCompleteExercise,
  onUndoExercise,
  substituteExercises,
  onAddSubstitute,
  onRemoveSubstitute,
  onStartRestTimer
}) {
  const [expanded, setExpanded] = useState({});
  const [repsInput, setRepsInput] = useState({});
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState('plans');
  const [pickerSearch, setPickerSearch] = useState('');
  const [customForm, setCustomForm] = useState({ name: '', sets: '3', reps: '12', weight: '' });

  // Nomes únicos de exercícios já usados pelo usuário
  const userExerciseNames = useMemo(() => {
    const names = new Set();
    (allPlans || []).forEach(plan => plan.exercises.forEach(ex => names.add(ex.name)));
    return [...names];
  }, [allPlans]);

  if (!selectedPlan) return null;

  const otherPlans = (allPlans || []).filter(p => p.id !== selectedPlan.id);

  const toggleExpand = (exerciseId) => {
    setExpanded(prev => ({ ...prev, [exerciseId]: !prev[exerciseId] }));
  };

  const isCompleted = (exercise) =>
    completedTodayIds.has(exercise.id) || completedTodayNames.has(exercise.name);

  const getProgress = (exerciseId) => setProgress[exerciseId] || { weight: null, sets: [] };
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
    if (completed) setExpanded(prev => ({ ...prev, [exercise.id]: false }));
    if (onStartRestTimer) onStartRestTimer();
    setRepsInput(prev => {
      const next = { ...prev };
      if (next[exercise.id]) delete next[exercise.id][setIndex];
      return next;
    });
  };

  const handleCompleteExercise = (exercise) => {
    const setsData = Array.from({ length: exercise.sets }, (_, i) => repsInput[exercise.id]?.[i] || null);
    onCompleteExercise(selectedPlan, exercise, setsData);
    setExpanded(prev => ({ ...prev, [exercise.id]: false }));
    if (onStartRestTimer) onStartRestTimer();
    setRepsInput(prev => { const next = { ...prev }; delete next[exercise.id]; return next; });
  };

  const handleUndo = (exercise) => {
    const record = todayRecords.find(r => r.exerciseId === exercise.id || r.exerciseName === exercise.name);
    onUndoExercise(selectedPlan, exercise);
    setExpanded(prev => ({ ...prev, [exercise.id]: true }));
    if (record?.completedSets) {
      const prefilled = {};
      record.completedSets.forEach((set, i) => { if (set?.reps != null) prefilled[i] = String(set.reps); });
      setRepsInput(prev => ({ ...prev, [exercise.id]: prefilled }));
    }
  };

  const handleImportExercise = (exercise, sourcePlanName) => {
    const imported = { ...exercise, id: Date.now() + Math.random(), _substitute: true, _sourcePlanName: sourcePlanName, _originalName: exercise.name };
    onAddSubstitute(imported);
    setExpanded(prev => ({ ...prev, [imported.id]: true }));
    setShowPicker(false);
    setPickerSearch('');
  };

  const handleCreateCustom = () => {
    if (!customForm.name.trim()) return;
    const custom = { id: Date.now() + Math.random(), name: customForm.name.trim(), sets: parseInt(customForm.sets) || 3, reps: customForm.reps || '12', weight: customForm.weight ? parseFloat(customForm.weight) : null, _substitute: true, _sourcePlanName: 'Avulso' };
    onAddSubstitute(custom);
    setExpanded(prev => ({ ...prev, [custom.id]: true }));
    setCustomForm({ name: '', sets: '3', reps: '12', weight: '' });
    setShowPicker(false);
  };

  const getRecordSets = (exercise) => {
    const record = todayRecords.find(r => r.exerciseId === exercise.id || r.exerciseName === exercise.name);
    return record?.completedSets || [];
  };

  const getRecordWeight = (exercise) => {
    const record = todayRecords.find(r => r.exerciseId === exercise.id || r.exerciseName === exercise.name);
    return record?.weight;
  };

  const allExercises = [...selectedPlan.exercises, ...(substituteExercises || [])];
  const completedCount = allExercises.filter(ex => isCompleted(ex)).length;
  const totalCount = allExercises.length;

  return (
    <div className="pt-4">
      {/* Hero card de progresso */}
      <div className="card-elevated p-4 mb-4 mt-1">
        <p className="text-[10px] text-purple-400 font-semibold tracking-[.8px] uppercase mb-2">
          progresso de hoje
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-[34px] font-bold text-white tracking-tight leading-none">
            {completedCount}
          </span>
          <span className="text-[18px] text-[#4a4568] font-medium">/{totalCount}</span>
          <span className="text-[12px] text-[#7c6f9e] ml-1">exercícios</span>
        </div>
        {totalCount > 0 && (
          <div className="h-[3px] rounded-full mt-3 overflow-hidden bg-[#2d1f55]">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Lista de Exercícios */}
      {allExercises.length === 0 ? (
        <div className="text-center py-16">
          <Dumbbell className="mx-auto text-[#3a3060] mb-4" size={48} />
          <p className="text-[#7c6f9e] text-[15px]">Nenhum exercício nesta ficha</p>
          <p className="text-[#4a4568] text-[12px] mt-2">Adicione exercícios na aba Fichas</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {allExercises.map((exercise) => {
            const isSubstitute = !!exercise._substitute;
            const completed = isCompleted(exercise);
            const progress = getProgress(exercise.id);
            const isOpen = expanded[exercise.id] ?? false;
            const confirmedCount = confirmedSetsCount(exercise.id);
            const inProgress = confirmedCount > 0 && !completed;
            const activeSetIndex = completed ? -1 : confirmedCount;

            return (
              <div
                key={exercise.id}
                className={`rounded-[18px] p-4 mb-2.5 border backdrop-blur-sm transition-all ${
                  completed
                    ? 'bg-green-500/[0.05] border-green-500/25'
                    : inProgress
                    ? 'bg-purple-600/[0.08] border-purple-500/50'
                    : 'bg-white/[0.05] border-purple-500/[0.18]'
                }`}
              >
                {/* Cabeçalho do card */}
                <div className="flex items-center gap-3" onClick={() => toggleExpand(exercise.id)}>
                  {/* Ícone de status */}
                  <div className={`w-9 h-9 rounded-[12px] flex items-center justify-center flex-shrink-0 ${
                    completed
                      ? 'bg-green-500/15 border border-green-500/25'
                      : inProgress
                      ? 'bg-purple-500/20 border border-purple-500/30'
                      : 'bg-purple-500/[0.12] border border-purple-500/[0.18]'
                  }`}>
                    {completed
                      ? <Check size={15} className="text-green-400" />
                      : <Dumbbell size={15} className={inProgress ? 'text-purple-400' : 'text-[#7c6f9e]'} />
                    }
                  </div>

                  {/* Nome + meta */}
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-[14px] font-semibold tracking-tight ${
                      completed ? 'text-green-400' : 'text-white'
                    }`}>
                      {exercise.name}
                    </h4>
                    <p className="text-[11px] text-[#7c6f9e] mt-0.5">
                      {exercise.sets} séries · {exercise.weight ? `${exercise.weight} kg` : 'sem carga'}
                      {inProgress && <span className="text-purple-400 ml-1">· em andamento</span>}
                    </p>
                    {isSubstitute && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-purple-300
                                       bg-purple-500/15 border border-purple-500/25 px-2 py-0.5 rounded-full">
                        <ArrowRightLeft size={9} />
                        substituto · {exercise._sourcePlanName}
                      </span>
                    )}
                  </div>

                  {/* Pill de status */}
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                    completed
                      ? 'bg-green-500/15 text-green-400 border border-green-500/25'
                      : inProgress
                      ? 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/25'
                      : 'bg-purple-500/15 text-purple-300 border border-purple-500/20'
                  }`}>
                    {completed ? 'Concluído' : inProgress ? `${confirmedCount}/${exercise.sets}` : 'Pendente'}
                  </span>
                </div>

                {/* Pills de séries — exercício concluído */}
                {completed && !isOpen && (() => {
                  const sets = progress.sets.length > 0 ? progress.sets : getRecordSets(exercise);
                  const weight = getRecordWeight(exercise);
                  return sets.length > 0 ? (
                    <div className="flex items-center gap-1.5 flex-wrap mt-3">
                      {weight != null && (
                        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full
                                          bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          {weight} kg
                        </span>
                      )}
                      {sets.map((s, i) => (
                        <span key={i} className="text-[10px] font-semibold px-2.5 py-1 rounded-full
                                                  bg-green-500/[0.10] text-green-400 border border-green-500/20">
                          S{i + 1}: {s?.reps != null ? `${s.reps} reps` : '—'}
                        </span>
                      ))}
                    </div>
                  ) : null;
                })()}

                {/* Área expandida */}
                {isOpen && (
                  <div className="mt-3 pt-3 border-t border-purple-500/10">
                    {completed ? (
                      /* ── Resumo do exercício concluído ── */
                      (() => {
                        const recordSets = progress.sets.length > 0 ? progress.sets : getRecordSets(exercise);
                        const recordWeight = progress.weight ?? getRecordWeight(exercise) ?? exercise.weight;
                        return (
                          <div>
                            {/* Carga registrada */}
                            {recordWeight != null && (
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-[12px] text-[#7c6f9e]">Carga registrada</span>
                                <span className="text-[14px] font-bold text-white">{recordWeight} kg</span>
                              </div>
                            )}

                            {/* Séries registradas */}
                            {recordSets.length > 0 && (
                              <div className="space-y-1.5">
                                {recordSets.map((s, i) => (
                                  <div key={i} className="flex items-center gap-2.5 px-0.5">
                                    <div className="w-6 h-6 rounded-full flex items-center justify-center
                                                    bg-green-500/10 border border-green-500/25 flex-shrink-0">
                                      <Check size={10} className="text-green-400" />
                                    </div>
                                    <span className="text-[12px] font-medium text-green-400/70">S{i + 1}</span>
                                    <span className="text-[13px] font-semibold text-white">
                                      {s?.reps != null ? `${s.reps} reps` : '—'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Desfazer */}
                            <button
                              onClick={() => handleUndo(exercise)}
                              className="mt-4 w-full text-center text-[11px] text-[#4a4568]
                                         transition-colors py-1 flex items-center justify-center gap-1.5
                                         active:text-purple-400">
                              <RotateCcw size={11} />
                              desfazer registro
                            </button>
                          </div>
                        );
                      })()
                    ) : (
                      /* ── Formulário de registro ── */
                      <>
                        {/* Linha de carga */}
                        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-purple-500/[0.08]">
                          <span className="text-[12px] text-[#7c6f9e] flex-1">Carga utilizada</span>
                          <input
                            type="number" inputMode="decimal" min="0" step="0.5"
                            value={progress.weight ?? exercise.weight ?? ''}
                            onChange={e => onUpdateWeight(exercise.id, e.target.value)}
                            className="w-16 text-center text-[13px] text-white py-1.5 px-2 rounded-[10px]
                                       bg-white/[0.05] border border-purple-500/25
                                       focus:outline-none focus:border-purple-400/50"
                          />
                          <span className="text-[11px] text-[#4a4568]">kg</span>
                        </div>

                        {/* Header colunas */}
                        <div className="grid grid-cols-[20px_1fr_28px] gap-2 mb-1.5 px-0.5">
                          <span className="text-[10px] text-[#4a4568] uppercase tracking-wide"></span>
                          <span className="text-[10px] text-[#4a4568] uppercase tracking-wide">Reps feitas</span>
                          <span className="text-[10px] text-[#4a4568] uppercase tracking-wide text-center">✓</span>
                        </div>

                        {/* Linhas de série */}
                        {Array.from({ length: exercise.sets }, (_, i) => {
                          const isConfirmed = i < confirmedCount;
                          const isActive = i === activeSetIndex;
                          const isLocked = i > confirmedCount;
                          return (
                            <div key={i} className={`grid grid-cols-[20px_1fr_28px] gap-2 items-center mb-1.5
                                                     ${isLocked ? 'opacity-25 pointer-events-none' : ''}`}>
                              <span className={`text-[12px] font-medium ${
                                isConfirmed ? 'text-green-400/60' : isActive ? 'text-purple-300' : 'text-[#4a4568]'
                              }`}>S{i + 1}</span>

                              {isConfirmed ? (
                                <div className="rounded-[10px] py-1.5 px-2 text-center text-[12px] text-green-400
                                                bg-green-500/[0.06] border border-green-500/20">
                                  {progress.sets[i].reps} reps
                                </div>
                              ) : (
                                <input
                                  type="number" inputMode="numeric" min="1"
                                  placeholder={`ex: ${exercise.reps}`}
                                  disabled={isLocked}
                                  value={repsInput[exercise.id]?.[i] ?? ''}
                                  onChange={e => handleRepsChange(exercise.id, i, e.target.value)}
                                  className="w-full text-center text-[13px] text-white py-1.5 px-2 rounded-[10px]
                                             bg-white/[0.05] border border-purple-500/25
                                             placeholder:text-[#4a4568]
                                             focus:outline-none focus:border-purple-400/50
                                             disabled:opacity-30"
                                />
                              )}

                              {isConfirmed ? (
                                <div className="w-7 h-7 rounded-full flex items-center justify-center
                                                bg-green-500/10 border border-green-500/30">
                                  <Check size={11} className="text-green-400" />
                                </div>
                              ) : (
                                <button
                                  disabled={isLocked || !repsInput[exercise.id]?.[i]}
                                  onClick={() => handleConfirmSet(exercise, i)}
                                  className="w-7 h-7 rounded-full flex items-center justify-center
                                             bg-purple-500/15 border border-purple-500/30
                                             enabled:active:scale-95 transition-transform
                                             disabled:opacity-25">
                                  <Check size={11} className="text-purple-300" />
                                </button>
                              )}
                            </div>
                          );
                        })}

                        {/* Hint */}
                        {confirmedCount < exercise.sets && (
                          <p className="text-center text-[10px] text-[#4a4568] mt-1">
                            planejado: {exercise.reps} reps
                          </p>
                        )}

                        {/* Concluir exercício */}
                        <button
                          onClick={() => handleCompleteExercise(exercise)}
                          className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-[14px]
                                     bg-green-500/[0.08] border border-green-500/25 text-green-400
                                     text-[12px] font-semibold active:scale-[0.98] transition-transform">
                          <Check size={13} />
                          concluir exercício
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Botão de adicionar substituto */}
          <button
            onClick={() => setShowPicker(true)}
            className="w-full flex items-center justify-center gap-2 py-3 mb-2 rounded-[14px]
                       text-[12px] font-semibold text-purple-400
                       border border-dashed border-purple-500/30 bg-purple-500/[0.06]
                       active:bg-purple-500/10 transition-colors">
            <ArrowRightLeft size={13} />
            adicionar exercício substituto
          </button>
        </div>
      )}

      {/* Modal picker de exercício substituto */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4"
             style={{ background: 'rgba(8, 6, 15, 0.75)', backdropFilter: 'blur(6px)' }}
             onClick={() => { setShowPicker(false); setPickerSearch(''); }}>
          <div
            className="w-full sm:max-w-md max-h-[85vh] rounded-t-[28px] sm:rounded-[24px] overflow-hidden flex flex-col animate-slide-up"
            style={{
              background: 'rgba(15, 10, 30, 0.98)',
              border: '0.5px solid rgba(139, 92, 246, 0.25)',
              backdropFilter: 'blur(20px)',
            }}
            onClick={e => e.stopPropagation()}>
            {/* Handle */}
            <div className="w-10 h-1 rounded-full bg-purple-500/30 mx-auto mt-3 mb-2" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-3">
              <h3 className="text-[16px] font-bold text-white">Adicionar exercício</h3>
              <button
                onClick={() => { setShowPicker(false); setPickerSearch(''); }}
                className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 border border-purple-500/15">
                <X size={13} className="text-[#7c6f9e]" />
              </button>
            </div>

            {/* Abas */}
            <div className="flex border-b border-purple-500/10 px-6">
              <button
                onClick={() => setPickerTab('plans')}
                className={`flex-1 py-2.5 text-[13px] font-medium transition-colors ${
                  pickerTab === 'plans'
                    ? 'text-purple-300 border-b-2 border-purple-400'
                    : 'text-[#4a4568]'
                }`}>
                De outra ficha
              </button>
              <button
                onClick={() => setPickerTab('custom')}
                className={`flex-1 py-2.5 text-[13px] font-medium transition-colors ${
                  pickerTab === 'custom'
                    ? 'text-purple-300 border-b-2 border-purple-400'
                    : 'text-[#4a4568]'
                }`}>
                Avulso
              </button>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto p-6">
              {pickerTab === 'plans' ? (
                <div className="space-y-4">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a4568]" />
                    <input
                      type="text"
                      value={pickerSearch}
                      onChange={e => setPickerSearch(e.target.value)}
                      placeholder="Buscar exercício..."
                      className="w-full bg-white/[0.05] border border-purple-500/25 rounded-[12px]
                                 pl-9 pr-3 py-3 text-[14px] text-white placeholder:text-[#4a4568]
                                 focus:outline-none focus:border-purple-400/50"
                    />
                  </div>

                  {otherPlans.length === 0 ? (
                    <p className="text-[#4a4568] text-[13px] text-center py-6">Você só tem uma ficha</p>
                  ) : (
                    otherPlans.map(plan => {
                      const filtered = plan.exercises.filter(ex =>
                        !pickerSearch || ex.name.toLowerCase().includes(pickerSearch.toLowerCase())
                      );
                      if (filtered.length === 0) return null;
                      return (
                        <div key={plan.id}>
                          <p className="text-[10px] font-semibold text-purple-400 tracking-[.6px] uppercase mb-2">
                            {plan.name}
                          </p>
                          <div className="space-y-1.5">
                            {filtered.map(ex => (
                              <button
                                key={ex.id}
                                onClick={() => handleImportExercise(ex, plan.name)}
                                className="w-full flex items-center justify-between rounded-[12px] px-3 py-2.5
                                           bg-white/[0.04] border border-purple-500/[0.12] active:bg-white/[0.08]
                                           text-left transition-all">
                                <div>
                                  <p className="text-[13px] text-white font-medium">{ex.name}</p>
                                  <p className="text-[11px] text-[#4a4568]">
                                    {ex.sets}×{ex.reps}{ex.weight ? ` · ${ex.weight} kg` : ''}
                                  </p>
                                </div>
                                <Plus size={14} className="text-purple-400/50" />
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-[#7c6f9e] mb-1 block">Nome do exercício</label>
                    <ExerciseAutocomplete
                      value={customForm.name}
                      onChange={name => setCustomForm(prev => ({ ...prev, name }))}
                      placeholder="Ex: Voador"
                      userExercises={userExerciseNames}
                      className="w-full bg-white/[0.05] border border-purple-500/25 rounded-[12px]
                                 px-4 py-3 text-[14px] text-white placeholder:text-[#4a4568]
                                 focus:outline-none focus:border-purple-400/50"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] text-[#7c6f9e] mb-1 block">Séries</label>
                      <input
                        type="number" inputMode="numeric" min="1"
                        value={customForm.sets}
                        onChange={e => setCustomForm(prev => ({ ...prev, sets: e.target.value }))}
                        className="w-full bg-white/[0.05] border border-purple-500/25 rounded-[12px]
                                   px-3 py-3 text-[14px] text-white text-center
                                   focus:outline-none focus:border-purple-400/50"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#7c6f9e] mb-1 block">Reps</label>
                      <input
                        type="text"
                        value={customForm.reps}
                        onChange={e => setCustomForm(prev => ({ ...prev, reps: e.target.value }))}
                        placeholder="12"
                        className="w-full bg-white/[0.05] border border-purple-500/25 rounded-[12px]
                                   px-3 py-3 text-[14px] text-white text-center placeholder:text-[#4a4568]
                                   focus:outline-none focus:border-purple-400/50"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#7c6f9e] mb-1 block">Carga (kg)</label>
                      <input
                        type="number" inputMode="decimal" min="0" step="0.5"
                        value={customForm.weight}
                        onChange={e => setCustomForm(prev => ({ ...prev, weight: e.target.value }))}
                        placeholder="0"
                        className="w-full bg-white/[0.05] border border-purple-500/25 rounded-[12px]
                                   px-3 py-3 text-[14px] text-white text-center placeholder:text-[#4a4568]
                                   focus:outline-none focus:border-purple-400/50"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleCreateCustom}
                    disabled={!customForm.name.trim()}
                    className="w-full bg-purple-600 text-white font-semibold text-[14px]
                               py-3.5 rounded-[14px] active:scale-[0.98] transition-transform mt-2
                               disabled:opacity-40 disabled:pointer-events-none">
                    Adicionar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}