import React from 'react';
import { Calendar } from 'lucide-react';

export default function HistoryView({ history, groupHistoryByDate }) {
  const groupedHistory = groupHistoryByDate();

  return (
    <div>
      {history.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="mx-auto text-purple-400/30 mb-4" size={64} />
          <p className="text-purple-300/70 text-lg">Nenhum treino registrado</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedHistory).map(([date, records]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="text-purple-400" size={18} />
                <h3 className="text-purple-300 font-semibold">{date}</h3>
                <span className="text-purple-400/60 text-sm">({records.length} exercícios)</span>
              </div>
              <div className="space-y-3">
                {records.map((record) => (
                  <div 
                    key={record.id} 
                    className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-purple-500/20"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-white font-semibold">{record.exerciseName}</h4>
                      <span className="text-purple-400/70 text-xs">{record.planName}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-purple-400/70">Planejado:</p>
                        <p className="text-purple-300">
                          {record.plannedSets}x{record.plannedReps} @ {record.plannedWeight}kg
                        </p>
                      </div>
                      <div>
                        <p className="text-green-400/70">Realizado:</p>
                        <p className="text-green-300">
                          {record.actualSets}x{record.actualReps} @ {record.actualWeight}kg
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

