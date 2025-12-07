import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { Icons } from '../constants';

interface InventoryPanelProps {
  inventory: InventoryItem[];
  onUpdateQuantity: (id: string, newQty: number) => void;
}

const InventoryPanel: React.FC<InventoryPanelProps> = ({ inventory, onUpdateQuantity }) => {
  return (
    <div className="pb-20 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Estoque de Medicamentos</h2>
            <p className="text-gray-500">Controle a quantidade restante para saber quando comprar mais.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inventory.map((item) => {
                const isLow = item.currentQuantity <= item.minThreshold;

                return (
                    <div key={item.id} className={`bg-white rounded-xl shadow-sm border p-5 transition-all ${isLow ? 'border-red-200 ring-4 ring-red-50' : 'border-gray-100'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                                <p className="text-sm text-gray-500">Mínimo ideal: {item.minThreshold} {item.unit}</p>
                            </div>
                            {isLow && (
                                <div className="flex items-center gap-1 text-red-600 bg-red-100 px-2 py-1 rounded text-xs font-bold animate-pulse">
                                    <Icons.Alert />
                                    <span>REPÔR!</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                            <button 
                                onClick={() => onUpdateQuantity(item.id, Math.max(0, item.currentQuantity - 1))}
                                className="w-10 h-10 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 flex items-center justify-center text-xl font-bold shadow-sm active:scale-95 transition-transform"
                            >
                                -
                            </button>
                            <div className="text-center">
                                <span className={`text-3xl font-bold ${isLow ? 'text-red-600' : 'text-gray-800'}`}>
                                    {item.currentQuantity}
                                </span>
                                <span className="text-xs text-gray-500 block uppercase font-medium mt-1">{item.unit}</span>
                            </div>
                            <button 
                                onClick={() => onUpdateQuantity(item.id, item.currentQuantity + 1)}
                                className="w-10 h-10 bg-blue-600 border border-blue-600 rounded-lg text-white hover:bg-blue-700 flex items-center justify-center shadow-md active:scale-95 transition-transform"
                            >
                                <Icons.Plus />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
        
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
            <div className="text-blue-500 mt-1"><Icons.Box /></div>
            <p className="text-sm text-blue-800 leading-relaxed">
                <strong>Dica:</strong> Mantenha o estoque sempre atualizado. Se o indicador ficar <span className="text-red-600 font-bold">vermelho</span>, significa que está na hora de ir ao hospital ou farmácia.
            </p>
        </div>
    </div>
  );
};

export default InventoryPanel;
