import { supabase } from "./supabase";

export const matchService = {
  // 1. Cria a partida no banco e retorna o ID
  startMatch: async (redIds: string[], blueIds: string[]) => {
    const { data, error } = await supabase
      .from("matches")
      .insert([
        {
          team_red_ids: redIds,
          team_blue_ids: blueIds,
          score_red: 0,
          score_blue: 0,
          status: "IN_PROGRESS",
          duration_seconds: 600,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 2. Registra o Gol + Assistência
  // NOTA: Removido 'teamColor' dos argumentos pois a tabela salva apenas o ID do jogador
  registerGoal: async (
    matchId: string,
    scorerId: string,
    assistId: string | null
  ) => {
    // A. Salva o evento do Gol
    const { error: eventError } = await supabase.from("match_events").insert({
      match_id: matchId,
      player_id: scorerId,
      event_type: "GOAL",
    });
    if (eventError) throw eventError;

    // B. Salva a Assistência (se houver)
    if (assistId && assistId !== "none") {
      await supabase.from("match_events").insert({
        match_id: matchId,
        player_id: assistId,
        event_type: "ASSIST",
      });
    }
  },

  // Atualiza placar solto
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

  getActiveMatch: async () => {
    const { data, error } = await supabase
      .from("matches")
      .select("*") // Pega tudo da match
      .eq("status", "IN_PROGRESS")
      .single(); // Esperamos apenas uma partida ativa por vez

    if (error && error.code !== "PGRST116") {
      // PGRST116 é "nenhum resultado", que é ok
      console.error("Erro ao buscar partida ativa:", error);
      return null;
    }
    return data;
  },

  // NOVA FUNÇÃO: Busca eventos (gols) de uma partida para reconstruir o placar/ícones
  getMatchEvents: async (matchId: string) => {
    const { data, error } = await supabase
      .from("match_events")
      .select("*")
      .eq("match_id", matchId);

    if (error) throw error;
    return data;
  },

  finishMatch: async (matchId: string, winnerColor: string | null) => {
    const { error } = await supabase
      .from("matches")
      .update({
        status: "FINISHED",
        winner_color: winnerColor,
        duration_seconds: 0,
      })
      .eq("id", matchId);
    if (error) throw error;
  },
};
