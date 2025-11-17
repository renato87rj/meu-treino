import React, { useState } from 'react';
import { Dumbbell, CheckCircle, Edit2, Save, X } from 'lucide-react';

export default function WorkoutView({ 
  selectedPlan,
  completedToday,
  todayRecords,
  onRecordWorkout,
  onEditRecord
}) {
  const [recordingExercise, setRecordingExercise] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [recordData, setRecordData] = useState({
    sets: '',
    reps: '',
    weight: ''
  });
  const [editRecordData, setEditRecordData] = useState({
    actualSets: '',
    actualReps: '',
    actualWeight: ''
  });

  const startRecording = (exercise) => {
    setRecordingExercise(exercise);
    setRecordData({
      sets: exercise.sets.toString(),
      reps: exercise.reps,
      weight: ''
    });
  };

  const handleRecordWorkout = () => {
    if (onRecordWorkout(selectedPlan, recordingExercise, recordData)) {
      setRecordData({ sets: '', reps: '', weight: '' });
      setRecordingExercise(null);
    }
  };

  const startEditingRecord = (record) => {
    setEditingRecord(record);
    setEditRecordData({
      actualSets: record.actualSets.toString(),
      actualReps: record.actualReps,
      actualWeight: record.actualWeight ? record.actualWeight.toString() : ''
    });
  };

  const handleSaveEditRecord = () => {
    if (onEditRecord(editingRecord.id, {
      actualSets: parseInt(editRecordData.actualSets),
      actualReps: editRecordData.actualReps,
      actualWeight: editRecordData.actualWeight ? parseFloat(editRecordData.actualWeight) : null
    })) {
      setEditingRecord(null);
      setEditRecordData({ actualSets: '', actualReps: '', actualWeight: '' });
    }
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

      {/* Modal Registrar */}
      {recordingExercise && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-purple-500/30 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">{recordingExercise.name}</h2>
            <p className="text-purple-300 text-sm mb-4">
              Planejado: {recordingExercise.sets} x {recordingExercise.reps}
              {recordingExercise.weight && ` - ${recordingExercise.weight}kg`}
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
                    type="text"
                    value={recordData.reps}
                    onChange={(e) => setRecordData({...recordData, reps: e.target.value})}
                    placeholder="ex: 12 ou 8-12"
                    className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/30 focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-purple-200 text-sm mb-2">Carga (opcional)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={recordData.weight}
                    onChange={(e) => setRecordData({...recordData, weight: e.target.value})}
                    placeholder="kg"
                    className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/30 focus:outline-none focus:border-purple-400"
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

      {/* Modal Editar Registro */}
      {editingRecord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-purple-500/30 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">Editar Registro</h2>
            <p className="text-purple-300 text-sm mb-1">{editingRecord.exerciseName}</p>
            <p className="text-purple-400/70 text-xs mb-4">
              Planejado: {editingRecord.plannedSets} x {editingRecord.plannedReps}
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-purple-200 text-sm mb-2">Séries</label>
                  <input
                    type="number"
                    min="1"
                    value={editRecordData.actualSets}
                    onChange={(e) => setEditRecordData({...editRecordData, actualSets: e.target.value})}
                    className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-purple-200 text-sm mb-2">Reps</label>
                  <input
                    type="text"
                    value={editRecordData.actualReps}
                    onChange={(e) => setEditRecordData({...editRecordData, actualReps: e.target.value})}
                    placeholder="ex: 12 ou 8-12"
                    className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/30 focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-purple-200 text-sm mb-2">Carga (opcional)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={editRecordData.actualWeight}
                    onChange={(e) => setEditRecordData({...editRecordData, actualWeight: e.target.value})}
                    placeholder="kg"
                    className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/30 focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={handleSaveEditRecord} 
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl"
                >
                  <Save size={16} className="inline mr-1" /> Salvar
                </button>
                <button 
                  onClick={() => setEditingRecord(null)} 
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl"
                >
                  <X size={16} className="inline mr-1" /> Cancelar
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
          <p className="text-purple-400/50 text-sm mt-2">Adicione exercícios na aba Fichas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {selectedPlan.exercises.map((exercise) => {
            const record = todayRecords.find(r => r.exerciseId === exercise.id);
            const isCompleted = !!record;

            return (
              <div
                key={exercise.id}
                className={`bg-white/10 backdrop-blur-md rounded-xl p-4 border transition-all ${
                  isCompleted ? 'border-green-500/50 bg-green-500/10' : 'border-purple-500/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg mb-1">{exercise.name}</h3>
                    <p className="text-purple-300 text-sm mb-1">
                      Planejado: {exercise.sets} x {exercise.reps}
                      {exercise.weight && ` - ${exercise.weight}kg`}
                    </p>
                    {isCompleted && (
                      <p className="text-green-300 text-sm">
                        Realizado: {record.actualSets} x {record.actualReps}
                        {record.actualWeight && ` - ${record.actualWeight}kg`}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {isCompleted ? (
                      <>
                        <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg flex items-center gap-2">
                          <CheckCircle size={20} />
                          <span className="text-sm font-medium">Feito</span>
                        </div>
                        <button
                          onClick={() => startEditingRecord(record)}
                          className="text-purple-400 hover:bg-purple-500/20 p-2 rounded-lg"
                          title="Editar registro"
                        >
                          <Edit2 size={18} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startRecording(exercise)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium"
                      >
                        Registrar
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

