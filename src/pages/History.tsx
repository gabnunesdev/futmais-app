import { CalendarDays, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { playerService } from "../services/playerService";
import { statsService } from "../services/statsService";
import type { MatchHistoryItem } from "../types";

export default function History() {
  const [matches, setMatches] = useState<MatchHistoryItem[]>([]);
  const [players, setPlayers] = useState<Map<string, string>>(new Map()); // Map ID -> Nome
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const [historyData, playersData] = await Promise.all([
        statsService.getHistory(),
        playerService.getAll(),
      ]);

      // Cria mapa de nomes para acesso rápido
      const pMap = new Map();
      playersData.forEach((p) => pMap.set(p.id, p.name));
      setPlayers(pMap);

      setMatches(historyData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Agrupar por Data (Lógica de "Racha")
  const groupedMatches = matches.reduce((acc, match) => {
    if (!acc[match.date]) acc[match.date] = [];
    acc[match.date].push(match);
    return acc;
  }, {} as Record<string, MatchHistoryItem[]>);

  return (
    <Layout title="Histórico de Jogos">
      {loading ? (
        <div className="text-center py-10 text-slate-400">
          Carregando jogos...
        </div>
      ) : matches.length === 0 ? (
        <p className="text-center py-10 text-slate-400">
          Nenhuma partida finalizada ainda.
        </p>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedMatches).map(([date, dayMatches]) => (
            <div key={date}>
              <h3 className="flex items-center gap-2 font-bold text-slate-500 mb-3 text-sm uppercase tracking-wider">
                <CalendarDays size={16} /> {date}
              </h3>

              <div className="space-y-3">
                {dayMatches.map((match, idx) => (
                  <div
                    key={match.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                  >
                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center text-xs text-slate-500">
                      <span className="font-bold">
                        Jogo {dayMatches.length - idx}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {match.time}
                      </span>
                    </div>

                    <div className="p-4 flex items-center justify-between">
                      {/* Time Red */}
                      <div className="flex-1 text-center">
                        <div
                          className={`text-2xl font-black ${
                            match.scoreRed > match.scoreBlue
                              ? "text-red-600"
                              : "text-slate-400"
                          }`}
                        >
                          {match.scoreRed}
                        </div>
                        <div className="text-xs text-red-600 font-bold uppercase mt-1">
                          Vermelho
                        </div>
                      </div>

                      <div className="text-slate-300 font-light text-xl">X</div>

                      {/* Time Blue */}
                      <div className="flex-1 text-center">
                        <div
                          className={`text-2xl font-black ${
                            match.scoreBlue > match.scoreRed
                              ? "text-blue-600"
                              : "text-slate-400"
                          }`}
                        >
                          {match.scoreBlue}
                        </div>
                        <div className="text-xs text-blue-600 font-bold uppercase mt-1">
                          Azul
                        </div>
                      </div>
                    </div>

                    {/* Detalhes dos Times (Expansível ou Pequeno) */}
                    <div className="px-4 pb-3 pt-0 text-xs text-slate-400 text-center">
                      <p>
                        <span className="font-bold">Elenco V:</span>{" "}
                        {match.teamRed
                          .map((id) => players.get(id)?.split(" ")[0])
                          .join(", ")}
                      </p>
                      <p className="mt-1">
                        <span className="font-bold">Elenco A:</span>{" "}
                        {match.teamBlue
                          .map((id) => players.get(id)?.split(" ")[0])
                          .join(", ")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
