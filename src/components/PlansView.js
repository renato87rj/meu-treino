import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ClipboardList, Copy, Trash2, Edit2, Save, X, Plus, Dumbbell, MoreVertical, GripVertical, Clock } from 'lucide-react';
import ExerciseAutocomplete from './ExerciseAutocomplete';

export default function PlansView({ 
  workoutPlans, 
  showAddPlan,
  onSelectPlanForWorkout,
  onEditPlanName,
  onDuplicatePlan,
  onDeletePlan,
  onCreatePlan,
  onCancelAdd,
  onAddExercise,
  onEditExercise,
  onDeleteExercise,
  onDuplicateExercise,
  onMoveExercise,
  onAddPlan
}) {
  const [newPlanName, setNewPlanName] = useState('');
  const [expandedPlan, setExpandedPlan] = useState(null);
  const [showAddExerciseForm, setShowAddExerciseForm] = useState(null);
  const [editingExercise, setEditingExercise] = useState(null);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [editingPlanName, setEditingPlanName] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [openExerciseMenu, setOpenExerciseMenu] = useState(null);
  const [toast, setToast] = useState(null);
  const [newExercise, setNewExercise] = useState({
    name: '',
    sets: '',
    reps: '',
    weight: ''
  });
  const previousPlansCount = useRef(workoutPlans.length);
  const menuRefs = useRef({});
  const exerciseMenuRefs = useRef({});
  const toastTimeoutRef = useRef(null);
  const longPressTimeoutRef = useRef(null);
  const dragStateRef = useRef({ planId: null, exerciseId: null, fromIndex: -1, toIndex: -1, pointerId: null });
  const [draggingKey, setDraggingKey] = useState(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
    };
  }, []);

  // Nomes únicos de exercícios já usados pelo usuário
  const userExerciseNames = useMemo(() => {
    const names = new Set();
    workoutPlans.forEach(plan => plan.exercises.forEach(ex => names.add(ex.name)));
    return [...names];
  }, [workoutPlans]);

  // Detectar quando uma nova ficha é criada e expandir automaticamente se tiver 0 exercícios
  useEffect(() => {
    if (workoutPlans.length > previousPlansCount.current) {
      const newestPlan = workoutPlans[workoutPlans.length - 1];
      if (newestPlan.exercises.length === 0) {
        queueMicrotask(() => {
          setExpandedPlan(newestPlan.id);
          setShowAddExerciseForm(newestPlan.id);
        });
      }
    }
    previousPlansCount.current = workoutPlans.length;
  }, [workoutPlans]);

  const handleCreate = () => {
    if (onCreatePlan(newPlanName)) {
      setNewPlanName('');
      onCancelAdd();
    }
  };

  const togglePlan = (planId) => {
    if (expandedPlan === planId) {
      setExpandedPlan(null);
      setShowAddExerciseForm(null);
    } else {
      setExpandedPlan(planId);
      const plan = workoutPlans.find(p => p.id === planId);
      if (plan && plan.exercises.length === 0) {
        setShowAddExerciseForm(planId);
      } else {
        setShowAddExerciseForm(null);
      }
    }
    setEditingExercise(null);
  };

  const handleAddExercise = (planId) => {
    const ok = onAddExercise(planId, newExercise);

    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);

    if (ok) {
      setToast({ type: 'success', message: 'Exercício adicionado!' });
      setNewExercise({ name: '', sets: '', reps: '', weight: '' });
    } else {
      setToast({ type: 'error', message: 'Falha ao adicionar exercício.' });
    }

    toastTimeoutRef.current = setTimeout(() => setToast(null), 2200);
  };

  const handleSaveEdit = (planId) => {
    if (onEditExercise(planId, editingExercise)) {
      setEditingExercise(null);
    }
  };

  const startEditingPlanName = (plan) => {
    setEditingPlanId(plan.id);
    setEditingPlanName(plan.name);
  };

  const handleSavePlanName = () => {
    if (onEditPlanName(editingPlanId, editingPlanName)) {
      setEditingPlanId(null);
      setEditingPlanName('');
    }
  };

  const cancelEditingPlanName = () => {
    setEditingPlanId(null);
    setEditingPlanName('');
  };

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId !== null) {
        const menuElement = menuRefs.current[openMenuId];
        if (menuElement && !menuElement.contains(event.target)) {
          setOpenMenuId(null);
        }
      }
    };

    if (openMenuId !== null) {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
      }, 10);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [openMenuId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openExerciseMenu !== null) {
        const menuElement = exerciseMenuRefs.current[openExerciseMenu];
        if (menuElement && !menuElement.contains(event.target)) {
          setOpenExerciseMenu(null);
        }
      }
    };

    if (openExerciseMenu !== null) {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
      }, 10);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [openExerciseMenu]);

  const toggleMenu = (planId, e) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === planId ? null : planId);
  };

  const toggleExerciseMenu = (menuKey, e) => {
    e.stopPropagation();
    setOpenExerciseMenu(openExerciseMenu === menuKey ? null : menuKey);
  };

  const handleExerciseMenuAction = (planId, exercise, action) => {
    setOpenExerciseMenu(null);
    if (action === 'edit') {
      setEditingExercise(exercise);
    } else if (action === 'duplicate') {
      onDuplicateExercise(planId, exercise);
    } else if (action === 'delete') {
      onDeleteExercise(planId, exercise.id);
    }
  };

  const startLongPressDrag = (planId, exerciseId, fromIndex, e) => {
    e.stopPropagation();
    if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);

    const pointerId = e.pointerId;
    dragStateRef.current = { planId, exerciseId, fromIndex, toIndex: fromIndex, pointerId };

    longPressTimeoutRef.current = setTimeout(() => {
      setOpenExerciseMenu(null);
      setDraggingKey(`${planId}:${exerciseId}`);
      try {
        e.currentTarget.setPointerCapture(pointerId);
      } catch {
      }
    }, 250);
  };

  const cancelLongPress = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  const handleDragMove = (e) => {
    if (!draggingKey) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const row = el?.closest?.('[data-exercise-row="true"]');
    if (!row) return;
    const idx = Number(row.getAttribute('data-index'));
    if (!Number.isNaN(idx)) dragStateRef.current.toIndex = idx;
  };

  const finishDrag = () => {
    cancelLongPress();
    if (!draggingKey) return;

    const { planId, exerciseId, fromIndex, toIndex } = dragStateRef.current;
    if (planId != null && exerciseId != null && fromIndex >= 0 && toIndex >= 0 && fromIndex !== toIndex) {
      const steps = Math.abs(toIndex - fromIndex);
      const direction = toIndex > fromIndex ? 'down' : 'up';
      for (let i = 0; i < steps; i++) {
        onMoveExercise(planId, exerciseId, direction);
      }
    }

    setDraggingKey(null);
    dragStateRef.current = { planId: null, exerciseId: null, fromIndex: -1, toIndex: -1, pointerId: null };
  };

  const handleMenuAction = (planId, action) => {
    setOpenMenuId(null);
    if (action === 'edit') {
      const plan = workoutPlans.find(p => p.id === planId);
      if (plan) startEditingPlanName(plan);
    } else if (action === 'duplicate') {
      const plan = workoutPlans.find(p => p.id === planId);
      if (plan) onDuplicatePlan(plan);
    } else if (action === 'delete') {
      onDeletePlan(planId);
    }
  };

  return (
    <div className="pt-4">
      {toast && (
        <div className="fixed bottom-[80px] left-1/2 -translate-x-1/2 z-50">
          <div
            className="px-4 py-3 rounded-[16px] text-[13px] font-semibold shadow-lg"
            style={{
              background: toast.type === 'success' ? 'rgba(34, 197, 94, 0.90)' : 'rgba(239, 68, 68, 0.90)',
              border: toast.type === 'success' ? '0.5px solid rgba(74, 222, 128, 0.40)' : '0.5px solid rgba(248, 113, 113, 0.40)',
              backdropFilter: 'blur(12px)',
              color: 'white',
            }}
          >
            {toast.message}
          </div>
        </div>
      )}

      {/* Modal de Nova Ficha */}
      {showAddPlan && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4"
             style={{ background: 'rgba(8, 6, 15, 0.75)', backdropFilter: 'blur(6px)' }}
             onClick={onCancelAdd}>
          <div
            className="w-full sm:max-w-md rounded-t-[28px] sm:rounded-[24px] p-6 animate-slide-up"
            style={{
              background: 'rgba(15, 10, 30, 0.98)',
              border: '0.5px solid rgba(139, 92, 246, 0.25)',
              backdropFilter: 'blur(20px)',
            }}
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-purple-500/30 mx-auto mb-5" />
            <h2 className="text-[16px] font-bold text-white mb-4">Nova Ficha de Treino</h2>
            <input
              type="text"
              value={newPlanName}
              onChange={(e) => setNewPlanName(e.target.value)}
              placeholder="Ex: Treino A - Peito e Tríceps"
              className="w-full bg-white/[0.05] border border-purple-500/25 rounded-[12px]
                         px-4 py-3 text-[14px] text-white placeholder:text-[#4a4568]
                         focus:outline-none focus:border-purple-400/50
                         transition-colors mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button 
                onClick={handleCreate} 
                className="flex-1 bg-purple-600 text-white font-semibold text-[14px]
                           py-3.5 rounded-[14px] active:scale-[0.98] transition-transform"
              >
                Criar
              </button>
              <button 
                onClick={onCancelAdd} 
                className="flex-1 bg-white/[0.05] border border-purple-500/15 text-[#7c6f9e] font-semibold text-[14px]
                           py-3.5 rounded-[14px] active:scale-[0.98] transition-transform"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Novo Exercício */}
      {showAddExerciseForm !== null && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4"
          style={{ background: 'rgba(8, 6, 15, 0.75)', backdropFilter: 'blur(6px)' }}
          onClick={() => {
            setShowAddExerciseForm(null);
            setNewExercise({ name: '', sets: '', reps: '', weight: '' });
          }}
        >
          <div
            className="w-full sm:max-w-md rounded-t-[28px] sm:rounded-[24px] p-6 animate-slide-up"
            style={{
              background: 'rgba(15, 10, 30, 0.98)',
              border: '0.5px solid rgba(139, 92, 246, 0.25)',
              backdropFilter: 'blur(20px)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-purple-500/30 mx-auto mb-5" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-bold text-white">Novo Exercício</h2>
              <button
                onClick={() => {
                  setShowAddExerciseForm(null);
                  setNewExercise({ name: '', sets: '', reps: '', weight: '' });
                }}
                className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 border border-purple-500/15"
              >
                <X size={13} className="text-[#7c6f9e]" />
              </button>
            </div>

            <div className="space-y-2.5">
              <ExerciseAutocomplete
                value={newExercise.name}
                onChange={(name) => setNewExercise({ ...newExercise, name })}
                placeholder="Nome do exercício"
                userExercises={userExerciseNames}
                className="w-full bg-white/[0.05] border border-purple-500/25 rounded-[12px]
                           px-4 py-3 text-[14px] text-white placeholder:text-[#4a4568]
                           focus:outline-none focus:border-purple-400/50 transition-colors"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number" min="1"
                  value={newExercise.sets}
                  onChange={(e) => setNewExercise({ ...newExercise, sets: e.target.value })}
                  placeholder="Séries"
                  className="bg-white/[0.05] border border-purple-500/25 rounded-[12px]
                             px-3 py-3 text-[14px] text-white text-center placeholder:text-[#4a4568]
                             focus:outline-none focus:border-purple-400/50 transition-colors"
                />
                <input
                  type="text"
                  value={newExercise.reps}
                  onChange={(e) => setNewExercise({ ...newExercise, reps: e.target.value })}
                  placeholder="Reps"
                  className="bg-white/[0.05] border border-purple-500/25 rounded-[12px]
                             px-3 py-3 text-[14px] text-white text-center placeholder:text-[#4a4568]
                             focus:outline-none focus:border-purple-400/50 transition-colors"
                />
                <input
                  type="number" min="0" step="0.5"
                  value={newExercise.weight}
                  onChange={(e) => setNewExercise({ ...newExercise, weight: e.target.value })}
                  placeholder="Carga"
                  className="bg-white/[0.05] border border-purple-500/25 rounded-[12px]
                             px-3 py-3 text-[14px] text-white text-center placeholder:text-[#4a4568]
                             focus:outline-none focus:border-purple-400/50 transition-colors"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => handleAddExercise(showAddExerciseForm)}
                  className="flex-1 bg-purple-600 text-white font-semibold text-[14px]
                             py-3 rounded-[14px] active:scale-[0.98] transition-transform"
                >
                  Adicionar
                </button>
                <button
                  onClick={() => {
                    setNewExercise({ name: '', sets: '', reps: '', weight: '' });
                  }}
                  className="flex-1 bg-white/[0.05] border border-purple-500/15 text-[#7c6f9e] font-semibold text-[14px]
                             py-3 rounded-[14px] active:scale-[0.98] transition-transform"
                >
                  Limpar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Fichas */}
      {workoutPlans.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList className="mx-auto text-[#3a3060] mb-4" size={48} />
          <p className="text-[#7c6f9e] text-[15px]">Nenhuma ficha criada</p>
          <p className="text-[#4a4568] text-[12px] mt-2 mb-6">Crie sua primeira ficha para começar</p>
          <button
            onClick={onAddPlan}
            className="mx-auto flex items-center justify-center gap-2 px-8 py-4 rounded-[16px]
                       text-[14px] font-semibold text-white bg-purple-600
                       active:scale-[0.98] transition-transform">
            <Plus size={16} />
            nova ficha
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {workoutPlans.map((plan) => {
            const isExpanded = expandedPlan === plan.id;
            
            return (
              <div
                key={plan.id}
                className={`card relative isolate p-4 mb-3 transition-all overflow-visible ${openMenuId === plan.id ? 'z-50' : ''} ${isExpanded ? 'border-purple-500/40' : ''}`}
                style={isExpanded ? { borderColor: 'rgba(139, 92, 246, 0.4)' } : {}}
              >
                {/* Cabeçalho do card */}
                <div className="flex items-center gap-3" onClick={() => togglePlan(plan.id)}>
                  {/* Ícone da ficha */}
                  <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0
                                  bg-purple-500/20 border border-purple-500/25">
                    <Dumbbell size={16} className="text-purple-400" />
                  </div>

                  {/* Info */}
                  {editingPlanId === plan.id ? (
                    <div className="flex-1 flex items-center gap-2 min-w-0" onClick={e => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingPlanName}
                        onChange={(e) => setEditingPlanName(e.target.value)}
                        className="flex-1 min-w-0 px-3 py-1.5 bg-white/[0.05] border border-purple-500/25 rounded-[10px] text-[14px] text-white focus:outline-none focus:border-purple-400/50"
                        autoFocus
                      />
                      <button onClick={handleSavePlanName}
                        className="w-7 h-7 rounded-full flex items-center justify-center bg-green-500/15 border border-green-500/25">
                        <Save size={12} className="text-green-400" />
                      </button>
                      <button onClick={cancelEditingPlanName}
                        className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 border border-purple-500/15">
                        <X size={12} className="text-[#7c6f9e]" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-semibold text-white tracking-tight truncate">
                        {plan.name}
                      </h3>
                      <p className="text-[12px] text-[#7c6f9e] mt-0.5">
                        {plan.exercises.length} exercício{plan.exercises.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}

                  {/* Ações */}
                  {editingPlanId !== plan.id && (
                    <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectPlanForWorkout(plan)}
                        className="text-[12px] font-semibold text-white bg-purple-600 px-3.5 py-1.5 rounded-full
                                   active:scale-95 transition-transform">
                        Treinar
                      </button>
                      <div className={`relative ${openMenuId === plan.id ? 'z-50' : ''}`}
                        ref={(el) => { if (el) menuRefs.current[plan.id] = el; }}>
                        <button
                          onClick={(e) => toggleMenu(plan.id, e)}
                          className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 border border-purple-500/15">
                          <MoreVertical size={13} className="text-[#7c6f9e]" />
                        </button>
                        {openMenuId === plan.id && (
                          <div className="absolute right-0 top-full mt-1 rounded-[14px] z-[60] min-w-[160px] overflow-hidden"
                               style={{ background: 'rgba(15, 10, 30, 0.98)', border: '0.5px solid rgba(139, 92, 246, 0.25)', backdropFilter: 'blur(20px)' }}>
                            <button onClick={() => handleMenuAction(plan.id, 'edit')}
                              className="w-full px-4 py-3 text-left text-white active:bg-purple-600/20 flex items-center gap-3 transition-colors">
                              <Edit2 size={14} className="text-purple-400 flex-shrink-0" />
                              <span className="text-[13px]">Editar nome</span>
                            </button>
                            <button onClick={() => handleMenuAction(plan.id, 'duplicate')}
                              className="w-full px-4 py-3 text-left text-white active:bg-purple-600/20 flex items-center gap-3 transition-colors">
                              <Copy size={14} className="text-purple-400 flex-shrink-0" />
                              <span className="text-[13px]">Duplicar</span>
                            </button>
                            <div className="border-t border-purple-500/10 mx-2"></div>
                            <button onClick={() => handleMenuAction(plan.id, 'delete')}
                              className="w-full px-4 py-3 text-left text-red-400 active:bg-red-500/20 flex items-center gap-3 transition-colors">
                              <Trash2 size={14} className="flex-shrink-0" />
                              <span className="text-[13px]">Deletar</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Indicador de idade da ficha */}
                {(() => {
                  const createdAt = plan.createdAt ? new Date(plan.createdAt) : null;
                  if (!createdAt) return null;
                  
                  const now = new Date();
                  const diffMs = now - createdAt;
                  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                  
                  const createdDay = String(createdAt.getDate()).padStart(2, '0');
                  const createdMonth = String(createdAt.getMonth() + 1).padStart(2, '0');
                  const dateLabel = `${createdDay}/${createdMonth}`;
                  
                  let color, bgColor, borderColor, label;
                  if (diffDays < 45) {
                    color = '#4ade80';
                    bgColor = 'rgba(74, 222, 128, 0.08)';
                    borderColor = 'rgba(74, 222, 128, 0.25)';
                    label = null;
                  } else if (diffDays < 90) {
                    color = '#fbbf24';
                    bgColor = 'rgba(251, 191, 36, 0.08)';
                    borderColor = 'rgba(251, 191, 36, 0.25)';
                    label = 'considere revisar';
                  } else {
                    color = '#f87171';
                    bgColor = 'rgba(248, 113, 113, 0.08)';
                    borderColor = 'rgba(248, 113, 113, 0.25)';
                    label = 'hora de revisar';
                  }
                  
                  return (
                    <div
                      className="flex items-center gap-2 mt-3 px-3 py-2 rounded-full"
                      style={{ background: bgColor, border: `0.5px solid ${borderColor}` }}
                    >
                      <Clock size={12} style={{ color }} />
                      <span className="text-[11px] flex-1" style={{ color }}>
                        usada há {diffDays} dias · desde {dateLabel}
                      </span>
                      {label && (
                        <span className="text-[10px]" style={{ color, opacity: 0.8 }}>
                          {label}
                        </span>
                      )}
                    </div>
                  );
                })()}

                {/* Dots de progresso */}
                {plan.exercises.length > 0 && !isExpanded && (
                  <div className="flex gap-1.5 mt-2">
                    {plan.exercises.map((ex) => (
                      <div key={ex.id} className="w-2 h-2 rounded-full bg-[#2d1f55]" />
                    ))}
                  </div>
                )}

                {/* Lista expandida de exercícios */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-purple-500/10">
                    {/* Botão Adicionar Exercício */}
                    {!showAddExerciseForm && (
                      <button
                        onClick={() => setShowAddExerciseForm(plan.id)}
                        className="w-full mb-3 flex items-center justify-center gap-2 py-2.5 rounded-[14px]
                                   text-[12px] font-semibold text-purple-400
                                   border border-dashed border-purple-500/30 bg-purple-500/[0.06]
                                   active:bg-purple-500/10 transition-colors">
                        <Plus size={13} />
                        adicionar exercício
                      </button>
                    )}

                    {plan.exercises.length > 1 && (
                      <div className="mb-3 text-center">
                        <span className="text-[11px] text-[#4a4568]">
                          Segure e arraste o exercício para reordenar
                        </span>
                      </div>
                    )}

                    {/* Lista de Exercícios */}
                    {plan.exercises.length === 0 ? (
                      <div className="text-center py-8">
                        <Dumbbell className="mx-auto text-[#3a3060] mb-2" size={32} />
                        <p className="text-[#7c6f9e] text-[13px]">Nenhum exercício</p>
                        <p className="text-[#4a4568] text-[11px] mt-1">Adicione exercícios para começar</p>
                      </div>
                    ) : (
                      <div className="space-y-0">
                        {plan.exercises.map((exercise, index) => {
                          const isEditing = editingExercise?.id === exercise.id;
                          const isFirst = index === 0;
                          const isLast = index === plan.exercises.length - 1;

                          return (
                            <div
                              key={exercise.id}
                              className={`flex items-center gap-3 py-3 border-b border-purple-500/[0.07] last:border-0 ${
                                draggingKey === `${plan.id}:${exercise.id}` ? 'opacity-70' : ''
                              }`}
                              data-exercise-row="true"
                              data-index={index}
                            >
                              {isEditing ? (
                                <div className="flex-1 space-y-2 py-1">
                                  <ExerciseAutocomplete
                                    value={editingExercise.name}
                                    onChange={(name) => setEditingExercise({...editingExercise, name})}
                                    userExercises={userExerciseNames}
                                    className="w-full bg-white/[0.05] border border-purple-500/25 rounded-[10px]
                                               px-3 py-2 text-[13px] text-white focus:outline-none focus:border-purple-400/50"
                                  />
                                  <div className="grid grid-cols-3 gap-2">
                                    <input
                                      type="number"
                                      value={editingExercise.sets}
                                      onChange={(e) => setEditingExercise({...editingExercise, sets: e.target.value})}
                                      placeholder="Séries"
                                      className="bg-white/[0.05] border border-purple-500/25 rounded-[10px]
                                                 px-3 py-2 text-[13px] text-white text-center focus:outline-none focus:border-purple-400/50"
                                    />
                                    <input
                                      type="text"
                                      value={editingExercise.reps}
                                      onChange={(e) => setEditingExercise({...editingExercise, reps: e.target.value})}
                                      placeholder="Reps"
                                      className="bg-white/[0.05] border border-purple-500/25 rounded-[10px]
                                                 px-3 py-2 text-[13px] text-white text-center focus:outline-none focus:border-purple-400/50"
                                    />
                                    <input
                                      type="number" min="0" step="0.5"
                                      value={editingExercise.weight || ''}
                                      onChange={(e) => setEditingExercise({...editingExercise, weight: e.target.value})}
                                      placeholder="Carga"
                                      className="bg-white/[0.05] border border-purple-500/25 rounded-[10px]
                                                 px-3 py-2 text-[13px] text-white text-center placeholder:text-[#4a4568] focus:outline-none focus:border-purple-400/50"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => handleSaveEdit(plan.id)} 
                                      className="flex-1 bg-purple-600 text-white text-[12px] font-semibold py-2 rounded-[10px] active:scale-[0.98] transition-transform flex items-center justify-center gap-1">
                                      <Save size={12} /> Salvar
                                    </button>
                                    <button 
                                      onClick={() => setEditingExercise(null)} 
                                      className="flex-1 bg-white/[0.05] border border-purple-500/15 text-[#7c6f9e] text-[12px] font-semibold py-2 rounded-[10px] active:scale-[0.98] transition-transform flex items-center justify-center gap-1">
                                      <X size={12} /> Cancelar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onPointerDown={(e) => startLongPressDrag(plan.id, exercise.id, index, e)}
                                    onPointerMove={handleDragMove}
                                    onPointerUp={finishDrag}
                                    onPointerCancel={finishDrag}
                                    onPointerLeave={cancelLongPress}
                                    onContextMenu={(e) => e.preventDefault()}
                                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border transition-all ${
                                      draggingKey === `${plan.id}:${exercise.id}`
                                        ? 'text-purple-200 border-purple-500/40 bg-purple-500/15'
                                        : 'text-[#7c6f9e] border-purple-500/[0.12] bg-white/[0.04]'
                                    }`}
                                    aria-label="Segure e arraste para reordenar"
                                  >
                                    <GripVertical size={14} />
                                  </button>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="text-[10px] font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full flex-shrink-0">
                                        {index + 1}
                                      </span>
                                      <span className="text-[13px] text-white font-medium flex-1 truncate">{exercise.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1.5">
                                      <span className="text-[12px] font-semibold text-purple-200 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full">
                                        {exercise.sets} séries · {exercise.reps} reps
                                      </span>
                                      {exercise.weight ? (
                                        <span className="text-[10px] font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                                          {exercise.weight}kg
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-semibold text-[#4a4568] bg-white/[0.04] border border-purple-500/[0.10] px-2 py-0.5 rounded-full">
                                          sem carga
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}
                                    ref={(el) => { if (el) exerciseMenuRefs.current[`${plan.id}:${exercise.id}`] = el; }}>
                                    <button
                                      onClick={(e) => toggleExerciseMenu(`${plan.id}:${exercise.id}`, e)}
                                      className="w-9 h-9 rounded-full flex items-center justify-center text-[#7c6f9e] bg-white/[0.04] border border-purple-500/[0.12] active:scale-95 transition-transform"
                                      aria-label="Abrir menu do exercício"
                                    >
                                      <MoreVertical size={14} />
                                    </button>
                                    {openExerciseMenu === `${plan.id}:${exercise.id}` && (
                                      <div className="absolute right-0 top-full mt-1 rounded-[14px] z-[60] min-w-[190px] overflow-hidden"
                                        style={{ background: 'rgba(15, 10, 30, 0.98)', border: '0.5px solid rgba(139, 92, 246, 0.25)', backdropFilter: 'blur(20px)' }}>
                                        <button onClick={() => handleExerciseMenuAction(plan.id, exercise, 'edit')}
                                          className="w-full px-4 py-3 text-left text-white active:bg-purple-600/20 flex items-center gap-3 transition-colors">
                                          <Edit2 size={14} className="text-purple-400 flex-shrink-0" />
                                          <span className="text-[13px]">Editar</span>
                                        </button>
                                        <button onClick={() => handleExerciseMenuAction(plan.id, exercise, 'duplicate')}
                                          className="w-full px-4 py-3 text-left text-white active:bg-purple-600/20 flex items-center gap-3 transition-colors">
                                          <Copy size={14} className="text-purple-400 flex-shrink-0" />
                                          <span className="text-[13px]">Duplicar</span>
                                        </button>
                                        <div className="border-t border-purple-500/10 mx-2"></div>
                                        <button onClick={() => handleExerciseMenuAction(plan.id, exercise, 'delete')}
                                          className="w-full px-4 py-3 text-left text-red-400 active:bg-red-500/20 flex items-center gap-3 transition-colors">
                                          <Trash2 size={14} className="flex-shrink-0" />
                                          <span className="text-[13px]">Excluir</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Botão de nova ficha — CTA no rodapé da lista */}
          <button
            onClick={onAddPlan}
            className="w-full flex items-center justify-center gap-2 mt-2 py-4 rounded-[16px]
                       text-[14px] font-semibold text-white bg-purple-600
                       active:scale-[0.98] transition-transform">
            <Plus size={16} />
            nova ficha
          </button>
        </div>
      )}
    </div>
  );
}
