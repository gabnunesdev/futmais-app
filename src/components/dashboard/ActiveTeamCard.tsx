import { type Team, type Player, type PlayerStats } from '../../types';
import { Timer } from 'lucide-react';

interface ActiveTeamCardProps {
  color: 'red' | 'blue';
  team: Team;
  score: number;
  stats: Record<string, PlayerStats>;
  onPlayerClick: (player: Player) => void;
  suspendedPlayers?: Record<string, number>; // playerId -> seconds remaining
  lobbyOrder: string[];
}

export default function ActiveTeamCard({ 
  color, 
  team, 
  score, 
  stats, 
  onPlayerClick, 
  suspendedPlayers = {},
  lobbyOrder 
}: ActiveTeamCardProps) {
  const isRed = color === 'red';
  
  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border-t-4 ${isRed ? 'border-red-500' : 'border-blue-500'} flex flex-col h-full`}>
       <div className="flex justify-between items-center mb-4">
          <h3 className={`font-bold uppercase ${isRed ? 'text-red-600' : 'text-blue-600'}`}>{team.name}</h3>
          <span className="text-4xl font-black text-slate-800">{score}</span>
       </div>
       
       <div className="flex-1 space-y-2 mb-4">
         {team.players.map((p: Player) => {
           const pStats = stats[p.id] || { goals: 0, assists: 0, yellowCards: 0, redCards: 0 };
           const arrivalIndex = lobbyOrder.indexOf(p.id);
           const arrivalDisplay = arrivalIndex !== -1 ? `${arrivalIndex + 1}º` : '-';
           
           const isSuspended = (suspendedPlayers[p.id] || 0) > 0;
           const remainingTime = suspendedPlayers[p.id] || 0;
           const minutes = Math.floor(remainingTime / 60);
           const seconds = remainingTime % 60;
           const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

           return (
             <div 
                key={p.id} 
                onClick={() => onPlayerClick(p)}
                className={`flex items-center justify-between text-sm border-b border-slate-50 pb-2 cursor-pointer hover:bg-slate-50 transition-colors p-2 rounded-lg ${isSuspended ? 'opacity-70 bg-red-50' : ''}`}
             >
               
               <div className="flex items-center gap-2">
                 <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 rounded" title="Ordem de Chegada">
                    {arrivalDisplay}
                 </span>
                 
                 <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                        <span className="text-slate-700 font-bold leading-tight">{p.name}</span>
                        {isSuspended && (
                            <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-white px-1.5 rounded-full shadow-sm ml-2">
                                <Timer size={12}/> {timeDisplay}
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] text-yellow-500 font-medium">
                        {'⭐'.repeat(p.stars)} ({p.stars})
                    </span>
                 </div>
               </div>

               <div className="flex gap-1 items-center">
                 {/* Cartões */}
                 {[...Array(pStats.yellowCards || 0)].map((_, i) => (
                    <div key={`yc-${i}`} className="w-3 h-4 bg-yellow-400 rounded-sm border border-yellow-600" title="Cartão Amarelo" />
                 ))}
                 {[...Array(pStats.redCards || 0)].map((_, i) => (
                    isSuspended ? (
                        <div key={`rc-${i}`} className="w-3 h-4 bg-red-600 rounded-sm border border-red-800" title="Cartão Vermelho (Suspenso)" />
                    ) : null
                 ))}

                 {/* Gols e Assistências */}
                 {(pStats.goals > 0 || pStats.assists > 0) && (
                     <div className="flex gap-1 ml-1 border-l pl-1 border-slate-200">
                        {[...Array(pStats.goals)].map((_, i) => <span key={`g-${i}`} title="Gol">⚽</span>)}
                        {[...Array(pStats.assists)].map((_, i) => <span key={`a-${i}`} title="Assistência">👟</span>)}
                     </div>
                 )}
               </div>
             </div>
           );
         })}
       </div>
       
       <div className="text-center text-xs text-slate-400 font-medium py-2">
         Toque no jogador para ações
       </div>
    </div>
  );
}
