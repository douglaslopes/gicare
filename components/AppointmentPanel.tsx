import React, { useState, useMemo } from 'react';
import { Appointment } from '../types';
import { parseAppointmentWithGemini } from '../services/geminiService';
import { Icons } from '../constants';

interface AppointmentPanelProps {
  appointments: Appointment[];
  onAddAppointment: (apt: Appointment) => void;
  onDeleteAppointment: (id: string) => void;
}

const AppointmentPanel: React.FC<AppointmentPanelProps> = ({ appointments, onAddAppointment, onDeleteAppointment }) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Filter for current week only
  const currentWeekAppointments = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday
    const diffToMonday = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return appointments.filter(apt => {
        const aptDate = new Date(apt.date + 'T' + apt.time);
        return aptDate >= startOfWeek && aptDate <= endOfWeek;
    }).sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());
  }, [appointments]);

  const handleAISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsProcessing(true);
    setErrorMsg('');

    try {
        const todayStr = new Date().toISOString().split('T')[0];
        const result = await parseAppointmentWithGemini(inputText, todayStr);

        if (result) {
            const newAppointment: Appointment = {
                id: crypto.randomUUID(),
                title: result.title,
                date: result.date,
                time: result.time,
                location: result.location
            };
            onAddAppointment(newAppointment);
            setInputText('');
        } else {
            setErrorMsg('Não entendi muito bem. Tente: "Neuro na terça às 14h".');
        }
    } catch (err) {
        setErrorMsg('Erro ao processar. Verifique sua conexão.');
    } finally {
        setIsProcessing(false);
    }
  };

  const getDayLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00'); // midday to avoid timezone shifts
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <div className="pb-20 space-y-6">
       <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Consultas da Semana</h2>
            <p className="text-gray-500">Veja apenas o que é importante para agora. Adicione novas consultas escrevendo naturalmente.</p>
        </div>

        {/* AI Input */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-5 border border-indigo-100 shadow-sm">
            <label className="block text-sm font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                <Icons.Magic />
                Adicionar Nova Consulta (IA)
            </label>
            <form onSubmit={handleAISubmit} className="relative">
                <input 
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Ex: Cardiologista na sexta-feira às 15h no Hospital Central"
                    className="w-full pl-4 pr-24 py-3 rounded-lg border border-indigo-200 focus:ring-2 focus:ring-indigo-400 focus:outline-none shadow-sm"
                    disabled={isProcessing}
                />
                <button 
                    type="submit"
                    disabled={isProcessing || !inputText}
                    className="absolute right-2 top-2 bottom-2 bg-indigo-600 text-white px-4 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isProcessing ? '...' : 'Criar'}
                </button>
            </form>
            {errorMsg && <p className="text-red-500 text-xs mt-2">{errorMsg}</p>}
        </div>

        {/* List */}
        <div className="space-y-3">
            {currentWeekAppointments.length === 0 ? (
                <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                    <p>Nenhuma consulta agendada para esta semana.</p>
                </div>
            ) : (
                currentWeekAppointments.map(apt => (
                    <div key={apt.id} className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-indigo-500 border-gray-100 flex justify-between items-center group">
                        <div>
                            <p className="text-xs uppercase font-bold text-indigo-600 mb-1">{getDayLabel(apt.date)}</p>
                            <h3 className="text-lg font-bold text-gray-900">{apt.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                <span className="flex items-center gap-1">🕒 {apt.time}</span>
                                <span className="flex items-center gap-1">📍 {apt.location || 'Local não informado'}</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => onDeleteAppointment(apt.id)}
                            className="text-gray-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remover consulta"
                        >
                            ✕
                        </button>
                    </div>
                ))
            )}
        </div>
    </div>
  );
};

export default AppointmentPanel;
