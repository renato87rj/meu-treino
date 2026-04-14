import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ClipboardList, Copy, Trash2, Edit2, Save, X, Plus, Dumbbell, MoreVertical, GripVertical, Clock } from 'lucide-react';
import ExerciseAutocomplete from './ExerciseAutocomplete';
import SortableExerciseList from './SortableExerciseList';
import SortablePlansList from './SortablePlansList';
import type { WorkoutPlan, Exercise } from '../../types/workout';

interface ExerciseForm {
  name: string;
  sets: string;
  reps: string;
  weight: string;
}

interface Toast {
  type: 'success' | 'error';
  message: string;
}

interface Props {
  workoutPlans: WorkoutPlan[];
  showAddPlan: boolean;
  onSelectPlanForWorkout: (plan: WorkoutPlan) => void;
  onEditPlanName: (planId: string, name: string) => boolean;
  onDuplicatePlan: (plan: WorkoutPlan) => void;
  onDeletePlan: (planId: string) => void;
  onCreatePlan: (name: string) => boolean;
  onCancelAdd: () => void;
  onAddExercise: (planId: string, exercise: ExerciseForm) => boolean;
  onEditExercise: (planId: string, exercise: Exercise) => boolean;
  onDeleteExercise: (planId: string, exerciseId: string) => void;
  onDuplicateExercise: (planId: string, exercise: Exercise) => void;
  onMoveExercise: (planId: string, exerciseId: string, direction: string) => void;
  onMoveExerciseToPosition: (planId: string, exerciseId: string, toIndex: number) => void;
  onReorderPlans: (newOrder: WorkoutPlan[]) => void;
  onAddPlan: () => void;
}

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
  onMoveExerciseToPosition,
  onReorderPlans,
  onAddPlan,
}: Props) {
  const [newPlanName, setNewPlanName] = useState('');
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [showAddExerciseForm, setShowAddExerciseForm] = useState<string | null>(null);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editingPlanName, setEditingPlanName] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openExerciseMenu, setOpenExerciseMenu] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [newExercise, setNewExercise] = useState<ExerciseForm>({
    name: '',
    sets: '',
    reps: '',
    weight: ''
  });
  const previousPlansCount = useRef(workoutPlans.length);
  const menuRefs = useRef<Record<string, HTMLDivElement>>({});
  const exerciseMenuRefs = useRef<Record<string, HTMLDivElement>>({});
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // Nomes únicos de exercícios já usados pelo usuário
  const userExerciseNames = useMemo(() => {
    const names = new Set<string>();
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

  const togglePlan = (planId: string) => {
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

  const handleAddExercise = (planId: string) => {
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

  const handleSaveEdit = (planId: string) => {
    if (editingExercise && onEditExercise(planId, editingExercise as Exercise)) {
      setEditingExercise(null);
    }
  };

  const startEditingPlanName = (plan: WorkoutPlan) => {
    setEditingPlanId(plan.id);
    setEditingPlanName(plan.name);
  };

  const handleSavePlanName = () => {
    if (editingPlanId !== null && onEditPlanName(editingPlanId, editingPlanName)) {
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
    const handleClickOutside = (event: Event) => {
      if (openMenuId !== null) {
        const menuElement = menuRefs.current[openMenuId];
        if (menuElement && !menuElement.contains(event.target as Node)) {
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
    const handleClickOutside = (event: Event) => {
      if (openExerciseMenu !== null) {
        const menuElement = exerciseMenuRefs.current[openExerciseMenu];
        if (menuElement && !menuElement.contains(event.target as Node)) {
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

  const toggleMenu = (planId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === planId ? null : planId);
  };

  const toggleExerciseMenu = (menuKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenExerciseMenu(openExerciseMenu === menuKey ? null : menuKey);
  };

  const handleExerciseMenuAction = (planId: string, exercise: Exercise, action: string) => {
    setOpenExerciseMenu(null);
    if (action === 'edit') {
      setEditingExercise(exercise);
    } else if (action === 'duplicate') {
      onDuplicateExercise(planId, exercise);
    } else if (action === 'delete') {
      onDeleteExercise(planId, exercise.id);
    }
  };

  
  const handleMenuAction = (planId: string, action: string) => {
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
        <SortablePlansList
          workoutPlans={workoutPlans}
          expandedPlan={expandedPlan}
          editingPlanId={editingPlanId}
          editingPlanName={editingPlanName}
          openMenuId={openMenuId}
          onSelectPlanForWorkout={onSelectPlanForWorkout}
          onEditPlanName={(plan) => onEditPlanName(plan.id, plan.name)}
          onDuplicatePlan={onDuplicatePlan}
          onDeletePlan={onDeletePlan}
          onSavePlanName={handleSavePlanName}
          onCancelEditPlanName={cancelEditingPlanName}
          setEditingPlanName={setEditingPlanName}
          onTogglePlan={togglePlan}
          onToggleMenu={toggleMenu}
          menuRefs={menuRefs}
          onReorderPlans={onReorderPlans}
        />
      )}

      {/* FAB — Floating Action Button (Android style) */}
      <button
        onClick={onAddPlan}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full flex items-center justify-center
                   bg-purple-600 text-white shadow-lg shadow-purple-900/40
                   active:scale-95 transition-transform z-40"
        aria-label="Nova ficha"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>
    </div>
  );
}
