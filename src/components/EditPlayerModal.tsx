import { useState } from 'react';
import {type Player } from '../types';
import { X, Save, Trash2 } from 'lucide-react';

interface EditPlayerModalProps {
  isOpen: boolean;
  player: Player | null;
  onClose: () => void;
  onSave: (id: string, name: string, stars: number) => void;
  onDelete: (id: string) => void;
}

export default function EditPlayerModal({ isOpen, player, onClose, onSave, onDelete }: EditPlayerModalProps) {
  const [name, setName] = useState(player?.name || '');
  const [stars, setStars] = useState(player?.stars || 3);

  // Atualiza state quando o player muda (ao abrir o modal)
  if (!isOpen || !player) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-slate-800">Editar Jogador</h3>
            <button onClick={onClose}><X className="text-slate-400 hover:text-slate-600" /></button>
        </div>

        <div className="space-y-4">
            <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Nome</label>
                <input 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full p-3 rounded-lg border border-slate-300 focus:border-blue-500 outline-none"
                    placeholder={player.name}
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Nível (Estrelas)</label>
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(s => (
                        <button
                            key={s}
                            onClick={() => setStars(s)}
                            className={`flex-1 py-2 rounded-lg font-bold border transition-all ${stars === s ? 'bg-yellow-400 border-yellow-500 text-white shadow-md scale-105' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <div className="flex gap-3 mt-8">
            <button 
                onClick={() => { if(confirm('Excluir este jogador?')) onDelete(player.id); }}
                className="flex-1 py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-100"
            >
                <Trash2 size={18} /> Excluir
            </button>
            <button 
                onClick={() => onSave(player.id, name || player.name, stars)}
                className="flex-2 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg"
            >
                <Save size={18} /> Salvar
            </button>
        </div>
      </div>
    </div>
  );
}