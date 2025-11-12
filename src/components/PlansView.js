import React, { useState } from 'react';
import { ClipboardList, ChevronRight, Copy, Trash2 } from 'lucide-react';

export default function PlansView({ 
  workoutPlans, 
  showAddPlan,
  onSelectPlanForWorkout,
  onDuplicatePlan,
  onDeletePlan,
  onCreatePlan,
  onCancelAdd
}) {
  const [newPlanName, setNewPlanName] = useState('');

  const handleCreate = () => {
    if (onCreatePlan(newPlanName)) {
      setNewPlanName('');
    }
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
          {workoutPlans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-purple-500/20 hover:bg-white/15 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg mb-1">{plan.name}</h3>
                  <p className="text-purple-300 text-sm">{plan.exercises.length} exercícios</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onSelectPlanForWorkout(plan)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                  >
                    Treinar <ChevronRight size={16} />
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
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

