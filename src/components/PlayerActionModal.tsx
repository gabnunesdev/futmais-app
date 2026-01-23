
import { useState } from "react";
import { X, Check, ChevronLeft, RefreshCw } from "lucide-react";
import type { Player } from "../types";

interface PlayerActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  teammates: Player[];
  availablePlayers?: Player[]; // Players in Queue or Bench
  onRecordGoal: (assistId: string | null) => void;
  onCard: (type: "YELLOW" | "RED") => void;
  onSubstitute?: (newPlayerId: string) => void;
}

export default function PlayerActionModal({
  isOpen,
  onClose,
  player,
  teammates,
  availablePlayers = [],
  onRecordGoal,
  onCard,
  onSubstitute,
}: PlayerActionModalProps) {
  const [view, setView] = useState<"MAIN" | "ASSIST_SELECT" | "SUB_SELECT">("MAIN");
  const [assistId, setAssistId] = useState<string | null>(null);

  if (!isOpen || !player) return null;

  const handleClose = () => {
    setView("MAIN");
    setAssistId(null);
    onClose();
  };

  const handleGoalClick = () => {
    setView("ASSIST_SELECT");
  };
  
  const handleSubClick = () => {
    setView("SUB_SELECT");
  };

  const confirmGoal = () => {
    onRecordGoal(assistId);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
             {view !== "MAIN" && (
                 <button onClick={() => setView("MAIN")} className="mr-1 hover:bg-slate-800 p-1 rounded-full"><ChevronLeft size={20}/></button>
             )}
            <h3 className="font-bold text-lg">{player.name}</h3>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {view === "MAIN" && (
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={handleGoalClick}
                className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-black text-xl rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md"
              >
                ⚽ GOL
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { onCard("YELLOW"); handleClose(); }}
                  className="py-4 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold text-lg rounded-xl flex flex-col items-center justify-center gap-1 transition-transform active:scale-95 shadow-sm"
                >
                  <div className="w-6 h-8 bg-yellow-500 border-2 border-white rounded-sm shadow-sm" />
                  Cartão Amarelo
                </button>
                
                <button
                  onClick={() => { onCard("RED"); handleClose(); }}
                  className="py-4 bg-red-500 hover:bg-red-600 text-white font-bold text-lg rounded-xl flex flex-col items-center justify-center gap-1 transition-transform active:scale-95 shadow-sm"
                >
                   <div className="w-6 h-8 bg-red-600 border-2 border-white rounded-sm shadow-sm" />
                   Cartão Vermelho
                </button>
              </div>

              {onSubstitute && (
                  <button
                    onClick={handleSubClick}
                    className="w-full py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold text-lg rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-sm mt-2"
                  >
                    <RefreshCw size={20}/> Substituição
                  </button>
              )}
            </div>
          )}

          {view === "ASSIST_SELECT" && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-700 text-center">Quem deu a assistência?</h4>
              
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                <button
                    onClick={() => setAssistId(null)}
                    className={`p-3 text-sm rounded-lg border transition-all font-medium ${
                        assistId === null
                        ? "bg-slate-800 text-white border-slate-800"
                        : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}
                >
                    Ninguém (Jogada Solo)
                </button>
                
                {teammates
                    .filter(p => p.id !== player.id)
                    .map(p => (
                    <button
                        key={p.id}
                        onClick={() => setAssistId(p.id)}
                        className={`p-3 text-sm rounded-lg border transition-all font-bold ${
                            assistId === p.id
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white border-slate-200 text-slate-700 hover:border-blue-300"
                        }`}
                    >
                        {p.name}
                    </button>
                ))}
              </div>

              <button
                onClick={confirmGoal}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
              >
                <Check size={20} /> Confirmar Gol
              </button>
            </div>
          )}

          {view === "SUB_SELECT" && (
              <div className="space-y-4">
                  <h4 className="font-bold text-slate-700 text-center">Quem entra no lugar de {player.name}?</h4>
                  
                  {availablePlayers.length === 0 ? (
                      <div className="text-center text-slate-500 py-4">Nenhum jogador disponível no banco.</div>
                  ) : (
                      <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                          {availablePlayers.map(p => (
                              <button
                                key={p.id}
                                onClick={() => {
                                    if(onSubstitute) onSubstitute(p.id);
                                    handleClose();
                                }}
                                className="p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 text-left font-bold text-slate-700 transition-colors flex justify-between items-center"
                              >
                                  <span>{p.name}</span>
                                  <span className="text-xs text-slate-400 font-normal">Star: {p.stars}</span>
                              </button>
                          ))}
                      </div>
                  )}
              </div>
          )}
        </div>
      </div>
    </div>
  );
}
