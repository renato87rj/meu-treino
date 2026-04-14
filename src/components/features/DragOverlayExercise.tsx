import React from 'react';
import { GripVertical } from 'lucide-react';
import type { Exercise } from '../../types/workout';

interface Props {
  exercise: Exercise | null;
  index: number;
}

export default function DragOverlayExercise({ exercise, index }: Props) {
  if (!exercise) return null;

  return (
    <div className="flex items-center gap-3 py-3 px-4 bg-white/[0.95] border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-500/40 rotate-2 scale-105 opacity-90 backdrop-blur-sm">
      {/* Botão de drag */}
      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border border-purple-400/60 bg-purple-500/25 shadow-lg">
        <GripVertical 
          size={14} 
          className="text-purple-600 animate-pulse"
        />
      </div>

      {/* Conteúdo do exercício */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-semibold text-purple-600 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-full flex-shrink-0">
            {index + 1}
          </span>
          <span className="text-[13px] text-gray-800 font-medium flex-1 truncate">{exercise.name}</span>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[12px] font-semibold text-purple-600 bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-full">
            {exercise.sets} séries · {exercise.reps} reps
          </span>
          {exercise.weight ? (
            <span className="text-[10px] font-semibold text-purple-500 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
              {exercise.weight}kg
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
              sem carga
            </span>
          )}
        </div>
      </div>

      {/* Indicador visual de arrasto */}
      <div className="flex-shrink-0">
        <div className="w-2 h-2 bg-purple-400 rounded-full animate-ping"></div>
      </div>
    </div>
  );
}
