import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { playerService } from '../services/playerService';
import { supabase } from '../services/supabase';
import { Trophy, Loader2, Goal, ArrowDownUp, Filter, X } from 'lucide-react';

// REMOVIDO: import do date-fns para corrigir o erro de "unused var"

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
  const [sortBy, setSortBy] = useState<'GOALS' | 'ASSISTS'>('GOALS');
  
  // FILTROS DE DATA
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number | 'ALL'>('ALL');
  const [month, setMonth] = useState<number | 'ALL'>('ALL');
  const [day, setDay] = useState<number | 'ALL'>('ALL');

  const [stats, setStats] = useState<RankingItem[]>([]);
  const [winsRanking, setWinsRanking] = useState<WinsItem[]>([]);

  // CORREÇÃO DO USEEFFECT: A função loadRankings agora está DENTRO dele
  useEffect(() => {
    const loadRankings = async () => {
        try {
          setLoading(true);

          // Lógica de Data Nativa (Sem date-fns)
          let start: string | null = null;
          let end: string | null = null;

          if (year !== 'ALL') {
            const y = Number(year);
            // Padrão: Ano inteiro
            let startDate = new Date(y, 0, 1);
            let endDate = new Date(y, 11, 31, 23, 59, 59);

            if (month !== 'ALL') {
                const m = Number(month);
                // Mês específico
                startDate = new Date(y, m, 1);
                // Último dia do mês (truque do dia 0 do mês seguinte)
                endDate = new Date(y, m + 1, 0, 23, 59, 59);

                if (day !== 'ALL') {
                    const d = Number(day);
                    // Dia específico
                    startDate = new Date(y, m, d);
                    endDate = new Date(y, m, d, 23, 59, 59);
                }
            }
            
            // Ajuste de fuso horário simples para ISO string não voltar um dia
            // (Enviamos o ISO direto, o banco vai comparar UTC com UTC)
            start = startDate.toISOString();
            end = endDate.toISOString();
          }

          // 1. QUERY DE GOLS/ASSISTÊNCIAS COM FILTRO
          let query = supabase
              .from('match_events')
              .select('*, players(name)')
              .order('created_at', { ascending: false });
          
          if (start && end) {
            query = query.gte('created_at', start).lte('created_at', end);
          }

          const { data: allEvents } = await query;

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
          setStats(Object.values(statsMap));

          // 2. QUERY DE VITÓRIAS COM FILTRO (RPC)
          const winsData = await playerService.getRankingWins(
              start || undefined, 
              end || undefined
          );
          setWinsRanking(winsData || []);

        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };

      loadRankings();

  }, [year, month, day]); // Dependências corretas

  // ORDENAÇÃO VISUAL
  const displayedStats = [...stats].sort((a, b) => {
      if (sortBy === 'GOALS') return b.goals - a.goals || b.assists - a.assists;
      return b.assists - a.assists || b.goals - a.goals;
  });

  // OPÇÕES DOS SELECTS
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const daysInMonth = (month !== 'ALL' && year !== 'ALL') 
    ? new Date(Number(year), Number(month) + 1, 0).getDate() 
    : 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <Layout title="Ranking Geral">
      
      {/* --- ÁREA DE FILTROS --- */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="flex items-center gap-2 mb-3 text-slate-500 font-bold text-sm uppercase tracking-wider">
              <Filter size={16} /> Filtrar Período
          </div>
          <div className="flex gap-2">
              {/* ANO */}
              <select 
                  value={year} 
                  onChange={(e) => {
                      setYear(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value));
                      setMonth('ALL');
                      setDay('ALL');
                  }}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 flex-1 focus:ring-blue-500 focus:border-blue-500 font-semibold"
              >
                  <option value="ALL">Todo o tempo</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>

              {/* MÊS */}
              <select 
                  value={month} 
                  onChange={(e) => {
                      setMonth(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value));
                      setDay('ALL');
                  }}
                  disabled={year === 'ALL'}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 flex-1 focus:ring-blue-500 focus:border-blue-500 font-semibold disabled:opacity-50"
              >
                  <option value="ALL">Todos os meses</option>
                  {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>

              {/* DIA */}
              <select 
                  value={day} 
                  onChange={(e) => setDay(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                  disabled={month === 'ALL'}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 w-20 focus:ring-blue-500 focus:border-blue-500 font-semibold disabled:opacity-50"
              >
                  <option value="ALL">Todos</option>
                  {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
          </div>
          
          {year !== 'ALL' && (
             <button 
                onClick={() => { setYear('ALL'); setMonth('ALL'); setDay('ALL'); }}
                className="mt-2 text-xs text-red-500 font-bold flex items-center gap-1 hover:text-red-700"
             >
                <X size={12} /> Limpar Filtros
             </button>
          )}
      </div>

      {/* --- ABAS --- */}
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
        <div className="max-w-md mx-auto space-y-3 pb-20">
          
          {/* CONTEÚDO ARTILHARIA */}
          {tab === 'GOALS' && (
            <>
                <div className="flex justify-between items-center px-2 mb-2 animate-in fade-in">
                    <span className="text-xs font-bold text-slate-400">
                        {year === 'ALL' ? 'Histórico Geral' : `${year} ${month !== 'ALL' ? `• ${months[Number(month)]}` : ''}`}
                    </span>
                    
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400"><ArrowDownUp size={12}/></span>
                        <div className="flex bg-slate-100 rounded-lg p-0.5">
                            <button onClick={() => setSortBy('GOALS')} className={`text-[10px] px-2 py-1 rounded-md font-bold ${sortBy === 'GOALS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Gols</button>
                            <button onClick={() => setSortBy('ASSISTS')} className={`text-[10px] px-2 py-1 rounded-md font-bold ${sortBy === 'ASSISTS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Assis</button>
                        </div>
                    </div>
                </div>

                {displayedStats.map((player, index) => (
                    <div key={player.playerId} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all">
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
                            <div className={`flex flex-col items-end ${sortBy === 'ASSISTS' ? 'opacity-40' : ''}`}>
                                <span className="font-black text-blue-600 text-lg leading-none">{player.goals}</span>
                                <span className="text-[10px] text-slate-400 uppercase font-bold">Gols</span>
                            </div>
                            <div className={`flex flex-col items-end w-8 ${sortBy === 'GOALS' ? 'opacity-40' : ''}`}>
                                <span className={`font-black text-lg leading-none ${sortBy === 'ASSISTS' ? 'text-blue-600' : 'text-slate-400'}`}>{player.assists}</span>
                                <span className="text-[10px] text-slate-300 uppercase font-bold">Assis</span>
                            </div>
                        </div>
                    </div>
                ))}
                {displayedStats.length === 0 && <div className="text-center text-slate-400 py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">Nenhum dado neste período.</div>}
            </>
          )}

          {/* CONTEÚDO VITÓRIAS */}
          {tab === 'WINS' && (
            <>
              <div className="flex justify-start px-2 mb-2">
                 <span className="text-xs font-bold text-slate-400">
                    {year === 'ALL' ? 'Histórico Geral' : `${year} ${month !== 'ALL' ? `• ${months[Number(month)]}` : ''}`}
                 </span>
              </div>

              {winsRanking.map((player, index) => (
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
              {winsRanking.length === 0 && <div className="text-center text-slate-400 py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">Nenhuma vitória neste período.</div>}
            </>
          )}

        </div>
      )}
    </Layout>
  );
}