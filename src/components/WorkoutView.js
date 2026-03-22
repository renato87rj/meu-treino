import React, { useState } from 'react';
import { Dumbbell, CheckCircle, ChevronDown, ChevronUp, RotateCcw, Check, Plus, X, Search, ArrowRightLeft } from 'lucide-react';

export default function WorkoutView({
  selectedPlan,
  allPlans,             // todas as fichas (para importar exercícios)
  completedTodayIds,    // Set de exerciseId concluídos hoje
  completedTodayNames,  // Set de exerciseName concluídos hoje
  todayRecords,         // array completo de registros de hoje
  setProgress,          // { [exerciseId]: { weight, sets: [{reps}] } }
  onConfirmSet,         // (plan, exercise, setIndex, reps) => bool
  onUpdateWeight,       // (exerciseId, weight) => void
  onCompleteExercise,   // (plan, exercise, setsData) => bool
  onUndoExercise,       // (plan, exercise) => void
  substituteExercises,  // array de exercícios substitutos persistidos no hook
  onAddSubstitute,      // (exercise) => void
  onRemoveSubstitute,   // (exerciseId) => void
  onStartRestTimer      // () => void — dispara cronômetro de descanso
}) {
  // Controla quais cards estão expandidos
  const [expanded, setExpanded] = useState({});
  // Valores dos inputs de reps por série: { [exerciseId]: { [setIndex]: string } }
  const [repsInput, setRepsInput] = useState({});
  // Modal de seleção de exercício substituto
  const [showPicker, setShowPicker] = useState(false);
  // Aba do picker: 'plans' ou 'custom'
  const [pickerTab, setPickerTab] = useState('plans');
  // Busca dentro do picker
  const [pickerSearch, setPickerSearch] = useState('');
  // Formulário de exercício avulso
  const [customForm, setCustomForm] = useState({ name: '', sets: '3', reps: '12', weight: '' });

  if (!selectedPlan) return null;

  // Fichas que não são a atual
  const otherPlans = (allPlans || []).filter(p => p.id !== selectedPlan.id);

  const toggleExpand = (exerciseId) => {
    setExpanded(prev => ({ ...prev, [exerciseId]: !prev[exerciseId] }));
  };

  const isCompleted = (exercise) =>
    completedTodayIds.has(exercise.id) || completedTodayNames.has(exercise.name);

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

    // Dispara cronômetro de descanso automaticamente
    if (onStartRestTimer) onStartRestTimer();

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

    // Dispara cronômetro de descanso automaticamente
    if (onStartRestTimer) onStartRestTimer();

    setRepsInput(prev => {
      const next = { ...prev };
      delete next[exercise.id];
      return next;
    });
  };

  const handleUndo = (exercise) => {
    const record = todayRecords.find(r =>
      r.exerciseId === exercise.id || r.exerciseName === exercise.name
    );
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

  // Importar exercício de outra ficha
  const handleImportExercise = (exercise, sourcePlanName) => {
    const imported = {
      ...exercise,
      id: Date.now() + Math.random(),
      _substitute: true,
      _sourcePlanName: sourcePlanName,
      _originalName: exercise.name
    };
    onAddSubstitute(imported);
    setExpanded(prev => ({ ...prev, [imported.id]: true }));
    setShowPicker(false);
    setPickerSearch('');
  };

  // Criar exercício avulso
  const handleCreateCustom = () => {
    if (!customForm.name.trim()) return;
    const custom = {
      id: Date.now() + Math.random(),
      name: customForm.name.trim(),
      sets: parseInt(customForm.sets) || 3,
      reps: customForm.reps || '12',
      weight: customForm.weight ? parseFloat(customForm.weight) : null,
      _substitute: true,
      _sourcePlanName: 'Avulso'
    };
    onAddSubstitute(custom);
    setExpanded(prev => ({ ...prev, [custom.id]: true }));
    setCustomForm({ name: '', sets: '3', reps: '12', weight: '' });
    setShowPicker(false);
  };

  // Remove exercício extra (não registrado)
  const handleRemoveExtra = (exerciseId) => {
    onRemoveSubstitute(exerciseId);
  };

  // Todos os exercícios a renderizar (ficha + extras)
  const allExercises = [...selectedPlan.exercises, ...(substituteExercises || [])];

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
      {allExercises.length === 0 ? (
        <div className="text-center py-16">
          <Dumbbell className="mx-auto text-purple-400/30 mb-4" size={64} />
          <p className="text-purple-300/70 text-lg">Nenhum exercício nesta ficha</p>
          <p className="text-purple-400/50 text-sm mt-2">Adicione exercícios na aba Fichas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allExercises.map((exercise) => {
            const isSubstitute = !!exercise._substitute;
            const completed = isCompleted(exercise);
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
                    <h3 className="text-white font-semibold text-base break-words">
                      {exercise.name}
                    </h3>
                    <p className="text-purple-300 text-sm mt-0.5">
                      {exercise.sets} séries · {exercise.reps} reps
                      {exercise.weight ? ` · ${exercise.weight} kg` : ''}
                    </p>
                    {isSubstitute && (
                      <span className="inline-flex items-center gap-1 mt-1 text-xs text-orange-400/80">
                        <ArrowRightLeft size={11} />
                        {exercise._sourcePlanName}
                      </span>
                    )}
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
          {/* Botão para adicionar exercício substituto */}
          <button
            onClick={() => setShowPicker(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-purple-500/30 text-purple-400/70 text-sm font-medium hover:border-purple-500/50 hover:text-purple-300 transition-all active:scale-[0.98]"
          >
            <Plus size={16} />
            Adicionar exercício substituto
          </button>
        </div>
      )}

      {/* Modal picker de exercício substituto */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => { setShowPicker(false); setPickerSearch(''); }}
          />

          {/* Drawer / Modal */}
          <div className="relative w-full max-w-lg max-h-[85vh] bg-slate-900 border border-purple-500/30 rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-purple-500/20">
              <h3 className="text-white font-semibold">Adicionar exercício</h3>
              <button
                onClick={() => { setShowPicker(false); setPickerSearch(''); }}
                className="text-purple-400/60 hover:text-purple-300 p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Abas */}
            <div className="flex border-b border-purple-500/20">
              <button
                onClick={() => setPickerTab('plans')}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  pickerTab === 'plans'
                    ? 'text-purple-300 border-b-2 border-purple-400'
                    : 'text-purple-400/50 hover:text-purple-300'
                }`}
              >
                De outra ficha
              </button>
              <button
                onClick={() => setPickerTab('custom')}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  pickerTab === 'custom'
                    ? 'text-purple-300 border-b-2 border-purple-400'
                    : 'text-purple-400/50 hover:text-purple-300'
                }`}
              >
                Avulso
              </button>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto p-4">
              {pickerTab === 'plans' ? (
                <div className="space-y-4">
                  {/* Busca */}
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400/40" />
                    <input
                      type="text"
                      value={pickerSearch}
                      onChange={e => setPickerSearch(e.target.value)}
                      placeholder="Buscar exercício..."
                      className="w-full bg-white/6 border border-purple-500/25 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-purple-400/30 focus:outline-none focus:border-purple-400/60"
                    />
                  </div>

                  {otherPlans.length === 0 ? (
                    <p className="text-purple-400/50 text-sm text-center py-6">Você só tem uma ficha</p>
                  ) : (
                    otherPlans.map(plan => {
                      const filtered = plan.exercises.filter(ex =>
                        !pickerSearch || ex.name.toLowerCase().includes(pickerSearch.toLowerCase())
                      );
                      if (filtered.length === 0) return null;

                      return (
                        <div key={plan.id}>
                          <p className="text-purple-300/60 text-xs font-medium uppercase tracking-wide mb-2">
                            {plan.name}
                          </p>
                          <div className="space-y-1.5">
                            {filtered.map(ex => (
                              <button
                                key={ex.id}
                                onClick={() => handleImportExercise(ex, plan.name)}
                                className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 border border-purple-500/15 hover:border-purple-500/30 rounded-lg px-3 py-2.5 text-left transition-all"
                              >
                                <div>
                                  <p className="text-white text-sm font-medium">{ex.name}</p>
                                  <p className="text-purple-400/60 text-xs">
                                    {ex.sets}x{ex.reps}
                                    {ex.weight ? ` · ${ex.weight} kg` : ''}
                                  </p>
                                </div>
                                <Plus size={16} className="text-purple-400/50" />
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                /* Aba avulso */
                <div className="space-y-3">
                  <div>
                    <label className="text-purple-300/70 text-xs mb-1 block">Nome do exercício</label>
                    <input
                      type="text"
                      value={customForm.name}
                      onChange={e => setCustomForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Voador"
                      className="w-full bg-white/6 border border-purple-500/25 rounded-lg px-3 py-2 text-sm text-white placeholder:text-purple-400/30 focus:outline-none focus:border-purple-400/60"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-purple-300/70 text-xs mb-1 block">Séries</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        min="1"
                        value={customForm.sets}
                        onChange={e => setCustomForm(prev => ({ ...prev, sets: e.target.value }))}
                        className="w-full bg-white/6 border border-purple-500/25 rounded-lg px-3 py-2 text-sm text-white text-center focus:outline-none focus:border-purple-400/60"
                      />
                    </div>
                    <div>
                      <label className="text-purple-300/70 text-xs mb-1 block">Reps</label>
                      <input
                        type="text"
                        value={customForm.reps}
                        onChange={e => setCustomForm(prev => ({ ...prev, reps: e.target.value }))}
                        placeholder="12"
                        className="w-full bg-white/6 border border-purple-500/25 rounded-lg px-3 py-2 text-sm text-white text-center focus:outline-none focus:border-purple-400/60"
                      />
                    </div>
                    <div>
                      <label className="text-purple-300/70 text-xs mb-1 block">Carga (kg)</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.5"
                        value={customForm.weight}
                        onChange={e => setCustomForm(prev => ({ ...prev, weight: e.target.value }))}
                        placeholder="0"
                        className="w-full bg-white/6 border border-purple-500/25 rounded-lg px-3 py-2 text-sm text-white text-center focus:outline-none focus:border-purple-400/60"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleCreateCustom}
                    disabled={!customForm.name.trim()}
                    className="w-full mt-1 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
                  >
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