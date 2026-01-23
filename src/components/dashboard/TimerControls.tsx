import { Play, Pause, RotateCcw, History, Timer } from "lucide-react";
import { type MatchState } from "../../types";

interface TimerControlsProps {
  gameState: MatchState;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onViewHistory: () => void;
}

export default function TimerControls({
  gameState,
  onToggleTimer,
  onResetTimer,
  onViewHistory,
}: TimerControlsProps) {
  return (
    <div className="bg-slate-900 text-white p-6 rounded-2xl w-full text-center mb-4">
      <div className="flex items-center justify-center gap-2 mb-2 text-yellow-400 opacity-80">
        <Timer size={20} />{" "}
        <span className="text-xs font-bold uppercase">Cronômetro</span>
      </div>
      <div className="text-5xl font-mono font-bold">
        {Math.floor(gameState.timer / 60)
          .toString()
          .padStart(2, "0")}
        :{(gameState.timer % 60).toString().padStart(2, "0")}
      </div>
      <div className="flex justify-center gap-4 mt-6">
        <button
          onClick={onToggleTimer}
          className={`p-5 rounded-full transition-all active:scale-95 flex items-center justify-center ${
            gameState.isRunning
              ? "bg-yellow-400 hover:bg-yellow-500 text-yellow-900 shadow-yellow-200"
              : "bg-green-600 hover:bg-green-700 text-white shadow-green-200"
          }`}
          title={gameState.isRunning ? "Pausar Tempo" : "Iniciar Tempo"}
        >
          {gameState.isRunning ? (
            <Pause size={40} fill="currentColor" />
          ) : (
            <Play size={40} fill="currentColor" className="ml-1" />
          )}
        </button>

        <button
          onClick={onResetTimer}
          className="p-3 bg-slate-700 rounded-full text-slate-300 hover:text-white"
          title="Reiniciar Timer"
        >
          <RotateCcw size={24} />
        </button>
      </div>
      <div className="mt-6 pt-4 border-t border-slate-700 flex justify-center gap-2">
        <button
          onClick={onViewHistory}
          className="text-slate-400 hover:text-white text-sm flex items-center gap-2 transition-colors px-3 py-1 rounded-full hover:bg-slate-800"
        >
          <History size={16} /> Ver Lances
        </button>
      </div>
    </div>
  );
}
