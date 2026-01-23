import { useState, useEffect } from "react";
import { playerService } from "../services/playerService";
import { matchService } from "../services/matchService";
import { lobbyService } from "../services/lobbyService";
import { buildQueueTeams, calculateRemainingTimer } from "../utils/matchUtils";
import { calculateStatsFromEvents } from "../utils/statsUtils";
import type {
  Player,
  MatchState,
  PlayerStats,
  ViewState,
  DraftState,
} from "../types";

interface UseMatchDataProps {
  updateSelectedIds: (ids: string[]) => void;
  setGameState: (state: MatchState | null) => void;
  setMatchStats: (stats: Record<string, PlayerStats>) => void;
  setCurrentMatchId: (id: string | null) => void;
  setDraftState: (state: DraftState | null) => void;
  loadFromStorage: () => {
    draftState: DraftState | null;
    selectedIds: string[];
  } | null;
  clearBackup: () => void;
  setAllPlayers: (players: Player[]) => void;
  setView: (view: ViewState) => void;
}

export function useMatchData({
  updateSelectedIds,
  setGameState,
  setMatchStats,
  setCurrentMatchId,
  setDraftState,
  loadFromStorage,
  clearBackup,
  setAllPlayers,
  setView,
}: UseMatchDataProps) {
  const [loading, setLoading] = useState(true);

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
              (p: Player) => !playingIds.includes(p.id) && p.is_active,
            );
          }

          const currentInGameOrQueue = [
            ...activeMatch.team_red_ids,
            ...activeMatch.team_blue_ids,
            ...queuePlayers.map((p) => p.id),
          ];
          if (lobbyOrder.length > 0) {
            updateSelectedIds(lobbyOrder);
          } else if (currentInGameOrQueue.length > 0) {
            updateSelectedIds(currentInGameOrQueue);
          }

          const events = await matchService.getMatchEvents(activeMatch.id);
          const stats = calculateStatsFromEvents(events);
          setMatchStats(stats);
          setCurrentMatchId(activeMatch.id);

          const calculatedTimer = calculateRemainingTimer(
            activeMatch.duration_seconds ?? 600,
            activeMatch.last_active_at,
          );

          const queueTeams = buildQueueTeams(queuePlayers);

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
          // Tenta recuperar backup robusto usando o hook de persistência
          const backup = loadFromStorage();
          if (backup && backup.draftState) {
            try {
              // Valida se os jogadores ainda existem
              const allPlayerIds = new Set(players.map((p) => p.id));
              const backupRedIds = backup.draftState.red.map(
                (p: Player) => p.id,
              );
              const backupBlueIds = backup.draftState.blue.map(
                (p: Player) => p.id,
              );
              const backupQueueIds = backup.draftState.queue.map(
                (p: Player) => p.id,
              );

              const allBackupIds = [
                ...backupRedIds,
                ...backupBlueIds,
                ...backupQueueIds,
              ];

              // Verifica se todos os jogadores do backup ainda existem
              const allIdsExist = allBackupIds.every((id) =>
                allPlayerIds.has(id),
              );

              if (allIdsExist) {
                // Recupera os objetos Player completos
                const getP = (id: string) => players.find((p) => p.id === id);
                const recoveredRed = backup.draftState.red
                  .map((p) => getP(p.id))
                  .filter((p): p is Player => !!p);
                const recoveredBlue = backup.draftState.blue
                  .map((p) => getP(p.id))
                  .filter((p): p is Player => !!p);
                const recoveredQueue = backup.draftState.queue
                  .map((p) => getP(p.id))
                  .filter((p): p is Player => !!p);

                if (recoveredRed.length > 0 && recoveredBlue.length > 0) {
                  setDraftState({
                    red: recoveredRed,
                    blue: recoveredBlue,
                    queue: recoveredQueue,
                  });

                  // Restaura também a ordem do lobby se disponível
                  if (backup.selectedIds && backup.selectedIds.length > 0) {
                    updateSelectedIds(backup.selectedIds);
                  }

                  setView("DRAFT");
                  console.log(
                    "✅ Draft recuperado com sucesso após F5/recarregamento",
                  );
                } else {
                  console.warn(
                    "⚠️ Backup inválido - jogadores não encontrados",
                  );
                  clearBackup();
                  setView("LOBBY");
                }
              } else {
                console.warn("⚠️ Backup contém jogadores que não existem mais");
                clearBackup();
                setView("LOBBY");
              }
            } catch (e) {
              console.error("❌ Erro ao recuperar backup:", e);
              clearBackup();
              setView("LOBBY");
            }
          } else {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { loading, setLoading };
}
