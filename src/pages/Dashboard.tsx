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
  Loader2,
  UserPlus,
  X,
  History,
  CheckCircle2,
} from "lucide-react";

// --- NOVOS COMPONENTES EXTRAÍDOS ---
import LobbyView from "../components/dashboard/LobbyView";
import DraftView from "../components/dashboard/DraftView";
import ActiveTeamCard from "../components/dashboard/ActiveTeamCard";
import GameOverModal, {
  type GameOverReason,
} from "../components/dashboard/GameOverModal";

// --- TIPOS LOCAIS ---
type ViewState = "LOBBY" | "DRAFT" | "MATCH";
type PlayerStats = { goals: number; assists: number };

// (Mantivemos este modal aqui pois ele é pequeno, mas poderia ser extraído também)
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
  const navigate = useNavigate();
  // --- ESTADOS ---
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
  const [gameOverReason, setGameOverReason] = useState<GameOverReason>(null);

  // --- FUNÇÃO PARA DELETAR EVENTOS (Gols/Assistências) ---
  const handleEventDeleted = async (
    eventId: string,
    playerId: string,
    type: "GOAL" | "ASSIST"
  ) => {
    if (!gameState || !currentMatchId) return;

    // 1. Atualiza estatísticas locais (Remove o gol/assistência visualmente)
    setMatchStats((prev) => {
      const stats = { ...prev };
      if (stats[playerId]) {
        if (type === "GOAL") {
          stats[playerId] = {
            ...stats[playerId],
            goals: Math.max(0, stats[playerId].goals - 1),
          };
        }
        if (type === "ASSIST") {
          stats[playerId] = {
            ...stats[playerId],
            assists: Math.max(0, stats[playerId].assists - 1),
          };
        }
      }
      return stats;
    });

    // 2. Se for GOL, precisa atualizar o placar do jogo
    if (type === "GOAL") {
      const isRed = gameState.red.players.some((p) => p.id === playerId);
      const isBlue = gameState.blue.players.some((p) => p.id === playerId);

      let newScoreRed = gameState.scoreRed;
      let newScoreBlue = gameState.scoreBlue;

      if (isRed) newScoreRed = Math.max(0, newScoreRed - 1);
      if (isBlue) newScoreBlue = Math.max(0, newScoreBlue - 1);

      // Atualiza estado local e banco
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

    // (Opcional: Se sua lógica de deletar evento no banco exige chamar o serviço aqui, adicione:)
    // await matchService.deleteEvent(eventId);
    // Nota: Normalmente o EventHistoryModal já chama o delete do banco internamente se você passou a prop matchId,
    // mas aqui estamos apenas reagindo à deleção para atualizar a tela.
  };

  useEffect(() => {
    // --- AUTH SIMPLES ---
    const isAdmin = sessionStorage.getItem("is_admin");
    if (!isAdmin) {
      const password = prompt(
        "🔒 Área Restrita!\nDigite a senha do organizador:"
      );
      if (password === "gabdev") {
        // Defina sua senha
        sessionStorage.setItem("is_admin", "true");
      } else {
        alert("Senha incorreta. Você será redirecionado para o Ranking.");
        navigate("/");
      }
    }
  }, [navigate]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

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
        const getP = (id: string) => players.find((p: Player) => p.id === id);
        const redPlayers = activeMatch.team_red_ids
          .map(getP)
          .filter(Boolean) as Player[];
        const bluePlayers = activeMatch.team_blue_ids
          .map(getP)
          .filter(Boolean) as Player[];

        const playingIds = [
          ...activeMatch.team_red_ids,
          ...activeMatch.team_blue_ids,
        ];
        const queuePlayers = players.filter(
          (p: Player) => !playingIds.includes(p.id) && p.is_active
        );

        setSelectedIds([...playingIds, ...queuePlayers.map((p) => p.id)]);

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

        setGameState({
          red: { name: "Time Vermelho", players: redPlayers },
          blue: { name: "Time Azul", players: bluePlayers },
          queue: [{ name: "Próximos", players: queuePlayers }],
          scoreRed: activeMatch.score_red,
          scoreBlue: activeMatch.score_blue,
          timer: calculatedTimer,
          isRunning: true,
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

  // --- LÓGICA DE NEGÓCIO ---

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
      alert("Erro ao iniciar");
    } finally {
      setLoading(false);
    }
  };

  // Timer & Game Over
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
      await matchService.registerGoal(currentMatchId, scorerId, assistId);
      await matchService.updateScore(currentMatchId, newScoreRed, newScoreBlue);
    } catch (error) {
      console.error(error);
    }
  };

  const handleEndMatch = async (
    action: "NEXT_MATCH" | "END_SESSION",
    winnerOverride?: "RED" | "BLUE" | "DRAW"
  ) => {
    if (!gameState || !currentMatchId) return;
    if (
      !gameOverReason &&
      !confirm(action === "NEXT_MATCH" ? "Encerrar jogo?" : "FINALIZAR RACHA?")
    )
      return;
    setLoading(true);

    try {
      const timerToSave = gameState.timer;
      let winnerColor = winnerOverride;
      if (!winnerColor) {
        const redWins = gameState.scoreRed > gameState.scoreBlue;
        const isDraw = gameState.scoreRed === gameState.scoreBlue;
        winnerColor = isDraw ? "DRAW" : redWins ? "RED" : "BLUE";
      }

      if (action === "END_SESSION") {
        isEndingRef.current = true;
        await matchService.updateMatchTimer(currentMatchId, timerToSave);
        await matchService.finishMatch(currentMatchId, winnerColor);
        await matchService.finishAllActiveMatches();
        setCurrentMatchId(null);
        setGameOverReason(null);
        alert("Racha finalizado!");
        navigate("/");
        return;
      }

      await matchService.updateMatchTimer(currentMatchId, timerToSave);
      await matchService.finishMatch(currentMatchId, winnerColor);
      setCurrentMatchId(null);

      const redWins = winnerColor === "RED";
      const blueWins = winnerColor === "BLUE";
      const isDraw = winnerColor === "DRAW";
      const winnerTeam = redWins || isDraw ? gameState.red : gameState.blue;
      const loserTeam = redWins || isDraw ? gameState.blue : gameState.red;

      const waitingPlayers = gameState.queue.flatMap((t) => t.players);
      let nextBluePlayers: Player[] = [],
        newQueuePlayers: Player[] = [];

      if (waitingPlayers.length >= PLAYERS_PER_TEAM) {
        nextBluePlayers = waitingPlayers.slice(0, PLAYERS_PER_TEAM);
        newQueuePlayers = [
          ...waitingPlayers.slice(PLAYERS_PER_TEAM),
          ...loserTeam.players,
        ];
      } else {
        const needed = PLAYERS_PER_TEAM - waitingPlayers.length;
        const sortedLosers = [...loserTeam.players].sort((a, b) => {
          const iA = selectedIds.indexOf(a.id),
            iB = selectedIds.indexOf(b.id);
          return iA === -1 ? 1 : iB === -1 ? -1 : iA - iB;
        });
        nextBluePlayers = [...waitingPlayers, ...sortedLosers.slice(0, needed)];
        newQueuePlayers = sortedLosers.slice(needed);
      }

      setDraftState({
        red: blueWins ? gameState.blue.players : winnerTeam.players,
        blue: nextBluePlayers,
        queue: newQueuePlayers,
      });
      setMatchStats({});
      setGameOverReason(null);
      setView("DRAFT");
    } catch (e) {
      console.error(e);
      isEndingRef.current = false;
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
                `${
                  i % PLAYERS_PER_TEAM === 0
                    ? `\n⏳ *Time ${Math.floor(i / PLAYERS_PER_TEAM) + 3}*:\n`
                    : ""
                }▫️ ${p.name}`
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

  // --- RENDERS ---

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
          onToggle={(id) =>
            setSelectedIds((p) =>
              p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
            )
          }
          onProceed={handleGoToDraft}
        />
      </Layout>
    );
  }

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
        />
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
        onAdd={(ids) => {
          if (!gameState) return;
          setSelectedIds((prev) => [...prev, ...ids]);
          const newPlayers = ids
            .map((id) => allPlayers.find((p) => p.id === id))
            .filter((p): p is Player => !!p);
          setGameState((prev) => {
            if (!prev) return null;
            const newQ = [
              ...prev.queue.flatMap((t) => t.players),
              ...newPlayers,
            ];
            const newTeams: Team[] = [];
            for (let i = 0; i < newQ.length; i += PLAYERS_PER_TEAM)
              newTeams.push({
                name: `Time ${3 + newTeams.length}`,
                players: newQ.slice(i, i + PLAYERS_PER_TEAM),
              });
            return { ...prev, queue: newTeams };
          });
        }}
      />
      <EventHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        matchId={currentMatchId}
        onEventDeleted={handleEventDeleted}
      />

      <GameOverModal
        isOpen={!!gameOverReason}
        reason={gameOverReason}
        scoreRed={gameState?.scoreRed || 0}
        scoreBlue={gameState?.scoreBlue || 0}
        onConfirm={(w) => handleEndMatch("NEXT_MATCH", w)}
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
                onClick={() =>
                  setGameState((p) => {
                    if (!p) return null;
                    const run = !p.isRunning;
                    if (!run && currentMatchId)
                      matchService.updateMatchTimer(currentMatchId, p.timer);
                    return { ...p, isRunning: run };
                  })
                }
                className={`p-3 rounded-full ${
                  gameState?.isRunning
                    ? "bg-yellow-500 text-black"
                    : "bg-green-600 text-white"
                }`}
              >
                <Play size={24} />
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
                <History size={16} /> Ver Lances
              </button>
            </div>
          </div>

          <div className="space-y-3 w-full">
            <button
              onClick={() => handleEndMatch("NEXT_MATCH")}
              className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95"
            >
              Encerrar & Próxima
            </button>
            <button
              onClick={() => handleEndMatch("END_SESSION")}
              className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Finalizar Racha
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
