import {
  Activity,
  Loader2,
  PlayCircle,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { matchService } from "../services/matchService"; // Importamos o serviço

export default function Home() {
  const navigate = useNavigate();
  const [hasActiveMatch, setHasActiveMatch] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  // Verifica se tem jogo rolando assim que abre a Home
  useEffect(() => {
    const checkActiveMatch = async () => {
      try {
        console.log("Verificando se tem jogo ativo..."); // <--- ADICIONE ISSO
        const match = await matchService.getActiveMatch();
        console.log("Resultado da busca:", match); // <--- ADICIONE ISSO
        setHasActiveMatch(!!match);
      } catch (error) {
        console.error("Erro ao verificar partida ativa", error);
      } finally {
        setLoading(false);
      }
    };

    checkActiveMatch();
  }, []);

  const cards = [
    {
      // Lógica Dinâmica: Se tiver jogo, vira "Voltar para o Jogo" (Vermelho/Live)
      title: hasActiveMatch ? "Voltar para o Jogo" : "Iniciar Partida",
      description: hasActiveMatch
        ? "Partida em andamento! Clique para retomar o controle."
        : "Check-in, Sorteio de times e Cronômetro.",
      icon: hasActiveMatch ? Activity : PlayCircle,
      path: "/match",
      // Cores mudam para chamar atenção (Vermelho = Urgente/Live)
      color: hasActiveMatch ? "bg-red-600" : "bg-blue-600",
      textColor: hasActiveMatch ? "text-red-600" : "text-blue-600",
      bgColor: hasActiveMatch ? "bg-red-50" : "bg-blue-50",
      isLive: hasActiveMatch,
    },
    {
      title: "Gerenciar Elenco",
      description: "Cadastre novos craques ou edite as notas.",
      icon: Users,
      path: "/players",
      color: "bg-green-600",
      textColor: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Ranking da Galera",
      description: "Quem é o artilheiro? Quem mais venceu?",
      icon: Trophy,
      path: "/ranking",
      color: "bg-amber-500",
      textColor: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "Histórico",
      description: "Veja todos os jogos passados.",
      icon: TrendingUp,
      path: "/history",
      color: "bg-slate-600",
      textColor: "text-slate-600",
      bgColor: "bg-slate-50",
    },
  ];

  if (loading) {
    return (
      <Layout title="Painel Principal">
        <div className="flex justify-center items-center h-40">
          <Loader2 className="animate-spin text-slate-400" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Painel Principal">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card) => (
          <button
            key={card.path}
            onClick={() => navigate(card.path)}
            className={`relative flex flex-col text-left bg-white p-6 rounded-2xl shadow-sm border transition-all group active:scale-[0.98]
              ${
                card.isLive
                  ? "border-red-200 shadow-red-100 ring-1 ring-red-100"
                  : "border-slate-100 hover:shadow-md hover:border-slate-200"
              }
            `}
          >
            {/* Badge "EM ANDAMENTO" pulsante */}
            {card.isLive && (
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                EM ANDAMENTO
              </div>
            )}

            <div
              className={`w-12 h-12 ${card.bgColor} ${card.textColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
            >
              <card.icon size={28} />
            </div>

            <h3
              className={`text-lg font-bold mb-1 group-hover:opacity-80 transition-opacity ${
                card.isLive ? "text-red-700" : "text-slate-800"
              }`}
            >
              {card.title}
            </h3>

            <p className="text-sm text-slate-500">{card.description}</p>
          </button>
        ))}
      </div>

      {/* Resumo Rápido Inteligente */}
      <div className="mt-8 bg-linear-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg">
        {hasActiveMatch ? (
          <>
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
              ⚠️ Atenção, Admin!
            </h3>
            <p className="text-slate-300 text-sm mb-4">
              Existe uma partida rolando agora. Não esqueça de registrar os gols
              em tempo real.
            </p>
            <button
              onClick={() => navigate("/match")}
              className="text-sm font-bold bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg animate-bounce"
            >
              Voltar para o Jogo ⚽
            </button>
          </>
        ) : (
          <>
            <h3 className="font-bold text-lg mb-2">Próximo Jogo? ⚽</h3>
            <p className="text-slate-300 text-sm mb-4">
              Mantenha as notas dos jogadores atualizadas para garantir times
              equilibrados hoje.
            </p>
            <button
              onClick={() => navigate("/players")}
              className="text-sm font-bold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
            >
              Revisar Notas
            </button>
          </>
        )}
      </div>
    </Layout>
  );
}
