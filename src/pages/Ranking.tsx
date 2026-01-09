import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { statsService, type RankingItem } from '../services/statsService';
import { playerService } from '../services/playerService';
import { Trophy } from 'lucide-react'; // CORREÇÃO: Removidos imports não usados

type Period = 'TODAY' | 'MONTH' | 'YEAR' | 'ALL';

export default function Ranking() {
  const [period, setPeriod] = useState<Period>('TODAY');
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // CORREÇÃO: Função movida para dentro do useEffect
  useEffect(() => {
    const loadRanking = async () => {
      setLoading(true);
      try {
        const players = await playerService.getAll();
        
        const now = new Date();
        let start = new Date(0).toISOString();
        const end = new Date().toISOString();

        if (period === 'TODAY') {
          const today = new Date();
          today.setHours(0,0,0,0);
          start = today.toISOString();
        } else if (period === 'MONTH') {
          const month = new Date(now.getFullYear(), now.getMonth(), 1);
          start = month.toISOString();
        } else if (period === 'YEAR') {
          const year = new Date(now.getFullYear(), 0, 1);
          start = year.toISOString();
        }

        const data = await statsService.getRanking(start, end, players);
        setRanking(data.filter(p => p.goals > 0 || p.assists > 0)); 
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadRanking();
  }, [period]); // Agora a única dependência real é o 'period'

  return (
    <Layout title="Ranking">
      {/* Filtros */}
      <div className="bg-white p-2 rounded-xl shadow-sm mb-6 flex justify-between gap-2 overflow-x-auto">
         {[
           { id: 'TODAY', label: 'Hoje' },
           { id: 'MONTH', label: 'Este Mês' },
           { id: 'YEAR', label: 'Este Ano' },
           { id: 'ALL', label: 'Geral' },
         ].map(f => (
           <button 
             key={f.id}
             onClick={() => setPeriod(f.id as Period)}
             className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
               period === f.id ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
             }`}
           >
             {f.label}
           </button>
         ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-400">Calculando estatísticas...</div>
      ) : ranking.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl border border-dashed">
          <Trophy className="mx-auto text-slate-300 mb-2" size={40}/>
          <p className="text-slate-500">Nenhum gol registrado neste período.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top 3 Cards */}
          <div className="grid grid-cols-3 gap-2 mb-4 items-end">
            {/* 2º Lugar */}
            {ranking[1] && <TopPlayerCard player={ranking[1]} place={2} />}
            {/* 1º Lugar */}
            {ranking[0] && <TopPlayerCard player={ranking[0]} place={1} />}
            {/* 3º Lugar */}
            {ranking[2] && <TopPlayerCard player={ranking[2]} place={3} />}
          </div>

          {/* Lista Restante */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Jogador</th>
                  <th className="p-3 text-center">⚽</th>
                  <th className="p-3 text-center">👟</th>
                </tr>
              </thead>
              <tbody>
                {ranking.slice(3).map((p, idx) => (
                  <tr key={p.playerId} className="border-t border-slate-100">
                    <td className="p-3 text-slate-400 font-mono">{idx + 4}</td>
                    <td className="p-3 font-medium text-slate-700">{p.name}</td>
                    <td className="p-3 text-center font-bold text-slate-800">{p.goals}</td>
                    <td className="p-3 text-center text-slate-500">{p.assists}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}

const TopPlayerCard = ({ player, place }: { player: RankingItem, place: number }) => {
  const colors = {
    1: 'bg-yellow-100 border-yellow-400 text-yellow-800 h-40',
    2: 'bg-slate-100 border-slate-300 text-slate-700 h-32',
    3: 'bg-orange-100 border-orange-300 text-orange-800 h-28',
  };

  return (
    <div className={`flex flex-col items-center justify-end p-2 rounded-t-xl border-b-4 ${colors[place as 1|2|3]} shadow-sm`}>
      <div className="mb-2 font-black text-2xl">{place}º</div>
      <div className="font-bold text-sm text-center leading-tight mb-1">{player.name}</div>
      <div className="text-xs font-medium opacity-80">{player.goals} Gols</div>
    </div>
  );
};