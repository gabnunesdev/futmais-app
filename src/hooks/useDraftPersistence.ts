import { useEffect, useRef, useCallback } from "react";
import { type Player } from "../types";

interface DraftState {
  red: Player[];
  blue: Player[];
  queue: Player[];
}

interface DraftBackup {
  draftState: DraftState;
  selectedIds: string[];
  timestamp: number;
  version: string; // Para compatibilidade futura
}

const STORAGE_KEY = "draft_backup";
const STORAGE_KEY_SESSION = "draft_backup_session";
const BACKUP_VERSION = "1.0";
const MAX_BACKUP_AGE_MS = 24 * 60 * 60 * 1000; // 24 horas

/**
 * Hook para gerenciar persistência robusta do draft
 * - Salva automaticamente no localStorage e sessionStorage
 * - Valida timestamp para evitar backups antigos
 * - Tenta salvar no backend quando possível
 */
export function useDraftPersistence(
  draftState: DraftState | null,
  selectedIds: string[],
  isOnline: boolean = navigator.onLine
) {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<number>(0);
  const isSavingRef = useRef(false);

  // Função para salvar no storage local
  const saveToLocalStorage = useCallback(
    (state: DraftState, ids: string[]) => {
      try {
        const backup: DraftBackup = {
          draftState: state,
          selectedIds: ids,
          timestamp: Date.now(),
          version: BACKUP_VERSION,
        };

        // Salva no localStorage (persiste entre sessões)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(backup));

        // Salva também no sessionStorage como backup adicional
        sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(backup));

        lastSavedRef.current = Date.now();
        console.log("✅ Draft salvo localmente", {
          timestamp: new Date(lastSavedRef.current).toLocaleTimeString(),
        });
      } catch (error) {
        console.error("❌ Erro ao salvar draft no localStorage:", error);
        // Tenta salvar apenas no sessionStorage se localStorage falhar
        try {
          const backup: DraftBackup = {
            draftState: state,
            selectedIds: ids,
            timestamp: Date.now(),
            version: BACKUP_VERSION,
          };
          sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(backup));
        } catch (e) {
          console.error("❌ Erro ao salvar no sessionStorage:", e);
        }
      }
    },
    []
  );

  // Função para recuperar do storage
  const loadFromStorage = useCallback((): DraftBackup | null => {
    try {
      // Tenta primeiro o localStorage
      const localBackup = localStorage.getItem(STORAGE_KEY);
      if (localBackup) {
        const parsed: DraftBackup = JSON.parse(localBackup);
        const age = Date.now() - parsed.timestamp;

        // Valida se o backup não é muito antigo
        if (age < MAX_BACKUP_AGE_MS && parsed.version === BACKUP_VERSION) {
          console.log("✅ Draft recuperado do localStorage", {
            age: Math.round(age / 1000 / 60),
            minutes: "minutos atrás",
          });
          return parsed;
        } else {
          console.warn("⚠️ Backup muito antigo ou versão incompatível, ignorando");
          // Remove backup antigo
          localStorage.removeItem(STORAGE_KEY);
        }
      }

      // Se não encontrou no localStorage, tenta sessionStorage
      const sessionBackup = sessionStorage.getItem(STORAGE_KEY_SESSION);
      if (sessionBackup) {
        const parsed: DraftBackup = JSON.parse(sessionBackup);
        const age = Date.now() - parsed.timestamp;

        if (age < MAX_BACKUP_AGE_MS && parsed.version === BACKUP_VERSION) {
          console.log("✅ Draft recuperado do sessionStorage", {
            age: Math.round(age / 1000 / 60),
            minutes: "minutos atrás",
          });
          return parsed;
        }
      }
    } catch (error) {
      console.error("❌ Erro ao recuperar draft:", error);
    }

    return null;
  }, []);

  // Salva automaticamente quando draftState ou selectedIds mudam
  useEffect(() => {
    if (!draftState) {
      // Se não há draft, limpa o backup
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY_SESSION);
      return;
    }

    // Debounce: salva após 500ms sem mudanças
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (!isSavingRef.current) {
        isSavingRef.current = true;
        saveToLocalStorage(draftState, selectedIds);
        isSavingRef.current = false;
      }
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [draftState, selectedIds, saveToLocalStorage]);

  // Salva imediatamente antes de sair da página (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (draftState) {
        // Salva síncrono antes de sair
        saveToLocalStorage(draftState, selectedIds);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [draftState, selectedIds, saveToLocalStorage]);

  // Detecta quando volta online e tenta salvar no backend (futuro)
  useEffect(() => {
    if (isOnline && draftState && Date.now() - lastSavedRef.current > 5000) {
      // Quando volta online, pode tentar sincronizar com backend
      // Por enquanto apenas loga
      console.log("🌐 Conexão restaurada, draft pode ser sincronizado");
    }
  }, [isOnline, draftState]);

  // Função para limpar backup
  const clearBackup = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY_SESSION);
    console.log("🗑️ Backup do draft removido");
  }, []);

  return {
    loadFromStorage,
    clearBackup,
    saveToLocalStorage: (state: DraftState, ids: string[]) =>
      saveToLocalStorage(state, ids),
  };
}
