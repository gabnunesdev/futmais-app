import { type Player } from '../../types';
import { UserCheck, ArrowRightLeft, ArrowUp, ArrowDown, X } from 'lucide-react';
import { PLAYERS_PER_TEAM } from '../../domain/matchmaking/balancer';

interface LobbyViewProps {
  allPlayers: Player[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onMoveUp: (index: number) => void;   // Sobe na lista
  onMoveDown: (index: number) => void; // Desce na lista
  onProceed: () => void;
}

export default function LobbyView({ 
  allPlayers, 
  selectedIds, 
  onToggle, 
  onMoveUp, 
  onMoveDown, 
  onProceed 
}: LobbyViewProps) {
  
  // Filtra e ordena os jogadores baseado na lista de IDs (mantendo a ordem da fila)
  const selectedPlayers = selectedIds
    .map(id => allPlayers.find(p => p.id === id))
    .filter((p): p is Player => !!p);

  const unselectedPlayers = allPlayers.filter(p => !selectedIds.includes(p.id));

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
        <UserCheck /> Lista de Presença
      </h3>

      {/* --- ÁREA DOS JOGADORES NA FILA (ORDENADA) --- */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Ordem de Chegada ({selectedPlayers.length})
            </h4>
        </div>
        
        <div className="space-y-2">
            {selectedPlayers.map((player, index) => (
                <div key={player.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg animate-in slide-in-from-left-2 transition-all">
                    
                    {/* LADO ESQUERDO: Posição + Nome */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                            {index + 1}º
                        </div>
                        <div className="overflow-hidden">
                            <div className="font-bold text-slate-800 leading-tight truncate">{player.name}</div>
                            <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                                {'⭐'.repeat(player.stars)}
                            </div>
                        </div>
                    </div>

                    {/* LADO DIREITO: Controles */}
                    <div className="flex items-center gap-2">
                        
                        {/* Botões de Sobe/Desce (Estilo Elevador) */}
                        <div className="flex flex-col gap-1">
                            {/* Botão SUBIR */}
                            <button 
                                onClick={() => onMoveUp(index)}
                                disabled={index === 0}
                                className={`p-1 bg-white border border-blue-100 rounded text-blue-600 hover:bg-blue-100 disabled:opacity-0 disabled:pointer-events-none transition-all h-6 w-8 flex items-center justify-center`}
                                title="Subir (Chegou antes)"
                            >
                                <ArrowUp size={14} />
                            </button>

                            {/* Botão DESCER */}
                            <button 
                                onClick={() => onMoveDown(index)} 
                                disabled={index === selectedPlayers.length - 1}
                                className={`p-1 bg-white border border-blue-100 rounded text-blue-600 hover:bg-blue-100 disabled:opacity-0 disabled:pointer-events-none transition-all h-6 w-8 flex items-center justify-center`}
                                title="Descer (Chegou depois)"
                            >
                                <ArrowDown size={14} />
                            </button>
                        </div>

                        {/* Separador visual */}
                        <div className="w-px h-8 bg-blue-200 mx-1"></div>

                        {/* Botão Remover */}
                        <button 
                            onClick={() => onToggle(player.id)} 
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remover da lista"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            ))}
            
            {selectedPlayers.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
                    <p className="text-slate-400 text-sm font-medium">A lista está vazia.</p>
                    <p className="text-slate-300 text-xs mt-1">Clique nos nomes abaixo para adicionar.</p>
                </div>
            )}
        </div>
      </div>

      <hr className="my-6 border-slate-100"/>

      {/* --- ÁREA DE SELEÇÃO (DISPONÍVEIS) --- */}
      <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Toque para adicionar
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {unselectedPlayers.map((player) => (
                <button 
                    key={player.id} 
                    onClick={() => onToggle(player.id)} 
                    className="text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 text-sm transition-all truncate active:scale-95 flex items-center gap-2"
                >
                  <span className="text-blue-400 font-bold">+</span> {player.name}
                </button>
            ))}
            {unselectedPlayers.length === 0 && selectedPlayers.length > 0 && (
                <p className="text-slate-300 text-xs col-span-2 italic">Todos os jogadores foram adicionados.</p>
            )}
          </div>
      </div>

      {/* --- RODAPÉ --- */}
      <div className="flex justify-end mt-8 pt-4 border-t border-slate-100 sticky bottom-0 bg-white pb-2">
        <button 
            onClick={onProceed} 
            disabled={selectedIds.length < PLAYERS_PER_TEAM * 2} 
            className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-all shadow-lg active:scale-95 w-full md:w-auto justify-center"
        >
          <ArrowRightLeft size={20} /> 
          <span>Ir para Sorteio</span>
        </button>
      </div>
    </div>
  );
}