import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import GoalModal from '../components/GoalModal';
import { playerService } from '../services/playerService';
import { matchService } from '../services/matchService';
import { generateTeams, PLAYERS_PER_TEAM } from '../domain/matchmaking/balancer';
import { type Player, type MatchState, type Team } from '../types';
import { Play, RotateCcw, UserCheck, Loader2, ArrowRightLeft, Plus, CheckCircle2 } from 'lucide-react';

// --- TIPOS LOCAIS ---
type ViewState = 'LOBBY' | 'DRAFT' | 'MATCH';
type PlayerStats = { goals: number; assists: number };

// Interfaces para os Subcomponentes (Clean Code: Tipagem Explícita)
interface DraftColumnProps {
  title: string;
  color: 'red' | 'blue';
  players: Player[];
  onMove: (playerId: string) => void;
  onKick: (playerId: string) => void;
}

interface ActiveTeamCardProps {
  color: 'red' | 'blue';
  team: Team;
  score: number;
  stats: Record<string, PlayerStats>;
  onGoal: () => void;
}

export default function Dashboard() {
  // --- ESTADOS ---
  const [view, setView] = useState<ViewState>('LOBBY');
  const [loading, setLoading] = useState(true);
  
  // Dados Mestre
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Estado do Draft
  const [draftState, setDraftState] = useState<{ red: Player[], blue: Player[], queue: Player[] } | null>(null);

  // Estado da Partida Ativa
  const [gameState, setGameState] = useState<MatchState | null>(null);
  const [currentMatchId, setCurrentMatchId] = useState<string | null>(null);
  
  // Estado Visual
  const [matchStats, setMatchStats] = useState<Record<string, PlayerStats>>({});

  // Modais
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalTeamColor, setGoalTeamColor] = useState<'red' | 'blue' | null>(null);

  // --- 1. CARREGAMENTO INICIAL ---
  useEffect(() => {
    loadInitialData();
  }, []);

 const loadInitialData = async () => {
    try {
      setLoading(true);
      const players = await playerService.getAll();
      setAllPlayers(players);

      const activeMatch = await matchService.getActiveMatch();
      
      if (activeMatch) {
        // CORREÇÃO AQUI: Tipagem explícita em todos os 'p'
        const redPlayers = activeMatch.team_red_ids
            .map((id: string) => players.find((p: Player) => p.id === id))
            .filter((p: Player | undefined): p is Player => !!p);

        const bluePlayers = activeMatch.team_blue_ids
            .map((id: string) => players.find((p: Player) => p.id === id))
            .filter((p: Player | undefined): p is Player => !!p);
        
        const playingIds = [...activeMatch.team_red_ids, ...activeMatch.team_blue_ids];
        
        // CORREÇÃO AQUI TAMBÉM: Tipagem explícita no filter da fila
        const queuePlayers = players.filter((p: Player) => !playingIds.includes(p.id) && p.is_active);

        const events = await matchService.getMatchEvents(activeMatch.id);
        const stats: Record<string, PlayerStats> = {};
        
        // CORREÇÃO OPCIONAL: Tipagem explícita no evento se precisar
        events?.forEach((ev) => { // Use 'any' ou a interface MatchEvent se tiver criada
          if (!stats[ev.player_id]) stats[ev.player_id] = { goals: 0, assists: 0 };
          if (ev.event_type === 'GOAL') stats[ev.player_id].goals++;
          if (ev.event_type === 'ASSIST') stats[ev.player_id].assists++;
        });

        setMatchStats(stats);
        setCurrentMatchId(activeMatch.id);
        setGameState({
          red: { name: 'Time Vermelho', players: redPlayers },
          blue: { name: 'Time Azul', players: bluePlayers },
          queue: [{ name: 'Próximos', players: queuePlayers }],
          scoreRed: activeMatch.score_red,
          scoreBlue: activeMatch.score_blue,
          timer: activeMatch.duration_seconds || 600,
          isRunning: false,
          period: 1
        });
        setView('MATCH');
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  // --- 2. LÓGICA DO LOBBY ---
  const togglePlayerSelection = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(pid => pid !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const handleGoToDraft = () => {
    const checkedIn = selectedIds
        .map(id => allPlayers.find(p => p.id === id))
        .filter((p): p is Player => p !== undefined);

    const { red, blue, queue } = generateTeams(checkedIn);
    const queuePlayers = queue.flatMap(t => t.players);

    setDraftState({ red: red.players, blue: blue.players, queue: queuePlayers });
    setView('DRAFT');
  };

  // --- 3. LÓGICA DO DRAFT ---
  const movePlayer = (playerId: string, from: 'red' | 'blue' | 'queue', to: 'red' | 'blue' | 'queue') => {
    if (!draftState) return;
    
    const player = draftState[from].find(p => p.id === playerId);
    if (!player) return;

    setDraftState({
      ...draftState,
      [from]: draftState[from].filter(p => p.id !== playerId),
      [to]: [...draftState[to], player]
    });
  };

  const confirmMatchStart = async () => {
    if (!draftState) return;
    setLoading(true);

    try {
      const matchData = await matchService.startMatch(
        draftState.red.map(p => p.id),
        draftState.blue.map(p => p.id)
      );

      setCurrentMatchId(matchData.id);

      const queueTeams: Team[] = [];
      for (let i = 0; i < draftState.queue.length; i += PLAYERS_PER_TEAM) {
         queueTeams.push({ 
           name: `Time ${3 + queueTeams.length}`, 
           players: draftState.queue.slice(i, i + PLAYERS_PER_TEAM) 
         });
      }

      setGameState({
        red: { name: 'Time Vermelho', players: draftState.red },
        blue: { name: 'Time Azul', players: draftState.blue },
        queue: queueTeams,
        scoreRed: 0,
        scoreBlue: 0,
        timer: 600,
        isRunning: false,
        period: 1
      });

      setMatchStats({});
      setView('MATCH');
    } catch (err) {
      console.error(err)
      alert('Erro ao iniciar partida');
    } finally {
      setLoading(false);
    }
  };

  // --- 4. LÓGICA DA PARTIDA ---
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (gameState?.isRunning) {
      interval = setInterval(() => {
        setGameState(prev => {
          if (!prev) return null;
          if (prev.timer <= 0) return { ...prev, timer: 0, isRunning: false };
          return { ...prev, timer: prev.timer - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState?.isRunning]);

  const handleGoalClick = (team: 'red' | 'blue') => {
    setGoalTeamColor(team);
    setGoalModalOpen(true);
  };

  const handleConfirmGoal = async (scorerId: string, assistId: string | null) => {
    if (!gameState || !currentMatchId || !goalTeamColor) return;

    setGameState(prev => {
      if (!prev) return null;
      const key = goalTeamColor === 'red' ? 'scoreRed' : 'scoreBlue';
      return { ...prev, [key]: prev[key] + 1 };
    });

    setMatchStats(prev => {
      const stats = { ...prev };
      if (!stats[scorerId]) stats[scorerId] = { goals: 0, assists: 0 };
      stats[scorerId].goals += 1;
      
      if (assistId) {
        if (!stats[assistId]) stats[assistId] = { goals: 0, assists: 0 };
        stats[assistId].assists += 1;
      }
      return stats;
    });

    try {
      await matchService.registerGoal(currentMatchId, scorerId, assistId);
      const newScoreRed = goalTeamColor === 'red' ? gameState.scoreRed + 1 : gameState.scoreRed;
      const newScoreBlue = goalTeamColor === 'blue' ? gameState.scoreBlue + 1 : gameState.scoreBlue;
      await matchService.updateScore(currentMatchId, newScoreRed, newScoreBlue);
    } catch (error) {
      console.error(error);
    }
  };

  const handleEndMatch = async () => {
    if (!gameState || !currentMatchId) return;
    if (!confirm('Encerrar partida? O vencedor será mantido.')) return;

    try {
      const redWins = gameState.scoreRed > gameState.scoreBlue;
      const isDraw = gameState.scoreRed === gameState.scoreBlue;
      const winnerColor = isDraw ? 'DRAW' : (redWins ? 'RED' : 'BLUE');

      await matchService.finishMatch(currentMatchId, winnerColor);
      setCurrentMatchId(null);

      const winnerTeam = redWins || isDraw ? gameState.red : gameState.blue;
      const loserTeam = redWins || isDraw ? gameState.blue : gameState.red;
      
      const nextTeam = gameState.queue[0];
      const remainingQueue = gameState.queue.slice(1);
      
      const newQueue = nextTeam 
        ? [...remainingQueue, { ...loserTeam, name: `Time ${3 + remainingQueue.length + 1}` }]
        : [];

      if (nextTeam) {
        setDraftState({
          red: { ...winnerTeam, name: 'Time Vermelho' }.players,
          blue: { ...nextTeam, name: 'Time Azul' }.players,
          queue: newQueue.flatMap(t => t.players)
        });
        setView('DRAFT');
      } else {
        alert('Fim dos times. Revanche!');
        setGameState(prev => prev ? ({ ...prev, scoreRed: 0, scoreBlue: 0, timer: 600, isRunning: false }) : null);
        setMatchStats({});
        const matchData = await matchService.startMatch(gameState.red.players.map(p=>p.id), gameState.blue.players.map(p=>p.id));
        setCurrentMatchId(matchData.id);
      }
    } catch (err) {
      console.error(err)
      alert('Erro ao finalizar.');
    }
  };

  if (loading) return <Layout title="Carregando..."><div className="flex justify-center p-10"><Loader2 className="animate-spin"/></div></Layout>;

  // VIEW 1: LOBBY
  if (view === 'LOBBY') {
    return (
      <Layout title="Check-in do Racha">
        <div className="bg-white p-6 rounded-xl shadow-sm">
           <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <UserCheck /> Presença
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {allPlayers.map(player => {
               const isSelected = selectedIds.includes(player.id);
               const order = isSelected ? selectedIds.indexOf(player.id) + 1 : null;
               return (
                 <label key={player.id} className={`relative p-3 rounded-lg border cursor-pointer select-none ${isSelected ? 'bg-blue-50 border-blue-500' : 'bg-slate-50'}`}>
                    {order && <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full">{order}º</div>}
                    <input type="checkbox" className="hidden" checked={isSelected} onChange={() => togglePlayerSelection(player.id)} />
                    <div className="font-bold text-slate-800">{player.name}</div>
                    <div className="text-xs text-slate-500">⭐ {player.stars}</div>
                 </label>
               )
            })}
          </div>
          <div className="flex justify-end">
            <button onClick={handleGoToDraft} disabled={selectedIds.length < PLAYERS_PER_TEAM * 2} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50">
              <ArrowRightLeft size={20} /> Montar Times
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // VIEW 2: DRAFT
  if (view === 'DRAFT' && draftState) {
    return (
      <Layout title="Ajuste os Times" action={<button onClick={() => setView('LOBBY')} className="text-red-500 text-sm">Voltar</button>}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DraftColumn 
            title="Time Vermelho" 
            color="red" 
            players={draftState.red} 
            onMove={(pid) => movePlayer(pid, 'red', 'blue')} 
            onKick={(pid) => movePlayer(pid, 'red', 'queue')}
          />

           <DraftColumn 
            title="Time Azul" 
            color="blue" 
            players={draftState.blue} 
            onMove={(pid) => movePlayer(pid, 'blue', 'red')}
            onKick={(pid) => movePlayer(pid, 'blue', 'queue')}
          />

          <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-600 mb-3">Banco / Fila</h3>
            <div className="space-y-2">
              {draftState.queue.map(p => (
                <div key={p.id} className="bg-white p-2 rounded border flex justify-between items-center">
                  <span>{p.name}</span>
                  <div className="flex gap-1">
                    <button onClick={() => movePlayer(p.id, 'queue', 'red')} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">V</button>
                    <button onClick={() => movePlayer(p.id, 'queue', 'blue')} className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">A</button>
                  </div>
                </div>
              ))}
              {draftState.queue.length === 0 && <p className="text-xs text-slate-400">Ninguém no banco.</p>}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
            <button onClick={confirmMatchStart} className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform flex items-center gap-2">
              <CheckCircle2 /> Confirmar e Jogar
            </button>
        </div>
      </Layout>
    );
  }

  // VIEW 3: MATCH
  return (
    <Layout title="Partida em Andamento">
       <GoalModal 
        isOpen={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        onConfirm={handleConfirmGoal}
        teamName={goalTeamColor === 'red' ? 'Vermelho' : 'Azul'}
        players={goalTeamColor === 'red' ? gameState!.red.players : gameState!.blue.players}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActiveTeamCard 
          color="red" 
          team={gameState!.red} 
          score={gameState!.scoreRed} 
          stats={matchStats} 
          onGoal={() => handleGoalClick('red')}
        />

        <div className="flex flex-col items-center">
           <div className="bg-slate-900 text-white p-6 rounded-2xl w-full text-center mb-4">
              <div className="text-5xl font-mono font-bold">{Math.floor(gameState!.timer / 60).toString().padStart(2, '0')}:{(gameState!.timer % 60).toString().padStart(2, '0')}</div>
              <div className="flex justify-center gap-4 mt-4">
                <button onClick={() => setGameState(p => p ? {...p, isRunning: !p.isRunning} : null)} className="p-3 bg-yellow-500 rounded-full text-black"><Play size={24}/></button>
                <button onClick={() => setGameState(p => p ? {...p, timer: 600, isRunning: false} : null)} className="p-3 bg-slate-700 rounded-full"><RotateCcw size={24}/></button>
              </div>
           </div>
           <button onClick={handleEndMatch} className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold">Encerrar Jogo</button>
        </div>

        <ActiveTeamCard 
          color="blue" 
          team={gameState!.blue} 
          score={gameState!.scoreBlue} 
          stats={matchStats} 
          onGoal={() => handleGoalClick('blue')}
        />
      </div>
    </Layout>
  );
}

// --- SUBCOMPONENTES AUXILIARES TIPADOS ---

// ... imports
// Certifique-se que PLAYERS_PER_TEAM está importado lá em cima:
// import { generateTeams, PLAYERS_PER_TEAM } from '../domain/matchmaking/balancer';

// ...

const DraftColumn = ({ title, color, players, onMove, onKick }: DraftColumnProps) => (
  <div className={`p-4 rounded-xl border-t-4 bg-white shadow-sm ${color === 'red' ? 'border-red-500' : 'border-blue-500'}`}>
    <h3 className={`font-bold uppercase text-sm mb-3 ${color === 'red' ? 'text-red-600' : 'text-blue-600'}`}>{title} ({players.length})</h3>
    <div className="space-y-2">
      {players.map((p: Player) => (
        <div key={p.id} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded border border-slate-100">
           <span>{p.name}</span>
           <div className="flex gap-1">
             <button onClick={() => onMove(p.id)} title="Trocar de time" className="p-1 hover:bg-slate-200 rounded"><ArrowRightLeft size={14}/></button>
             <button onClick={() => onKick(p.id)} title="Mandar pro banco" className="p-1 hover:bg-red-100 text-red-500 rounded">X</button>
           </div>
        </div>
      ))}
      
      {/* CORREÇÃO AQUI: Usar PLAYERS_PER_TEAM em vez de número fixo */}
      {[...Array(Math.max(0, PLAYERS_PER_TEAM - players.length))].map((_, i) => (
        <div key={i} className="h-9 border-2 border-dashed border-slate-100 rounded flex items-center justify-center text-xs text-slate-300">Vaga aberta</div>
      ))}
    </div>
  </div>
);

const ActiveTeamCard = ({ color, team, score, stats, onGoal }: ActiveTeamCardProps) => {
  const isRed = color === 'red';
  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border-t-4 ${isRed ? 'border-red-500' : 'border-blue-500'} flex flex-col h-full`}>
       <div className="flex justify-between items-center mb-4">
          <h3 className={`font-bold uppercase ${isRed ? 'text-red-600' : 'text-blue-600'}`}>{team.name}</h3>
          <span className="text-4xl font-black text-slate-800">{score}</span>
       </div>
       
       <div className="flex-1 space-y-2 mb-4">
         {team.players.map((p) => {
           const pStats = stats[p.id] || { goals: 0, assists: 0 };
           return (
             <div key={p.id} className="flex items-center justify-between text-sm border-b border-slate-50 pb-1">
               <span className="text-slate-700 font-medium">{p.name}</span>
               <div className="flex gap-1">
                 {[...Array(pStats.goals)].map((_, i) => <span key={`g-${i}`} title="Gol">⚽</span>)}
                 {[...Array(pStats.assists)].map((_, i) => <span key={`a-${i}`} title="Assistência">👟</span>)}
               </div>
             </div>
           );
         })}
       </div>

       <button onClick={onGoal} className={`w-full py-3 rounded-xl font-bold flex justify-center gap-2 ${isRed ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
         <Plus size={18}/> GOL
       </button>
    </div>
  );
}