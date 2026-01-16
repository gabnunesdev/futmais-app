import { Trophy, Ban, AlertTriangle, Scale } from 'lucide-react';

export type GameOverReason = 'TIME_LIMIT' | 'GOAL_LIMIT' | 'PENALTIES';

interface GameOverModalProps {
  isOpen: boolean;
  reason: GameOverReason | 'MANUAL' | null;
  scoreRed: number;
  scoreBlue: number;
  // AQUI MUDOU: Removemos 'DRAW' da assinatura. Só aceita RED ou BLUE.
  onConfirm: (winner: 'RED' | 'BLUE') => void;
}

export default function GameOverModal({ isOpen, reason, scoreRed, scoreBlue, onConfirm }: GameOverModalProps) {
  if (!isOpen) return null;

  const isDraw = scoreRed === scoreBlue;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95">
        <div className="flex justify-center mb-4 text-yellow-500">
           {reason === 'TIME_LIMIT' && <Ban size={48} />}
           {reason === 'GOAL_LIMIT' && <Trophy size={48} />}
           {/* Ícone de Balança para Pênaltis/Empate */}
           {(reason === 'PENALTIES' || (reason === 'MANUAL' && isDraw)) && <Scale size={48} />}
           {(reason === 'MANUAL' && !isDraw) && <AlertTriangle size={48} />}
        </div>
        
        <h2 className="text-2xl font-black text-slate-800 mb-2">
            {(isDraw) ? 'Disputa de Pênaltis!' : 'Fim de Jogo!'}
        </h2>
        
        <p className="text-slate-500 mb-6 font-medium">
          {reason === 'TIME_LIMIT' && !isDraw && 'O tempo regulamentar acabou.'}
          {reason === 'GOAL_LIMIT' && 'Limite de gols atingido!'}
          
          {/* Mensagens específicas para Empate */}
          {(isDraw) && 'Tudo igual no placar. Quem venceu nos pênaltis?'}
          
          {reason === 'MANUAL' && !isDraw && 'Encerrando manualmente.'}
        </p>

        <div className="grid grid-cols-1 gap-3">
          {/* CASO 1: Jogo decidido no tempo normal (Não é empate) */}
          {!isDraw && (
             <button 
                onClick={() => onConfirm(scoreRed > scoreBlue ? 'RED' : 'BLUE')} 
                className={`py-4 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all ${scoreRed > scoreBlue ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
             >
               Confirmar Vitória ({scoreRed > scoreBlue ? 'Vermelho' : 'Azul'})
             </button>
          )}

          {/* CASO 2: Empate (Pênaltis) ou Decisão Manual */}
          {/* Mostra SEMPRE os dois botões se estiver empatado */}
          {(isDraw) && (
            <>
              <button onClick={() => onConfirm('RED')} className="py-3 bg-red-50 text-red-600 border-2 border-red-100 rounded-xl font-bold hover:bg-red-100 hover:border-red-200 active:scale-95 transition-all flex items-center justify-center gap-2">
                🔴 Vermelho Venceu (Pênaltis)
              </button>
              <button onClick={() => onConfirm('BLUE')} className="py-3 bg-blue-50 text-blue-600 border-2 border-blue-100 rounded-xl font-bold hover:bg-blue-100 hover:border-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2">
                🔵 Azul Venceu (Pênaltis)
              </button>
            </>
          )}
          
          {/* Botão de Cancelar para segurança */}
          <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest">
            {isDraw ? 'Quem ganha, fica em campo' : 'Confira o placar'}
          </p>
        </div>
      </div>
    </div>
  );
}