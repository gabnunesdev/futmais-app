import { supabase } from '../services/supabase';

export const lobbyService = {
  // Busca a ordem atual salva no banco
  getLobbyOrder: async () => {
    // Usa maybeSingle para não dar erro se a tabela estiver vazia (retorna null em vez de exception)
    const { data, error } = await supabase
      .from('app_state')
      .select('lobby_order')
      .eq('id', 1)
      .maybeSingle();
    
    if (error) {
      console.error('Erro ao buscar fila:', error);
      return [];
    }
    return data?.lobby_order || [];
  },

  // Atualiza a ordem no banco
  updateLobbyOrder: async (newOrder: string[]) => {
    // Tenta atualizar primeiro
    const { error, data } = await supabase
      .from('app_state')
      .update({ 
        lobby_order: newOrder,
        updated_at: new Date().toISOString() 
      })
      .eq('id', 1)
      .select();

    // Se der erro ou não encontrar a linha para atualizar (data vazio), faz o Insert
    if (error || (data && data.length === 0)) {
       const { error: insertError } = await supabase
        .from('app_state')
        .upsert({ id: 1, lobby_order: newOrder });
        
       if (insertError) throw insertError;
    }
  }
};