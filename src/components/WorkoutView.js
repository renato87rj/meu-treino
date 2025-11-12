import React, { useState } from 'react';
import { Dumbbell, CheckCircle, Edit2, Save, X, Copy, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';

export default function WorkoutView({ 
  selectedPlan,
  completedToday,
  showAddExercise,
  onAddExercise,
  onEditExercise,
  onDeleteExercise,
  onDuplicateExercise,
  onMoveExercise,
  onRecordWorkout,
  onCancelAdd
}) {
  const [newExercise, setNewExercise] = useState({
    name: '',
    sets: '',
    reps: '',
    weight: ''
  });

  const [editingExercise, setEditingExercise] = useState(null);
  const [recordingExercise, setRecordingExercise] = useState(null);
  const [recordData, setRecordData] = useState({
    sets: '',
    reps: '',
    weight: ''
  });

  const handleAddExercise = () => {
    if (onAddExercise(selectedPlan.id, newExercise)) {
      setNewExercise({ name: '', sets: '', reps: '', weight: '' });
    }
  };

  const handleSaveEdit = () => {
    if (onEditExercise(selectedPlan.id, editingExercise)) {
      setEditingExercise(null);
    }
  };

  const startRecording = (exercise) => {
    setRecordingExercise(exercise);
    setRecordData({
      sets: exercise.sets.toString(),
      reps: exercise.reps.toString(),
      weight: exercise.weight.toString()
    });
  };

  const handleRecordWorkout = () => {
    if (onRecordWorkout(selectedPlan, recordingExercise, recordData)) {
      setRecordData({ sets: '', reps: '', weight: '' });
      setRecordingExercise(null);
    }
  };

  if (!selectedPlan) return null;

  return (
    <div>
      {/* Formulário de Novo Exercício */}
      {showAddExercise && (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-purple-500/20 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-4">Adicionar Exercício</h2>
          <div className="space-y-4">
            <input
              type="text"
              value={newExercise.name}
              onChange={(e) => setNewExercise({...newExercise, name: e.target.value})}
              placeholder="Nome do exercício"
              className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400"
            />
            <div className="grid grid-cols-3 gap-4">
              <input
                type="number"
                min="1"
                value={newExercise.sets}
                onChange={(e) => setNewExercise({...newExercise, sets: e.target.value})}
                placeholder="Séries"
                className="px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400"
              />
              <input
                type="number"
                min="1"
                value={newExercise.reps}
                onChange={(e) => setNewExercise({...newExercise, reps: e.target.value})}
                placeholder="Reps"
                className="px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400"
              />
              <input
                type="number"
                min="0"
                step="0.5"
                value={newExercise.weight}
                onChange={(e) => setNewExercise({...newExercise, weight: e.target.value})}
                placeholder="Kg"
                className="px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400"
              />
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleAddExercise} 
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl"
              >
                Adicionar
              </button>
              <button 
                onClick={onCancelAdd} 
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Registrar */}
      {recordingExercise && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-purple-500/30 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">{recordingExercise.name}</h2>
            <p className="text-purple-300 text-sm mb-4">
              Planejado: {recordingExercise.sets}x{recordingExercise.reps} @ {recordingExercise.weight}kg
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-purple-200 text-sm mb-2">Séries</label>
                  <input
                    type="number"
                    min="1"
                    value={recordData.sets}
                    onChange={(e) => setRecordData({...recordData, sets: e.target.value})}
                    className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-purple-200 text-sm mb-2">Reps</label>
                  <input
                    type="number"
                    min="1"
                    value={recordData.reps}
                    onChange={(e) => setRecordData({...recordData, reps: e.target.value})}
                    className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-purple-200 text-sm mb-2">Carga</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={recordData.weight}
                    onChange={(e) => setRecordData({...recordData, weight: e.target.value})}
                    className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={handleRecordWorkout} 
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl"
                >
                  Registrar
                </button>
                <button 
                  onClick={() => setRecordingExercise(null)} 
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Exercícios */}
      {selectedPlan.exercises.length === 0 ? (
        <div className="text-center py-16">
          <Dumbbell className="mx-auto text-purple-400/30 mb-4" size={64} />
          <p className="text-purple-300/70 text-lg">Nenhum exercício nesta ficha</p>
          <p className="text-purple-400/50 text-sm mt-2">Clique no + para adicionar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {selectedPlan.exercises.map((exercise, index) => {
            const isCompleted = completedToday.has(exercise.id);
            const isEditing = editingExercise?.id === exercise.id;
            const isFirst = index === 0;
            const isLast = index === selectedPlan.exercises.length - 1;

            return (
              <div
                key={exercise.id}
                className={`bg-white/10 backdrop-blur-md rounded-xl p-4 border transition-all ${
                  isCompleted ? 'border-green-500/50 bg-green-500/10' : 'border-purple-500/20 hover:bg-white/15'
                }`}
              >
                {isEditing ? (
                  <div className="space-y-3">
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
                        className="px-3 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white"
                      />
                      <input
                        type="number"
                        value={editingExercise.reps}
                        onChange={(e) => setEditingExercise({...editingExercise, reps: e.target.value})}
                        className="px-3 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white"
                      />
                      <input
                        type="number"
                        step="0.5"
                        value={editingExercise.weight}
                        onChange={(e) => setEditingExercise({...editingExercise, weight: e.target.value})}
                        className="px-3 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={handleSaveEdit} 
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg"
                      >
                        <Save size={16} className="inline mr-1" /> Salvar
                      </button>
                      <button 
                        onClick={() => setEditingExercise(null)} 
                        className="flex-1 bg-white/10 text-white py-2 rounded-lg"
                      >
                        <X size={16} className="inline mr-1" /> Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    {/* Botões de reordenação */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => onMoveExercise(selectedPlan.id, exercise.id, 'up')}
                        disabled={isFirst}
                        className={`p-1 rounded ${isFirst ? 'text-purple-400/30 cursor-not-allowed' : 'text-purple-400 hover:bg-purple-500/20'}`}
                        title="Mover para cima"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        onClick={() => onMoveExercise(selectedPlan.id, exercise.id, 'down')}
                        disabled={isLast}
                        className={`p-1 rounded ${isLast ? 'text-purple-400/30 cursor-not-allowed' : 'text-purple-400 hover:bg-purple-500/20'}`}
                        title="Mover para baixo"
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg mb-1">{exercise.name}</h3>
                      <p className="text-purple-300 text-sm">
                        {exercise.sets} séries × {exercise.reps} reps @ {exercise.weight}kg
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {isCompleted ? (
                        <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg flex items-center gap-2">
                          <CheckCircle size={20} />
                          <span className="text-sm font-medium">Feito</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => startRecording(exercise)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium"
                        >
                          Registrar
                        </button>
                      )}
                      <button
                        onClick={() => onDuplicateExercise(selectedPlan.id, exercise)}
                        className="text-purple-400 hover:bg-purple-500/20 p-2 rounded-lg"
                        title="Duplicar exercício"
                      >
                        <Copy size={18} />
                      </button>
                      <button
                        onClick={() => setEditingExercise(exercise)}
                        className="text-purple-400 hover:bg-purple-500/20 p-2 rounded-lg"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => onDeleteExercise(selectedPlan.id, exercise.id)}
                        className="text-red-400 hover:bg-red-500/20 p-2 rounded-lg"
                      >
                        <Trash2 size={18} />
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
  );
}

