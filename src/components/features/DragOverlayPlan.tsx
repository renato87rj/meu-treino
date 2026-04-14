import React from 'react';
import { Dumbbell, Clock } from 'lucide-react';
import type { WorkoutPlan } from '../../types/workout';

interface Props {
  plan: WorkoutPlan | null;
  index: number;
}

export default function DragOverlayPlan({ plan, index }: Props) {
  if (!plan) return null;

  const createdAt = plan.createdAt ? new Date(plan.createdAt) : null;
  const diffDays = createdAt ? Math.floor((new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="card p-4 bg-white/[0.95] border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-500/40 rotate-2 scale-105 opacity-90 backdrop-blur-sm">
      {/* Cabeçalho do card */}
      <div className="flex items-center gap-3">
        {/* Ícone da ficha (agora é a área de drag) */}
        <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0 bg-purple-100 border border-purple-200 shadow-lg">
          <Dumbbell size={16} className="text-purple-600 animate-pulse" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold text-gray-800 tracking-tight truncate">
            {plan.name}
          </h3>
          <p className="text-[12px] text-gray-600 mt-0.5">
            {plan.exercises.length} exercício{plan.exercises.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Indicador visual de arrasto */}
        <div className="flex-shrink-0">
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-ping"></div>
        </div>
      </div>

      {/* Indicador de idade da ficha */}
      {createdAt && (
        <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-full bg-purple-50 border border-purple-200">
          <Clock size={12} className="text-purple-600" />
          <span className="text-[11px] flex-1 text-purple-700">
            usada há {diffDays} dias
          </span>
        </div>
      )}

      {/* Dots de progresso */}
      {plan.exercises.length > 0 && (
        <div className="flex gap-1.5 mt-2">
          {plan.exercises.map((ex) => (
            <div key={ex.id} className="w-2 h-2 rounded-full bg-purple-300" />
          ))}
        </div>
      )}
    </div>
  );
}
