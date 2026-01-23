import { useEffect, useRef } from "react";
import { type MatchState, type GameOverReason } from "../types";
import { matchService } from "../services/matchService";
import { PLAYERS_PER_TEAM } from "../domain/matchmaking/balancer";

interface UseMatchTimerProps {
  gameState: MatchState | null;
  currentMatchId: string | null;
  gameOverReason: GameOverReason | "MANUAL" | null;
  onTimerTick: (newTimer: number) => void;
  onTimerEnd: (reason: GameOverReason) => void;
  isEndingRef: React.MutableRefObject<boolean>;
}

export function useMatchTimer({
  gameState,
  currentMatchId,
  gameOverReason,
  onTimerTick,
  onTimerEnd,
  isEndingRef,
}: UseMatchTimerProps) {
  const gameStateRef = useRef<MatchState | null>(null);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (gameState?.isRunning && !gameOverReason) {
      interval = setInterval(() => {
        if (!gameStateRef.current) return;

        if (gameStateRef.current.timer <= 1) {
          const isDraw =
            gameStateRef.current.scoreRed === gameStateRef.current.scoreBlue;
          const queueCount = gameStateRef.current.queue.flatMap(
            (t) => t.players
          ).length;
          const hasFullTeamsOutside = queueCount >= PLAYERS_PER_TEAM * 2;
          let reason: GameOverReason = "TIME_LIMIT";
          if (isDraw && !hasFullTeamsOutside) reason = "PENALTIES";
          onTimerEnd(reason);
          return;
        }

        // Chama callback para atualizar o timer no componente pai
        onTimerTick(gameStateRef.current.timer - 1);
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
  }, [
    gameState?.isRunning,
    currentMatchId,
    gameOverReason,
    onTimerTick,
    onTimerEnd,
    isEndingRef,
  ]);

  return { gameStateRef };
}
