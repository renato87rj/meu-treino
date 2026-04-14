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
import SortableExercise from './SortableExercise';
import DragOverlayExercise from './DragOverlayExercise';
import type { Exercise, WorkoutPlan } from '../../types/workout';

interface Props {
  plan: WorkoutPlan;
  exercises: Exercise[];
  editingExercise: Exercise | null;
  userExerciseNames: string[];
  onEditExercise: (exercise: Exercise) => void;
  onDeleteExercise: (exerciseId: string) => void;
  onDuplicateExercise: (exercise: Exercise) => void;
  onToggleExerciseMenu: (menuKey: string, e: React.MouseEvent) => void;
  openExerciseMenu: string | null;
  exerciseMenuRefs: React.MutableRefObject<Record<string, HTMLDivElement>>;
  setEditingExercise: (exercise: Exercise | null) => void;
  onHandleSaveEdit: (planId: string) => void;
  onMoveExercise: (planId: string, exerciseId: string, direction: string) => void;
  onMoveExerciseToPosition: (planId: string, exerciseId: string, toIndex: number) => void;
}

export default function SortableExerciseList({
  plan,
  exercises,
  editingExercise,
  userExerciseNames,
  onEditExercise,
  onDeleteExercise,
  onDuplicateExercise,
  onToggleExerciseMenu,
  openExerciseMenu,
  exerciseMenuRefs,
  setEditingExercise,
  onHandleSaveEdit,
  onMoveExerciseToPosition,
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
      const oldIndex = exercises.findIndex(exercise => exercise.id === active.id);
      const newIndex = exercises.findIndex(exercise => exercise.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // Usar a função existente para mover o exercício
        onMoveExerciseToPosition(plan.id, active.id as string, newIndex);
      }
    }

    setActiveId(null);
  }

  const activeExercise = exercises.find(exercise => exercise.id === activeId);
  const activeIndex = exercises.findIndex(exercise => exercise.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext items={exercises.map(ex => ex.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-0">
          {exercises.map((exercise, index) => {
            const isEditing = editingExercise?.id === exercise.id;
            
            return (
              <SortableExercise
                key={exercise.id}
                exercise={exercise}
                index={index}
                isEditing={isEditing}
                editingExercise={editingExercise}
                userExerciseNames={userExerciseNames}
                onEditExercise={onEditExercise}
                onDeleteExercise={onDeleteExercise}
                onDuplicateExercise={onDuplicateExercise}
                onToggleExerciseMenu={onToggleExerciseMenu}
                openExerciseMenu={openExerciseMenu}
                exerciseMenuRefs={exerciseMenuRefs}
                planId={plan.id}
                setEditingExercise={setEditingExercise}
                onHandleSaveEdit={onHandleSaveEdit}
              />
            );
          })}
        </div>
      </SortableContext>

      {/* Drag Overlay - o card que se move */}
      <DragOverlayExercise 
        exercise={activeExercise || null} 
        index={activeIndex} 
      />
    </DndContext>
  );
}
