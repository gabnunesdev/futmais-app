import { useState } from "react";
import { UserPlus, X, CheckCircle2 } from "lucide-react";
import { type Player } from "../../types";

interface AddLatePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  onAdd: (ids: string[]) => void;
}

export default function AddLatePlayerModal({
  isOpen,
  onClose,
  players,
  onAdd,
}: AddLatePlayerModalProps) {
  const [localSelected, setLocalSelected] = useState<string[]>([]);

  if (!isOpen) return null;

  const toggle = (id: string) => {
    if (localSelected.includes(id))
      setLocalSelected(localSelected.filter((sid) => sid !== id));
    else setLocalSelected([...localSelected, id]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <UserPlus size={20} /> Quem chegou agora?
          </h3>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="p-4 max-h-[50vh] overflow-y-auto grid grid-cols-2 gap-2">
          {players.length === 0 && (
            <p className="text-slate-500 col-span-2 text-center py-4">
              Todo mundo já está no jogo!
            </p>
          )}
          {players.map((p: Player) => (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              className={`p-3 rounded-lg border text-left flex justify-between items-center ${
                localSelected.includes(p.id)
                  ? "bg-blue-50 border-blue-500 ring-1 ring-blue-500"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <span className="font-semibold text-slate-800 text-sm">
                {p.name}
              </span>
              {localSelected.includes(p.id) && (
                <CheckCircle2 size={16} className="text-blue-600" />
              )}
            </button>
          ))}
        </div>
        <div className="p-4 border-t bg-slate-50 flex justify-end">
          <button
            onClick={() => {
              onAdd(localSelected);
              onClose();
            }}
            disabled={localSelected.length === 0}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50 hover:bg-blue-700 transition-colors"
          >
            Adicionar à Fila
          </button>
        </div>
      </div>
    </div>
  );
}
