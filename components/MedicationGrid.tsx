import React, { useMemo } from 'react';
import { MedicationScheduleItem, MedLog } from '../types';
import { Icons } from '../constants';

interface MedicationGridProps {
  schedule: MedicationScheduleItem[];
  logs: MedLog[];
  onToggleMed: (scheduleId: string, date: string, time: string) => void;
  currentDate: Date;
}

// Helpers for date manipulation
const getStartOfWeek = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday is start
  return new Date(date.setDate(diff));
};

const formatDateISO = (d: Date) => d.toISOString().split('T')[0];
const formatDisplayDate = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
const getDayName = (d: Date) => d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');

const MedicationGrid: React.FC<MedicationGridProps> = ({ schedule, logs, onToggleMed, currentDate }) => {
  
  const weekDays = useMemo(() => {
    const start = getStartOfWeek(currentDate);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentDate]);

  const isToday = (d: Date) => formatDateISO(d) === formatDateISO(new Date());

  return (
    <div className="flex flex-col space-y-6 pb-20">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Semana Atual</h2>
        <p className="text-sm text-gray-500">
          De {formatDisplayDate(weekDays[0])} a {formatDisplayDate(weekDays[6])}
        </p>
      </div>

      {/* Mobile-First Card View (Day by Day) for small screens */}
      <div className="md:hidden space-y-4">
        {weekDays.map((day) => {
          const dateStr = formatDateISO(day);
          const isDayToday = isToday(day);
          
          return (
            <div key={dateStr} className={`rounded-xl border overflow-hidden ${isDayToday ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200 bg-white'}`}>
              <div className={`p-3 text-center font-semibold ${isDayToday ? 'bg-blue-50 text-blue-800' : 'bg-gray-50 text-gray-700'}`}>
                {getDayName(day).toUpperCase()} - {formatDisplayDate(day)}
              </div>
              <div className="divide-y divide-gray-100">
                {schedule.map((med) => (
                  <div key={med.id} className="p-3 bg-white">
                     <div className="flex items-center gap-2 mb-2">
                        <span className={`w-2 h-2 rounded-full ${med.category === 'Fígado' ? 'bg-amber-400' : 'bg-purple-400'}`}></span>
                        <span className="text-sm font-medium text-gray-900">{med.name}</span>
                     </div>
                     <div className="flex gap-2">
                        {med.times.map((time) => {
                          const logEntry = logs.find(l => l.medScheduleId === med.id && l.date === dateStr && l.time === time);
                          const isTaken = !!logEntry?.taken;

                          return (
                            <button
                              key={time}
                              onClick={() => onToggleMed(med.id, dateStr, time)}
                              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm transition-all duration-200
                                ${isTaken 
                                  ? 'bg-green-100 border-green-200 text-green-700' 
                                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                              {isTaken ? <Icons.Check /> : <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>}
                              <span>{time}</span>
                            </button>
                          );
                        })}
                     </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Medicamento</th>
              <th className="px-4 py-4 w-24">Horário</th>
              {weekDays.map(day => (
                <th key={formatDateISO(day)} className={`px-4 py-4 text-center ${isToday(day) ? 'text-blue-600 bg-blue-50' : ''}`}>
                  <div className="text-xs uppercase opacity-75">{getDayName(day)}</div>
                  <div>{day.getDate()}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {schedule.map(med => (
              <React.Fragment key={med.id}>
                {med.times.map((time, idx) => (
                  <tr key={`${med.id}-${time}`} className="hover:bg-gray-50">
                    {/* Only show med name on first time row */}
                    {idx === 0 && (
                      <td rowSpan={med.times.length} className="px-6 py-4 font-medium text-gray-900 border-r border-gray-100 align-top bg-white">
                         <div className="flex items-center gap-2">
                             <span className={`w-3 h-3 rounded-full ${med.category === 'Fígado' ? 'bg-amber-400' : 'bg-purple-400'}`}></span>
                             {med.name}
                         </div>
                      </td>
                    )}
                    <td className="px-4 py-4 text-gray-500 font-medium border-r border-gray-100 bg-gray-50/50">
                      {time}
                    </td>
                    {weekDays.map(day => {
                      const dateStr = formatDateISO(day);
                      const logEntry = logs.find(l => l.medScheduleId === med.id && l.date === dateStr && l.time === time);
                      const isTaken = !!logEntry?.taken;

                      return (
                        <td key={dateStr} className={`px-2 py-3 text-center ${isToday(day) ? 'bg-blue-50/30' : ''}`}>
                          <button
                            onClick={() => onToggleMed(med.id, dateStr, time)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto transition-all duration-200
                              ${isTaken 
                                ? 'bg-green-500 text-white shadow-sm scale-110' 
                                : 'bg-gray-100 text-transparent hover:bg-gray-200 border border-gray-200'
                              }`}
                          >
                             <Icons.Check />
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MedicationGrid;
