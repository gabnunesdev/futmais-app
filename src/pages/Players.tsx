import { Plus, Star, Trash2, User } from "lucide-react";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { playerService } from "../services/playerService";
import type { Player } from "../types";

export default function Players() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado do Formulário
  const [newName, setNewName] = useState("");
  const [newStars, setNewStars] = useState(3); // Começa com média 3
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carregar dados ao abrir a tela
  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      const data = await playerService.getAll();
      setPlayers(data);
    } catch (error) {
      console.error("Erro ao carregar:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsSubmitting(true);
    try {
      await playerService.create(newName, newStars);
      setNewName("");
      setNewStars(3);
      await loadPlayers(); // Recarrega a lista
    } catch (error) {
      console.error(error);
      alert("Erro ao criar jogador");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este craque?")) return;
    try {
      await playerService.delete(id);
      setPlayers(players.filter((p) => p.id !== id)); // Otimista: remove da tela na hora
    } catch (error) {
      console.error(error);
      alert("Erro ao deletar");
    }
  };

  // Componente visual de Estrelas (Input)
  const StarRatingInput = () => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setNewStars(star)}
          className={`p-1 transition-transform active:scale-95 ${
            star <= newStars
              ? "text-yellow-400 fill-yellow-400"
              : "text-slate-300"
          }`}
        >
          <Star size={24} />
        </button>
      ))}
    </div>
  );

  return (
    <Layout title="Elenco">
      {/* --- FORMULÁRIO DE CADASTRO (FIXO NO TOPO MOBILE) --- */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
          Novo Jogador
        </h3>
        <form onSubmit={handleAddPlayer} className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder="Nome do Craque"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />

            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 md:w-auto">
              <span className="text-sm text-slate-500 mr-3 md:hidden">
                Nível:
              </span>
              <StarRatingInput />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !newName}
            className="bg-blue-600 text-white font-semibold py-3 rounded-lg shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              "Salvando..."
            ) : (
              <>
                <Plus size={20} /> Adicionar ao Elenco
              </>
            )}
          </button>
        </form>
      </div>

      {/* --- LISTA DE JOGADORES --- */}
      {loading ? (
        <div className="text-center py-10 text-slate-400">
          Carregando craques...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {players.map((player) => (
            <div
              key={player.id}
              className="group bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-blue-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold">
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-slate-800">{player.name}</div>
                  <div className="flex gap-0.5 mt-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={
                          i < player.stars
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-slate-200"
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDelete(player.id)}
                className="text-slate-300 hover:text-red-500 p-2 transition-colors"
                title="Remover"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}

          {players.length === 0 && (
            <div className="col-span-full text-center py-10 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
              <User size={48} className="mx-auto mb-2 opacity-20" />
              Nenhum jogador cadastrado ainda.
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
