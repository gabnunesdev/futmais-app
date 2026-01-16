import { supabase } from "./supabase"

export const lobbyService = {
  // Pega a fila atual do banco
  getLobbyOrder: async () => {
    const { data, error } = await supabase
      .from('app_state')
      .select('lobby_order')
      .eq('id', 1)
      .single();
    if (error) throw error;
    return data?.lobby_order || [];
  },

  // Salva a fila inteira (usado para adicionar, remover ou reordenar)
  updateLobbyOrder: async (newOrder: string[]) => {
    const { error } = await supabase
      .from('app_state')
      .update({ lobby_order: newOrder, updated_at: new Date().toISOString() })
      .eq('id', 1);
    if (error) throw error;
  }
};