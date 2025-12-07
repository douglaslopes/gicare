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
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Manual Form State
  const [manualForm, setManualForm] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '08:00',
    location: ''
  });

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
            setErrorMsg('Não entendi muito bem. Tente usar o modo manual.');
        }
    } catch (err) {
        console.error(err);
        setErrorMsg('Erro ao processar. Tente o modo manual.');
    } finally {
        setIsProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.title || !manualForm.date || !manualForm.time) {
        setErrorMsg('Preencha os campos obrigatórios.');
        return;
    }

    const newAppointment: Appointment = {
        id: crypto.randomUUID(),
        title: manualForm.title,
        date: manualForm.date,
        time: manualForm.time,
        location: manualForm.location || 'Não informado'
    };
    onAddAppointment(newAppointment);
    
    // Reset form
    setManualForm({
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '08:00',
        location: ''
    });
    setMode('ai'); // Switch back or stay? Let's switch back to list view essentially
  };

  const getDayLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00'); // midday to avoid timezone shifts
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <div className="pb-20 space-y-6">
       <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Consultas da Semana</h2>
            <p className="text-gray-500">Veja apenas o que é importante para agora.</p>
        </div>

        {/* Toggle Mode */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <button 
                onClick={() => setMode('ai')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2
                ${mode === 'ai' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <Icons.Magic />
                IA (Automático)
            </button>
            <button 
                onClick={() => setMode('manual')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2
                ${mode === 'manual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <Icons.Plus />
                Manual
            </button>
        </div>

        {/* Input Forms */}
        {mode === 'ai' ? (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-5 border border-indigo-100 shadow-sm">
                <label className="block text-sm font-semibold text-indigo-900 mb-2">
                    Escreva como se estivesse falando:
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
        ) : (
            <form onSubmit={handleManualSubmit} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título / Médico</label>
                    <input 
                        type="text" 
                        required
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        placeholder="Ex: Dr. Silva (Neuro)"
                        value={manualForm.title}
                        onChange={e => setManualForm({...manualForm, title: e.target.value})}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data</label>
                        <input 
                            type="date" 
                            required
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={manualForm.date}
                            onChange={e => setManualForm({...manualForm, date: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hora</label>
                        <input 
                            type="time" 
                            required
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={manualForm.time}
                            onChange={e => setManualForm({...manualForm, time: e.target.value})}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Local (Opcional)</label>
                    <input 
                        type="text" 
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Ex: Clínica Centro, Sala 10"
                        value={manualForm.location}
                        onChange={e => setManualForm({...manualForm, location: e.target.value})}
                    />
                </div>
                <button 
                    type="submit"
                    className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    Salvar Consulta
                </button>
            </form>
        )}

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
                            className="text-gray-300 hover:text-red-500 p-2 group-hover:opacity-100 transition-opacity"
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
