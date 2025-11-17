import React, { useState, useEffect, useRef } from 'react';
import { ClipboardList, ChevronRight, Copy, Trash2, ChevronDown, ChevronUp, Edit2, Save, X, Plus, Dumbbell } from 'lucide-react';

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
  onMoveExercise
}) {
  const [newPlanName, setNewPlanName] = useState('');
  const [expandedPlan, setExpandedPlan] = useState(null);
  const [showAddExerciseForm, setShowAddExerciseForm] = useState(null);
  const [editingExercise, setEditingExercise] = useState(null);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [editingPlanName, setEditingPlanName] = useState('');
  const [newExercise, setNewExercise] = useState({
    name: '',
    sets: '',
    reps: '',
    weight: ''
  });
  const previousPlansCount = useRef(workoutPlans.length);

  // Detectar quando uma nova ficha é criada e expandir automaticamente se tiver 0 exercícios
  useEffect(() => {
    if (workoutPlans.length > previousPlansCount.current) {
      // Nova ficha foi adicionada
      const newestPlan = workoutPlans[workoutPlans.length - 1];
      if (newestPlan.exercises.length === 0) {
        // Expandir a ficha e mostrar o formulário
        setExpandedPlan(newestPlan.id);
        setShowAddExerciseForm(newestPlan.id);
      }
    }
    previousPlansCount.current = workoutPlans.length;
  }, [workoutPlans]);

  const handleCreate = () => {
    if (onCreatePlan(newPlanName)) {
      setNewPlanName('');
    }
  };

  const togglePlan = (planId) => {
    if (expandedPlan === planId) {
      // Está fechando a ficha
      setExpandedPlan(null);
      setShowAddExerciseForm(null);
    } else {
      // Está abrindo a ficha
      setExpandedPlan(planId);
      // Se a ficha não tem exercícios, mostrar o formulário automaticamente
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
    if (onAddExercise(planId, newExercise)) {
      setNewExercise({ name: '', sets: '', reps: '', weight: '' });
      setShowAddExerciseForm(null);
    }
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

  return (
    <div>
      {/* Formulário de Nova Ficha */}
      {showAddPlan && (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-purple-500/20 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-4">Nova Ficha de Treino</h2>
          <input
            type="text"
            value={newPlanName}
            onChange={(e) => setNewPlanName(e.target.value)}
            placeholder="Ex: Treino A - Peito e Tríceps"
            className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 mb-4"
          />
          <div className="flex gap-3">
            <button 
              onClick={handleCreate} 
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl"
            >
              Criar
            </button>
            <button 
              onClick={onCancelAdd} 
              className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de Fichas */}
      {workoutPlans.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList className="mx-auto text-purple-400/30 mb-4" size={64} />
          <p className="text-purple-300/70 text-lg">Nenhuma ficha criada</p>
          <p className="text-purple-400/50 text-sm mt-2">Clique no + para criar sua primeira ficha</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workoutPlans.map((plan) => {
            const isExpanded = expandedPlan === plan.id;
            
            return (
            <div
              key={plan.id}
                className="bg-white/10 backdrop-blur-md rounded-xl border border-purple-500/20 transition-all"
              >
                {/* Cabeçalho da Ficha */}
                <div className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <button 
                      onClick={() => togglePlan(plan.id)}
                      className="flex items-center gap-3 text-left"
                      disabled={editingPlanId === plan.id}
                    >
                      {isExpanded ? (
                        <ChevronDown className="text-purple-400 flex-shrink-0" size={20} />
                      ) : (
                        <ChevronRight className="text-purple-400 flex-shrink-0" size={20} />
                      )}
                    </button>
                    
                    {editingPlanId === plan.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editingPlanName}
                          onChange={(e) => setEditingPlanName(e.target.value)}
                          className="flex-1 px-3 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
                          autoFocus
                        />
                        <button
                          onClick={handleSavePlanName}
                          className="text-green-400 hover:bg-green-500/20 p-2 rounded-lg"
                          title="Salvar"
                        >
                          <Save size={18} />
                        </button>
                        <button
                          onClick={cancelEditingPlanName}
                          className="text-red-400 hover:bg-red-500/20 p-2 rounded-lg"
                          title="Cancelar"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg mb-1">{plan.name}</h3>
                  <p className="text-purple-300 text-sm">{plan.exercises.length} exercícios</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onSelectPlanForWorkout(plan)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                  >
                            Treinar
                          </button>
                          <button
                            onClick={() => startEditingPlanName(plan)}
                            className="text-purple-400 hover:bg-purple-500/20 p-2 rounded-lg"
                            title="Editar nome"
                          >
                            <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => onDuplicatePlan(plan)}
                    className="text-purple-400 hover:bg-purple-500/20 p-2 rounded-lg"
                    title="Duplicar ficha"
                  >
                    <Copy size={18} />
                  </button>
                  <button
                    onClick={() => onDeletePlan(plan.id)}
                    className="text-red-400 hover:bg-red-500/20 p-2 rounded-lg"
                            title="Deletar ficha"
                  >
                    <Trash2 size={18} />
                  </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Lista de Exercícios (Expansível) */}
                {isExpanded && (
                  <div className="border-t border-purple-500/20 p-4 bg-white/5">
                    {/* Botão Adicionar Exercício */}
                    {!showAddExerciseForm && (
                      <button
                        onClick={() => setShowAddExerciseForm(plan.id)}
                        className="w-full mb-4 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-200 px-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all"
                      >
                        <Plus size={20} />
                        Adicionar Exercício
                      </button>
                    )}

                    {/* Formulário de Novo Exercício */}
                    {showAddExerciseForm === plan.id && (
                      <div className="bg-white/10 rounded-xl p-4 mb-4 border border-purple-500/30">
                        <h4 className="text-white font-semibold mb-3">Novo Exercício</h4>
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={newExercise.name}
                            onChange={(e) => setNewExercise({...newExercise, name: e.target.value})}
                            placeholder="Nome do exercício"
                            className="w-full px-4 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400"
                          />
                          <div className="grid grid-cols-3 gap-3">
                            <input
                              type="number"
                              min="1"
                              value={newExercise.sets}
                              onChange={(e) => setNewExercise({...newExercise, sets: e.target.value})}
                              placeholder="Séries"
                              className="px-4 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400"
                            />
                            <input
                              type="text"
                              value={newExercise.reps}
                              onChange={(e) => setNewExercise({...newExercise, reps: e.target.value})}
                              placeholder="Reps (ex: 12 ou 8-12)"
                              className="px-4 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400"
                            />
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={newExercise.weight}
                              onChange={(e) => setNewExercise({...newExercise, weight: e.target.value})}
                              placeholder="Carga (opcional)"
                              className="px-4 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleAddExercise(plan.id)} 
                              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg"
                            >
                              Adicionar
                            </button>
                            <button 
                              onClick={() => {
                                setShowAddExerciseForm(null);
                                setNewExercise({ name: '', sets: '', reps: '', weight: '' });
                              }} 
                              className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-2 rounded-lg"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Lista de Exercícios */}
                    {plan.exercises.length === 0 ? (
                      <div className="text-center py-8">
                        <Dumbbell className="mx-auto text-purple-400/30 mb-2" size={48} />
                        <p className="text-purple-300/70">Nenhum exercício</p>
                        <p className="text-purple-400/50 text-sm mt-1">Adicione exercícios para começar</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {plan.exercises.map((exercise, index) => {
                          const isEditing = editingExercise?.id === exercise.id;
                          const isFirst = index === 0;
                          const isLast = index === plan.exercises.length - 1;

                          return (
                            <div
                              key={exercise.id}
                              className="bg-white/10 rounded-lg p-3 border border-purple-500/20"
                            >
                              {isEditing ? (
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={editingExercise.name}
                                    onChange={(e) => setEditingExercise({...editingExercise, name: e.target.value})}
                                    className="w-full px-3 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white"
                                  />
                                  <div className="grid grid-cols-3 gap-2">
                                    <input
                                      type="number"
                                      value={editingExercise.sets}
                                      onChange={(e) => setEditingExercise({...editingExercise, sets: e.target.value})}
                                      placeholder="Séries"
                                      className="px-3 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white"
                                    />
                                    <input
                                      type="text"
                                      value={editingExercise.reps}
                                      onChange={(e) => setEditingExercise({...editingExercise, reps: e.target.value})}
                                      placeholder="Reps (ex: 12 ou 8-12)"
                                      className="px-3 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white"
                                    />
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.5"
                                      value={editingExercise.weight || ''}
                                      onChange={(e) => setEditingExercise({...editingExercise, weight: e.target.value})}
                                      placeholder="Carga (opcional)"
                                      className="px-3 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => handleSaveEdit(plan.id)} 
                                      className="flex-1 bg-green-600 text-white py-2 rounded-lg flex items-center justify-center gap-1"
                                    >
                                      <Save size={14} /> Salvar
                                    </button>
                                    <button 
                                      onClick={() => setEditingExercise(null)} 
                                      className="flex-1 bg-white/10 text-white py-2 rounded-lg flex items-center justify-center gap-1"
                                    >
                                      <X size={14} /> Cancelar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  {/* Botões de reordenação */}
                                  <div className="flex flex-col gap-1">
                                    <button
                                      onClick={() => onMoveExercise(plan.id, exercise.id, 'up')}
                                      disabled={isFirst}
                                      className={`p-1 rounded ${isFirst ? 'text-purple-400/30 cursor-not-allowed' : 'text-purple-400 hover:bg-purple-500/20'}`}
                                    >
                                      <ChevronUp size={14} />
                                    </button>
                                    <button
                                      onClick={() => onMoveExercise(plan.id, exercise.id, 'down')}
                                      disabled={isLast}
                                      className={`p-1 rounded ${isLast ? 'text-purple-400/30 cursor-not-allowed' : 'text-purple-400 hover:bg-purple-500/20'}`}
                                    >
                                      <ChevronDown size={14} />
                                    </button>
                                  </div>

                                  <div className="flex-1">
                                    <h4 className="text-white font-medium">{exercise.name}</h4>
                                    <p className="text-purple-300 text-xs">
                                      {exercise.sets} x {exercise.reps}
                                      {exercise.weight && ` - ${exercise.weight}kg`}
                                    </p>
                                  </div>

                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => onDuplicateExercise(plan.id, exercise)}
                                      className="text-purple-400 hover:bg-purple-500/20 p-2 rounded-lg"
                                      title="Duplicar"
                                    >
                                      <Copy size={14} />
                                    </button>
                                    <button
                                      onClick={() => setEditingExercise(exercise)}
                                      className="text-purple-400 hover:bg-purple-500/20 p-2 rounded-lg"
                                      title="Editar"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                    <button
                                      onClick={() => onDeleteExercise(plan.id, exercise.id)}
                                      className="text-red-400 hover:bg-red-500/20 p-2 rounded-lg"
                                      title="Remover"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
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
        </div>
      )}
    </div>
  );
}

