import Layout from '../components/Layout';
import { Timer, UserPlus, Zap } from 'lucide-react';

export default function Dashboard() {
  // Mock visual para testar o layout
  return (
    <Layout 
      title="Partida em Andamento" 
      action={
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md active:scale-95 transition-transform flex items-center gap-2">
          <UserPlus size={18} />
          Nova Partida
        </button>
      }
    >
      {/* Placar Principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        
        {/* Time Vermelho */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border-t-4 border-red-500 flex flex-col items-center">
          <h3 className="text-red-500 font-bold uppercase tracking-wider text-sm mb-2">Time Vermelho</h3>
          <div className="text-5xl font-black text-slate-800 mb-4">0</div>
          <button className="w-full py-2 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
            <Zap size={18} /> Gol
          </button>
        </div>

        {/* Cronômetro (Centro) */}
        <div className="bg-slate-900 rounded-2xl p-6 shadow-lg text-white flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-yellow-400 to-blue-500 opacity-50"></div>
          <Timer size={32} className="text-yellow-400 mb-2 opacity-80" />
          <div className="text-6xl font-mono font-bold tracking-tighter mb-2">10:00</div>
          <span className="text-slate-400 text-sm font-medium">1º Tempo</span>
        </div>

        {/* Time Azul */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border-t-4 border-blue-500 flex flex-col items-center">
          <h3 className="text-blue-500 font-bold uppercase tracking-wider text-sm mb-2">Time Azul</h3>
          <div className="text-5xl font-black text-slate-800 mb-4">0</div>
          <button className="w-full py-2 bg-blue-50 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
            <Zap size={18} /> Gol
          </button>
        </div>
      </div>

      {/* Lista de Próximos (Fila) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
          <span className="w-2 h-6 bg-yellow-400 rounded-full"></span>
          Próximos da Fila
        </h3>
        
        {/* Placeholder de Lista Vazia */}
        <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
          <p>Ninguém na espera. O jogo tá fluindo! ⚽</p>
        </div>
      </div>
    </Layout>
  );
}