import { Trophy, AlertTriangle } from 'lucide-react';

export type GameOverReason = 'GOAL_LIMIT' | 'TIME_LIMIT' | 'PENALTIES' | null;

interface GameOverModalProps {
  isOpen: boolean;
  reason: GameOverReason;
  scoreRed: number;
  scoreBlue: number;
  onConfirm: (winner: 'RED' | 'BLUE' | 'DRAW') => void;
}

export default function GameOverModal({ isOpen, reason, scoreRed, scoreBlue, onConfirm }: GameOverModalProps) {
  if (!isOpen) return null;

  const isDraw = scoreRed === scoreBlue;
  const leader = scoreRed > scoreBlue ? 'RED' : 'BLUE';

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-center p-6 animate-in zoom-in-95">
        <div className="mb-4 flex justify-center">
          {reason === 'PENALTIES' ? <div className="p-4 bg-yellow-100 rounded-full text-yellow-600"><AlertTriangle size={40}/></div> : <div className="p-4 bg-green-100 rounded-full text-green-600"><Trophy size={40}/></div>}
        </div>
        
        <h2 className="text-2xl font-black text-slate-800 mb-2">FIM DE JOGO!</h2>
        
        {reason === 'GOAL_LIMIT' && (
          <p className="text-slate-600 mb-6">Limite de 2 gols atingido.<br/>Vitória do time <b>{leader === 'RED' ? 'Vermelho' : 'Azul'}</b>.</p>
        )}

        {reason === 'TIME_LIMIT' && !isDraw && (
          <p className="text-slate-600 mb-6">Tempo esgotado.<br/>Vitória do time <b>{leader === 'RED' ? 'Vermelho' : 'Azul'}</b>.</p>
        )}

        {reason === 'TIME_LIMIT' && isDraw && (
            <p className="text-slate-600 mb-6">Tempo esgotado e empate.<br/>Temos times completos fora, segue o jogo (Empate).</p>
        )}

        {reason === 'PENALTIES' && (
          <p className="text-slate-600 mb-6">Tempo esgotado e empate!<br/>Pouca gente na fila. <b>Quem venceu os pênaltis?</b></p>
        )}

        <div className="space-y-3">
          {reason === 'PENALTIES' ? (
            <>
              <button onClick={() => onConfirm('RED')} className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700">Venceu VERMELHO</button>
              <button onClick={() => onConfirm('BLUE')} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Venceu AZUL</button>
            </>
          ) : (
            <button onClick={() => onConfirm(isDraw ? 'DRAW' : leader)} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800">
              Confirmar Resultado
            </button>
          )}
        </div>
      </div>
    </div>
  );
}