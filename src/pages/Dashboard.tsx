import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import GoalModal from "../components/GoalModal";
import EventHistoryModal from "../components/EventHistoryModal";
import { playerService } from "../services/playerService";
import { matchService } from "../services/matchService";
import {
  generateTeams,
  PLAYERS_PER_TEAM,
} from "../domain/matchmaking/balancer";
import { type Player, type MatchState, type Team } from "../types";
import {
  Play,
  Timer,
  RotateCcw,
  UserCheck,
  Loader2,
  ArrowRightLeft,
  Plus,
  CheckCircle2,
  UserPlus,
  X,
  History,
} from "lucide-react";

// --- TIPOS LOCAIS ---
type ViewState = "LOBBY" | "DRAFT" | "MATCH";
type PlayerStats = { goals: number; assists: number };

interface DraftColumnProps {
  title: string;
  color: "red" | "blue";
  players: Player[];
  onMove: (playerId: string) => void;
  onKick: (playerId: string) => void;
}

interface ActiveTeamCardProps {
  color: "red" | "blue";
  team: Team;
  score: number;
  stats: Record<string, PlayerStats>;
  onGoal: () => void;
}

// Modal Interno para Adicionar Atrasados
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
              setLocalSelected([]);
            }}
            disabled={localSelected.length === 0}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50"
          >
            Adicionar à Fila
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const isEndingRef = useRef(false);
  const navigate = useNavigate();
  // --- ESTADOS ---
  const [view, setView] = useState<ViewState>("LOBBY");
  const [loading, setLoading] = useState(true);

  // Dados Mestre
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Draft & Game States
  const [draftState, setDraftState] = useState<{
    red: Player[];
    blue: Player[];
    queue: Player[];
  } | null>(null);
  const [gameState, setGameState] = useState<MatchState | null>(null);
  const [currentMatchId, setCurrentMatchId] = useState<string | null>(null);
  const [matchStats, setMatchStats] = useState<Record<string, PlayerStats>>({});

  // REF para o Timer (Evita Loop de Dependência)
  const gameStateRef = useRef<MatchState | null>(null);

  // Modais
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalTeamColor, setGoalTeamColor] = useState<"red" | "blue" | null>(
    null
  );
  const [latePlayerModalOpen, setLatePlayerModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // Sincroniza Ref
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // --- 1. CARREGAMENTO ---
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const players = await playerService.getAll();
      setAllPlayers(players);

      const activeMatch = await matchService.getActiveMatch();

      if (activeMatch) {
        // ... (lógica de times igual ao anterior) ...
        const redPlayers = activeMatch.team_red_ids
          .map((id: string) => players.find((p: Player) => p.id === id))
          .filter((p: Player | undefined): p is Player => !!p);
        const bluePlayers = activeMatch.team_blue_ids
          .map((id: string) => players.find((p: Player) => p.id === id))
          .filter((p: Player | undefined): p is Player => !!p);
        const playingIds = [
          ...activeMatch.team_red_ids,
          ...activeMatch.team_blue_ids,
        ];
        const queuePlayers = players.filter(
          (p: Player) => !playingIds.includes(p.id) && p.is_active
        );

        setSelectedIds([
          ...activeMatch.team_red_ids,
          ...activeMatch.team_blue_ids,
          ...queuePlayers.map((p) => p.id),
        ]);

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

        // --- CÁLCULO DO TEMPO REAL (A MÁGICA 🧙‍♂️) ---
        let calculatedTimer = activeMatch.duration_seconds ?? 600;

        // Se a partida tem uma data de última atividade, calculamos a diferença
        if (activeMatch.last_active_at) {
          const lastActive = new Date(activeMatch.last_active_at).getTime();
          const now = new Date().getTime();
          const secondsPassed = Math.floor((now - lastActive) / 1000);

          // Só desconta se a diferença for razoável (ex: > 1 segundo)
          if (secondsPassed > 0) {
            calculatedTimer = Math.max(0, calculatedTimer - secondsPassed);
          }
        }
        // ---------------------------------------------

        setGameState({
          red: { name: "Time Vermelho", players: redPlayers },
          blue: { name: "Time Azul", players: bluePlayers },
          queue: [{ name: "Próximos", players: queuePlayers }],
          scoreRed: activeMatch.score_red,
          scoreBlue: activeMatch.score_blue,
          timer: calculatedTimer, // Usa o tempo calculado
          isRunning: true, // Já volta RODANDO pra não perder o ritmo!
          period: 1,
        });
        setView("MATCH");
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  // --- 2. LOBBY ---
  const togglePlayerSelection = (id: string) => {
    if (selectedIds.includes(id))
      setSelectedIds(selectedIds.filter((pid) => pid !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const handleGoToDraft = () => {
    const checkedIn = selectedIds
      .map((id) => allPlayers.find((p) => p.id === id))
      .filter((p): p is Player => !!p);

    const { red, blue, queue } = generateTeams(checkedIn);
    const queuePlayers = queue.flatMap((t) => t.players);

    setDraftState({
      red: red.players,
      blue: blue.players,
      queue: queuePlayers,
    });
    setView("DRAFT");
  };

  // --- 3. DRAFT ---
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
      const matchData = await matchService.startMatch(
        draftState.red.map((p) => p.id),
        draftState.blue.map((p) => p.id)
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
      alert("Erro ao iniciar partida");
    } finally {
      setLoading(false);
    }
  };

  // --- 4. PARTIDA ---

  // Timer (Usando Ref para evitar dependência cíclica)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (gameState?.isRunning) {
      interval = setInterval(() => {
        setGameState((prev) => {
          if (!prev) return null;
          if (prev.timer <= 0) return { ...prev, timer: 0, isRunning: false };
          return { ...prev, timer: prev.timer - 1 };
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);

      // SÓ SALVA SE NÃO ESTIVERMOS ENCERRANDO O RACHA
      if (currentMatchId && gameStateRef.current && !isEndingRef.current) {
        matchService.updateMatchTimer(
          currentMatchId,
          gameStateRef.current.timer
        );
      }
    };
  }, [gameState?.isRunning, currentMatchId]);

  // Auto-Save a cada 10s
  useEffect(() => {
    const autoSave = setInterval(() => {
      if (gameStateRef.current?.isRunning && currentMatchId) {
        matchService.updateMatchTimer(
          currentMatchId,
          gameStateRef.current.timer
        );
      }
    }, 10000);
    return () => clearInterval(autoSave);
  }, [currentMatchId]);

  // Late Join
  const handleAddLatePlayers = (newIds: string[]) => {
    if (!gameState) return;

    const updatedSelectedIds = [...selectedIds, ...newIds];
    setSelectedIds(updatedSelectedIds);

    const newPlayers = newIds
      .map((id) => allPlayers.find((p) => p.id === id))
      .filter((p): p is Player => !!p);

    setGameState((prev) => {
      if (!prev) return null;
      const currentQueuePlayers = prev.queue.flatMap((t) => t.players);
      const updatedQueuePlayers = [...currentQueuePlayers, ...newPlayers];

      const newQueueTeams: Team[] = [];
      for (let i = 0; i < updatedQueuePlayers.length; i += PLAYERS_PER_TEAM) {
        newQueueTeams.push({
          name: `Time ${3 + newQueueTeams.length}`,
          players: updatedQueuePlayers.slice(i, i + PLAYERS_PER_TEAM),
        });
      }
      return { ...prev, queue: newQueueTeams };
    });
  };

  // Gol
  const handleGoalClick = (team: "red" | "blue") => {
    setGoalTeamColor(team);
    setGoalModalOpen(true);
  };

  const handleConfirmGoal = async (
    scorerId: string,
    assistId: string | null
  ) => {
    if (!gameState || !currentMatchId || !goalTeamColor) return;

    setGameState((prev) => {
      if (!prev) return null;
      const key = goalTeamColor === "red" ? "scoreRed" : "scoreBlue";
      return { ...prev, [key]: prev[key] + 1 };
    });

    setMatchStats((prev) => {
      const stats = { ...prev };
      const currentScorerStats = stats[scorerId] || { goals: 0, assists: 0 };
      stats[scorerId] = {
        ...currentScorerStats,
        goals: currentScorerStats.goals + 1,
      };

      if (assistId) {
        const currentAssistStats = stats[assistId] || { goals: 0, assists: 0 };
        stats[assistId] = {
          ...currentAssistStats,
          assists: currentAssistStats.assists + 1,
        };
      }
      return stats;
    });

    try {
      await matchService.registerGoal(currentMatchId, scorerId, assistId);
      const newScoreRed =
        goalTeamColor === "red" ? gameState.scoreRed + 1 : gameState.scoreRed;
      const newScoreBlue =
        goalTeamColor === "blue"
          ? gameState.scoreBlue + 1
          : gameState.scoreBlue;
      await matchService.updateScore(currentMatchId, newScoreRed, newScoreBlue);
    } catch (error) {
      console.error(error);
    }
  };

  // CORREÇÃO: Adicionado _ antes do eventId para indicar que não é usado
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

      if (isRed) newScoreRed--;
      if (isBlue) newScoreBlue--;

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

  // Finalizar Partida
  // --- FINALIZAR PARTIDA (COM DUAS OPÇÕES) ---
 // --- FINALIZAR PARTIDA (CORRIGIDA) ---
  const handleEndMatch = async (action: 'NEXT_MATCH' | 'END_SESSION') => {
    if (!gameState || !currentMatchId) return;

    const message = action === 'NEXT_MATCH' 
      ? 'Encerrar jogo e montar próxima partida?' 
      : 'Tem certeza que deseja FINALIZAR O RACHA? Todas as partidas abertas serão fechadas.';

    if (!confirm(message)) return;

    setLoading(true);

    try {
      // --- CAMINHO A: FIM DO RACHA (OPÇÃO NUCLEAR) ---
      if (action === 'END_SESSION') {
        isEndingRef.current = true; // Ativa a trava para o useEffect não atrapalhar

        // 1. Salva o estado final deste jogo específico primeiro (para garantir estatísticas)
        await matchService.updateMatchTimer(currentMatchId, gameState.timer);

        // 2. Define vencedor deste jogo
        const redWins = gameState.scoreRed > gameState.scoreBlue;
        const isDraw = gameState.scoreRed === gameState.scoreBlue;
        const winnerColor = isDraw ? 'DRAW' : (redWins ? 'RED' : 'BLUE');

        await matchService.finishMatch(currentMatchId, winnerColor);

        // 3. LIMPEZA GERAL: Garante que não sobrou nenhum "zumbi" para trás
        await matchService.finishAllActiveMatches();

        setCurrentMatchId(null);
        alert('Racha finalizado! Bom descanso.');
        navigate('/');
        return;
      }

      // --- CAMINHO B: PRÓXIMA PARTIDA (Segue fluxo normal) ---

      // 1. Salva timer
      matchService.updateMatchTimer(currentMatchId, gameState.timer);

      // 2. Define vencedor
      const redWins = gameState.scoreRed > gameState.scoreBlue;
      const isDraw = gameState.scoreRed === gameState.scoreBlue;
      const winnerColor = isDraw ? 'DRAW' : (redWins ? 'RED' : 'BLUE');

      // 3. Fecha só a atual
      await matchService.finishMatch(currentMatchId, winnerColor);
      setCurrentMatchId(null);

      // 4. Lógica de Reciclagem (Draft)
      const winnerTeam = redWins || isDraw ? gameState.red : gameState.blue;
      const loserTeam = redWins || isDraw ? gameState.blue : gameState.red;

      const waitingPlayers = gameState.queue.flatMap(t => t.players);
      let nextBluePlayers: Player[] = [];
      let newQueuePlayers: Player[] = [];

      if (waitingPlayers.length >= PLAYERS_PER_TEAM) {
        nextBluePlayers = waitingPlayers.slice(0, PLAYERS_PER_TEAM);
        newQueuePlayers = [...waitingPlayers.slice(PLAYERS_PER_TEAM), ...loserTeam.players];
      } else {
        const needed = PLAYERS_PER_TEAM - waitingPlayers.length;
        const sortedLosers = [...loserTeam.players].sort((a, b) => {
          const indexA = selectedIds.indexOf(a.id);
          const indexB = selectedIds.indexOf(b.id);
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });

        const recycledPlayers = sortedLosers.slice(0, needed);
        const losersToQueue = sortedLosers.slice(needed);

        nextBluePlayers = [...waitingPlayers, ...recycledPlayers];
        newQueuePlayers = losersToQueue;
      }

      setDraftState({
        red: winnerTeam.players,
        blue: nextBluePlayers,
        queue: newQueuePlayers
      });

      setMatchStats({});
      setView('DRAFT');

    } catch (error) {
      console.error(error);
      alert('Erro ao finalizar.');
      isEndingRef.current = false; // Reseta trava em caso de erro
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <Layout title="Carregando...">
        <div className="flex justify-center p-10">
          <Loader2 className="animate-spin" />
        </div>
      </Layout>
    );

  // --- VIEWS ---

  if (view === "LOBBY") {
    return (
      <Layout title="Check-in do Racha">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <UserCheck /> Presença
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {allPlayers.map((player: Player) => {
              const isSelected = selectedIds.includes(player.id);
              const order = isSelected
                ? selectedIds.indexOf(player.id) + 1
                : null;
              return (
                <label
                  key={player.id}
                  className={`relative p-3 rounded-lg border cursor-pointer select-none ${
                    isSelected ? "bg-blue-50 border-blue-500" : "bg-slate-50"
                  }`}
                >
                  {order && (
                    <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full shadow-sm">
                      {order}º
                    </div>
                  )}
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={isSelected}
                    onChange={() => togglePlayerSelection(player.id)}
                  />
                  <div className="font-bold text-slate-800">{player.name}</div>
                  <div className="text-xs text-slate-500">
                    ⭐ {player.stars}
                  </div>
                </label>
              );
            })}
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleGoToDraft}
              disabled={selectedIds.length < PLAYERS_PER_TEAM * 2}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
            >
              <ArrowRightLeft size={20} /> Montar Times
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (view === "DRAFT" && draftState) {
    return (
      <Layout
        title="Ajuste os Times"
        action={
          <button
            onClick={() => setView("LOBBY")}
            className="text-red-500 text-sm"
          >
            Voltar
          </button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DraftColumn
            title="Time Vermelho"
            color="red"
            players={draftState.red}
            onMove={(pid) => movePlayer(pid, "red", "blue")}
            onKick={(pid) => movePlayer(pid, "red", "queue")}
          />
          <DraftColumn
            title="Time Azul"
            color="blue"
            players={draftState.blue}
            onMove={(pid) => movePlayer(pid, "blue", "red")}
            onKick={(pid) => movePlayer(pid, "blue", "queue")}
          />

          <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-600 mb-3">Banco / Fila</h3>
            <div className="space-y-2">
              {draftState.queue.map((p) => {
                const arrivalIndex = selectedIds.indexOf(p.id);
                return (
                  <div
                    key={p.id}
                    className="bg-white p-2 rounded border flex justify-between items-center"
                  >
                    <div className="flex items-center gap-2">
                      {arrivalIndex !== -1 && (
                        <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-6 text-center">
                          {arrivalIndex + 1}º
                        </span>
                      )}
                      <span className="text-sm font-medium text-slate-700">
                        {p.name}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => movePlayer(p.id, "queue", "red")}
                        className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200 font-bold"
                      >
                        V
                      </button>
                      <button
                        onClick={() => movePlayer(p.id, "queue", "blue")}
                        className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200 font-bold"
                      >
                        A
                      </button>
                    </div>
                  </div>
                );
              })}
              {draftState.queue.length === 0 && (
                <p className="text-xs text-slate-400">Ninguém no banco.</p>
              )}
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-center">
          <button
            onClick={confirmMatchStart}
            className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg active:scale-95 flex items-center gap-2"
          >
            <CheckCircle2 /> Confirmar e Jogar
          </button>
        </div>
      </Layout>
    );
  }

  // MATCH VIEW
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
      <AddLatePlayerModal
        isOpen={latePlayerModalOpen}
        onClose={() => setLatePlayerModalOpen(false)}
        players={playersNotInGame}
        onAdd={handleAddLatePlayers}
      />
      <EventHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        matchId={currentMatchId}
        onEventDeleted={handleEventDeleted}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActiveTeamCard
          color="red"
          team={gameState!.red}
          score={gameState!.scoreRed}
          stats={matchStats}
          onGoal={() => handleGoalClick("red")}
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
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={() => {
                  setGameState((p) => {
                    if (!p) return null;
                    const newState = !p.isRunning;
                    if (!newState && currentMatchId)
                      matchService.updateMatchTimer(currentMatchId, p.timer);
                    return { ...p, isRunning: newState };
                  });
                }}
                className={`p-3 rounded-full transition-colors ${
                  gameState?.isRunning
                    ? "bg-yellow-500 text-black"
                    : "bg-green-600 text-white"
                }`}
              >
                {gameState?.isRunning ? (
                  <Play className="fill-current" size={24} />
                ) : (
                  <Play size={24} />
                )}
              </button>
              <button
                onClick={() =>
                  setGameState((p) =>
                    p ? { ...p, timer: 600, isRunning: false } : null
                  )
                }
                className="p-3 bg-slate-700 rounded-full text-slate-300"
              >
                <RotateCcw size={24} />
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700 flex justify-center">
              <button
                onClick={() => setHistoryModalOpen(true)}
                className="text-slate-400 hover:text-white text-sm flex items-center gap-2 transition-colors px-3 py-1 rounded-full hover:bg-slate-800"
              >
                <History size={16} /> Ver Lances / Corrigir
              </button>
            </div>
          </div>
          <div className="space-y-3 w-full">
            {/* Opção 1: Segue o jogo */}
            <button
              onClick={() => handleEndMatch("NEXT_MATCH")}
              className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95"
            >
              Encerrar & Próxima Partida
            </button>

            {/* Opção 2: Acaba o dia */}
            <button
              onClick={() => handleEndMatch("END_SESSION")}
              className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Finalizar Racha (Sair)
            </button>
          </div>
        </div>

        <ActiveTeamCard
          color="blue"
          team={gameState!.blue}
          score={gameState!.scoreBlue}
          stats={matchStats}
          onGoal={() => handleGoalClick("blue")}
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
                      )}
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

// --- SUBCOMPONENTES AUXILIARES ---

const DraftColumn = ({
  title,
  color,
  players,
  onMove,
  onKick,
}: DraftColumnProps) => (
  <div
    className={`p-4 rounded-xl border-t-4 bg-white shadow-sm ${
      color === "red" ? "border-red-500" : "border-blue-500"
    }`}
  >
    <h3
      className={`font-bold uppercase text-sm mb-3 ${
        color === "red" ? "text-red-600" : "text-blue-600"
      }`}
    >
      {title} ({players.length})
    </h3>
    <div className="space-y-2">
      {players.map((p: Player) => (
        <div
          key={p.id}
          className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded border border-slate-100"
        >
          <span>{p.name}</span>
          <div className="flex gap-1">
            <button
              onClick={() => onMove(p.id)}
              title="Trocar de time"
              className="p-1 hover:bg-slate-200 rounded"
            >
              <ArrowRightLeft size={14} />
            </button>
            <button
              onClick={() => onKick(p.id)}
              title="Mandar pro banco"
              className="p-1 hover:bg-red-100 text-red-500 rounded"
            >
              X
            </button>
          </div>
        </div>
      ))}
      {[...Array(Math.max(0, PLAYERS_PER_TEAM - players.length))].map(
        (_, i) => (
          <div
            key={i}
            className="h-9 border-2 border-dashed border-slate-100 rounded flex items-center justify-center text-xs text-slate-300"
          >
            Vaga aberta
          </div>
        )
      )}
    </div>
  </div>
);

const ActiveTeamCard = ({
  color,
  team,
  score,
  stats,
  onGoal,
}: ActiveTeamCardProps) => {
  const isRed = color === "red";
  return (
    <div
      className={`bg-white rounded-2xl p-4 shadow-sm border-t-4 ${
        isRed ? "border-red-500" : "border-blue-500"
      } flex flex-col h-full`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3
          className={`font-bold uppercase ${
            isRed ? "text-red-600" : "text-blue-600"
          }`}
        >
          {team.name}
        </h3>
        <span className="text-4xl font-black text-slate-800">{score}</span>
      </div>
      <div className="flex-1 space-y-2 mb-4">
        {team.players.map((p: Player) => {
          const pStats = stats[p.id] || { goals: 0, assists: 0 };
          return (
            <div
              key={p.id}
              className="flex items-center justify-between text-sm border-b border-slate-50 pb-1"
            >
              <span className="text-slate-700 font-medium">{p.name}</span>
              <div className="flex gap-1">
                {[...Array(pStats.goals)].map((_, i) => (
                  <span key={`g-${i}`} title="Gol">
                    ⚽
                  </span>
                ))}
                {[...Array(pStats.assists)].map((_, i) => (
                  <span key={`a-${i}`} title="Assistência">
                    👟
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <button
        onClick={onGoal}
        className={`w-full py-3 rounded-xl font-bold flex justify-center gap-2 ${
          isRed ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
        }`}
      >
        <Plus size={18} /> GOL
      </button>
    </div>
  );
};
