import { supabase } from "./supabase";

export const matchService = {
  // 1. Cria a partida (status: IN_PROGRESS)
  startMatch: async (
    redIds: string[],
    blueIds: string[],
    queueIds: string[]
  ) => {
    // Busca duração padrão
    const { data: config } = await supabase
      .from("configs")
      .select("default_match_duration")
      .single();

    const duration = config?.default_match_duration || 600;

    const { data, error } = await supabase
      .from("matches")
      .insert({
        team_red_ids: redIds,
        team_blue_ids: blueIds,
        queue_ids: queueIds, // <--- NOVO: Salva a fila
        status: "IN_PROGRESS",
        score_red: 0,
        score_blue: 0,
        started_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
        duration_seconds: duration,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 2. BUSCA PARTIDA ATIVA (Essa é a função que faz a Home funcionar!)
  getActiveMatch: async () => {
    const { data, error } = await supabase
      .from("matches")
      .select("*") // O Select * já vai trazer o queue_ids
      .eq("status", "IN_PROGRESS")
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  updateQueue: async (matchId: string, newQueueIds: string[]) => {
    const { error } = await supabase
      .from("matches")
      .update({ queue_ids: newQueueIds })
      .eq("id", matchId);
    if (error) throw error;
  },

  // 3. Registra Gol/Assistência
  registerGoal: async (
    matchId: string,
    scorerId: string,
    assistId: string | null
  ) => {
    const { error } = await supabase.from("match_events").insert({
      match_id: matchId,
      player_id: scorerId,
      event_type: "GOAL",
    });
    if (error) throw error;

    if (assistId && assistId !== "none") {
      await supabase.from("match_events").insert({
        match_id: matchId,
        player_id: assistId,
        event_type: "ASSIST",
      });
    }
  },

  // 4. Atualiza Placar Geral
  updateScore: async (
    matchId: string,
    newScoreRed: number,
    newScoreBlue: number
  ) => {
    const { error } = await supabase
      .from("matches")
      .update({ score_red: newScoreRed, score_blue: newScoreBlue })
      .eq("id", matchId);
    if (error) throw error;
  },

  // 5. Busca Eventos (Simples)
  getMatchEvents: async (matchId: string) => {
    const { data, error } = await supabase
      .from("match_events")
      .select("*")
      .eq("match_id", matchId);
    if (error) throw error;
    return data;
  },

  // 6. Busca Eventos com Nomes (Para o Histórico)
  getMatchEventsWithNames: async (matchId: string) => {
    const { data, error } = await supabase
      .from("match_events")
      .select("*, players(name)")
      .eq("match_id", matchId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  updateMatchTimer: async (matchId: string, secondsRemaining: number) => {
    const { error } = await supabase
      .from("matches")
      .update({
        duration_seconds: secondsRemaining,
        last_active_at: new Date().toISOString(), // <--- O SEGREDO ESTÁ AQUI
      })
      .eq("id", matchId);

    if (error) console.error("Erro ao salvar timer:", error);
  },

  // 7. Deletar Evento (Correção)
  deleteEvent: async (eventId: string) => {
    const { error } = await supabase
      .from("match_events")
      .delete()
      .eq("id", eventId);
    if (error) throw error;
  },

  // 8. Encerrar Partida
  finishMatch: async (matchId: string, winnerColor: string | null) => {
    const { error } = await supabase
      .from("matches")
      .update({
        status: "FINISHED",
        winner_color: winnerColor,
        duration_seconds: 0, // Zera o tempo ou salva o restante
      })
      .eq("id", matchId);
    if (error) throw error;
  },

  finishAllActiveMatches: async () => {
    const { error } = await supabase
      .from("matches")
      .update({
        status: "FINISHED",
        last_active_at: new Date().toISOString(),
      })
      .eq("status", "IN_PROGRESS"); // Pega TUDO que estiver aberto

    if (error) throw error;
  },
};
