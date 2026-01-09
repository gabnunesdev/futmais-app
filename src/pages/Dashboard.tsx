import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { playerService } from '../services/playerService';
import { generateTeams, PLAYERS_PER_TEAM } from '../domain/matchmaking/balancer';
import { type Player, type MatchState, type Team } from '../types';
import { Play, Timer, RotateCcw, Plus, Trophy, UserCheck } from 'lucide-react'; //

export default function Dashboard() {
  // --- ESTADO GERAL ---
  const [view, setView] = useState<'LOBBY' | 'MATCH'>('LOBBY');
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // --- ESTADO DA PARTIDA ---
  const [gameState, setGameState] = useState<MatchState | null>(null);

  // Carregar jogadores ao iniciar
  useEffect(() => {
    playerService.getAll().then(setAllPlayers);
  }, []);

  // --- LÓGICA DO LOBBY (CHECK-IN) ---
  const togglePlayerSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleStartGame = () => {
    try {
      const checkedIn = allPlayers.filter(p => selectedIds.has(p.id));
      const { red, blue, queue } = generateTeams(checkedIn);
      
      setGameState({
        red,
        blue,
        queue,
        scoreRed: 0,
        scoreBlue: 0,
        timer: 600, // 10 minutos
        isRunning: false,
        period: 1
      });
      
      setView('MATCH');
    } catch (error) {
       // Correção do 'any': Tratamos o erro como Error padrão
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('Erro desconhecido ao iniciar jogo');
      }
    }
  };

  // --- LÓGICA DA PARTIDA (TIMER) ---
  useEffect(() => {
    // Correção da tipagem do intervalo
    let interval: ReturnType<typeof setInterval>;

    // Simplificamos a condição para depender APENAS de isRunning
    // A lógica de "timer > 0" agora vive dentro do setGameState para evitar dependências cíclicas
    if (gameState?.isRunning) {
      interval = setInterval(() => {
        setGameState(prev => {
          if (!prev) return null;
          
          // Se o tempo acabou, para tudo
          if (prev.timer <= 0) {
             return { ...prev, timer: 0, isRunning: false };
          }
          
          return { ...prev, timer: prev.timer - 1 };
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [gameState?.isRunning]); // Dependência limpa!

  // Formata MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // --- AÇÕES DO JOGO ---
  const handleGoal = (team: 'red' | 'blue', delta: number) => {
    if (!gameState) return;
    setGameState(prev => {
      if (!prev) return null;
      const key = team === 'red' ? 'scoreRed' : 'scoreBlue';
      const newScore = Math.max(0, prev[key] + delta);
      return { ...prev, [key]: newScore };
    });
  };

  const handleEndMatch = () => {
    if (!gameState) return;
    if (!confirm('Encerrar partida e rodar a fila?')) return;

    const redWins = gameState.scoreRed > gameState.scoreBlue;
    const isDraw = gameState.scoreRed === gameState.scoreBlue;
    
    // Regra: Empate, o Vermelho (Mandante) fica. Ajuste conforme sua regra real.
    const winnerTeam = redWins || isDraw ? gameState.red : gameState.blue;
    const loserTeam = redWins || isDraw ? gameState.blue : gameState.red;

    const nextTeam = gameState.queue.length > 0 ? gameState.queue[0] : null;
    const remainingQueue = gameState.queue.slice(1);

    const newQueue = nextTeam 
      ? [...remainingQueue, { ...loserTeam, name: `Time ${3 + remainingQueue.length + 1}` }]
      : [];

    if (nextTeam) {
      setGameState({
        red: { ...winnerTeam, name: 'Time Vermelho' },
        blue: { ...nextTeam, name: 'Time Azul' },
        queue: newQueue,
        scoreRed: 0,
        scoreBlue: 0,
        timer: 600,
        isRunning: false,
        period: 1
      });
    } else {
      alert('Sem próximo time. Revanche!');
      setGameState(prev => prev ? ({ ...prev, scoreRed: 0, scoreBlue: 0, timer: 600, isRunning: false }) : null);
    }
  };

  // --- RENDERIZAÇÃO ---

  if (view === 'LOBBY') {
    return (
      <Layout title="Check-in">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <UserCheck /> Quem vai jogar hoje?
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6 max-h-[60vh] overflow-y-auto">
            {allPlayers.map(player => (
              <label 
                key={player.id} 
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedIds.has(player.id) 
                    ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' 
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <input 
                  type="checkbox" 
                  className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                  checked={selectedIds.has(player.id)}
                  onChange={() => togglePlayerSelection(player.id)}
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-800">{player.name}</span>
                  <span className="text-xs text-slate-500">⭐ {player.stars}</span>
                </div>
              </label>
            ))}
          </div>

          <div className="flex justify-between items-center border-t pt-4">
            <div className="text-sm text-slate-500">
              {selectedIds.size} jogadores selecionados 
              ({Math.floor(selectedIds.size / PLAYERS_PER_TEAM)} times completos)
            </div>
            <button
              onClick={handleStartGame}
              disabled={selectedIds.size < PLAYERS_PER_TEAM * 2}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Trophy size={20} />
              Sortear e Iniciar
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // VIEW MATCH
  return (
    <Layout title="Partida" action={
      <button onClick={() => setView('LOBBY')} className="text-sm text-red-500 hover:underline">
        Cancelar Jogo
      </button>
    }>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        
        <TeamCard 
          color="red" 
          team={gameState!.red} 
          score={gameState!.scoreRed} 
          onGoal={(d) => handleGoal('red', d)} 
        />

        <div className="flex flex-col items-center justify-start gap-4">
          <div className="bg-slate-900 text-white p-6 rounded-2xl w-full text-center shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-center gap-2 mb-2 text-yellow-400 opacity-80">
                {/* Reintegrando o ícone Timer para não dar erro de unused */}
                <Timer size={20} />
                <span className="text-xs font-bold tracking-widest uppercase">Cronômetro</span>
            </div>
            <div className="text-6xl font-mono font-bold tracking-tighter mb-4">
              {formatTime(gameState!.timer)}
            </div>
            <div className="flex justify-center gap-2">
               <button 
                 onClick={() => setGameState(p => p ? ({...p, isRunning: !p.isRunning}) : null)}
                 className={`p-3 rounded-full transition-colors ${gameState?.isRunning ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-green-600 text-white hover:bg-green-500'}`}
               >
                 {gameState?.isRunning ? <Play className="fill-current" size={24}/> : <Play size={24} />}
               </button>
               <button 
                 onClick={() => setGameState(p => p ? ({...p, timer: 600, isRunning: false}) : null)}
                 className="p-3 bg-slate-700 rounded-full text-slate-300 hover:bg-slate-600 transition-colors"
               >
                 <RotateCcw size={24} />
               </button>
            </div>
          </div>
          
          <button 
            onClick={handleEndMatch}
            className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors shadow-lg"
          >
            Encerrar Partida 🏁
          </button>
        </div>

        <TeamCard 
          color="blue" 
          team={gameState!.blue} 
          score={gameState!.scoreBlue} 
          onGoal={(d) => handleGoal('blue', d)} 
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
          <span className="w-2 h-6 bg-yellow-400 rounded-full"></span>
          Próximos da Fila ({gameState!.queue.length} times)
        </h3>
        <div className="flex flex-wrap gap-4">
          {gameState!.queue.length === 0 && <p className="text-slate-400">Ninguém esperando.</p>}
          {gameState!.queue.map((team, idx) => (
            <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200 min-w-50">
              <div className="font-bold text-slate-700 mb-2 border-b pb-1">{team.name}</div>
              <ul className="text-sm text-slate-500 space-y-1">
                {team.players.map(p => (
                  <li key={p.id}>• {p.name}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

// Subcomponente
const TeamCard = ({ color, team, score, onGoal }: { color: 'red' | 'blue', team: Team, score: number, onGoal: (d: number) => void }) => {
  const isRed = color === 'red';
  const borderColor = isRed ? 'border-red-500' : 'border-blue-500';
  const textColor = isRed ? 'text-red-600' : 'text-blue-600';
  const bgColor = isRed ? 'bg-red-50' : 'bg-blue-50';

  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border-t-4 ${borderColor} flex flex-col h-full`}>
      <h3 className={`${textColor} font-bold uppercase tracking-wider text-sm mb-1`}>{team.name}</h3>
      <div className="mb-4">
        {team.players.map(p => (
           <div key={p.id} className="text-xs text-slate-600 font-medium border-b border-slate-50 last:border-0 py-1">{p.name}</div>
        ))}
      </div>
      
      <div className="mt-auto">
        <div className="text-6xl font-black text-slate-800 mb-4 text-center">{score}</div>
        <div className="flex gap-2">
          <button 
            onClick={() => onGoal(-1)}
            className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200 transition-colors"
          >
            -
          </button>
          <button 
            onClick={() => onGoal(1)}
            className={`flex-2 py-2 ${bgColor} ${textColor} rounded-lg font-bold flex items-center justify-center gap-2 hover:brightness-95 transition-all active:scale-95`}
          >
            <Plus size={18} /> GOL
          </button>
        </div>
      </div>
    </div>
  );
};