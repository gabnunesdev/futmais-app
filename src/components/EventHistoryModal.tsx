import { useEffect, useState } from "react";
import { matchService } from "../services/matchService";
import { X, Trash2, History, Loader2 } from "lucide-react";

interface EventHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string | null;
  onEventDeleted: (
    eventId: string,
    playerId: string,
    type: "GOAL" | "ASSIST"
  ) => void;
}

// Interface tipada para segurança
interface MatchEventWithPlayer {
  id: string;
  player_id: string;
  event_type: "GOAL" | "ASSIST";
  created_at: string;
  players?: {
    name: string;
  };
}

export default function EventHistoryModal({
  isOpen,
  onClose,
  matchId,
  onEventDeleted,
}: EventHistoryModalProps) {
  const [events, setEvents] = useState<MatchEventWithPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    // SOLUÇÃO: Definimos a função AQUI DENTRO para evitar problemas de dependência
    const loadEvents = async () => {
      if (!matchId) return;
      setLoading(true);
      try {
        const data = await matchService.getMatchEventsWithNames(matchId);
        setEvents((data as unknown as MatchEventWithPlayer[]) || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && matchId) {
      loadEvents();
    }
  }, [isOpen, matchId]); // Agora as dependências são apenas props estáveis (primitivos)

  const handleDelete = async (event: MatchEventWithPlayer) => {
    if (
      !confirm(
        "Tem certeza que deseja apagar este lance? O placar será corrigido."
      )
    )
      return;

    setDeletingId(event.id);
    try {
      await matchService.deleteEvent(event.id);

      // Remove localmente sem precisar recarregar tudo
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
      onEventDeleted(event.id, event.player_id, event.event_type);
    } catch (error) {
      console.error(error);
      alert("Erro ao deletar evento.");
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[80vh]">
        <div className="bg-slate-900 p-4 flex justify-between items-center text-white shrink-0">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <History size={20} /> Histórico da Partida
          </h3>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 bg-slate-50">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-slate-400" />
            </div>
          ) : events.length === 0 ? (
            <p className="text-center text-slate-400 py-10">
              Nenhum lance registrado ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center"
                >
                  <div>
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                      {event.event_type === "GOAL"
                        ? "⚽ Gol"
                        : "👟 Assistência"}
                      <span className="font-normal text-slate-500">de</span>
                      <span className="text-blue-600">
                        {event.players?.name || "Desconhecido"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Registrado às{" "}
                      {new Date(event.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(event)}
                    disabled={deletingId === event.id}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deletingId === event.id ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
