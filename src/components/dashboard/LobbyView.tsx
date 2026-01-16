import { type Player } from '../../types';
import { UserCheck, ArrowRightLeft } from 'lucide-react';
import { PLAYERS_PER_TEAM } from '../../domain/matchmaking/balancer';

interface LobbyViewProps {
  allPlayers: Player[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onProceed: () => void;
}

export default function LobbyView({ allPlayers, selectedIds, onToggle, onProceed }: LobbyViewProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
        <UserCheck /> Presença
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {allPlayers.map((player) => {
          const isSelected = selectedIds.includes(player.id);
          const order = isSelected ? selectedIds.indexOf(player.id) + 1 : null;
          return (
            <label key={player.id} className={`relative p-3 rounded-lg border cursor-pointer select-none ${isSelected ? 'bg-blue-50 border-blue-500' : 'bg-slate-50'}`}>
              {order && <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full shadow-sm">{order}º</div>}
              <input type="checkbox" className="hidden" checked={isSelected} onChange={() => onToggle(player.id)} />
              <div className="font-bold text-slate-800">{player.name}</div>
              <div className="text-xs text-slate-500">⭐ {player.stars}</div>
            </label>
          );
        })}
      </div>
      <div className="flex justify-end">
        <button onClick={onProceed} disabled={selectedIds.length < PLAYERS_PER_TEAM * 2} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50">
          <ArrowRightLeft size={20} /> Montar Times
        </button>
      </div>
    </div>
  );
}