import { useState, useCallback } from "react";
import { lobbyService } from "../services/lobbyService";

export function useLobbyState(initialIds: string[] = []) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);

  const handleToggleLobby = useCallback(async (playerId: string) => {
    setSelectedIds((prev) => {
      let newOrder = [...prev];
      if (newOrder.includes(playerId))
        newOrder = newOrder.filter((id) => id !== playerId);
      else newOrder.push(playerId);
      
      // Salva no backend
      lobbyService.updateLobbyOrder(newOrder).catch(console.error);
      return newOrder;
    });
  }, []);

  const handleMoveUp = useCallback(async (index: number) => {
    if (index <= 0) return;
    setSelectedIds((prev) => {
      const newOrder = [...prev];
      [newOrder[index - 1], newOrder[index]] = [
        newOrder[index],
        newOrder[index - 1],
      ];
      lobbyService.updateLobbyOrder(newOrder).catch(console.error);
      return newOrder;
    });
  }, []);

  const handleMoveDown = useCallback(async (index: number) => {
    setSelectedIds((prev) => {
      if (index === prev.length - 1) return prev;
      const newOrder = [...prev];
      const temp = newOrder[index];
      newOrder[index] = newOrder[index + 1];
      newOrder[index + 1] = temp;
      lobbyService.updateLobbyOrder(newOrder).catch(console.error);
      return newOrder;
    });
  }, []);

  const updateSelectedIds = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);

  return {
    selectedIds,
    handleToggleLobby,
    handleMoveUp,
    handleMoveDown,
    updateSelectedIds,
  };
}
