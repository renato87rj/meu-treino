import React, { useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MoreVertical, Edit2, Copy, Trash2 } from 'lucide-react';
import type { Exercise } from '../../types/workout';

interface Props {
  exercise: Exercise;
  index: number;
  isEditing: boolean;
  editingExercise: Exercise | null;
  userExerciseNames: string[];
  onEditExercise: (exercise: Exercise) => void;
  onDeleteExercise: (exerciseId: string) => void;
  onDuplicateExercise: (exercise: Exercise) => void;
  onToggleExerciseMenu: (menuKey: string, e: React.MouseEvent) => void;
  openExerciseMenu: string | null;
  exerciseMenuRefs: React.MutableRefObject<Record<string, HTMLDivElement>>;
  planId: string;
  setEditingExercise: (exercise: Exercise | null) => void;
  onHandleSaveEdit: (planId: string) => void;
}

export default function SortableExercise({
  exercise,
  index,
  isEditing,
  editingExercise,
  userExerciseNames,
  onEditExercise,
  onDeleteExercise,
  onDuplicateExercise,
  onToggleExerciseMenu,
  openExerciseMenu,
  exerciseMenuRefs,
  planId,
  setEditingExercise,
  onHandleSaveEdit,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exercise.id });

  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (isEditing) {
    return (
      <div className="flex-1 space-y-2 py-1">
        {/* Formulário de edição - implementar conforme necessário */}
        <div className="bg-white/[0.05] border border-purple-500/25 rounded-[10px] p-3">
          <input
            type="text"
            value={editingExercise?.name || ''}
            onChange={(e) => setEditingExercise({...editingExercise!, name: e.target.value})}
            className="w-full bg-white/[0.05] border border-purple-500/25 rounded-[10px] px-3 py-2 text-[13px] text-white focus:outline-none focus:border-purple-400/50 mb-2"
            placeholder="Nome do exercício"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              value={editingExercise?.sets || ''}
              onChange={(e) => setEditingExercise({...editingExercise!, sets: parseInt(e.target.value) || 0})}
              placeholder="Séries"
              className="bg-white/[0.05] border border-purple-500/25 rounded-[10px] px-3 py-2 text-[13px] text-white text-center focus:outline-none focus:border-purple-400/50"
            />
            <input
              type="text"
              value={editingExercise?.reps || ''}
              onChange={(e) => setEditingExercise({...editingExercise!, reps: e.target.value})}
              placeholder="Reps"
              className="bg-white/[0.05] border border-purple-500/25 rounded-[10px] px-3 py-2 text-[13px] text-white text-center focus:outline-none focus:border-purple-400/50"
            />
            <input
              type="number" min="0" step="0.5"
              value={editingExercise?.weight || ''}
              onChange={(e) => setEditingExercise({...editingExercise!, weight: e.target.value ? parseFloat(e.target.value) : null})}
              placeholder="Carga"
              className="bg-white/[0.05] border border-purple-500/25 rounded-[10px] px-3 py-2 text-[13px] text-white text-center placeholder:text-[#4a4568] focus:outline-none focus:border-purple-400/50"
            />
          </div>
          <div className="flex gap-2 mt-2">
            <button 
              onClick={() => onHandleSaveEdit(planId)} 
              className="flex-1 bg-purple-600 text-white text-[12px] font-semibold py-2 rounded-[10px] active:scale-[0.98] transition-transform flex items-center justify-center gap-1">
              Salvar
            </button>
            <button 
              onClick={() => setEditingExercise(null)} 
              className="flex-1 bg-white/[0.05] border border-purple-500/15 text-[#7c6f9e] text-[12px] font-semibold py-2 rounded-[10px] active:scale-[0.98] transition-transform flex items-center justify-center gap-1">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 py-3 border-b border-purple-500/[0.07] last:border-0 transition-all duration-200 ease-out ${
        isDragging ? 'opacity-50 scale-95 shadow-lg shadow-purple-500/20 rotate-1' : 'opacity-100 scale-100'
      }`}
    >
      {/* Botão de drag */}
      <button
        {...attributes}
        {...listeners}
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border transition-all duration-200 ease-out ${
          isDragging
            ? 'text-purple-200 border-purple-400/60 bg-purple-500/25 scale-110 shadow-lg shadow-purple-500/30 cursor-grabbing'
            : 'text-[#7c6f9e] border-purple-500/[0.12] bg-white/[0.04] hover:border-purple-500/25 hover:bg-purple-500/10 cursor-grab active:scale-95'
        }`}
        aria-label="Arraste para reordenar"
      >
        <GripVertical 
          size={14} 
          className={`transition-transform duration-200 ${
            isDragging ? 'animate-pulse' : ''
          }`}
        />
      </button>

      {/* Conteúdo do exercício */}
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

      {/* Menu de ações */}
      <div 
        className="relative flex-shrink-0" 
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={(e) => onToggleExerciseMenu(`${planId}:${exercise.id}`, e)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#7c6f9e] bg-white/[0.04] border border-purple-500/[0.12] active:scale-95 transition-transform"
          aria-label="Abrir menu do exercício"
        >
          <MoreVertical size={14} />
        </button>
        {openExerciseMenu === `${planId}:${exercise.id}` && (
          <div className="absolute right-0 top-full mt-1 rounded-[14px] z-[60] min-w-[190px] overflow-hidden"
            style={{ background: 'rgba(15, 10, 30, 0.98)', border: '0.5px solid rgba(139, 92, 246, 0.25)', backdropFilter: 'blur(20px)' }}>
            <button onClick={() => onEditExercise(exercise)}
              className="w-full px-4 py-3 text-left text-white active:bg-purple-600/20 flex items-center gap-3 transition-colors">
              <Edit2 size={14} className="text-purple-400 flex-shrink-0" />
              <span className="text-[13px]">Editar</span>
            </button>
            <button onClick={() => onDuplicateExercise(exercise)}
              className="w-full px-4 py-3 text-left text-white active:bg-purple-600/20 flex items-center gap-3 transition-colors">
              <Copy size={14} className="text-purple-400 flex-shrink-0" />
              <span className="text-[13px]">Duplicar</span>
            </button>
            <div className="border-t border-purple-500/10 mx-2"></div>
            <button onClick={() => onDeleteExercise(exercise.id)}
              className="w-full px-4 py-3 text-left text-red-400 active:bg-red-500/20 flex items-center gap-3 transition-colors">
              <Trash2 size={14} className="flex-shrink-0" />
              <span className="text-[13px]">Excluir</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
