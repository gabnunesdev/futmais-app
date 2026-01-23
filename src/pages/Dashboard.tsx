import { useState, useEffect } from "react";
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

// Hooks
import { useLobbyState } from "../hooks/useLobbyState";
import { useDraftState } from "../hooks/useDraftState";
import { useMatchTimer } from "../hooks/useMatchTimer";
import { useDraftPersistence } from "../hooks/useDraftPersistence";
import { useMatchState } from "../hooks/useMatchState";
import { useMatchData } from "../hooks/useMatchData";

import { generateTeams } from "../domain/matchmaking/balancer";

// Types e Utils
import { type ViewState, type Player } from "../types";
import { formatTeamsForShare } from "../utils/matchUtils";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewState>("LOBBY");
  
  // UI Local State
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalTeamColor, setGoalTeamColor] = useState<"red" | "blue" | null>(null);
  const [latePlayerModalOpen, setLatePlayerModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [movingPlayerId, setMovingPlayerId] = useState<string | null>(null);

  // Lifted State
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);

  // 1. Lobby Hook
  const { selectedIds, handleToggleLobby, handleMoveUp, handleMoveDown, updateSelectedIds } = useLobbyState();

  // 2. Draft Hook
  const { draftState, setDraftState, handleSmartShuffleDraft, movePlayer, handleQueueReorder, removeFromQueue } = useDraftState(null);

  // 3. Persistence
  const { loadFromStorage, clearBackup } = useDraftPersistence(
    draftState,
    selectedIds,
    navigator.onLine
  );

  // 4. Match State Hook
  const {
    gameState,
    setGameState,
    currentMatchId,
    setCurrentMatchId,
    matchStats,
    setMatchStats,
    gameOverReason,
    setGameOverReason,
    isEndingRef,
    loadingState: matchLoading,
    handlers: matchHandlers
  } = useMatchState({
    setDraftState,
    setView,
    updateSelectedIds,
    selectedIds,
    allPlayers
  });

  // 5. Data Loading Hook
  const { loading: dataLoading } = useMatchData({
    updateSelectedIds,
    setGameState,
    setMatchStats,
    setCurrentMatchId,
    setDraftState,
    loadFromStorage,
    clearBackup,
    setAllPlayers,
    setView // Passando setView diretamente
  });

  // 6. Hook do cronômetro
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

  // Efeitos Globais
  useEffect(() => {
    sessionStorage.setItem("is_admin", "true");
  }, []);


  // Handlers de View/UI (que nao estao nos hooks)
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

  // Renderização
  const isLoading = dataLoading || matchLoading;

  if (isLoading) {
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
          onConfirm={() => matchHandlers.confirmMatchStart(draftState)}
          onBack={() => setView("LOBBY")}
          onShare={handleShareTeams}
          onShuffle={() => handleSmartShuffleDraft(allPlayers, selectedIds)}
          onQueueReorder={handleQueueReorder}
        />
      </Layout>
    );
  }

  return (
    <Layout title="Partida em Andamento">
      <GoalModal
        isOpen={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        onConfirm={(scorer, assist) => {
             if(goalTeamColor) matchHandlers.handleConfirmGoal(scorer, assist, goalTeamColor);
             setGoalModalOpen(false);
        }}
        teamName={goalTeamColor === "red" ? "Vermelho" : "Azul"}
        players={
          goalTeamColor === "red"
            ? gameState!.red.players
            : gameState?.blue.players || []
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
        onAdd={matchHandlers.handleAddLatePlayers}
      />
      
      <EventHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        matchId={currentMatchId}
        onEventDeleted={matchHandlers.handleEventDeleted}
      />
      
      <GameOverModal
        isOpen={!!gameOverReason}
        reason={gameOverReason as GameOverReason}
        scoreRed={gameState?.scoreRed || 0}
        scoreBlue={gameState?.scoreBlue || 0}
        onConfirm={(winner) => matchHandlers.handleEndMatch(winner)}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {gameState && (
            <>
                <ActiveTeamCard
                color="red"
                team={gameState.red}
                score={gameState.scoreRed}
                stats={matchStats}
                onGoal={() => {
                    setGoalTeamColor("red");
                    setGoalModalOpen(true);
                }}
                lobbyOrder={selectedIds}
                />
                
                <div className="flex flex-col items-center">
                <TimerControls
                    gameState={gameState}
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
                    onFinishDay={() => matchHandlers.handleFinishDay(clearBackup, (path) => navigate(path))}
                />
                </div>
                
                <ActiveTeamCard
                color="blue"
                team={gameState.blue}
                score={gameState.scoreBlue}
                stats={matchStats}
                onGoal={() => {
                    setGoalTeamColor("blue");
                    setGoalModalOpen(true);
                }}
                lobbyOrder={selectedIds}
                />
            </>
        )}
      </div>
      
      {gameState && (
          <QueueSection
            queue={gameState.queue}
            selectedIds={selectedIds}
            movingPlayerId={movingPlayerId}
            onSetMovingPlayer={setMovingPlayerId}
            onQuickMove={(target) => {
                 if(movingPlayerId) matchHandlers.handleQuickMove(target, movingPlayerId);
            }}
            onQueueReorder={matchHandlers.handleQueueReorderActiveMatch}
            onAddLatePlayers={() => setLatePlayerModalOpen(true)}
          />
      )}
    </Layout>
  );
}
