import type { Player } from "../types";
import { supabase } from "./supabase";

export const playerService = {
  // Busca todos os jogadores ordenados por nome
  getAll: async () => {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .order("name");
    if (error) throw error;
    return data;
  },

  // Cria novo jogador
  create: async (name: string, stars: number) => {
    const { data, error } = await supabase
      .from("players")
      .insert([{ name, stars, is_active: true }])
      .select()
      .single();

    if (error) throw error;
    return data as Player;
  },

  // Atualiza nota (caso o jogador evolua ou piore no churrasco)
  update: async (id: string, name: string, stars: number) => {
    const { error } = await supabase
      .from("players")
      .update({ name, stars })
      .eq("id", id);

    if (error) throw error;
  },

  // Deleta jogador (Soft delete ou Hard delete? Por enquanto Hard delete para simplificar)
  delete: async (id: string) => {
    const { error } = await supabase.from("players").delete().eq("id", id);
    if (error) throw error;
  },

  getRankingWins: async () => {
    const { data, error } = await supabase.rpc("get_ranking_wins");
    if (error) throw error;
    return data as { player_id: string; name: string; wins: number }[];
  },
};
