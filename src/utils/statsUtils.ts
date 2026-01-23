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
      stats[ev.player_id] = { goals: 0, assists: 0, yellowCards: 0, redCards: 0 };
    
    // Processamento sequencial para garantir a regra de 2 amarelos = 1 vermelho
    const p = stats[ev.player_id];
    
    if (ev.event_type === "GOAL") p.goals++;
    if (ev.event_type === "ASSIST") p.assists++;
    
    if (ev.event_type === "YELLOW_CARD") {
        p.yellowCards = (p.yellowCards || 0) + 1;
        if (p.yellowCards === 2) {
            p.yellowCards = 0;
            p.redCards = (p.redCards || 0) + 1;
        }
    }
    
    if (ev.event_type === "RED_CARD") {
        p.redCards = (p.redCards || 0) + 1;
    }
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
 * Atualiza estatísticas quando um cartão é aplicado
 * @param currentStats Estatísticas atuais
 * @param playerId ID do jogador
 * @param type Tipo do cartão ("YELLOW" | "RED")
 * @returns Novas estatísticas atualizadas
 */
export function updateStatsOnCard(
  currentStats: Record<string, PlayerStats>,
  playerId: string,
  type: "YELLOW" | "RED"
): Record<string, PlayerStats> {
    const stats = { ...currentStats };
    const pStats = stats[playerId] || { goals: 0, assists: 0, yellowCards: 0, redCards: 0 };
    
    if (type === "YELLOW") {
        const newYellows = (pStats.yellowCards || 0) + 1;
        if (newYellows === 2) {
            stats[playerId] = { ...pStats, yellowCards: 0, redCards: (pStats.redCards || 0) + 1 };
        } else {
            stats[playerId] = { ...pStats, yellowCards: newYellows };
        }
    } else {
        stats[playerId] = { ...pStats, redCards: (pStats.redCards || 0) + 1 };
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
  type: "GOAL" | "ASSIST" | "YELLOW_CARD" | "RED_CARD"
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
    if (type === "YELLOW_CARD") {
        // Se tem 0 amarelos e >0 vermelhos, assume que foi revertido de 2 amarelos
        const currentYellows = stats[playerId].yellowCards || 0;
        const currentReds = stats[playerId].redCards || 0;
        
        if (currentYellows === 0 && currentReds > 0) {
            // Reverter conversão: Remove 1 Vermelho, Volta para 1 Amarelo
            stats[playerId] = {
                ...stats[playerId],
                redCards: currentReds - 1,
                yellowCards: 1
            };
        } else {
            // Apenas remove o amarelo
             stats[playerId] = {
                ...stats[playerId],
                yellowCards: Math.max(0, currentYellows - 1),
            };
        }
    }
    if (type === "RED_CARD")
        stats[playerId] = {
            ...stats[playerId],
            redCards: Math.max(0, (stats[playerId].redCards || 0) - 1),
        };
  }
  return stats;
}
