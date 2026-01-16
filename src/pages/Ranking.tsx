import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { playerService } from '../services/playerService';
import { supabase } from '../services/supabase';
import { Trophy, Loader2, Goal, ArrowDownUp } from 'lucide-react';

type RankingItem = {
  playerId: string;
  name: string;
  goals: number;
  assists: number;
};

type WinsItem = {
  player_id: string;
  name: string;
  wins: number;
};

export default function Ranking() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'GOALS' | 'WINS'>('GOALS');
  
  // Novo estado para controlar a ordenação interna da Artilharia
  const [sortBy, setSortBy] = useState<'GOALS' | 'ASSISTS'>('GOALS');
  
  const [stats, setStats] = useState<RankingItem[]>([]);
  const [winsRanking, setWinsRanking] = useState<WinsItem[]>([]);

  useEffect(() => {
    loadRankings();
  }, []);

  const loadRankings = async () => {
    try {
      setLoading(true);
      
      // 1. Carrega Gols/Assistências
      const { data: allEvents } = await supabase
          .from('match_events')
          .select('*, players(name)')
          .order('created_at', { ascending: false });

      const statsMap: Record<string, RankingItem> = {};
      
      if (allEvents) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        allEvents.forEach((ev: any) => {
            if (!statsMap[ev.player_id]) {
                statsMap[ev.player_id] = { 
                    playerId: ev.player_id, 
                    name: ev.players?.name || 'Desconhecido', 
                    goals: 0, 
                    assists: 0 
                };
            }
            if (ev.event_type === 'GOAL') statsMap[ev.player_id].goals++;
            if (ev.event_type === 'ASSIST') statsMap[ev.player_id].assists++;
        });
      }
      // A ordenação inicial não importa tanto aqui, pois faremos no render
      setStats(Object.values(statsMap));

      // 2. Carrega Ranking de Vitórias
      const winsData = await playerService.getRankingWins();
      setWinsRanking(winsData || []);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Lógica de Ordenação Dinâmica
  const displayedStats = [...stats].sort((a, b) => {
      if (sortBy === 'GOALS') {
          // Prioriza Gols. Desempate: Assistências
          return b.goals - a.goals || b.assists - a.assists;
      } else {
          // Prioriza Assistências. Desempate: Gols
          return b.assists - a.assists || b.goals - a.goals;
      }
  });

  return (
    <Layout title="Ranking Geral">
      
      {/* Abas Principais */}
      <div className="flex p-1 bg-slate-100 rounded-xl mb-4 mx-auto max-w-md">
        <button
          onClick={() => setTab('GOALS')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
            tab === 'GOALS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Goal size={16} /> Artilharia
        </button>
        <button
          onClick={() => setTab('WINS')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
            tab === 'WINS' ? 'bg-white text-yellow-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Trophy size={16} /> Vitórias
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="animate-spin text-slate-400"/></div>
      ) : (
        <div className="max-w-md mx-auto space-y-3">
          
          {/* PAINEL DE ARTILHARIA */}
          {tab === 'GOALS' && (
            <>
                {/* Filtro de Ordenação (Gols vs Assistências) */}
                <div className="flex justify-end items-center gap-2 px-2 mb-2 animate-in fade-in slide-in-from-top-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <ArrowDownUp size={12}/> Ordenar por:
                    </span>
                    <button 
                        onClick={() => setSortBy('GOALS')}
                        className={`text-xs px-2 py-1 rounded-md font-bold transition-colors ${
                            sortBy === 'GOALS' ? 'bg-blue-100 text-blue-700' : 'text-slate-400 hover:bg-slate-100'
                        }`}
                    >
                        Gols
                    </button>
                    <button 
                        onClick={() => setSortBy('ASSISTS')}
                        className={`text-xs px-2 py-1 rounded-md font-bold transition-colors ${
                            sortBy === 'ASSISTS' ? 'bg-blue-100 text-blue-700' : 'text-slate-400 hover:bg-slate-100'
                        }`}
                    >
                        Assistências
                    </button>
                </div>

                {/* Lista Ordenada */}
                {displayedStats.map((player, index) => (
                    <div key={player.playerId} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:border-blue-200">
                    <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                        index === 1 ? 'bg-slate-100 text-slate-700' : 
                        index === 2 ? 'bg-orange-100 text-orange-700' : 'text-slate-400'
                    }`}>
                        {index + 1}º
                    </div>
                    <div className="flex-1">
                        <div className="font-bold text-slate-800">{player.name}</div>
                    </div>
                    <div className="flex gap-4 text-right">
                        {/* Coluna Gols */}
                        <div className={`flex flex-col items-end transition-opacity ${sortBy === 'ASSISTS' ? 'opacity-40' : 'opacity-100'}`}>
                            <span className="font-black text-blue-600 text-lg leading-none">{player.goals}</span>
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Gols</span>
                        </div>
                        {/* Coluna Assistências */}
                        <div className={`flex flex-col items-end w-8 transition-opacity ${sortBy === 'GOALS' ? 'opacity-40' : 'opacity-100'}`}>
                            <span className={`font-black text-lg leading-none ${sortBy === 'ASSISTS' ? 'text-blue-600' : 'text-slate-400'}`}>
                                {player.assists}
                            </span>
                            <span className="text-[10px] text-slate-300 uppercase font-bold">Assis</span>
                        </div>
                    </div>
                    </div>
                ))}
                {displayedStats.length === 0 && <div className="text-center text-slate-400 py-10">Nenhum dado registrado.</div>}
            </>
          )}


          {/* PAINEL DE VITÓRIAS */}
          {tab === 'WINS' && winsRanking.map((player, index) => (
            <div key={player.player_id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
               <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${
                   index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                   index === 1 ? 'bg-slate-100 text-slate-700' : 
                   index === 2 ? 'bg-orange-100 text-orange-700' : 'text-slate-400'
               }`}>
                   {index + 1}º
               </div>
               <div className="flex-1">
                   <div className="font-bold text-slate-800">{player.name}</div>
               </div>
               <div className="flex items-center gap-2">
                   <Trophy size={16} className="text-yellow-500" />
                   <span className="font-black text-slate-800 text-xl">{player.wins}</span>
               </div>
            </div>
          ))}
          {tab === 'WINS' && winsRanking.length === 0 && <div className="text-center text-slate-400 py-10">Nenhuma vitória registrada.</div>}

        </div>
      )}
    </Layout>
  );
}