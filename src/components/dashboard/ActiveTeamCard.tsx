import { type Team, type Player } from '../../types';
import { Plus } from 'lucide-react';

interface ActiveTeamCardProps {
  color: 'red' | 'blue';
  team: Team;
  score: number;
  stats: Record<string, { goals: number; assists: number }>;
  onGoal: () => void;
  // Nova prop para saber a ordem de chegada original
  lobbyOrder: string[];
}

export default function ActiveTeamCard({ color, team, score, stats, onGoal, lobbyOrder }: ActiveTeamCardProps) {
  const isRed = color === 'red';
  
  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border-t-4 ${isRed ? 'border-red-500' : 'border-blue-500'} flex flex-col h-full`}>
       <div className="flex justify-between items-center mb-4">
          <h3 className={`font-bold uppercase ${isRed ? 'text-red-600' : 'text-blue-600'}`}>{team.name}</h3>
          <span className="text-4xl font-black text-slate-800">{score}</span>
       </div>
       
       <div className="flex-1 space-y-2 mb-4">
         {team.players.map((p: Player) => {
           const pStats = stats[p.id] || { goals: 0, assists: 0 };
           // Calcula a posição de chegada
           const arrivalIndex = lobbyOrder.indexOf(p.id);
           const arrivalDisplay = arrivalIndex !== -1 ? `${arrivalIndex + 1}º` : '-';

           return (
             <div key={p.id} className="flex items-center justify-between text-sm border-b border-slate-50 pb-2">
               
               <div className="flex items-center gap-2">
                 {/* Feedback da Ordem de Chegada (Lado Esquerdo) */}
                 <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 rounded" title="Ordem de Chegada">
                    {arrivalDisplay}
                 </span>
                 
                 <div className="flex flex-col">
                    <span className="text-slate-700 font-bold leading-tight">{p.name}</span>
                    {/* Feedback das Estrelas (Abaixo ou ao lado do nome) */}
                    <span className="text-[10px] text-yellow-500 font-medium">
                        {'⭐'.repeat(p.stars)} ({p.stars})
                    </span>
                 </div>
               </div>

               <div className="flex gap-1">
                 {[...Array(pStats.goals)].map((_, i) => <span key={`g-${i}`} title="Gol">⚽</span>)}
                 {[...Array(pStats.assists)].map((_, i) => <span key={`a-${i}`} title="Assistência">👟</span>)}
               </div>
             </div>
           );
         })}
       </div>
       
       <button onClick={onGoal} className={`w-full py-3 rounded-xl font-bold flex justify-center gap-2 ${isRed ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
         <Plus size={18}/> GOL
       </button>
    </div>
  );
}