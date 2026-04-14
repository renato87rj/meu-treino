import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import SortablePlanCard from './SortablePlanCard';
import DragOverlayPlan from './DragOverlayPlan';
import type { WorkoutPlan } from '../../types/workout';

interface Props {
  workoutPlans: WorkoutPlan[];
  expandedPlan: string | null;
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
  onReorderPlans: (newOrder: WorkoutPlan[]) => void;
}

export default function SortablePlansList({
  workoutPlans,
  expandedPlan,
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
  onReorderPlans,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    setActiveId(active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = workoutPlans.findIndex(plan => plan.id === active.id);
      const newIndex = workoutPlans.findIndex(plan => plan.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // Reordenar as fichas
        const newOrder = arrayMove(workoutPlans, oldIndex, newIndex);
        onReorderPlans(newOrder);
      }
    }

    setActiveId(null);
  }

  const activePlan = workoutPlans.find(plan => plan.id === activeId);
  const activeIndex = workoutPlans.findIndex(plan => plan.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext items={workoutPlans.map(plan => plan.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {workoutPlans.map((plan, index) => (
            <SortablePlanCard
              key={plan.id}
              plan={plan}
              index={index}
              isExpanded={expandedPlan === plan.id}
              editingPlanId={editingPlanId}
              editingPlanName={editingPlanName}
              openMenuId={openMenuId}
              onSelectPlanForWorkout={onSelectPlanForWorkout}
              onEditPlanName={onEditPlanName}
              onDuplicatePlan={onDuplicatePlan}
              onDeletePlan={onDeletePlan}
              onSavePlanName={onSavePlanName}
              onCancelEditPlanName={onCancelEditPlanName}
              setEditingPlanName={setEditingPlanName}
              onTogglePlan={onTogglePlan}
              onToggleMenu={onToggleMenu}
              menuRefs={menuRefs}
            />
          ))}
        </div>
      </SortableContext>

      {/* Drag Overlay - a ficha que se move */}
      <DragOverlayPlan 
        plan={activePlan || null} 
        index={activeIndex} 
      />
    </DndContext>
  );
}
