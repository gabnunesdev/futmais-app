import { type PlayerStats } from "../types";

/**
 * Calcula estatísticas dos jogadores a partir de eventos da partida
 * @param events Array de eventos da partida
 * @returns Objeto com estatísticas por playerId
 */
export function calculateStatsFromEvents(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  events: any[]
): Record<string, PlayerStats> {
  const stats: Record<string, PlayerStats> = {};
  events?.forEach((ev) => {
    if (!stats[ev.player_id])
      stats[ev.player_id] = { goals: 0, assists: 0 };
    if (ev.event_type === "GOAL") stats[ev.player_id].goals++;
    if (ev.event_type === "ASSIST") stats[ev.player_id].assists++;
  });
  return stats;
}

/**
 * Atualiza estatísticas quando um gol é marcado
 * @param currentStats Estatísticas atuais
 * @param scorerId ID do jogador que marcou o gol
 * @param assistId ID do jogador que deu a assistência (opcional)
 * @returns Novas estatísticas atualizadas
 */
export function updateStatsOnGoal(
  currentStats: Record<string, PlayerStats>,
  scorerId: string,
  assistId: string | null
): Record<string, PlayerStats> {
  const stats = { ...currentStats };
  const sc = stats[scorerId] || { goals: 0, assists: 0 };
  stats[scorerId] = { ...sc, goals: sc.goals + 1 };
  if (assistId) {
    const as = stats[assistId] || { goals: 0, assists: 0 };
    stats[assistId] = { ...as, assists: as.assists + 1 };
  }
  return stats;
}

/**
 * Remove estatísticas quando um evento é deletado
 * @param currentStats Estatísticas atuais
 * @param playerId ID do jogador
 * @param type Tipo do evento ("GOAL" ou "ASSIST")
 * @returns Novas estatísticas atualizadas
 */
export function removeStatsOnEventDeleted(
  currentStats: Record<string, PlayerStats>,
  playerId: string,
  type: "GOAL" | "ASSIST"
): Record<string, PlayerStats> {
  const stats = { ...currentStats };
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
}
