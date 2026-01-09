import { useState } from 'react';
import { type Player } from '../types';
import { X, Check } from 'lucide-react';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (scorerId: string, assistId: string | null) => void;
  teamName: string;
  players: Player[]; // Jogadores do time que fez o gol
}

export default function GoalModal({ isOpen, onClose, onConfirm, teamName, players }: GoalModalProps) {
  const [scorer, setScorer] = useState<string>('');
  const [assist, setAssist] = useState<string>('none');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!scorer) return alert('Selecione quem fez o gol!');
    onConfirm(scorer, assist === 'none' ? null : assist);
    // Reset
    setScorer('');
    setAssist('none');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
          <h3 className="font-bold text-lg flex items-center gap-2">
            ⚽ Gol do {teamName}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Quem fez? */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Quem marcou? (Gol)</label>
            <div className="grid grid-cols-2 gap-2">
              {players.map(p => (
                <button
                  key={p.id}
                  onClick={() => setScorer(p.id)}
                  className={`p-2 text-sm rounded-lg border transition-all ${
                    scorer === p.id 
                      ? 'bg-green-100 border-green-500 text-green-800 font-bold ring-1 ring-green-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Quem ajudou? */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Quem passou? (Assistência)</label>
            <select
              value={assist}
              onChange={(e) => setAssist(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="none">-- Sem assistência / Jogada individual --</option>
              {players
                .filter(p => p.id !== scorer) // Não pode dar assistência pra si mesmo
                .map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!scorer}
            className="w-full py-3 mt-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
          >
            <Check size={20} /> Confirmar Gol
          </button>
        </div>
      </div>
    </div>
  );
}