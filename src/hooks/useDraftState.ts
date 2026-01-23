import { useState, useCallback } from "react";
import { type Player } from "../types";
import { PLAYERS_PER_TEAM } from "../domain/matchmaking/balancer";
import { reorderQueue } from "../utils/matchUtils";
import { useDraftPersistence } from "./useDraftPersistence";

interface DraftState {
  red: Player[];
  blue: Player[];
  queue: Player[];
}

export function useDraftState(
  initialState: DraftState | null = null,
  selectedIds: string[] = []
) {
  const [draftState, setDraftState] = useState<DraftState | null>(initialState);
  
  // Hook de persistência integrado (side-effect only)
  useDraftPersistence(
    draftState,
    selectedIds,
    navigator.onLine
  );

  const handleSmartShuffleDraft = useCallback(
    (allPlayers: Player[], selectedIds: string[]) => {
      const MAX_PLAYERS = PLAYERS_PER_TEAM * 2;
      const mainIds = selectedIds.slice(0, MAX_PLAYERS);
      const queueIds = selectedIds.slice(MAX_PLAYERS);

      const pool = mainIds
        .map((id) => allPlayers.find((p) => p.id === id))
        .filter((p): p is Player => !!p);

      const queuePlayers = queueIds
        .map((id) => allPlayers.find((p) => p.id === id))
        .filter((p): p is Player => !!p);

      // Mistura aleatória leve
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }

      // Ordena por estrelas
      pool.sort((a, b) => (b.stars || 3) - (a.stars || 3));

      const red: Player[] = [];
      const blue: Player[] = [];
      let sumRed = 0;
      let sumBlue = 0;

      // Distribuição gulosa
      pool.forEach((player) => {
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

        const pStars = player.stars || 3;
        if (sumRed <= sumBlue) {
          red.push(player);
          sumRed += pStars;
        } else {
          blue.push(player);
          sumBlue += pStars;
        }
      });

      setDraftState({
        red,
        blue,
        queue: queuePlayers,
      });
    },
    []
  );

  const movePlayer = useCallback(
    (
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
    },
    [draftState]
  );

  const handleQueueReorder = useCallback(
    (playerId: string, direction: "up" | "down") => {
      if (!draftState) return;
      const newQueue = reorderQueue(draftState.queue, playerId, direction);
      setDraftState({
        ...draftState,
        queue: newQueue,
      });
    },
    [draftState]
  );

  const removeFromQueue = useCallback(
    (playerId: string) => {
      if (!draftState) return;
      setDraftState({
        ...draftState,
        queue: draftState.queue.filter((p) => p.id !== playerId),
      });
    },
    [draftState]
  );

  return {
    draftState,
    setDraftState,
    handleSmartShuffleDraft,
    movePlayer,
    handleQueueReorder,
    removeFromQueue,
  };
}
