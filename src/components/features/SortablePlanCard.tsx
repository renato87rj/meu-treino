import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Dumbbell, Clock, Edit2, Copy, Trash2, MoreVertical } from 'lucide-react';
import type { WorkoutPlan } from '../../types/workout';

interface Props {
  plan: WorkoutPlan;
  index: number;
  isExpanded: boolean;
  editingPlanId: string | null;
  editingPlanName: string;
  openMenuId: string | null;
  onSelectPlanForWorkout: (plan: WorkoutPlan) => void;
  onEditPlanName: (plan: WorkoutPlan) => void;
  onDuplicatePlan: (plan: WorkoutPlan) => void;
  onDeletePlan: (planId: string) => void;
  onSavePlanName: () => void;
  onCancelEditPlanName: () => void;
  setEditingPlanName: (name: string) => void;
  onTogglePlan: (planId: string) => void;
  onToggleMenu: (planId: string, e: React.MouseEvent) => void;
  menuRefs: React.MutableRefObject<Record<string, HTMLDivElement>>;
}

export default function SortablePlanCard({
  plan,
  index,
  isExpanded,
  editingPlanId,
  editingPlanName,
  openMenuId,
  onSelectPlanForWorkout,
  onEditPlanName,
  onDuplicatePlan,
  onDeletePlan,
  onSavePlanName,
  onCancelEditPlanName,
  setEditingPlanName,
  onTogglePlan,
  onToggleMenu,
  menuRefs,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: plan.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isEditingThisPlan = editingPlanId === plan.id;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        ...(isExpanded ? { borderColor: 'rgba(139, 92, 246, 0.4)' } : {})
      }}
      className={`card relative isolate p-4 mb-3 transition-all overflow-visible ${
        openMenuId === plan.id ? 'z-50' : ''
      } ${isExpanded ? 'border-purple-500/40' : ''} ${
        isDragging ? 'opacity-50 scale-95 shadow-lg shadow-purple-500/20 rotate-1' : 'opacity-100 scale-100'
      }`}
      {...attributes}
      {...listeners}
    >
      {/* Cabeçalho do card */}
      <div className="flex items-center gap-3" onClick={(e) => {
        e.stopPropagation();
        onTogglePlan(plan.id);
      }}>
        {/* Ícone da ficha (agora é a área de drag) */}
        <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0 bg-purple-500/20 border border-purple-500/25 transition-all duration-200 ease-out ${
          isDragging
            ? 'text-purple-200 border-purple-400/60 bg-purple-500/25 scale-110 shadow-lg shadow-purple-500/30 cursor-grabbing'
            : 'cursor-grab active:scale-95'
        }`}
             aria-label="Arraste para reordenar ficha">
          <Dumbbell size={16} className={`text-purple-400 ${isDragging ? 'animate-pulse' : ''}`} />
        </div>

        {/* Info */}
        {isEditingThisPlan ? (
          <div className="flex-1 flex items-center gap-2 min-w-0" onClick={e => e.stopPropagation()}>
            <input
              type="text"
              value={editingPlanName}
              onChange={(e) => setEditingPlanName(e.target.value)}
              className="flex-1 min-w-0 px-3 py-1.5 bg-white/[0.05] border border-purple-500/25 rounded-[10px] text-[14px] text-white focus:outline-none focus:border-purple-400/50"
              autoFocus
            />
            <button onClick={onSavePlanName}
              className="w-7 h-7 rounded-full flex items-center justify-center bg-green-500/15 border border-green-500/25">
              <Edit2 size={12} className="text-green-400" />
            </button>
            <button onClick={onCancelEditPlanName}
              className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 border border-purple-500/15">
              <MoreVertical size={12} className="text-[#7c6f9e]" />
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
        {!isEditingThisPlan && (
          <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => onSelectPlanForWorkout(plan)}
              className="text-[12px] font-semibold text-white bg-purple-600 px-3.5 py-1.5 rounded-full active:scale-95 transition-transform">
              Treinar
            </button>
            <div className={`relative ${openMenuId === plan.id ? 'z-50' : ''}`}>
              <button
                onClick={(e) => onToggleMenu(plan.id, e)}
                className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 border border-purple-500/15">
                <MoreVertical size={13} className="text-[#7c6f9e]" />
              </button>
              {openMenuId === plan.id && (
                <div className="absolute right-0 top-full mt-1 rounded-[14px] z-[60] min-w-[160px] overflow-hidden"
                  style={{ background: 'rgba(15, 10, 30, 0.98)', border: '0.5px solid rgba(139, 92, 246, 0.25)', backdropFilter: 'blur(20px)' }}>
                  <button onClick={() => onEditPlanName(plan)}
                    className="w-full px-4 py-3 text-left text-white active:bg-purple-600/20 flex items-center gap-3 transition-colors">
                    <Edit2 size={14} className="text-purple-400 flex-shrink-0" />
                    <span className="text-[13px]">Editar nome</span>
                  </button>
                  <button onClick={() => onDuplicatePlan(plan)}
                    className="w-full px-4 py-3 text-left text-white active:bg-purple-600/20 flex items-center gap-3 transition-colors">
                    <Copy size={14} className="text-purple-400 flex-shrink-0" />
                    <span className="text-[13px]">Duplicar</span>
                  </button>
                  <div className="border-t border-purple-500/10 mx-2"></div>
                  <button onClick={() => onDeletePlan(plan.id)}
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
        const diffMs = now.getTime() - createdAt.getTime();
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
    </div>
  );
}
