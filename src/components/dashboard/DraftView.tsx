import { type Player } from '../../types';
import { ArrowRightLeft, CheckCircle2, Share2, LogOut, Shuffle } from 'lucide-react';
import { PLAYERS_PER_TEAM } from '../../domain/matchmaking/balancer';

// 1. Interface da Coluna
interface DraftColumnProps {
  title: string;
  color: 'red' | 'blue';
  players: Player[];
  lobbyOrder: string[];
  onMove: (playerId: string) => void;
  onKick: (playerId: string) => void;
}

// 2. Interface Principal Atualizada
interface DraftViewProps {
  draftState: { red: Player[], blue: Player[], queue: Player[] };
  selectedIds: string[];
  onMove: (pid: string, from: 'red' | 'blue' | 'queue', to: 'red' | 'blue' | 'queue') => void;
  onRemoveFromQueue: (pid: string) => void;
  onConfirm: () => void;
  onBack: () => void;
  onShare: () => void;
  onShuffle?: () => void; // <--- Nova prop opcional para o sorteio
}

// 3. Componente da Coluna (Mantido igual)
const DraftColumn = ({ title, color, players, lobbyOrder, onMove, onKick }: DraftColumnProps) => (
  <div className={`p-3 rounded-xl border-t-4 bg-white shadow-sm ${color === 'red' ? 'border-red-500' : 'border-blue-500'}`}>
    <h3 className={`font-bold uppercase text-xs mb-3 flex justify-between ${color === 'red' ? 'text-red-600' : 'text-blue-600'}`}>
        <span>{title}</span>
        <span>{players.length}</span>
    </h3>
    
    <div className="space-y-2">
      {players.map((p: Player) => {
        const arrivalIndex = lobbyOrder.indexOf(p.id);
        const arrivalText = arrivalIndex !== -1 ? `${arrivalIndex + 1}º` : '-';

        return (
            <div key={p.id} className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100 group hover:border-blue-200 transition-colors">
            
            {/* LADO ESQUERDO: INFOS */}
            <div className="flex items-center gap-2 overflow-hidden">
                <div className="min-w-6 h-6 flex items-center justify-center bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-500 shadow-sm" title={`Chegou em ${arrivalText}`}>
                    {arrivalText}
                </div>
                
                <div className="flex flex-col truncate">
                    <span className="text-sm font-bold text-slate-700 leading-tight truncate">{p.name}</span>
                    <span className="text-[10px] text-yellow-500 font-medium">
                        {'⭐'.repeat(p.stars)}
                    </span>
                </div>
            </div>

            {/* LADO DIREITO: AÇÕES */}
            <div className="flex gap-1 shrink-0">
                <button onClick={() => onMove(p.id)} title="Trocar de Time" className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 rounded-lg transition-colors">
                    <ArrowRightLeft size={14}/>
                </button>
                <button onClick={() => onKick(p.id)} title="Mandar para o Banco" className="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-300 rounded-lg transition-colors">
                    <span className="font-bold text-xs px-1">X</span>
                </button>
            </div>
            </div>
        );
      })}
      
      {/* Slots Vazios */}
      {[...Array(Math.max(0, PLAYERS_PER_TEAM - players.length))].map((_, i) => (
        <div key={i} className="h-10 border-2 border-dashed border-slate-100 rounded flex items-center justify-center text-[10px] text-slate-300 uppercase tracking-widest">
            Vaga aberta
        </div>
      ))}
    </div>
  </div>
);

// 4. Componente Principal Atualizado
export default function DraftView({ draftState, selectedIds, onMove, onRemoveFromQueue, onConfirm, onBack, onShare, onShuffle }: DraftViewProps) {
  return (
    <>
      <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-700">Ajuste os Times</h2>
          <div className="flex gap-2">
              {/* BOTÃO DE SORTEIO NOVO */}
              {onShuffle && (
                <button 
                  onClick={onShuffle} 
                  className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-slate-200 border border-slate-200"
                  title="Sortear novamente (Equilibrado)"
                >
                    <Shuffle size={14}/> <span className="hidden sm:inline">Sortear</span>
                </button>
              )}

              <button onClick={onShare} className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-green-200 border border-green-200">
                  <Share2 size={14}/> <span className="hidden sm:inline">Zap</span>
              </button>
              
              <button onClick={onBack} className="text-red-500 text-xs font-bold border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50">
                  Voltar
              </button>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DraftColumn 
            title="Time Vermelho" 
            color="red" 
            players={draftState.red} 
            lobbyOrder={selectedIds} 
            onMove={(pid) => onMove(pid, 'red', 'blue')} 
            onKick={(pid) => onMove(pid, 'red', 'queue')} 
        />
        
        <DraftColumn 
            title="Time Azul" 
            color="blue" 
            players={draftState.blue} 
            lobbyOrder={selectedIds}
            onMove={(pid) => onMove(pid, 'blue', 'red')} 
            onKick={(pid) => onMove(pid, 'blue', 'queue')} 
        />
        
        {/* COLUNA DO BANCO / FILA */}
        <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
          <h3 className="font-bold text-slate-600 text-xs uppercase mb-3">Banco / Próximos</h3>
          <div className="space-y-2">
            {draftState.queue.map(p => {
              const arrivalIndex = selectedIds.indexOf(p.id);
              const arrivalText = arrivalIndex !== -1 ? `${arrivalIndex + 1}º` : '-';
              
              return (
                  <div key={p.id} className="bg-white p-2 rounded border flex justify-between items-center">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded min-w-6 text-center" title="Ordem de chegada">
                            {arrivalText}
                        </span>
                        <div className="flex flex-col truncate">
                            <span className="text-sm font-medium text-slate-700 truncate">{p.name}</span>
                            <span className="text-[10px] text-yellow-500 leading-none">{'⭐'.repeat(p.stars)}</span>
                        </div>
                    </div>
                    
                    <div className="flex gap-1 shrink-0">
                        <button onClick={() => onMove(p.id, 'queue', 'red')} className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200 font-bold border border-red-200">VER</button>
                        <button onClick={() => onMove(p.id, 'queue', 'blue')} className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200 font-bold border border-blue-200">AZU</button>
                        <button onClick={() => onRemoveFromQueue(p.id)} title="Foi embora" className="text-xs bg-slate-100 text-slate-400 px-2 py-1 rounded hover:bg-slate-200 border border-slate-200"><LogOut size={12}/></button>
                    </div>
                  </div>
              );
            })}
            {draftState.queue.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Ninguém no banco.</p>}
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-center pb-8">
          <button onClick={onConfirm} className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg active:scale-95 flex items-center gap-2 hover:bg-green-700 transition-colors"><CheckCircle2 /> Confirmar e Jogar</button>
      </div>
    </>
  );
}