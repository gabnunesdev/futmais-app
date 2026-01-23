import { UserPlus, ChevronUp, ChevronDown, MousePointer2, XCircle } from "lucide-react";
import { type Team, type Player } from "../../types";

interface QueueSectionProps {
  queue: Team[];
  selectedIds: string[];
  movingPlayerId: string | null;
  onSetMovingPlayer: (playerId: string | null) => void;
  onQuickMove: (targetPlayerId: string) => void;
  onQueueReorder: (playerId: string, direction: "up" | "down") => void;
  onAddLatePlayers: () => void;
}

export default function QueueSection({
  queue,
  selectedIds,
  movingPlayerId,
  onSetMovingPlayer,
  onQuickMove,
  onQueueReorder,
  onAddLatePlayers,
}: QueueSectionProps) {
  const totalPlayers = queue.flatMap((t) => t.players).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mt-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-700 flex items-center gap-2">
          <span className="w-2 h-6 bg-yellow-400 rounded-full"></span>{" "}
          Próximos ({totalPlayers})
        </h3>
        <button
          onClick={onAddLatePlayers}
          className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 flex items-center gap-1"
        >
          <UserPlus size={16} /> Chegou gente!
        </button>
      </div>
      <div className="flex flex-wrap gap-4">
        {queue.map((team, teamIndex) => (
          <div
            key={teamIndex}
            className={`p-3 rounded-lg border transition-all min-w-[200px] ${
              team.players.some((p) => p.id === movingPlayerId)
                ? "bg-blue-50 border-blue-300 ring-1 ring-blue-300"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <div className="font-bold text-slate-700 mb-2 border-b pb-1 flex justify-between items-center">
              <span>{team.name}</span>
              <span className="text-[10px] bg-slate-200 px-1.5 rounded text-slate-500">
                {team.players.length}
              </span>
            </div>

            <ul className="space-y-1">
              {team.players.map((p) => {
                const arrivalIndex = selectedIds.indexOf(p.id);
                const isMovingMe = movingPlayerId === p.id;
                const isMoveMode = movingPlayerId !== null;

                return (
                  <li
                    key={p.id}
                    className={`flex items-center gap-2 p-1.5 rounded border shadow-sm transition-all ${
                      isMovingMe
                        ? "bg-blue-600 text-white border-blue-700 scale-105 z-10"
                        : isMoveMode
                        ? "bg-white border-dashed border-blue-300 hover:bg-blue-50 cursor-pointer"
                        : "bg-white border-slate-100"
                    }`}
                    onClick={() => {
                      if (isMoveMode && !isMovingMe) {
                        onQuickMove(p.id);
                      }
                    }}
                  >
                    {/* BOTÕES DE AÇÃO */}
                    <div className="flex flex-col gap-0.5">
                      {!isMoveMode && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSetMovingPlayer(p.id);
                            }}
                            className="text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded p-0.5"
                            title="Mover este jogador"
                          >
                            <MousePointer2 size={14} />
                          </button>
                          <div className="flex flex-col">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onQueueReorder(p.id, "up");
                              }}
                              className="text-slate-300 hover:text-blue-600"
                            >
                              <ChevronUp size={10} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onQueueReorder(p.id, "down");
                              }}
                              className="text-slate-300 hover:text-blue-600"
                            >
                              <ChevronDown size={10} />
                            </button>
                          </div>
                        </>
                      )}

                      {isMovingMe && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSetMovingPlayer(null);
                          }}
                          className="text-white hover:text-red-200"
                          title="Cancelar"
                        >
                          <XCircle size={16} />
                        </button>
                      )}
                    </div>

                    {/* INFO DO JOGADOR */}
                    <div className="flex flex-col leading-tight pointer-events-none">
                      <div className="flex items-center gap-1">
                        {arrivalIndex !== -1 && (
                          <span
                            className={`text-[9px] px-1 rounded font-bold min-w-[18px] text-center ${
                              isMovingMe
                                ? "bg-blue-500 text-white"
                                : "bg-slate-200 text-slate-500"
                            }`}
                          >
                            {arrivalIndex + 1}º
                          </span>
                        )}
                        <span
                          className={`text-sm font-medium ${
                            isMovingMe ? "text-white" : "text-slate-700"
                          }`}
                        >
                          {p.name}
                          {isMoveMode && !isMovingMe && (
                            <span className="text-[10px] text-blue-500 font-bold ml-1">
                              (Mover pra cá)
                            </span>
                          )}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] ${
                          isMovingMe ? "text-blue-200" : "text-yellow-500"
                        }`}
                      >
                        {"⭐".repeat(p.stars || 3)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {queue.length === 0 && (
          <p className="text-slate-400 text-sm italic w-full text-center py-4">
            Ninguém na fila de espera.
          </p>
        )}
      </div>
    </div>
  );
}
