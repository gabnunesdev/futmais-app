import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import GoalModal from "../components/GoalModal";
import EventHistoryModal from "../components/EventHistoryModal";
import { playerService } from "../services/playerService";
import { matchService } from "../services/matchService";
import { lobbyService } from "../services/lobbyService";
import {
  generateTeams,
  PLAYERS_PER_TEAM,
} from "../domain/matchmaking/balancer";
import { type Player, type MatchState, type Team } from "../types";
import {
  Play,
  Pause,
  Timer,
  RotateCcw,
  Loader2,
  UserPlus,
  X,
  History,
  CheckCircle2,
} from "lucide-react";

import LobbyView from "../components/dashboard/LobbyView";
import DraftView from "../components/dashboard/DraftView";
import ActiveTeamCard from "../components/dashboard/ActiveTeamCard";
import GameOverModal, {
  type GameOverReason,
} from "../components/dashboard/GameOverModal";

type ViewState = "LOBBY" | "DRAFT" | "MATCH";
type PlayerStats = { goals: number; assists: number };

// --- MODAL ADD PLAYER (Mantido igual) ---
const AddLatePlayerModal = ({
  isOpen,
  onClose,
  players,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  onAdd: (ids: string[]) => void;
}) => {
  const [localSelected, setLocalSelected] = useState<string[]>([]);

  if (!isOpen) return null;

  const toggle = (id: string) => {
    if (localSelected.includes(id))
      setLocalSelected(localSelected.filter((sid) => sid !== id));
    else setLocalSelected([...localSelected, id]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <UserPlus size={20} /> Quem chegou agora?
          </h3>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="p-4 max-h-[50vh] overflow-y-auto grid grid-cols-2 gap-2">
          {players.length === 0 && (
            <p className="text-slate-500 col-span-2 text-center py-4">
              Todo mundo já está no jogo!
            </p>
          )}
          {players.map((p: Player) => (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              className={`p-3 rounded-lg border text-left flex justify-between items-center ${
                localSelected.includes(p.id)
                  ? "bg-blue-50 border-blue-500 ring-1 ring-blue-500"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <span className="font-semibold text-slate-800 text-sm">
                {p.name}
              </span>
              {localSelected.includes(p.id) && (
                <CheckCircle2 size={16} className="text-blue-600" />
              )}
            </button>
          ))}
        </div>
        <div className="p-4 border-t bg-slate-50 flex justify-end">
          <button
            onClick={() => {
              onAdd(localSelected);
              onClose();
            }}
            disabled={localSelected.length === 0}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50 hover:bg-blue-700 transition-colors"
          >
            Adicionar à Fila
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewState>("LOBBY");
  const [loading, setLoading] = useState(true);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [draftState, setDraftState] = useState<{
    red: Player[];
    blue: Player[];
    queue: Player[];
  } | null>(null);
  const [gameState, setGameState] = useState<MatchState | null>(null);
  const [currentMatchId, setCurrentMatchId] = useState<string | null>(null);
  const [matchStats, setMatchStats] = useState<Record<string, PlayerStats>>({});
  const gameStateRef = useRef<MatchState | null>(null);
  const isEndingRef = useRef(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalTeamColor, setGoalTeamColor] = useState<"red" | "blue" | null>(
    null
  );
  const [latePlayerModalOpen, setLatePlayerModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [gameOverReason, setGameOverReason] = useState<
    GameOverReason | "MANUAL" | null
  >(null);

  useEffect(() => {
    sessionStorage.setItem("is_admin", "true");
  }, []);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // --- NOVO: SALVAR ESTADO DO DRAFT NO NAVEGADOR (PARA AGUENTAR F5) ---
  useEffect(() => {
    // Se estiver no Draft, salva o estado atual
    if (view === 'DRAFT' && draftState) {
        sessionStorage.setItem('draft_backup', JSON.stringify(draftState));
    } 
    // Se saiu do draft (foi pro Lobby ou começou Jogo), limpa o backup
    else if (view === 'LOBBY' || view === 'MATCH') {
        // Só limpamos se estivermos no MATCH para garantir, 
        // no LOBBY mantemos caso o usuário tenha clicado "Voltar" sem querer? 
        // Melhor limpar apenas no MATCH para evitar sujeira.
        if (view === 'MATCH') {
            sessionStorage.removeItem('draft_backup');
        }
    }
  }, [view, draftState]);

  // --- CARREGAMENTO DE DADOS ---
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [players, activeMatch, lobbyOrder] = await Promise.all([
          playerService.getAll(),
          matchService.getActiveMatch(),
          lobbyService.getLobbyOrder(),
        ]);

        setAllPlayers(players);
        if (lobbyOrder && lobbyOrder.length > 0) setSelectedIds(lobbyOrder);

        if (activeMatch) {
          const getP = (id: string) => players.find((p: Player) => p.id === id);
          const redPlayers = activeMatch.team_red_ids
            .map(getP)
            .filter(Boolean) as Player[];
          const bluePlayers = activeMatch.team_blue_ids
            .map(getP)
            .filter(Boolean) as Player[];

          let queuePlayers: Player[] = [];
          if (activeMatch.queue_ids && activeMatch.queue_ids.length > 0) {
            queuePlayers = activeMatch.queue_ids
              .map(getP)
              .filter(Boolean) as Player[];
          } else {
            const playingIds = [
              ...activeMatch.team_red_ids,
              ...activeMatch.team_blue_ids,
            ];
            queuePlayers = players.filter(
              (p: Player) => !playingIds.includes(p.id) && p.is_active
            );
          }

          const currentInGameOrQueue = [
            ...activeMatch.team_red_ids,
            ...activeMatch.team_blue_ids,
            ...queuePlayers.map((p) => p.id),
          ];
          setSelectedIds((prev) => {
            if (lobbyOrder.length > 0) return lobbyOrder;
            if (prev.length === 0) return currentInGameOrQueue;
            return prev;
          });

          const events = await matchService.getMatchEvents(activeMatch.id);
          const stats: Record<string, PlayerStats> = {};
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          events?.forEach((ev: any) => {
            if (!stats[ev.player_id])
              stats[ev.player_id] = { goals: 0, assists: 0 };
            if (ev.event_type === "GOAL") stats[ev.player_id].goals++;
            if (ev.event_type === "ASSIST") stats[ev.player_id].assists++;
          });
          setMatchStats(stats);
          setCurrentMatchId(activeMatch.id);

          let calculatedTimer = activeMatch.duration_seconds ?? 600;
          if (activeMatch.last_active_at) {
            const secondsPassed = Math.floor(
              (new Date().getTime() -
                new Date(activeMatch.last_active_at).getTime()) /
                1000
            );
            if (secondsPassed > 0)
              calculatedTimer = Math.max(0, calculatedTimer - secondsPassed);
          }

          const queueTeams: Team[] = [];
          for (let i = 0; i < queuePlayers.length; i += PLAYERS_PER_TEAM) {
            queueTeams.push({
              name: `Time ${3 + queueTeams.length}`,
              players: queuePlayers.slice(i, i + PLAYERS_PER_TEAM),
            });
          }

          setGameState({
            red: { name: "Time Vermelho", players: redPlayers },
            blue: { name: "Time Azul", players: bluePlayers },
            queue: queueTeams,
            scoreRed: activeMatch.score_red,
            scoreBlue: activeMatch.score_blue,
            timer: calculatedTimer,
            isRunning: true,
            period: 1,
          });
          setView("MATCH");
        } else {
          const backup = sessionStorage.getItem('draft_backup');
            if (backup) {
                try {
                    const parsed = JSON.parse(backup);
                    // Verifica se os dados parecem válidos
                    if (parsed.red && parsed.blue) {
                        setDraftState(parsed);
                        setView("DRAFT");
                        console.log("Estado de Draft recuperado do F5");
                    }
                } catch (e) {
                    console.error("Erro ao recuperar backup", e);
                }
            } else {
                // Comportamento padrão (vai pro Lobby)
                setView("LOBBY");
            }
        
        }
      } catch (error) {
        console.error(error);
        alert("Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // --- LÓGICA DO LOBBY ---
  const handleToggleLobby = async (playerId: string) => {
    let newOrder = [...selectedIds];
    if (newOrder.includes(playerId))
      newOrder = newOrder.filter((id) => id !== playerId);
    else newOrder.push(playerId);
    setSelectedIds(newOrder);
    await lobbyService.updateLobbyOrder(newOrder);
  };

  const handleMoveUp = async (index: number) => {
    if (index <= 0) return;
    const newOrder = [...selectedIds];
    [newOrder[index - 1], newOrder[index]] = [
      newOrder[index],
      newOrder[index - 1],
    ];
    setSelectedIds(newOrder);
    await lobbyService.updateLobbyOrder(newOrder);
  };

  const handleMoveDown = async (index: number) => {
    if (index === selectedIds.length - 1) return;
    const newOrder = [...selectedIds];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + 1];
    newOrder[index + 1] = temp;
    setSelectedIds(newOrder);
    await lobbyService.updateLobbyOrder(newOrder);
  };

  const handleGoToDraft = () => {
    const checkedIn = selectedIds
      .map((id) => allPlayers.find((p) => p.id === id))
      .filter((p): p is Player => !!p);
    const { red, blue, queue } = generateTeams(checkedIn);
    setDraftState({
      red: red.players,
      blue: blue.players,
      queue: queue.flatMap((t) => t.players),
    });
    setView("DRAFT");
  };

  // --- NOVO: FUNÇÃO DE SORTEIO INTELIGENTE NO DRAFT ---
 // --- FUNÇÃO DE SORTEIO INTELIGENTE NO DRAFT (Respeitando a Chegada) ---
 const handleSmartShuffleDraft = () => {
  // 1. Define o limite (Geralmente 12 jogadores)
  const MAX_PLAYERS = PLAYERS_PER_TEAM * 2;

  // 2. Separa os IDs: Quem joga (Top 12) e Quem espera (Resto)
  const mainIds = selectedIds.slice(0, MAX_PLAYERS);
  const queueIds = selectedIds.slice(MAX_PLAYERS);

  // 3. Converte IDs em Objetos de Jogadores
  const pool = mainIds
    .map((id) => allPlayers.find((p) => p.id === id))
    .filter((p): p is Player => !!p);

  const queuePlayers = queueIds
    .map((id) => allPlayers.find((p) => p.id === id))
    .filter((p): p is Player => !!p);

  // 4. Mistura aleatória LEVE no pool principal (apenas entre os 12)
  // Isso evita que, se tiverem estrelas iguais, fiquem sempre nos mesmos times
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // 5. Ordena o pool por Estrelas (Do melhor para o pior)
  pool.sort((a, b) => (b.stars || 3) - (a.stars || 3));

  const red: Player[] = [];
  const blue: Player[] = [];
  let sumRed = 0;
  let sumBlue = 0;

  // 6. Distribuição "Gulosa" (Equilibrando Soma de Estrelas)
  pool.forEach((player) => {
    // Se um time encheu, vai pro outro
    if (red.length >= PLAYERS_PER_TEAM) {
      blue.push(player);
      sumBlue += player.stars || 3;
      return;
    }
    if (blue.length >= PLAYERS_PER_TEAM) {
      red.push(player);
      sumRed += player.stars || 3;
      return;
    }

    // Se cabe em ambos, joga no time que está "mais fraco" no momento
    const pStars = player.stars || 3;
    if (sumRed <= sumBlue) {
      red.push(player);
      sumRed += pStars;
    } else {
      blue.push(player);
      sumBlue += pStars;
    }
  });

  // 7. Atualiza o estado
  // red/blue: Apenas os 12 primeiros equilibrados
  // queue: Quem chegou do 13º pra frente, sem mexer na ordem
  setDraftState({
    red,
    blue,
    queue: queuePlayers,
  });
};

  const movePlayer = (
    playerId: string,
    from: "red" | "blue" | "queue",
    to: "red" | "blue" | "queue"
  ) => {
    if (!draftState) return;
    const player = draftState[from].find((p) => p.id === playerId);
    if (!player) return;
    setDraftState({
      ...draftState,
      [from]: draftState[from].filter((p) => p.id !== playerId),
      [to]: [...draftState[to], player],
    });
  };

  const confirmMatchStart = async () => {
    if (!draftState) return;
    setLoading(true);
    try {
      const queueIds = draftState.queue.map((p) => p.id);
      const matchData = await matchService.startMatch(
        draftState.red.map((p) => p.id),
        draftState.blue.map((p) => p.id),
        queueIds
      );
      setCurrentMatchId(matchData.id);
      const queueTeams: Team[] = [];
      for (let i = 0; i < draftState.queue.length; i += PLAYERS_PER_TEAM) {
        queueTeams.push({
          name: `Time ${3 + queueTeams.length}`,
          players: draftState.queue.slice(i, i + PLAYERS_PER_TEAM),
        });
      }
      setGameState({
        red: { name: "Time Vermelho", players: draftState.red },
        blue: { name: "Time Azul", players: draftState.blue },
        queue: queueTeams,
        scoreRed: 0,
        scoreBlue: 0,
        timer: 600,
        isRunning: false,
        period: 1,
      });
      setMatchStats({});
      setView("MATCH");
    } catch (error) {
      console.error(error);
      alert("Erro ao iniciar");
    } finally {
      setLoading(false);
    }
  };

  const handleEventDeleted = async (
    _eventId: string,
    playerId: string,
    type: "GOAL" | "ASSIST"
  ) => {
    if (!gameState || !currentMatchId) return;
    setMatchStats((prev) => {
      const stats = { ...prev };
      if (stats[playerId]) {
        if (type === "GOAL")
          stats[playerId] = {
            ...stats[playerId],
            goals: Math.max(0, stats[playerId].goals - 1),
          };
        if (type === "ASSIST")
          stats[playerId] = {
            ...stats[playerId],
            assists: Math.max(0, stats[playerId].assists - 1),
          };
      }
      return stats;
    });
    if (type === "GOAL") {
      const isRed = gameState.red.players.some((p) => p.id === playerId);
      const isBlue = gameState.blue.players.some((p) => p.id === playerId);
      let newScoreRed = gameState.scoreRed;
      let newScoreBlue = gameState.scoreBlue;
      if (isRed) newScoreRed = Math.max(0, newScoreRed - 1);
      if (isBlue) newScoreBlue = Math.max(0, newScoreBlue - 1);
      setGameState((prev) =>
        prev
          ? { ...prev, scoreRed: newScoreRed, scoreBlue: newScoreBlue }
          : null
      );
      try {
        await matchService.updateScore(
          currentMatchId,
          newScoreRed,
          newScoreBlue
        );
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleConfirmGoal = async (
    scorerId: string,
    assistId: string | null
  ) => {
    if (!gameState || !currentMatchId || !goalTeamColor) return;
    const newScoreRed = gameState.scoreRed + (goalTeamColor === "red" ? 1 : 0);
    const newScoreBlue =
      gameState.scoreBlue + (goalTeamColor === "blue" ? 1 : 0);

    if (newScoreRed >= 2 || newScoreBlue >= 2) {
      setGameOverReason("GOAL_LIMIT");
      setGameState((prev) => (prev ? { ...prev, isRunning: false } : null));
    }
    setGameState((prev) =>
      prev ? { ...prev, scoreRed: newScoreRed, scoreBlue: newScoreBlue } : null
    );

    setMatchStats((prev) => {
      const stats = { ...prev };
      const sc = stats[scorerId] || { goals: 0, assists: 0 };
      stats[scorerId] = { ...sc, goals: sc.goals + 1 };
      if (assistId) {
        const as = stats[assistId] || { goals: 0, assists: 0 };
        stats[assistId] = { ...as, assists: as.assists + 1 };
      }
      return stats;
    });

    try {
      await matchService.registerEvent(currentMatchId, scorerId, "GOAL");
      if (assistId) {
        await matchService.registerEvent(currentMatchId, assistId, "ASSIST");
      }
      await matchService.updateScore(currentMatchId, newScoreRed, newScoreBlue);
    } catch (error) {
      console.error(error);
    }
  };

  const handleEndMatch = async (winnerColor: "RED" | "BLUE") => {
    if (!gameState || !currentMatchId) return;

    isEndingRef.current = true;

    try {
      setLoading(true);

      // 1. Finaliza a partida no Banco
      await matchService.finishMatch(
        currentMatchId,
        winnerColor,
        gameState.scoreRed,
        gameState.scoreBlue
      );

      // 2. Define Vencedores e Perdedores
      const redWins = winnerColor === "RED";
      const winningTeam = redWins ? gameState.red : gameState.blue;
      const losingTeam = redWins ? gameState.blue : gameState.red;

      // 3. Pega quem estava esperando
      const waitingPlayers = gameState.queue.flatMap((t) => t.players);
      
      let challengerPlayers: Player[] = [];
      let newQueuePlayers: Player[] = [];

      // 4. Lógica de Rotação (Quem entra e quem sobra)
      if (waitingPlayers.length >= PLAYERS_PER_TEAM) {
        // Tem gente suficiente na fila para formar um time completo
        challengerPlayers = waitingPlayers.slice(0, PLAYERS_PER_TEAM);
        
        // A nova fila é: Quem sobrou da fila antiga + Os perdedores
        newQueuePlayers = [
          ...waitingPlayers.slice(PLAYERS_PER_TEAM),
          ...losingTeam.players,
        ];
      } else {
        // Não tem gente suficiente, precisa completar com perdedores (Raro, mas acontece)
        const needed = PLAYERS_PER_TEAM - waitingPlayers.length;
        
        // Ordena perdedores pela ordem de chegada original para decidir quem joga de novo
        const sortedLosers = [...losingTeam.players].sort((a, b) => {
          const iA = selectedIds.indexOf(a.id);
          const iB = selectedIds.indexOf(b.id);
          if (iA === -1) return 1;
          if (iB === -1) return -1;
          return iA - iB;
        });

        challengerPlayers = [
          ...waitingPlayers,
          ...sortedLosers.slice(0, needed),
        ];
        newQueuePlayers = sortedLosers.slice(needed);
      }

      // 5. Define as Cores para o Próximo Jogo
      let nextRed: Player[] = [];
      let nextBlue: Player[] = [];

      if (redWins) {
        nextRed = winningTeam.players;
        nextBlue = challengerPlayers;
      } else {
        nextRed = challengerPlayers;
        nextBlue = winningTeam.players;
      }

      // 6. ATUALIZA O ESTADO VISUAL (Draft)
      setDraftState({
        red: nextRed,
        blue: nextBlue,
        queue: newQueuePlayers,
      });

      // --- CORREÇÃO DO BUG AQUI ---
      // 7. Atualiza a "Ordem de Chegada" Oficial (Persistência)
      // A nova ordem oficial do mundo passa a ser:
      // [Quem está no Vermelho] + [Quem está no Azul] + [Quem está na Fila]
      // Isso garante que os perdedores sejam oficialmente movidos para o final da lista no banco.
      
      const newGlobalOrderIds = [
        ...nextRed.map(p => p.id),
        ...nextBlue.map(p => p.id),
        ...newQueuePlayers.map(p => p.id)
      ];

      // Mantém no final da lista quem fez check-in mas não estava nesse jogo/fila (casos de borda)
      const everyoneElse = selectedIds.filter(id => !newGlobalOrderIds.includes(id));
      const finalOrder = [...newGlobalOrderIds, ...everyoneElse];

      setSelectedIds(finalOrder); // Atualiza Local
      await lobbyService.updateLobbyOrder(finalOrder); // Atualiza Banco (app_state)
      // ----------------------------

      setMatchStats({});
      setGameOverReason(null);
      setView("DRAFT");
    } catch (error) {
      console.error(error);
      alert("Erro ao finalizar partida");
    } finally {
      setLoading(false);
    }
  };

  const handleShareTeams = () => {
    if (!draftState) return;
    const redNames = draftState.red.map((p) => p.name).join("\n🔴 ");
    const blueNames = draftState.blue.map((p) => p.name).join("\n🔵 ");
    const queueNames =
      draftState.queue.length > 0
        ? draftState.queue
            .map(
              (p, i) =>
                `${i % PLAYERS_PER_TEAM === 0 ? `\n⏳ *Time ${Math.floor(i / PLAYERS_PER_TEAM) + 3}*:\n` : ""}▫️ ${p.name}`
            )
            .join("")
        : "\n(Sem fila)";
    navigator.clipboard.writeText(
      `⚽ *TIMES DEFINIDOS*\n\n🔴 *TIME VERMELHO*\n🔴 ${redNames}\n\n🔵 *TIME AZUL*\n🔵 ${blueNames}\n\n------------------\nPRÓXIMOS:\n${queueNames}`
    );
    alert("Copiado!");
  };

  const handleRemoveFromQueue = (pid: string) => {
    if (!draftState || !confirm("Remover jogador?")) return;
    setDraftState((p) =>
      p ? { ...p, queue: p.queue.filter((pl) => pl.id !== pid) } : null
    );
    setSelectedIds((p) => p.filter((id) => id !== pid));
  };

  const handleFinishDay = async () => {
    if (!gameState || !currentMatchId) return;

    const confirmEnd = window.confirm(
      "Deseja realmente encerrar o racha por hoje?\n\nA partida atual será finalizada com o placar atual e você voltará ao menu."
    );

    if (!confirmEnd) return;

    try {
      setLoading(true);
      isEndingRef.current = true;

      let finalWinner: "RED" | "BLUE" | "DRAW" = "DRAW";
      if (gameState.scoreRed > gameState.scoreBlue) finalWinner = "RED";
      if (gameState.scoreBlue > gameState.scoreRed) finalWinner = "BLUE";

      await matchService.finishMatch(
        currentMatchId,
        finalWinner,
        gameState.scoreRed,
        gameState.scoreBlue
      );

      setGameState(null);
      setDraftState(null);
      navigate("/");
    } catch (error) {
      console.error(error);
      alert("Erro ao encerrar sessão.");
      setLoading(false);
      isEndingRef.current = false;
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (gameState?.isRunning && !gameOverReason) {
      interval = setInterval(() => {
        setGameState((prev) => {
          if (!prev) return null;
          if (prev.timer <= 1) {
            const isDraw = prev.scoreRed === prev.scoreBlue;
            const queueCount = prev.queue.flatMap((t) => t.players).length;
            const hasFullTeamsOutside = queueCount >= PLAYERS_PER_TEAM * 2;
            let reason: GameOverReason = "TIME_LIMIT";
            if (isDraw && !hasFullTeamsOutside) reason = "PENALTIES";
            setGameOverReason(reason);
            return { ...prev, timer: 0, isRunning: false };
          }
          return { ...prev, timer: prev.timer - 1 };
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
      if (currentMatchId && gameStateRef.current && !isEndingRef.current) {
        matchService.updateMatchTimer(
          currentMatchId,
          gameStateRef.current.timer
        );
      }
    };
  }, [gameState?.isRunning, currentMatchId, gameOverReason]);

  if (loading)
    return (
      <Layout title="Carregando...">
        <div className="flex justify-center p-10">
          <Loader2 className="animate-spin" />
        </div>
      </Layout>
    );

  if (view === "LOBBY") {
    return (
      <Layout title="Check-in">
        <LobbyView
          allPlayers={allPlayers}
          selectedIds={selectedIds}
          onToggle={handleToggleLobby}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onProceed={handleGoToDraft}
        />
      </Layout>
    );
  }

  // --- RENDERIZAÇÃO DO DRAFT ---
  if (view === "DRAFT" && draftState) {
    return (
      <Layout title="Ajuste os Times">
        <DraftView
          draftState={draftState}
          selectedIds={selectedIds}
          onMove={movePlayer}
          onRemoveFromQueue={handleRemoveFromQueue}
          onConfirm={confirmMatchStart}
          onBack={() => setView("LOBBY")}
          onShare={handleShareTeams}
          // --- Passando a nova função para o componente ---
          onShuffle={handleSmartShuffleDraft}
        />
      </Layout>
    );
  }

  // ... (Código do Modo MATCH permanece igual)
  const playersNotInGame = allPlayers.filter(
    (p) =>
      !gameState?.red.players.find((rp) => rp.id === p.id) &&
      !gameState?.blue.players.find((bp) => bp.id === p.id) &&
      !gameState?.queue.flatMap((t) => t.players).find((qp) => qp.id === p.id)
  );

  return (
    <Layout title="Partida em Andamento">
      <GoalModal
        isOpen={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        onConfirm={handleConfirmGoal}
        teamName={goalTeamColor === "red" ? "Vermelho" : "Azul"}
        players={
          goalTeamColor === "red"
            ? gameState!.red.players
            : gameState!.blue.players
        }
      />
      {latePlayerModalOpen && (
        <AddLatePlayerModal
          isOpen={true}
          onClose={() => setLatePlayerModalOpen(false)}
          players={playersNotInGame}
          onAdd={async (ids) => {
            if (!gameState) return;
            const updatedSelection = [...selectedIds, ...ids];
            setSelectedIds(updatedSelection);
            const newPlayers = ids
              .map((id) => allPlayers.find((p) => p.id === id))
              .filter((p): p is Player => !!p);
            setGameState((prev) => {
              if (!prev) return null;
              const currentQueueList = prev.queue.flatMap((t) => t.players);
              const newFullQueue = [...currentQueueList, ...newPlayers];
              if (currentMatchId)
                matchService
                  .updateQueue(
                    currentMatchId,
                    newFullQueue.map((p) => p.id)
                  )
                  .catch(console.error);
              const newTeams: Team[] = [];
              for (let i = 0; i < newFullQueue.length; i += PLAYERS_PER_TEAM)
                newTeams.push({
                  name: `Time ${3 + newTeams.length}`,
                  players: newFullQueue.slice(i, i + PLAYERS_PER_TEAM),
                });
              return { ...prev, queue: newTeams };
            });
          }}
        />
      )}
      <EventHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        matchId={currentMatchId}
        onEventDeleted={handleEventDeleted}
      />
      <GameOverModal
        isOpen={!!gameOverReason}
        reason={gameOverReason as GameOverReason}
        scoreRed={gameState?.scoreRed || 0}
        scoreBlue={gameState?.scoreBlue || 0}
        onConfirm={(winner) => handleEndMatch(winner)}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActiveTeamCard
          color="red"
          team={gameState!.red}
          score={gameState!.scoreRed}
          stats={matchStats}
          onGoal={() => {
            setGoalTeamColor("red");
            setGoalModalOpen(true);
          }}
          lobbyOrder={selectedIds}
        />
        <div className="flex flex-col items-center">
          <div className="bg-slate-900 text-white p-6 rounded-2xl w-full text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-2 text-yellow-400 opacity-80">
              <Timer size={20} />{" "}
              <span className="text-xs font-bold uppercase">Cronômetro</span>
            </div>
            <div className="text-5xl font-mono font-bold">
              {Math.floor(gameState!.timer / 60)
                .toString()
                .padStart(2, "0")}
              :{(gameState!.timer % 60).toString().padStart(2, "0")}
            </div>
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={() =>
                  setGameState((curr) =>
                    curr ? { ...curr, isRunning: !curr.isRunning } : null
                  )
                }
                className={`p-5 rounded-full transition-all active:scale-95 flex items-center justify-center ${
                  gameState?.isRunning
                    ? "bg-yellow-400 hover:bg-yellow-500 text-yellow-900 shadow-yellow-200"
                    : "bg-green-600 hover:bg-green-700 text-white shadow-green-200"
                }`}
                title={gameState?.isRunning ? "Pausar Tempo" : "Iniciar Tempo"}
              >
                {gameState?.isRunning ? (
                  <Pause size={40} fill="currentColor" />
                ) : (
                  <Play size={40} fill="currentColor" className="ml-1" />
                )}
              </button>

              <button
                onClick={() =>
                  setGameState((p) =>
                    p ? { ...p, timer: 600, isRunning: false } : null
                  )
                }
                className="p-3 bg-slate-700 rounded-full text-slate-300 hover:text-white"
                title="Reiniciar Timer"
              >
                <RotateCcw size={24} />
              </button>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-700 flex justify-center gap-2">
              <button
                onClick={() => setHistoryModalOpen(true)}
                className="text-slate-400 hover:text-white text-sm flex items-center gap-2 transition-colors px-3 py-1 rounded-full hover:bg-slate-800"
              >
                <History size={16} /> Ver Lances
              </button>
            </div>
          </div>
          <div className="space-y-3 w-full">
            <button
              onClick={() => setGameOverReason("MANUAL")}
              className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95"
            >
              Encerrar & Próxima
            </button>
            <button
              onClick={handleFinishDay}
              className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Finalizar Racha (Encerrar Dia)
            </button>
          </div>
        </div>
        <ActiveTeamCard
          color="blue"
          team={gameState!.blue}
          score={gameState!.scoreBlue}
          stats={matchStats}
          onGoal={() => {
            setGoalTeamColor("blue");
            setGoalModalOpen(true);
          }}
          lobbyOrder={selectedIds}
        />
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mt-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <span className="w-2 h-6 bg-yellow-400 rounded-full"></span>{" "}
            Próximos ({gameState!.queue.flatMap((t) => t.players).length})
          </h3>
          <button
            onClick={() => setLatePlayerModalOpen(true)}
            className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 flex items-center gap-1"
          >
            <UserPlus size={16} /> Chegou gente!
          </button>
        </div>
        <div className="flex flex-wrap gap-4">
          {gameState!.queue.map((team, idx) => (
            <div
              key={idx}
              className="bg-slate-50 p-3 rounded-lg border border-slate-200 min-w-50"
            >
              <div className="font-bold text-slate-700 mb-2 border-b pb-1">
                {team.name}
              </div>
              <ul className="text-sm text-slate-500 space-y-1">
                {team.players.map((p) => {
                  const arrivalIndex = selectedIds.indexOf(p.id);
                  return (
                    <li key={p.id} className="flex items-center gap-2">
                      {arrivalIndex !== -1 && (
                        <span className="text-[10px] bg-slate-200 px-1.5 rounded text-slate-600 font-bold">
                          {arrivalIndex + 1}º
                        </span>
                      )}{" "}
                      {p.name}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {gameState!.queue.length === 0 && (
            <p className="text-slate-400 text-sm">Fila vazia.</p>
          )}
        </div>
      </div>
    </Layout>
  );
}