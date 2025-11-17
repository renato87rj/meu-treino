import React from 'react';
import { Dumbbell, CheckCircle, X, Check } from 'lucide-react';

export default function WorkoutView({ 
  selectedPlan,
  completedToday,
  todayRecords,
  onRecordWorkout
}) {
  const handleToggleExercise = (exercise) => {
    onRecordWorkout(selectedPlan, exercise);
  };

  const isExerciseCompleted = (exerciseId) => {
    return completedToday.has(exerciseId);
  };

  if (!selectedPlan) return null;

  return (
    <div>
      {/* Badge da Ficha */}
      <div className="bg-purple-600/20 backdrop-blur-md rounded-xl p-4 mb-6 border border-purple-500/30">
        <div className="flex items-center gap-2">
          <Dumbbell className="text-purple-400" size={20} />
          <div>
            <p className="text-purple-300/70 text-xs">Treinando ficha</p>
            <h2 className="text-white font-semibold text-lg">{selectedPlan.name}</h2>
          </div>
        </div>
      </div>

      {/* Lista de Exercícios */}
      {selectedPlan.exercises.length === 0 ? (
        <div className="text-center py-16">
          <Dumbbell className="mx-auto text-purple-400/30 mb-4" size={64} />
          <p className="text-purple-300/70 text-lg">Nenhum exercício nesta ficha</p>
          <p className="text-purple-400/50 text-sm mt-2">Adicione exercícios na aba Fichas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {selectedPlan.exercises.map((exercise) => {
            const completed = isExerciseCompleted(exercise.id);

            return (
              <div
                key={exercise.id}
                className={`bg-white/10 backdrop-blur-md rounded-xl p-4 border transition-all ${
                  completed 
                    ? 'border-green-500/50 bg-green-500/10' 
                    : 'border-purple-500/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-lg mb-1 break-words">{exercise.name}</h3>
                    <p className="text-purple-300 text-sm">
                      Planejado: {exercise.sets} x {exercise.reps}
                      {exercise.weight && ` - ${exercise.weight}kg`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {completed ? (
                      <>
                        <div className="bg-green-500/20 text-green-400 px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2">
                          <CheckCircle size={18} className="sm:w-5 sm:h-5" />
                          <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Feito</span>
                        </div>
                        <button
                          onClick={() => handleToggleExercise(exercise)}
                          className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 p-2 rounded-lg shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 flex-shrink-0"
                          title="Desmarcar exercício"
                        >
                          <X size={18} strokeWidth={2.5} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleToggleExercise(exercise)}
                        className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 p-2 rounded-lg shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 flex-shrink-0"
                        title="Marcar como feito"
                      >
                        <Check size={18} strokeWidth={2.5} />
                        <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Feito</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
