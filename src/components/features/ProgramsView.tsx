'use client';
import React, { useState } from 'react';
import {
  Dumbbell, Plus, Edit2, Trash2, ChevronDown, ChevronRight,
  MoreVertical, Play, CheckCircle2, X, Zap, Archive, ArchiveRestore,
} from 'lucide-react';
import type { WorkoutProgram, WorkoutPlan, Exercise } from '../../types/workout';
import ExerciseAutocomplete from './ExerciseAutocomplete';

interface ExerciseForm {
  name: string;
  sets: string;
  reps: string;
  weight: string;
}

interface Props {
  workoutPrograms: WorkoutProgram[];
  workoutPlans: WorkoutPlan[];
  draft: import('../../types/workout').WorkoutDraft | null;
  onCreateProgram: (name: string) => boolean;
  onEditProgramName: (programId: string, name: string) => boolean;
  onArchiveProgram: (programId: string) => void;
  onUnarchiveProgram: (programId: string) => void;
  onDeleteProgram: (programId: string) => void;
  onSetActiveProgram: (programId: string) => void;
  onCreatePlan: (name: string, programId: string) => boolean;
  onEditPlanName: (planId: string, name: string) => boolean;
  onDeletePlan: (planId: string) => void;
  onAddExercise: (planId: string, exercise: ExerciseForm) => boolean;
  onEditExercise: (planId: string, exercise: Exercise) => boolean;
  onDeleteExercise: (planId: string, exerciseId: string) => void;
  onSelectPlanForWorkout: (plan: WorkoutPlan) => void;
}

export default function ProgramsView({
  workoutPrograms,
  workoutPlans,
  draft,
  onCreateProgram,
  onEditProgramName,
  onArchiveProgram,
  onUnarchiveProgram,
  onDeleteProgram,
  onSetActiveProgram,
  onCreatePlan,
  onEditPlanName,
  onDeletePlan,
  onAddExercise,
  onEditExercise,
  onDeleteExercise,
  onSelectPlanForWorkout,
}: Props) {
  const [expandedPrograms, setExpandedPrograms] = useState<Record<string, boolean>>({});
  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({});

  // Modais
  const [showNewProgram, setShowNewProgram] = useState(false);
  const [newProgramName, setNewProgramName] = useState('');
  const [editingProgram, setEditingProgram] = useState<{ id: string; name: string } | null>(null);

  const [showNewPlan, setShowNewPlan] = useState<string | null>(null); // programId
  const [newPlanName, setNewPlanName] = useState('');
  const [editingPlan, setEditingPlan] = useState<{ id: string; name: string } | null>(null);

  const [showAddExercise, setShowAddExercise] = useState<string | null>(null); // planId
  const [newExercise, setNewExercise] = useState<ExerciseForm>({ name: '', sets: '', reps: '', weight: '' });
  const [editingExercise, setEditingExercise] = useState<{ planId: string; exercise: Exercise } | null>(null);

  const [openProgramMenu, setOpenProgramMenu] = useState<string | null>(null);
  const [openPlanMenu, setOpenPlanMenu] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  function timeAgo(isoDate: string): string {
    const diff = Date.now() - new Date(isoDate).getTime();
    const days = Math.floor(diff / 86400000);
    if (days < 1) return 'hoje';
    if (days === 1) return 'ontem';
    if (days < 7) return `${days} dias`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks} sem`;
    const months = Math.floor(days / 30);
    if (months < 13) return `${months} ${months === 1 ? 'mês' : 'meses'}`;
    const years = Math.floor(days / 365);
    return `${years} ${years === 1 ? 'ano' : 'anos'}`;
  }

  const userExerciseNames = React.useMemo(() => {
    const names = new Set<string>();
    workoutPlans.forEach(p => p.exercises.forEach(ex => names.add(ex.name)));
    return [...names];
  }, [workoutPlans]);

  const toggleProgram = (id: string) =>
    setExpandedPrograms(prev => ({ ...prev, [id]: !prev[id] }));

  const togglePlan = (id: string) =>
    setExpandedPlans(prev => ({ ...prev, [id]: !prev[id] }));

  const plansOf = (programId: string) =>
    workoutPlans.filter(p => p.programId === programId);

  const handleCreateProgram = () => {
    if (onCreateProgram(newProgramName)) {
      setNewProgramName('');
      setShowNewProgram(false);
    }
  };

  const handleSaveEditProgram = () => {
    if (!editingProgram) return;
    if (onEditProgramName(editingProgram.id, editingProgram.name)) {
      setEditingProgram(null);
    }
  };

  const handleCreatePlan = () => {
    if (!showNewPlan) return;
    if (onCreatePlan(newPlanName, showNewPlan)) {
      setNewPlanName('');
      setShowNewPlan(null);
    }
  };

  const handleSaveEditPlan = () => {
    if (!editingPlan) return;
    if (onEditPlanName(editingPlan.id, editingPlan.name)) {
      setEditingPlan(null);
    }
  };

  const handleAddExercise = (planId: string) => {
    if (onAddExercise(planId, newExercise)) {
      setNewExercise({ name: '', sets: '', reps: '', weight: '' });
      setShowAddExercise(null);
    }
  };

  const handleSaveEditExercise = () => {
    if (!editingExercise) return;
    if (onEditExercise(editingExercise.planId, editingExercise.exercise)) {
      setEditingExercise(null);
    }
  };

  return (
    <div className="pt-4 pb-4">

      {/* Header */}
      <div className="mb-5 px-1">
        <h1 className="text-[18px] font-bold text-white">Meus Treinos</h1>
        <p className="text-[12px] text-[#7c6f9e] mt-0.5">Programas e fichas de treino</p>
      </div>

      {/* FAB: Novo programa */}
      <button
        onClick={() => setShowNewProgram(true)}
        className="fixed bottom-24 right-5 z-40 flex items-center gap-2 bg-purple-600 text-white text-[13px] font-bold pl-4 pr-5 h-12 rounded-full shadow-lg shadow-purple-900/50 active:scale-95 transition-transform">
        <Plus size={16} />
        Novo programa
      </button>

      {/* Estado vazio */}
      {workoutPrograms.length === 0 && (
        <div className="text-center py-16">
          <Dumbbell className="mx-auto text-[#3a3060] mb-4" size={48} />
          <p className="text-[#7c6f9e] text-[15px]">Nenhum programa criado</p>
          <p className="text-[#4a4568] text-[12px] mt-2 mb-6">Crie seu programa de treino (ex: Upper/Lower, PPL)</p>
          <button
            onClick={() => setShowNewProgram(true)}
            className="mx-auto flex items-center justify-center gap-2 px-8 py-4 rounded-[16px] text-[14px] font-semibold text-white bg-purple-600 active:scale-[0.98] transition-transform">
            <Plus size={16} />
            Criar programa
          </button>
        </div>
      )}

      {/* Lista de programas */}
      <div className="space-y-3">
        {workoutPrograms.filter(p => !p.archived).map(program => {
          const plans = plansOf(program.id);
          const isExpanded = expandedPrograms[program.id] ?? true;
          const isActive = program.active;
          const isDraftProgram = draft?.programId === program.id;

          return (
            <div
              key={program.id}
              className={`rounded-[20px] border ${
                isActive
                  ? 'border-purple-500/40 bg-purple-500/[0.04]'
                  : 'border-white/[0.06] bg-white/[0.02]'
              }`}
            >
              {/* Cabeçalho do programa */}
              <div className="flex items-center gap-3 p-4">
                <button
                  onClick={() => toggleProgram(program.id)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left">
                  <div className={`w-9 h-9 rounded-[12px] flex items-center justify-center flex-shrink-0 ${
                    isActive ? 'bg-purple-500/20 border border-purple-500/35' : 'bg-white/[0.06] border border-white/[0.08]'
                  }`}>
                    {isActive
                      ? <Zap size={15} className="text-purple-400" />
                      : <Dumbbell size={15} className="text-[#7c6f9e]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-semibold text-white truncate">{program.name}</span>
                      {isActive && (
                        <span className="text-[9px] font-bold text-purple-400 bg-purple-500/15 border border-purple-500/25 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          ativo
                        </span>
                      )}
                      {isDraftProgram && (
                        <span className="text-[9px] font-bold text-green-400 bg-green-500/15 border border-green-500/25 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          em treino
                        </span>
                      )}
                    </div>
                    <span className="text-[12px] text-[#7c6f9e]">
                      {plans.length} ficha{plans.length !== 1 ? 's' : ''}
                      {program.createdAt && (
                        <span className="ml-2 text-[#4a4568]">· há {timeAgo(program.createdAt)}</span>
                      )}
                    </span>
                  </div>
                  {isExpanded
                    ? <ChevronDown size={16} className="text-[#7c6f9e] flex-shrink-0" />
                    : <ChevronRight size={16} className="text-[#7c6f9e] flex-shrink-0" />}
                </button>

                {/* Menu do programa */}
                <div className="relative flex-shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); setOpenProgramMenu(openProgramMenu === program.id ? null : program.id); }}
                    className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 border border-purple-500/15">
                    <MoreVertical size={13} className="text-[#7c6f9e]" />
                  </button>
                  {openProgramMenu === program.id && (
                    <div className="absolute right-0 top-full mt-1 rounded-[14px] z-50 min-w-[170px] overflow-hidden"
                         style={{ background: 'rgba(15, 10, 30, 0.98)', border: '0.5px solid rgba(139,92,246,0.25)', backdropFilter: 'blur(20px)' }}>
                      {!isActive && (
                        <button onClick={() => { onSetActiveProgram(program.id); setOpenProgramMenu(null); }}
                          className="w-full px-4 py-3 text-left text-white active:bg-purple-600/20 flex items-center gap-3">
                          <CheckCircle2 size={14} className="text-purple-400" />
                          <span className="text-[13px]">Definir como ativo</span>
                        </button>
                      )}
                      <button onClick={() => { setEditingProgram({ id: program.id, name: program.name }); setOpenProgramMenu(null); }}
                        className="w-full px-4 py-3 text-left text-white active:bg-purple-600/20 flex items-center gap-3">
                        <Edit2 size={14} className="text-purple-400" />
                        <span className="text-[13px]">Renomear</span>
                      </button>
                      <div className="border-t border-purple-500/10 mx-2" />
                      <button onClick={() => { onArchiveProgram(program.id); setOpenProgramMenu(null); }}
                        className="w-full px-4 py-3 text-left text-[#7c6f9e] active:bg-purple-600/10 flex items-center gap-3">
                        <Archive size={14} className="text-[#7c6f9e]" />
                        <span className="text-[13px]">Arquivar</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Fichas do programa */}
              {isExpanded && (
                <div className="px-3 pb-3 space-y-2">
                  {plans.map(plan => {
                    const isPlanExpanded = expandedPlans[plan.id] ?? false;
                    const isDraftPlan = draft?.planId === plan.id;

                    return (
                      <div key={plan.id}
                        className={`rounded-[14px] border ${
                          isDraftPlan
                            ? 'border-green-500/30 bg-green-500/[0.04]'
                            : 'border-purple-500/15 bg-white/[0.03]'
                        }`}>
                        {/* Cabeçalho da ficha */}
                        <div className="flex items-center gap-2 p-3">
                          <button
                            onClick={() => togglePlan(plan.id)}
                            className="flex items-center gap-2 flex-1 min-w-0 text-left">
                            <div className="w-7 h-7 rounded-[8px] flex items-center justify-center bg-purple-500/10 border border-purple-500/20 flex-shrink-0">
                              <Dumbbell size={11} className="text-purple-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[13px] font-semibold text-white truncate block">{plan.name}</span>
                              <span className="text-[11px] text-[#7c6f9e]">
                                {plan.exercises.length} exercício{plan.exercises.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            {isPlanExpanded
                              ? <ChevronDown size={13} className="text-[#7c6f9e] flex-shrink-0" />
                              : <ChevronRight size={13} className="text-[#7c6f9e] flex-shrink-0" />}
                          </button>

                          {/* Botão Treinar */}
                          <button
                            onClick={() => onSelectPlanForWorkout(plan)}
                            className={`flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-full active:scale-95 transition-transform flex-shrink-0 ${
                              isDraftPlan
                                ? 'bg-green-600 text-white'
                                : 'bg-purple-600 text-white'
                            }`}>
                            <Play size={10} />
                            {isDraftPlan ? 'Em treino' : 'Treinar'}
                          </button>

                          {/* Menu da ficha */}
                          <div className="relative flex-shrink-0">
                            <button
                              onClick={e => { e.stopPropagation(); setOpenPlanMenu(openPlanMenu === plan.id ? null : plan.id); }}
                              className="w-6 h-6 rounded-full flex items-center justify-center bg-white/5 border border-purple-500/10">
                              <MoreVertical size={11} className="text-[#7c6f9e]" />
                            </button>
                            {openPlanMenu === plan.id && (
                              <div className="absolute right-0 top-full mt-1 rounded-[14px] z-[100] min-w-[160px] overflow-hidden"
                                   style={{ background: 'rgba(15,10,30,0.98)', border: '0.5px solid rgba(139,92,246,0.25)', backdropFilter: 'blur(20px)' }}>
                                <button onClick={() => { setEditingPlan({ id: plan.id, name: plan.name }); setOpenPlanMenu(null); }}
                                  className="w-full px-4 py-3 text-left text-white active:bg-purple-600/20 flex items-center gap-3">
                                  <Edit2 size={13} className="text-purple-400" />
                                  <span className="text-[13px]">Renomear</span>
                                </button>
                                <button onClick={() => { setShowAddExercise(plan.id); setOpenPlanMenu(null); }}
                                  className="w-full px-4 py-3 text-left text-white active:bg-purple-600/20 flex items-center gap-3">
                                  <Plus size={13} className="text-purple-400" />
                                  <span className="text-[13px]">Add exercício</span>
                                </button>
                                <div className="border-t border-purple-500/10 mx-2" />
                                <button onClick={() => { onDeletePlan(plan.id); setOpenPlanMenu(null); }}
                                  className="w-full px-4 py-3 text-left text-red-400 active:bg-red-500/20 flex items-center gap-3">
                                  <Trash2 size={13} />
                                  <span className="text-[13px]">Excluir ficha</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Exercícios da ficha */}
                        {isPlanExpanded && (
                          <div className="px-3 pb-3 space-y-1.5">
                            {plan.exercises.length === 0 && (
                              <p className="text-[11px] text-[#4a4568] text-center py-2">Nenhum exercício. Adicione pelo menu ⋮</p>
                            )}
                            {plan.exercises.map(ex => (
                              <div key={ex.id}
                                className="flex items-center gap-2 rounded-[10px] px-3 py-2 bg-white/[0.03] border border-purple-500/10">
                                <div className="flex-1 min-w-0">
                                  <span className="text-[12px] font-medium text-[#d4b8ff] block truncate">{ex.name}</span>
                                  <span className="text-[10px] text-[#7c6f9e]">
                                    {ex.sets}×{ex.reps}{ex.weight ? ` · ${ex.weight}kg` : ''}
                                  </span>
                                </div>
                                <div className="flex gap-1.5 flex-shrink-0">
                                  <button
                                    onClick={() => setEditingExercise({ planId: plan.id, exercise: { ...ex } })}
                                    className="w-6 h-6 rounded-full flex items-center justify-center bg-purple-500/10 border border-purple-500/15">
                                    <Edit2 size={10} className="text-purple-400" />
                                  </button>
                                  <button
                                    onClick={() => onDeleteExercise(plan.id, ex.id)}
                                    className="w-6 h-6 rounded-full flex items-center justify-center bg-red-500/10 border border-red-500/15">
                                    <Trash2 size={10} className="text-red-400" />
                                  </button>
                                </div>
                              </div>
                            ))}
                            <button
                              onClick={() => setShowAddExercise(plan.id)}
                              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-[10px] border border-dashed border-purple-500/20 text-[11px] text-[#7c6f9e] active:bg-purple-500/5 transition-colors mt-1">
                              <Plus size={11} />
                              Adicionar exercício
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Botão nova ficha */}
                  <button
                    onClick={() => { setShowNewPlan(program.id); setNewPlanName(''); }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[14px] border border-dashed border-purple-500/20 text-[12px] text-[#7c6f9e] active:bg-purple-500/5 transition-colors">
                    <Plus size={13} />
                    Nova ficha
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Programas arquivados */}
      {workoutPrograms.some(p => p.archived) && (
        <div className="mt-4">
          <button
            onClick={() => setShowArchived(v => !v)}
            className="flex items-center gap-2 text-[12px] text-[#4a4568] mb-2 active:text-[#7c6f9e] transition-colors">
            <Archive size={12} />
            Arquivados ({workoutPrograms.filter(p => p.archived).length})
            {showArchived ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
          {showArchived && (
            <div className="space-y-2">
              {workoutPrograms.filter(p => p.archived).map(program => (
                <div key={program.id} className="rounded-[16px] border border-white/[0.04] bg-white/[0.015] px-4 py-3 flex items-center gap-3">
                  <Archive size={14} className="text-[#4a4568] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-medium text-[#7c6f9e] truncate block">{program.name}</span>
                    <span className="text-[11px] text-[#4a4568]">{plansOf(program.id).length} fichas · arquivado há {timeAgo(program.updatedAt)}</span>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => onUnarchiveProgram(program.id)}
                      className="flex items-center gap-1 text-[11px] text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1.5 rounded-full active:scale-95 transition-transform">
                      <ArchiveRestore size={11} />
                      Restaurar
                    </button>
                    <button
                      onClick={() => onDeleteProgram(program.id)}
                      className="w-7 h-7 rounded-full flex items-center justify-center bg-red-500/10 border border-red-500/15">
                      <Trash2 size={11} className="text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ Modal: Novo programa ═══ */}
      {showNewProgram && (
        <BottomModal title="Novo Programa de Treino" onClose={() => setShowNewProgram(false)}>
          <input
            type="text"
            value={newProgramName}
            onChange={e => setNewProgramName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateProgram()}
            placeholder="Ex: Upper/Lower, PPL, Fullbody"
            autoFocus
            className="w-full bg-white/[0.05] border border-purple-500/25 rounded-[12px] px-4 py-3 text-[14px] text-white placeholder:text-[#4a4568] focus:outline-none focus:border-purple-400/50 transition-colors mb-4"
          />
          <ModalActions onConfirm={handleCreateProgram} onCancel={() => setShowNewProgram(false)} confirmLabel="Criar" />
        </BottomModal>
      )}

      {/* ═══ Modal: Editar programa ═══ */}
      {editingProgram && (
        <BottomModal title="Renomear Programa" onClose={() => setEditingProgram(null)}>
          <input
            type="text"
            value={editingProgram.name}
            onChange={e => setEditingProgram({ ...editingProgram, name: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && handleSaveEditProgram()}
            autoFocus
            className="w-full bg-white/[0.05] border border-purple-500/25 rounded-[12px] px-4 py-3 text-[14px] text-white placeholder:text-[#4a4568] focus:outline-none focus:border-purple-400/50 transition-colors mb-4"
          />
          <ModalActions onConfirm={handleSaveEditProgram} onCancel={() => setEditingProgram(null)} confirmLabel="Salvar" />
        </BottomModal>
      )}

      {/* ═══ Modal: Nova ficha ═══ */}
      {showNewPlan && (
        <BottomModal title="Nova Ficha" onClose={() => setShowNewPlan(null)}>
          <input
            type="text"
            value={newPlanName}
            onChange={e => setNewPlanName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreatePlan()}
            placeholder="Ex: Upper A, Lower B, Peito/Tríceps"
            autoFocus
            className="w-full bg-white/[0.05] border border-purple-500/25 rounded-[12px] px-4 py-3 text-[14px] text-white placeholder:text-[#4a4568] focus:outline-none focus:border-purple-400/50 transition-colors mb-4"
          />
          <ModalActions onConfirm={handleCreatePlan} onCancel={() => setShowNewPlan(null)} confirmLabel="Criar" />
        </BottomModal>
      )}

      {/* ═══ Modal: Editar ficha ═══ */}
      {editingPlan && (
        <BottomModal title="Renomear Ficha" onClose={() => setEditingPlan(null)}>
          <input
            type="text"
            value={editingPlan.name}
            onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && handleSaveEditPlan()}
            autoFocus
            className="w-full bg-white/[0.05] border border-purple-500/25 rounded-[12px] px-4 py-3 text-[14px] text-white placeholder:text-[#4a4568] focus:outline-none focus:border-purple-400/50 transition-colors mb-4"
          />
          <ModalActions onConfirm={handleSaveEditPlan} onCancel={() => setEditingPlan(null)} confirmLabel="Salvar" />
        </BottomModal>
      )}

      {/* ═══ Modal: Add exercício ═══ */}
      {showAddExercise && (
        <BottomModal title="Novo Exercício" onClose={() => { setShowAddExercise(null); setNewExercise({ name: '', sets: '', reps: '', weight: '' }); }}>
          <div className="space-y-2.5 mb-4">
            <ExerciseAutocomplete
              value={newExercise.name}
              onChange={name => setNewExercise(prev => ({ ...prev, name }))}
              placeholder="Nome do exercício"
              userExercises={userExerciseNames}
              className="w-full bg-white/[0.05] border border-purple-500/25 rounded-[12px] px-4 py-3 text-[14px] text-white placeholder:text-[#4a4568] focus:outline-none focus:border-purple-400/50 transition-colors"
            />
            <div className="grid grid-cols-3 gap-2">
              {(['sets', 'reps', 'weight'] as const).map((field, i) => (
                <input
                  key={field}
                  type={field === 'reps' ? 'text' : 'number'}
                  min={field === 'weight' ? '0' : '1'}
                  step={field === 'weight' ? '0.5' : '1'}
                  value={newExercise[field]}
                  onChange={e => setNewExercise(prev => ({ ...prev, [field]: e.target.value }))}
                  placeholder={['Séries', 'Reps', 'Carga'][i]}
                  className="bg-white/[0.05] border border-purple-500/25 rounded-[12px] px-3 py-3 text-[14px] text-white text-center placeholder:text-[#4a4568] focus:outline-none focus:border-purple-400/50 transition-colors"
                />
              ))}
            </div>
          </div>
          <ModalActions
            onConfirm={() => handleAddExercise(showAddExercise)}
            onCancel={() => { setShowAddExercise(null); setNewExercise({ name: '', sets: '', reps: '', weight: '' }); }}
            confirmLabel="Adicionar"
          />
        </BottomModal>
      )}

      {/* ═══ Modal: Editar exercício ═══ */}
      {editingExercise && (
        <BottomModal title="Editar Exercício" onClose={() => setEditingExercise(null)}>
          <div className="space-y-2.5 mb-4">
            <ExerciseAutocomplete
              value={editingExercise.exercise.name}
              onChange={name => setEditingExercise(prev => prev ? { ...prev, exercise: { ...prev.exercise, name } } : null)}
              placeholder="Nome do exercício"
              userExercises={userExerciseNames}
              className="w-full bg-white/[0.05] border border-purple-500/25 rounded-[12px] px-4 py-3 text-[14px] text-white placeholder:text-[#4a4568] focus:outline-none focus:border-purple-400/50 transition-colors"
            />
            <div className="grid grid-cols-3 gap-2">
              <input type="number" min="1"
                value={editingExercise.exercise.sets}
                onChange={e => setEditingExercise(prev => prev ? { ...prev, exercise: { ...prev.exercise, sets: parseInt(e.target.value) || 1 } } : null)}
                placeholder="Séries"
                className="bg-white/[0.05] border border-purple-500/25 rounded-[12px] px-3 py-3 text-[14px] text-white text-center placeholder:text-[#4a4568] focus:outline-none focus:border-purple-400/50 transition-colors" />
              <input type="text"
                value={editingExercise.exercise.reps}
                onChange={e => setEditingExercise(prev => prev ? { ...prev, exercise: { ...prev.exercise, reps: e.target.value } } : null)}
                placeholder="Reps"
                className="bg-white/[0.05] border border-purple-500/25 rounded-[12px] px-3 py-3 text-[14px] text-white text-center placeholder:text-[#4a4568] focus:outline-none focus:border-purple-400/50 transition-colors" />
              <input type="number" min="0" step="0.5"
                value={editingExercise.exercise.weight ?? ''}
                onChange={e => setEditingExercise(prev => prev ? { ...prev, exercise: { ...prev.exercise, weight: e.target.value ? parseFloat(e.target.value) : null } } : null)}
                placeholder="Carga"
                className="bg-white/[0.05] border border-purple-500/25 rounded-[12px] px-3 py-3 text-[14px] text-white text-center placeholder:text-[#4a4568] focus:outline-none focus:border-purple-400/50 transition-colors" />
            </div>
          </div>
          <ModalActions onConfirm={handleSaveEditExercise} onCancel={() => setEditingExercise(null)} confirmLabel="Salvar" />
        </BottomModal>
      )}
    </div>
  );
}

function BottomModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4"
         style={{ background: 'rgba(8,6,15,0.75)', backdropFilter: 'blur(6px)' }}
         onClick={onClose}>
      <div
        className="w-full sm:max-w-md rounded-t-[28px] sm:rounded-[24px] p-6 animate-slide-up"
        style={{ background: 'rgba(15,10,30,0.98)', border: '0.5px solid rgba(139,92,246,0.25)', backdropFilter: 'blur(20px)' }}
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-purple-500/30 mx-auto mb-5" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-bold text-white">{title}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 border border-purple-500/15">
            <X size={13} className="text-[#7c6f9e]" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ onConfirm, onCancel, confirmLabel }: { onConfirm: () => void; onCancel: () => void; confirmLabel: string }) {
  return (
    <div className="flex gap-3">
      <button onClick={onConfirm}
        className="flex-1 bg-purple-600 text-white font-semibold text-[14px] py-3.5 rounded-[14px] active:scale-[0.98] transition-transform">
        {confirmLabel}
      </button>
      <button onClick={onCancel}
        className="flex-1 bg-white/[0.05] border border-purple-500/15 text-[#7c6f9e] font-semibold text-[14px] py-3.5 rounded-[14px] active:scale-[0.98] transition-transform">
        Cancelar
      </button>
    </div>
  );
}
