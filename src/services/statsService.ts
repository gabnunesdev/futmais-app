import { supabase } from './supabase';
import { type Player } from '../types';

export interface RankingItem {
  playerId: string;
  name: string;
  goals: number;
  assists: number;
  matches: number; // Futuro: Contar partidas jogadas
}

export interface MatchHistoryItem {
  id: string;
  date: string;
  time: string;
  scoreRed: number;
  scoreBlue: number;
  winner: 'RED' | 'BLUE' | 'DRAW';
  teamRed: string[]; // IDs
  teamBlue: string[]; // IDs
}

export const statsService = {
  // 1. BUSCAR RANKING (Com filtros de data)
  getRanking: async (startDate: string, endDate: string, allPlayers: Player[]) => {
    // Busca todos os eventos (Gols/Assist) no período
    const { data: events, error } = await supabase
      .from('match_events')
      .select('player_id, event_type')
      .gte('created_at', startDate) // Maior ou igual data inicio
      .lte('created_at', endDate);  // Menor ou igual data fim

    if (error) throw error;

    // Processamento em Memória (Rápido e Flexível)
    const statsMap = new Map<string, RankingItem>();

    // Inicializa todos os jogadores com 0
    allPlayers.forEach(p => {
      statsMap.set(p.id, { playerId: p.id, name: p.name, goals: 0, assists: 0, matches: 0 });
    });

    // Soma os eventos
    events.forEach((ev) => {
      const player = statsMap.get(ev.player_id);
      if (player) {
        if (ev.event_type === 'GOAL') player.goals++;
        if (ev.event_type === 'ASSIST') player.assists++;
      }
    });

    // Converte para Array e Ordena (Artilharia é critério principal)
    return Array.from(statsMap.values()).sort((a, b) => {
        if (b.goals !== a.goals) return b.goals - a.goals; // Quem tem mais gols
        return b.assists - a.assists; // Desempate por assist
    });
  },

  // 2. BUSCAR HISTÓRICO
  getHistory: async () => {
    const { data, error } = await supabase
      .from('view_match_history') // Usa a View que criamos
      .select('*');

    if (error) throw error;

    return data.map((m) => ({
      id: m.id,
      date: new Date(m.created_at).toLocaleDateString(),
      time: new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      scoreRed: m.score_red,
      scoreBlue: m.score_blue,
      winner: m.winner_color,
      teamRed: m.team_red_ids,
      teamBlue: m.team_blue_ids
    }));
  }
};