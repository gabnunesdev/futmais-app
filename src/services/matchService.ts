import { supabase } from "../services/supabase";

export const matchService = {
  // 1. INICIAR NOVA PARTIDA (Agora salvando a fila)
  // 1. INICIAR NOVA PARTIDA (Versão Blindada)
  startMatch: async (
    redIds: string[],
    blueIds: string[],
    queueIds: string[]
  ) => {
    // Tenta buscar configuração, mas não trava se falhar
    let duration = 600; // Valor padrão (10 min)

    try {
      const { data: config, error } = await supabase
        .from("configs")
        .select("default_match_duration")
        .maybeSingle(); // <--- Use maybeSingle em vez de single para não dar erro se estiver vazio

      if (!error && config?.default_match_duration) {
        duration = config.default_match_duration;
      }
    } catch (error) {
      console.error(error);
      console.warn("Usando duração padrão (600s) pois não há config salva.");
    }

    const { data, error } = await supabase
      .from("matches")
      .insert({
        team_red_ids: redIds,
        team_blue_ids: blueIds,
        queue_ids: queueIds,
        status: "IN_PROGRESS",
        score_red: 0,
        score_blue: 0,
        started_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
        duration_seconds: duration,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar partida:", error.message);
      throw error;
    }
    return data;
  },

  // 2. BUSCAR PARTIDA ATIVA
  getActiveMatch: async () => {
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .eq("status", "IN_PROGRESS")
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // 3. ATUALIZAR PLACAR
  updateScore: async (matchId: string, scoreRed: number, scoreBlue: number) => {
    const { error } = await supabase
      .from("matches")
      .update({
        score_red: scoreRed,
        score_blue: scoreBlue,
        last_active_at: new Date().toISOString(),
      })
      .eq("id", matchId);

    if (error) throw error;
  },

  // 4. ATUALIZAR TIMER (Duração)
  updateMatchTimer: async (matchId: string, newDuration: number) => {
    const { error } = await supabase
      .from("matches")
      .update({ duration_seconds: newDuration })
      .eq("id", matchId);

    if (error) throw error;
  },

  // 5. ATUALIZAR A FILA EM TEMPO REAL (Novo)
  // Usado quando chega gente atrasada ou alguém vai embora durante o jogo
  updateQueue: async (matchId: string, newQueueIds: string[]) => {
    const { error } = await supabase
      .from("matches")
      .update({ queue_ids: newQueueIds })
      .eq("id", matchId);

    if (error) throw error;
  },

  // 6. FINALIZAR PARTIDA
  finishMatch: async (
    matchId: string,
    winner: "RED" | "BLUE" | "DRAW",
    scoreRed: number,
    scoreBlue: number
  ) => {
    const { error } = await supabase
      .from("matches")
      .update({
        status: "FINISHED",
        winner_team: winner,
        score_red: scoreRed,
        score_blue: scoreBlue,
        ended_at: new Date().toISOString(),
      })
      .eq("id", matchId);

    if (error) throw error;
  },

  // --- EVENTOS (Gols e Assistências) ---

  registerEvent: async (
    matchId: string,
    playerId: string,
    type: "GOAL" | "ASSIST" | "YELLOW_CARD" | "RED_CARD"
  ) => {
    const { error } = await supabase.from("match_events").insert({
      match_id: matchId,
      player_id: playerId,
      event_type: type,
      created_at: new Date().toISOString(),
    });

    if (error) throw error;

    // Atualiza o last_active_at da partida para manter o timer sincronizado
    await supabase
      .from("matches")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", matchId);
  },

  deleteEvent: async (eventId: string) => {
    const { error } = await supabase
      .from("match_events")
      .delete()
      .eq("id", eventId);

    if (error) throw error;
  },

  getMatchEvents: async (matchId: string) => {
    const { data, error } = await supabase
      .from("match_events")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data;
  },

  
  updateTeams: async (matchId: string, redIds: string[], blueIds: string[]) => {
    const { error } = await supabase
      .from("matches")
      .update({
        team_red_ids: redIds,
        team_blue_ids: blueIds,
      })
      .eq("id", matchId);

    if (error) throw error;
  },

  substitutePlayer: async (
    matchId: string, 
    redIds: string[], 
    blueIds: string[], 
    queueIds: string[]
  ) => {
    const { error } = await supabase
      .from("matches")
      .update({
        team_red_ids: redIds,
        team_blue_ids: blueIds,
        queue_ids: queueIds,
        last_active_at: new Date().toISOString()
      })
      .eq("id", matchId);

    if (error) throw error;
  }
};
