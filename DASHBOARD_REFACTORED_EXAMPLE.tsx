/**
 * EXEMPLO DE COMO O Dashboard.tsx FICARIA APÓS REFATORAÇÃO
 * 
 * Este é apenas um exemplo mostrando a estrutura refatorada.
 * O arquivo real Dashboard.tsx ainda não foi modificado.
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import GoalModal from "../components/GoalModal";
import EventHistoryModal from "../components/EventHistoryModal";
import AddLatePlayerModal from "../components/dashboard/AddLatePlayerModal";
import TimerControls from "../components/dashboard/TimerControls";
import MatchControls from "../components/dashboard/MatchControls";
import QueueSection from "../components/dashboard/QueueSection";
import LobbyView from "../components/dashboard/LobbyView";
import DraftView from "../components/dashboard/DraftView";
import ActiveTeamCard from "../components/dashboard/ActiveTeamCard";
import GameOverModal, { type GameOverReason } from "../components/dashboard/GameOverModal";

// Hooks customizados
import { useLobbyState } from "../hooks/useLobbyState";
import { useDraftState } from "../hooks/useDraftState";
import { useMatchTimer } from "../hooks/useMatchTimer";

// Utilitários
import { buildQueueTeams, formatTeamsForShare, calculateRemainingTimer, calculateNextTeams } from "../utils/matchUtils";
import { calculateStatsFromEvents, updateStatsOnGoal, removeStatsOnEventDeleted } from "../utils/statsUtils";

// Services
import { playerService } from "../services/playerService";
import { matchService } from "../services/matchService";
import { lobbyService } from "../services/lobbyService";
import { generateTeams, PLAYERS_PER_TEAM } from "../domain/matchmaking/balancer";

import { type Player, type MatchState, type Team, type ViewState, type PlayerStats } from "../types";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewState>("LOBBY");
  const [loading, setLoading] = useState(true);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  
  // Estados da partida
  const [gameState, setGameState] = useState<MatchState | null>(null);
  const [currentMatchId, setCurrentMatchId] = useState<string | null>(null);
  const [matchStats, setMatchStats] = useState<Record<string, PlayerStats>>({});
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalTeamColor, setGoalTeamColor] = useState<"red" | "blue" | null>(null);
  const [latePlayerModalOpen, setLatePlayerModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [gameOverReason, setGameOverReason] = useState<GameOverReason | "MANUAL" | null>(null);
  const [movingPlayerId, setMovingPlayerId] = useState<string | null>(null);
  
  const isEndingRef = useRef(false);

  // Hooks customizados
  const { selectedIds, handleToggleLobby, handleMoveUp, handleMoveDown, updateSelectedIds } = useLobbyState();
  const { draftState, setDraftState, handleSmartShuffleDraft, movePlayer, handleQueueReorder, removeFromQueue } = useDraftState();

  // Hook do cronômetro
  useMatchTimer({
    gameState,
    currentMatchId,
    gameOverReason,
    onTimerTick: (newTimer) => {
      setGameState(prev => prev ? { ...prev, timer: newTimer } : null);
    },
    onTimerEnd: (reason) => {
      setGameOverReason(reason);
      setGameState(prev => prev ? { ...prev, timer: 0, isRunning: false } : null);
    },
    isEndingRef,
  });

  // Carregamento inicial de dados
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
        if (lobbyOrder && lobbyOrder.length > 0) updateSelectedIds(lobbyOrder);

        if (activeMatch) {
          // ... lógica de carregamento da partida ativa usando utilitários
          const getP = (id: string) => players.find((p: Player) => p.id === id);
          const redPlayers = activeMatch.team_red_ids.map(getP).filter(Boolean) as Player[];
          const bluePlayers = activeMatch.team_blue_ids.map(getP).filter(Boolean) as Player[];
          
          // ... resto da lógica usando utilitários
          const events = await matchService.getMatchEvents(activeMatch.id);
          const stats = calculateStatsFromEvents(events);
          setMatchStats(stats);
          
          const calculatedTimer = calculateRemainingTimer(
            activeMatch.duration_seconds ?? 600,
            activeMatch.last_active_at
          );
          
          // ... resto do setup
        }
      } catch (error) {
        console.error(error);
        alert("Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [updateSelectedIds]);

  // Handlers simplificados usando utilitários
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

  const handleShareTeams = () => {
    if (!draftState) return;
    const shareText = formatTeamsForShare(draftState);
    navigator.clipboard.writeText(shareText);
    alert("Copiado!");
  };

  const handleConfirmGoal = async (scorerId: string, assistId: string | null) => {
    if (!gameState || !currentMatchId || !goalTeamColor) return;
    
    const newScoreRed = gameState.scoreRed + (goalTeamColor === "red" ? 1 : 0);
    const newScoreBlue = gameState.scoreBlue + (goalTeamColor === "blue" ? 1 : 0);

    if (newScoreRed >= 2 || newScoreBlue >= 2) {
      setGameOverReason("GOAL_LIMIT");
      setGameState((prev) => (prev ? { ...prev, isRunning: false } : null));
    }
    
    setGameState((prev) =>
      prev ? { ...prev, scoreRed: newScoreRed, scoreBlue: newScoreBlue } : null
    );

    const newStats = updateStatsOnGoal(matchStats, scorerId, assistId);
    setMatchStats(newStats);

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
      await matchService.finishMatch(
        currentMatchId,
        winnerColor,
        gameState.scoreRed,
        gameState.scoreBlue
      );

      const redWins = winnerColor === "RED";
      const winningTeam = redWins ? gameState.red : gameState.blue;
      const losingTeam = redWins ? gameState.blue : gameState.red;
      const waitingPlayers = gameState.queue.flatMap((t) => t.players);

      const nextTeams = calculateNextTeams(
        winnerColor,
        winningTeam,
        losingTeam,
        waitingPlayers,
        selectedIds
      );

      setDraftState(nextTeams);
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

  // Renderização simplificada
  if (loading) {
    return (
      <Layout title="Carregando...">
        <div className="flex justify-center p-10">
          <Loader2 className="animate-spin" />
        </div>
      </Layout>
    );
  }

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

  if (view === "DRAFT" && draftState) {
    return (
      <Layout title="Ajuste os Times">
        <DraftView
          draftState={draftState}
          selectedIds={selectedIds}
          onMove={movePlayer}
          onRemoveFromQueue={removeFromQueue}
          onConfirm={confirmMatchStart}
          onBack={() => setView("LOBBY")}
          onShare={handleShareTeams}
          onShuffle={() => handleSmartShuffleDraft(allPlayers, selectedIds)}
          onQueueReorder={handleQueueReorder}
        />
      </Layout>
    );
  }

  // View MATCH - muito mais limpo agora!
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
        players={allPlayers.filter(
          (p) =>
            !gameState?.red.players.find((rp) => rp.id === p.id) &&
            !gameState?.blue.players.find((bp) => bp.id === p.id) &&
            !gameState?.queue.flatMap((t) => t.players).find((qp) => qp.id === p.id)
        )}
        onAdd={handleAddLatePlayers}
      />
      
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
          <TimerControls
            gameState={gameState!}
            onToggleTimer={() =>
              setGameState((curr) =>
                curr ? { ...curr, isRunning: !curr.isRunning } : null
              )
            }
            onResetTimer={() =>
              setGameState((p) =>
                p ? { ...p, timer: 600, isRunning: false } : null
              )
            }
            onViewHistory={() => setHistoryModalOpen(true)}
          />
          
          <MatchControls
            onEndMatch={() => setGameOverReason("MANUAL")}
            onFinishDay={handleFinishDay}
          />
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
      
      <QueueSection
        queue={gameState!.queue}
        selectedIds={selectedIds}
        movingPlayerId={movingPlayerId}
        onSetMovingPlayer={setMovingPlayerId}
        onQuickMove={handleQuickMove}
        onQueueReorder={handleQueueReorderActiveMatch}
        onAddLatePlayers={() => setLatePlayerModalOpen(true)}
      />
    </Layout>
  );
}
