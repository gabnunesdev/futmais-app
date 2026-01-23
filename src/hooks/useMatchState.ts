import { useState, useRef } from "react";
import { matchService } from "../services/matchService";
import { lobbyService } from "../services/lobbyService";
import type { Player, MatchState, PlayerStats, ViewState, DraftState, GameOverReason } from "../types";
import { updateStatsOnGoal, removeStatsOnEventDeleted, updateStatsOnCard } from "../utils/statsUtils";
import { calculateNextTeams, buildQueueTeams, movePlayerInQueue, reorderQueue } from "../utils/matchUtils";

interface UseMatchStateProps {
  setDraftState: (state: DraftState | null) => void;
  setView: (view: ViewState) => void;
  updateSelectedIds: (ids: string[]) => void;
  selectedIds: string[];
  allPlayers: Player[];
}

export function useMatchState({
  setDraftState,
  setView,
  updateSelectedIds,
  selectedIds,
  allPlayers
}: UseMatchStateProps) {
  const [gameState, setGameState] = useState<MatchState | null>(null);
  const [currentMatchId, setCurrentMatchId] = useState<string | null>(null);
  const [matchStats, setMatchStats] = useState<Record<string, PlayerStats>>({});
  const [gameOverReason, setGameOverReason] = useState<GameOverReason | "MANUAL" | null>(null);
  const isEndingRef = useRef(false);
  const [loading, setLoading] = useState(false);

  // Goal Handling
  const handleConfirmGoal = async (scorerId: string, assistId: string | null, teamColor: "red" | "blue") => {
    if (!gameState || !currentMatchId) return;
    
    // Prevent double submission if needed, though simpler here
    const newScoreRed = gameState.scoreRed + (teamColor === "red" ? 1 : 0);
    const newScoreBlue = gameState.scoreBlue + (teamColor === "blue" ? 1 : 0);

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

  const handleEventDeleted = async (
    _eventId: string,
    playerId: string,
    type: "GOAL" | "ASSIST"
  ) => {
    if (!gameState || !currentMatchId) return;
    const newStats = removeStatsOnEventDeleted(matchStats, playerId, type);
    setMatchStats(newStats);

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

  const handleCard = async (playerId: string, type: "YELLOW" | "RED") => {
    if (!gameState || !currentMatchId) return;

    // Atualiza Stats (Local)
    const newStats = updateStatsOnCard(matchStats, playerId, type);
    setMatchStats(newStats);

    // Tenta salvar no backend (Eventos de cartão)
    try {
        const eventType = type === "YELLOW" ? "YELLOW_CARD" : "RED_CARD";
        await matchService.registerEvent(currentMatchId, playerId, eventType);
    } catch (error) {
        console.error("Erro ao registrar cartão:", error);
    }
  };

  const handleSubstitution = async (playerOutId: string, playerInId: string) => {
    if (!gameState || !currentMatchId) return;

    // 1. Identificar onde está o Player Out
    const isRed = gameState.red.players.some(p => p.id === playerOutId);
    const isBlue = gameState.blue.players.some(p => p.id === playerOutId);

    if (!isRed && !isBlue) return; // Jogador não está jogando

    // 2. Encontrar o Player In (pode estar na fila ou na lista geral)
    // Se estiver na fila, removemos de lá.
    const queueList = gameState.queue.flatMap(t => t.players);
    const playerInIndex = queueList.findIndex(p => p.id === playerInId);
    
    // Se não achar na fila, busca em allPlayers (caso esteja na "bancada" sem time)
    const playerIn = playerInIndex !== -1 
        ? queueList[playerInIndex] 
        : allPlayers.find(p => p.id === playerInId);

    if (!playerIn) return; // Jogador novo não encontrado

    // 3. Montar novos times
    let newRed = [...gameState.red.players];
    let newBlue = [...gameState.blue.players];
    const newQueue = [...queueList];

    // Remover Player In da fila se estiver lá
    if (playerInIndex !== -1) {
        newQueue.splice(playerInIndex, 1);
    }
    
    // Pegar o objeto completo do playerOut
    const playerOut = isRed 
        ? newRed.find(p => p.id === playerOutId)!
        : newBlue.find(p => p.id === playerOutId)!;

    // Realizar a troca nos times
    if (isRed) {
        newRed = newRed.map(p => p.id === playerOutId ? playerIn : p);
    } else {
        newBlue = newBlue.map(p => p.id === playerOutId ? playerIn : p);
    }

    // Colocar o Player Out no final da fila
    newQueue.push(playerOut);
    
    // 4. Atualizar Estado Local
    const newQueueTeams = buildQueueTeams(newQueue);
    
    setGameState({
        ...gameState,
        red: { ...gameState.red, players: newRed },
        blue: { ...gameState.blue, players: newBlue },
        queue: newQueueTeams
    });

    // 5. Atualizar Backend
    try {
        await matchService.substitutePlayer(
            currentMatchId,
            newRed.map(p => p.id),
            newBlue.map(p => p.id),
            newQueue.map(p => p.id)
        );
    } catch (error) {
        console.error("Erro ao realizar substituição:", error);
    }
  };

  // Match Lifecycle
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
      const waitingPlayers = gameState.queue.flatMap((t: { players: Player[] }) => t.players);

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

  const confirmMatchStart = async (draftState: DraftState) => {
    if (!draftState) return;
    setLoading(true);
    try {
      const queueIds = draftState.queue.map((p: Player) => p.id);
      const matchData = await matchService.startMatch(
        draftState.red.map((p: Player) => p.id),
        draftState.blue.map((p: Player) => p.id),
        queueIds
      );
      setCurrentMatchId(matchData.id);
      const queueTeams = buildQueueTeams(draftState.queue);

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

  const handleFinishDay = async (clearBackup: () => void, navigate: (path: string) => void) => {
    const confirmEnd = window.confirm(
      "Deseja realmente encerrar o racha por hoje?\n\nIsso irá:\n1. Finalizar a partida atual.\n2. Limpar a lista de presença (check-in).\n3. Apagar rascunhos salvos."
    );

    if (!confirmEnd) return;

    try {
      setLoading(true);
      isEndingRef.current = true;

      if (currentMatchId && gameState) {
        let finalWinner: "RED" | "BLUE" | "DRAW" = "DRAW";
        if (gameState.scoreRed > gameState.scoreBlue) finalWinner = "RED";
        if (gameState.scoreBlue > gameState.scoreRed) finalWinner = "BLUE";

        await matchService.finishMatch(
          currentMatchId,
          finalWinner,
          gameState.scoreRed,
          gameState.scoreBlue
        );
      }

      clearBackup();
      await lobbyService.updateLobbyOrder([]);

      setGameState(null);
      setDraftState(null);
      updateSelectedIds([]);
      setCurrentMatchId(null);

      navigate("/");
    } catch (error) {
      console.error(error);
      alert("Erro ao encerrar sessão.");
      isEndingRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  // Queue Management
  const handleQuickMove = async (targetPlayerId: string, movingPlayerId: string) => {
    if (!movingPlayerId || !gameState || !currentMatchId) return;

    const currentQueueList = gameState.queue.flatMap((t) => t.players);
    const newQueueList = movePlayerInQueue(
      currentQueueList,
      movingPlayerId,
      targetPlayerId
    );

    const newTeams = buildQueueTeams(newQueueList);
    setGameState({ ...gameState, queue: newTeams });

    try {
      await matchService.updateQueue(
        currentMatchId,
        newQueueList.map((p) => p.id)
      );
    } catch (error) {
      console.error("Erro ao salvar movimento rápido:", error);
    }
  };

  const handleQueueReorderActiveMatch = async (
    playerId: string,
    direction: "up" | "down"
  ) => {
    if (!gameState || !currentMatchId) return;

    const currentQueueList = gameState.queue.flatMap((t) => t.players);
    const newQueueList = reorderQueue(currentQueueList, playerId, direction);

    const newTeams = buildQueueTeams(newQueueList);
    setGameState({ ...gameState, queue: newTeams });

    try {
      await matchService.updateQueue(
        currentMatchId,
        newQueueList.map((p) => p.id)
      );
    } catch (error) {
      console.error("Erro ao atualizar fila:", error);
    }
  };

  const handleAddLatePlayers = async (ids: string[]) => {
    if (!gameState) return;

    const updatedSelection = [...selectedIds, ...ids];
    updateSelectedIds(updatedSelection);
    await lobbyService.updateLobbyOrder(updatedSelection);

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

      const newTeams = buildQueueTeams(newFullQueue);
      return { ...prev, queue: newTeams };
    });
  };

  return {
    gameState,
    setGameState,
    currentMatchId,
    setCurrentMatchId,
    matchStats,
    setMatchStats,
    gameOverReason,
    setGameOverReason,
    isEndingRef,
    loadingState: loading,
    handlers: {
      handleConfirmGoal,
      handleEventDeleted,
      handleEndMatch,
      confirmMatchStart,
      handleFinishDay,
      handleQuickMove,
      handleQueueReorderActiveMatch,
      handleAddLatePlayers,
      handleCard,
      handleSubstitution
    }
  };
}
