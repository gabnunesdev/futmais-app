import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import EditPlayerModal from "../components/EditPlayerModal"; // Certifique-se de ter criado este arquivo no passo anterior
import { playerService } from "../services/playerService";
import { type Player } from "../types";
import { UserPlus, Pencil, Users } from "lucide-react";

export default function Players() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newName, setNewName] = useState("");
  const [newStars, setNewStars] = useState(3);
  const [loading, setLoading] = useState(true);

  // Estado para controlar quem está sendo editado (Se null, modal fecha)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const data = await playerService.getAll();
      setPlayers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await playerService.create(newName, newStars);
      setNewName("");
      setNewStars(3);
      loadPlayers();
    } catch (error) {
      console.error(error);
      alert("Erro ao adicionar jogador");
    }
  };

  // Função nova para salvar a edição
  const handleUpdate = async (id: string, name: string, stars: number) => {
    try {
      await playerService.update(id, name, stars);
      setEditingPlayer(null); // Fecha o modal
      loadPlayers(); // Recarrega a lista
    } catch (error) {
      alert("Erro ao atualizar jogador");
      console.error(error);
    }
  };

  // Função nova para deletar (passada para o modal)
  const handleDelete = async (id: string) => {
    try {
      await playerService.delete(id);
      setEditingPlayer(null);
      loadPlayers();
    } catch (error) {
      console.error(error);
      alert("Erro ao remover jogador");
    }
  };

  return (
    <Layout title="Gerenciar Elenco">
      {/* O Modal fica aqui, invisível até alguém clicar no lápis */}
      <EditPlayerModal
        isOpen={!!editingPlayer}
        player={editingPlayer}
        onClose={() => setEditingPlayer(null)}
        onSave={handleUpdate}
        onDelete={handleDelete}
      />

      <div className="max-w-2xl mx-auto">
        {/* Formulário de Adicionar (Mantido igual) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-6">
          <h2 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <UserPlus size={20} /> Novo Jogador
          </h2>
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 p-3 rounded-lg border border-slate-300 outline-none focus:border-blue-500 transition-all"
              placeholder="Nome do craque..."
            />
            <select
              value={newStars}
              onChange={(e) => setNewStars(Number(e.target.value))}
              className="p-3 rounded-lg border border-slate-300 bg-white outline-none focus:border-blue-500 cursor-pointer"
            >
              {[1, 2, 3, 4, 5].map((s) => (
                <option key={s} value={s}>
                  {s} ⭐
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 rounded-lg font-bold hover:bg-blue-700 transition-colors"
            >
              +
            </button>
          </form>
        </div>

        {/* Lista de Jogadores */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
            <Users size={18} className="text-slate-400" />
            <span className="font-bold text-slate-600 text-sm uppercase">
              Total: {players.length} jogadores
            </span>
          </div>

          {players.map((p) => (
            <div
              key={p.id}
              className="flex justify-between items-center p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-lg shadow-sm border border-slate-200">
                  {/* Avatar simples com a inicial */}
                  <span className="font-bold text-slate-500">
                    {p.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-bold text-slate-800">{p.name}</div>
                  <div className="text-xs text-yellow-500 font-medium">
                    {"⭐".repeat(p.stars)}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {/* Botão Editar (Abre o Modal) */}
                <button
                  onClick={() => setEditingPlayer(p)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  title="Editar Jogador"
                >
                  <Pencil size={18} />
                </button>
              </div>
            </div>
          ))}

          {players.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-400 italic">
              Nenhum jogador cadastrado ainda.
            </div>
          )}

          {loading && (
            <div className="p-8 text-center text-slate-400 animate-pulse">
              Carregando elenco...
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
