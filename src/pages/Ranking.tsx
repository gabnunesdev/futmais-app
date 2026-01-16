import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { supabase } from "../services/supabase";
import { playerService } from "../services/playerService";
import { Trophy, Loader2, Goal } from "lucide-react";

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
  const [tab, setTab] = useState<"GOALS" | "WINS">("GOALS");

  const [stats, setStats] = useState<RankingItem[]>([]);
  const [winsRanking, setWinsRanking] = useState<WinsItem[]>([]);

  useEffect(() => {
    loadRankings();
  }, []);

  const loadRankings = async () => {
    try {
      setLoading(true);

      // 1. Carrega Gols/Assistências (Query direta para garantir os dados)
      // REMOVIDO: const events = await matchService.getAllEvents(); <--- Linha que causava o erro

      const { data: allEvents } = await supabase
        .from("match_events")
        .select("*, players(name)")
        .order("created_at", { ascending: false });

      const statsMap: Record<string, RankingItem> = {};

      if (allEvents) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        allEvents.forEach((ev: any) => {
          if (!statsMap[ev.player_id]) {
            statsMap[ev.player_id] = {
              playerId: ev.player_id,
              name: ev.players?.name || "Desconhecido",
              goals: 0,
              assists: 0,
            };
          }
          if (ev.event_type === "GOAL") statsMap[ev.player_id].goals++;
          if (ev.event_type === "ASSIST") statsMap[ev.player_id].assists++;
        });
      }
      const sortedStats = Object.values(statsMap).sort(
        (a, b) => b.goals - a.goals || b.assists - a.assists
      );
      setStats(sortedStats);

      // 2. Carrega Ranking de Vitórias
      const winsData = await playerService.getRankingWins();
      setWinsRanking(winsData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Ranking Geral">
      {/* Abas de Navegação */}
      <div className="flex p-1 bg-slate-100 rounded-xl mb-6 mx-auto max-w-md">
        <button
          onClick={() => setTab("GOALS")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
            tab === "GOALS"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Goal size={16} /> Artilharia
        </button>
        <button
          onClick={() => setTab("WINS")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
            tab === "WINS"
              ? "bg-white text-yellow-600 shadow-sm"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Trophy size={16} /> Vitórias
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-10">
          <Loader2 className="animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="max-w-md mx-auto space-y-3">
          {/* LISTA DE ARTILHARIA */}
          {tab === "GOALS" &&
            stats.map((player, index) => (
              <div
                key={player.playerId}
                className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4"
              >
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${
                    index === 0
                      ? "bg-yellow-100 text-yellow-700"
                      : index === 1
                        ? "bg-slate-100 text-slate-700"
                        : index === 2
                          ? "bg-orange-100 text-orange-700"
                          : "text-slate-400"
                  }`}
                >
                  {index + 1}º
                </div>
                <div className="flex-1">
                  <div className="font-bold text-slate-800">{player.name}</div>
                </div>
                <div className="flex gap-4 text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-black text-blue-600 text-lg leading-none">
                      {player.goals}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">
                      Gols
                    </span>
                  </div>
                  <div className="flex flex-col items-end w-8">
                    <span className="font-bold text-slate-400 text-lg leading-none">
                      {player.assists}
                    </span>
                    <span className="text-[10px] text-slate-300 uppercase font-bold">
                      Assis
                    </span>
                  </div>
                </div>
              </div>
            ))}
          {tab === "GOALS" && stats.length === 0 && (
            <div className="text-center text-slate-400 py-10">
              Nenhum gol registrado.
            </div>
          )}

          {/* LISTA DE VITÓRIAS (NOVA) */}
          {tab === "WINS" &&
            winsRanking.map((player, index) => (
              <div
                key={player.player_id}
                className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4"
              >
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${
                    index === 0
                      ? "bg-yellow-100 text-yellow-700"
                      : index === 1
                        ? "bg-slate-100 text-slate-700"
                        : index === 2
                          ? "bg-orange-100 text-orange-700"
                          : "text-slate-400"
                  }`}
                >
                  {index + 1}º
                </div>
                <div className="flex-1">
                  <div className="font-bold text-slate-800">{player.name}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy size={16} className="text-yellow-500" />
                  <span className="font-black text-slate-800 text-xl">
                    {player.wins}
                  </span>
                </div>
              </div>
            ))}
          {tab === "WINS" && winsRanking.length === 0 && (
            <div className="text-center text-slate-400 py-10">
              Nenhuma vitória registrada.
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
