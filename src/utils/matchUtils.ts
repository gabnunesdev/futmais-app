import { type Player, type Team } from "../types";
import { PLAYERS_PER_TEAM } from "../domain/matchmaking/balancer";

/**
 * Constrói times da fila a partir de uma lista linear de jogadores
 * @param players Lista linear de jogadores
 * @returns Array de times (Time 3, Time 4, etc.)
 */
export function buildQueueTeams(players: Player[]): Team[] {
  const teams: Team[] = [];
  for (let i = 0; i < players.length; i += PLAYERS_PER_TEAM) {
    teams.push({
      name: `Time ${3 + teams.length}`,
      players: players.slice(i, i + PLAYERS_PER_TEAM),
    });
  }
  return teams;
}

/**
 * Reordena a fila movendo um jogador para cima ou para baixo
 * @param queue Lista atual da fila
 * @param playerId ID do jogador a mover
 * @param direction Direção do movimento ("up" ou "down")
 * @returns Nova lista reordenada
 */
export function reorderQueue(
  queue: Player[],
  playerId: string,
  direction: "up" | "down"
): Player[] {
  const newQueue = [...queue];
  const index = newQueue.findIndex((p) => p.id === playerId);

  if (index === -1) return queue;

  if (direction === "up" && index > 0) {
    [newQueue[index - 1], newQueue[index]] = [
      newQueue[index],
      newQueue[index - 1],
    ];
  } else if (direction === "down" && index < newQueue.length - 1) {
    [newQueue[index + 1], newQueue[index]] = [
      newQueue[index],
      newQueue[index + 1],
    ];
  }

  return newQueue;
}

/**
 * Move um jogador de uma posição para outra na fila
 * @param queue Lista atual da fila
 * @param sourcePlayerId ID do jogador a mover
 * @param targetPlayerId ID do jogador alvo (onde inserir)
 * @returns Nova lista com o jogador movido
 */
export function movePlayerInQueue(
  queue: Player[],
  sourcePlayerId: string,
  targetPlayerId: string
): Player[] {
  const newQueue = [...queue];
  const sourceIndex = newQueue.findIndex((p) => p.id === sourcePlayerId);
  const targetIndex = newQueue.findIndex((p) => p.id === targetPlayerId);

  if (sourceIndex === -1 || targetIndex === -1) return queue;

  const [movedPlayer] = newQueue.splice(sourceIndex, 1);
  newQueue.splice(targetIndex, 0, movedPlayer);

  return newQueue;
}

/**
 * Calcula os próximos times após o fim de uma partida
 * @param winnerColor Cor do time vencedor ("RED" ou "BLUE")
 * @param winningTeam Time vencedor
 * @param losingTeam Time perdedor
 * @param waitingPlayers Jogadores que estavam na fila
 * @param selectedIds Ordem de chegada dos jogadores
 * @returns Objeto com os próximos times (red, blue, queue)
 */
export function calculateNextTeams(
  winnerColor: "RED" | "BLUE",
  winningTeam: Team,
  losingTeam: Team,
  waitingPlayers: Player[],
  selectedIds: string[]
): {
  red: Player[];
  blue: Player[];
  queue: Player[];
} {
  const redWins = winnerColor === "RED";
  let challengerPlayers: Player[] = [];
  let newQueuePlayers: Player[] = [];

  if (waitingPlayers.length >= PLAYERS_PER_TEAM) {
    challengerPlayers = waitingPlayers.slice(0, PLAYERS_PER_TEAM);
    newQueuePlayers = [
      ...waitingPlayers.slice(PLAYERS_PER_TEAM),
      ...losingTeam.players,
    ];
  } else {
    const needed = PLAYERS_PER_TEAM - waitingPlayers.length;
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

  let nextRed: Player[] = [];
  let nextBlue: Player[] = [];

  if (redWins) {
    nextRed = winningTeam.players;
    nextBlue = challengerPlayers;
  } else {
    nextRed = challengerPlayers;
    nextBlue = winningTeam.players;
  }

  return {
    red: nextRed,
    blue: nextBlue,
    queue: newQueuePlayers,
  };
}

/**
 * Formata os times para compartilhamento via WhatsApp
 * @param draftState Estado do draft com times e fila
 * @returns String formatada para compartilhamento
 */
export function formatTeamsForShare(draftState: {
  red: Player[];
  blue: Player[];
  queue: Player[];
}): string {
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

  return `⚽ *TIMES DEFINIDOS*\n\n🔴 *TIME VERMELHO*\n🔴 ${redNames}\n\n🔵 *TIME AZUL*\n🔵 ${blueNames}\n\n------------------\nPRÓXIMOS:\n${queueNames}`;
}

/**
 * Calcula o timer restante baseado no último timestamp salvo
 * @param durationSeconds Duração total da partida em segundos
 * @param lastActiveAt Timestamp da última atualização
 * @returns Timer restante em segundos
 */
export function calculateRemainingTimer(
  durationSeconds: number,
  lastActiveAt: string | null
): number {
  let calculatedTimer = durationSeconds ?? 600;
  if (lastActiveAt) {
    const secondsPassed = Math.floor(
      (new Date().getTime() - new Date(lastActiveAt).getTime()) / 1000
    );
    if (secondsPassed > 0)
      calculatedTimer = Math.max(0, calculatedTimer - secondsPassed);
  }
  return calculatedTimer;
}
