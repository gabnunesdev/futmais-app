import { type Player } from '../../types';
import { ArrowRightLeft, CheckCircle2, Share2, LogOut } from 'lucide-react';
import { PLAYERS_PER_TEAM } from '../../domain/matchmaking/balancer';

// 1. Tipagem das Props da Coluna (DraftColumn)
interface DraftColumnProps {
  title: string;
  color: 'red' | 'blue';
  players: Player[];
  onMove: (playerId: string) => void;
  onKick: (playerId: string) => void;
}

// 2. Tipagem das Props da View Principal (DraftView)
interface DraftViewProps {
  draftState: { red: Player[], blue: Player[], queue: Player[] };
  selectedIds: string[];
  onMove: (pid: string, from: 'red' | 'blue' | 'queue', to: 'red' | 'blue' | 'queue') => void;
  onRemoveFromQueue: (pid: string) => void;
  onConfirm: () => void;
  onBack: () => void;
  onShare: () => void;
}

// Subcomponente tipado corretamente
const DraftColumn = ({ title, color, players, onMove, onKick }: DraftColumnProps) => (
  <div className={`p-4 rounded-xl border-t-4 bg-white shadow-sm ${color === 'red' ? 'border-red-500' : 'border-blue-500'}`}>
    <h3 className={`font-bold uppercase text-sm mb-3 ${color === 'red' ? 'text-red-600' : 'text-blue-600'}`}>{title} ({players.length})</h3>
    <div className="space-y-2">
      {players.map((p: Player) => (
        <div key={p.id} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded border border-slate-100">
           <span>{p.name}</span>
           <div className="flex gap-1">
             <button onClick={() => onMove(p.id)} title="Trocar" className="p-1 hover:bg-slate-200 rounded"><ArrowRightLeft size={14}/></button>
             <button onClick={() => onKick(p.id)} title="Banco" className="p-1 hover:bg-red-100 text-red-500 rounded">X</button>
           </div>
        </div>
      ))}
      {[...Array(Math.max(0, PLAYERS_PER_TEAM - players.length))].map((_, i) => (
        <div key={i} className="h-9 border-2 border-dashed border-slate-100 rounded flex items-center justify-center text-xs text-slate-300">Vaga aberta</div>
      ))}
    </div>
  </div>
);

export default function DraftView({ draftState, selectedIds, onMove, onRemoveFromQueue, onConfirm, onBack, onShare }: DraftViewProps) {
  return (
    <>
      <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-700">Ajuste os Times</h2>
          <div className="flex gap-2">
              <button onClick={onShare} className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-green-200"><Share2 size={14}/> Zap</button>
              <button onClick={onBack} className="text-red-500 text-xs font-bold border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50">Voltar</button>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DraftColumn 
            title="Time Vermelho" 
            color="red" 
            players={draftState.red} 
            onMove={(pid) => onMove(pid, 'red', 'blue')} 
            onKick={(pid) => onMove(pid, 'red', 'queue')} 
        />
        <DraftColumn 
            title="Time Azul" 
            color="blue" 
            players={draftState.blue} 
            onMove={(pid) => onMove(pid, 'blue', 'red')} 
            onKick={(pid) => onMove(pid, 'blue', 'queue')} 
        />
        
        <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
          <h3 className="font-bold text-slate-600 mb-3">Banco / Fila</h3>
          <div className="space-y-2">
            {draftState.queue.map(p => {
              const arrivalIndex = selectedIds.indexOf(p.id);
              return (
                  <div key={p.id} className="bg-white p-2 rounded border flex justify-between items-center">
                  <div className="flex items-center gap-2">
                      {arrivalIndex !== -1 && <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-6 text-center">{arrivalIndex + 1}º</span>}
                      <span className="text-sm font-medium text-slate-700">{p.name}</span>
                  </div>
                  <div className="flex gap-1">
                      <button onClick={() => onMove(p.id, 'queue', 'red')} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200 font-bold">V</button>
                      <button onClick={() => onMove(p.id, 'queue', 'blue')} className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200 font-bold">A</button>
                      <button onClick={() => onRemoveFromQueue(p.id)} title="Foi embora" className="text-xs bg-slate-200 text-slate-500 px-2 py-1 rounded hover:bg-slate-300"><LogOut size={12}/></button>
                  </div>
                  </div>
              );
            })}
            {draftState.queue.length === 0 && <p className="text-xs text-slate-400">Ninguém no banco.</p>}
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-center">
          <button onClick={onConfirm} className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg active:scale-95 flex items-center gap-2"><CheckCircle2 /> Confirmar e Jogar</button>
      </div>
    </>
  );
}