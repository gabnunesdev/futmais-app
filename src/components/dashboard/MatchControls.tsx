interface MatchControlsProps {
  onEndMatch: () => void;
  onFinishDay: () => void;
}

export default function MatchControls({
  onEndMatch,
  onFinishDay,
}: MatchControlsProps) {
  return (
    <div className="space-y-3 w-full">
      <button
        onClick={onEndMatch}
        className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95"
      >
        Encerrar & Próxima
      </button>
      <button
        onClick={onFinishDay}
        className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
      >
        Finalizar Racha (Encerrar Dia)
      </button>
    </div>
  );
}
