import React, { useState, useEffect, useCallback } from 'react';
import { Tab, MedLog, InventoryItem, Appointment } from './types';
import { MEDICATION_SCHEDULE, INITIAL_INVENTORY, Icons } from './constants';
import MedicationGrid from './components/MedicationGrid';
import InventoryPanel from './components/InventoryPanel';
import AppointmentPanel from './components/AppointmentPanel';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('schedule');
  const [logs, setLogs] = useState<MedLog[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Load Initial State
  useEffect(() => {
    const storedLogs = localStorage.getItem('gi-care-logs');
    const storedInv = localStorage.getItem('gi-care-inventory');
    const storedApts = localStorage.getItem('gi-care-appointments');

    if (storedLogs) setLogs(JSON.parse(storedLogs));
    if (storedInv) setInventory(JSON.parse(storedInv));
    if (storedApts) setAppointments(JSON.parse(storedApts));

    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem('gi-care-logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('gi-care-inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('gi-care-appointments', JSON.stringify(appointments));
  }, [appointments]);

  // --- Notification Logic ---
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert("Este navegador não suporta notificações de área de trabalho.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        new Notification("GiCare", { body: "Notificações ativadas! Avisaremos na hora dos remédios e consultas." });
      }
    } catch (e) {
      console.error("Erro ao solicitar permissão", e);
    }
  };

  useEffect(() => {
    if (notificationPermission !== 'granted') return;

    const checkNotifications = () => {
      const now = new Date();
      const currentTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const currentDateStr = now.toISOString().split('T')[0];

      // 1. Check Medications
      MEDICATION_SCHEDULE.forEach(med => {
        if (med.times.includes(currentTime)) {
          const alreadyTaken = logs.some(
            log => log.medScheduleId === med.id && log.date === currentDateStr && log.time === currentTime && log.taken
          );

          if (!alreadyTaken) {
            new Notification(`Hora do Remédio: ${med.name}`, {
              body: `Está na hora de tomar o remédio (${currentTime}). Categoria: ${med.category}`,
              icon: '/favicon.ico'
            });
          }
        }
      });

      // 2. Check Appointments
      appointments.forEach(apt => {
        if (apt.date === currentDateStr) {
          // Check for Exact Time
          if (apt.time === currentTime) {
             new Notification(`Consulta Agora: ${apt.title}`, {
                body: `Sua consulta é agora às ${apt.time}. Local: ${apt.location || 'Não informado'}`,
                icon: '/favicon.ico'
             });
          }

          // Check for 1 Hour Before
          const aptDate = new Date(`${apt.date}T${apt.time}`);
          const oneHourBefore = new Date(aptDate.getTime() - 60 * 60 * 1000);
          const oneHourBeforeTime = oneHourBefore.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          
          if (currentTime === oneHourBeforeTime) {
             new Notification(`Lembrete de Consulta: ${apt.title}`, {
                body: `Sua consulta será em 1 hora (${apt.time}). Prepare-se!`,
                icon: '/favicon.ico'
             });
          }
        }
      });
    };

    // Check every minute
    const intervalId = setInterval(checkNotifications, 60000);
    // Initial check (in case user opens app exactly on minute)
    checkNotifications();

    return () => clearInterval(intervalId);
  }, [notificationPermission, logs, appointments]);
  // --------------------------

  const handleToggleMed = (scheduleId: string, date: string, time: string) => {
    setLogs(prev => {
      const exists = prev.find(l => l.medScheduleId === scheduleId && l.date === date && l.time === time);
      if (exists) {
        // Untoggle (remove)
        return prev.filter(l => l !== exists);
      } else {
        // Toggle (add)
        const newLog: MedLog = {
          id: crypto.randomUUID(),
          medScheduleId: scheduleId,
          date,
          time,
          taken: true,
          takenAt: new Date().toISOString()
        };
        return [...prev, newLog];
      }
    });
  };

  const handleUpdateInventory = (id: string, newQty: number) => {
    setInventory(prev => prev.map(item => item.id === id ? { ...item, currentQuantity: newQty } : item));
  };

  const handleAddAppointment = (apt: Appointment) => {
    setAppointments(prev => [...prev, apt]);
  };

  const handleDeleteAppointment = (id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-teal-400 rounded-lg flex items-center justify-center text-white shadow-lg">
                <span className="font-bold">G</span>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-600">
              GiCare
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
             {/* Notification Button */}
             <button
               onClick={requestNotificationPermission}
               className={`p-2 rounded-full transition-colors ${
                 notificationPermission === 'granted' 
                   ? 'text-blue-500 bg-blue-50' 
                   : 'text-gray-400 hover:bg-gray-100'
               }`}
               title={notificationPermission === 'granted' ? 'Notificações Ativas' : 'Ativar Notificações'}
             >
               {notificationPermission === 'granted' ? <Icons.Bell /> : <Icons.BellOff />}
             </button>
             
             {/* Status Badge */}
             <div className="hidden sm:block text-xs text-gray-400 font-medium bg-gray-100 px-2 py-1 rounded">
               Local Storage (Offline)
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === 'schedule' && (
          <MedicationGrid 
            schedule={MEDICATION_SCHEDULE}
            logs={logs}
            onToggleMed={handleToggleMed}
            currentDate={new Date()}
          />
        )}
        
        {activeTab === 'inventory' && (
          <InventoryPanel 
            inventory={inventory}
            onUpdateQuantity={handleUpdateInventory}
          />
        )}

        {activeTab === 'appointments' && (
          <AppointmentPanel 
            appointments={appointments}
            onAddAppointment={handleAddAppointment}
            onDeleteAppointment={handleDeleteAppointment}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-20">
        <div className="max-w-4xl mx-auto flex justify-around items-center h-16 px-2">
          <button 
            onClick={() => setActiveTab('schedule')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'schedule' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Icons.Pill />
            <span className="text-xs font-medium">Remédios</span>
          </button>
          
          <button 
             onClick={() => setActiveTab('inventory')}
             className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'inventory' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Icons.Box />
            <span className="text-xs font-medium">Estoque</span>
          </button>

          <button 
             onClick={() => setActiveTab('appointments')}
             className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'appointments' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Icons.Calendar />
            <span className="text-xs font-medium">Consultas</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
