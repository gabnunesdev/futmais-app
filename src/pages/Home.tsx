import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { matchService } from '../services/matchService'; // <--- Importe o serviço
import Layout from '../components/Layout';
import { PlayCircle, Users, BarChart3, History, LogOut, User, Activity } from 'lucide-react';

export default function Home() {
  const [userName, setUserName] = useState<string | null>(null);
  const [hasActiveMatch, setHasActiveMatch] = useState(false); // <--- Novo estado
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
        try {
            // 1. Busca Usuário
            const { data: userData } = await supabase.auth.getUser();
            if (userData.user) {
                const metaName = userData.user.user_metadata?.full_name;
                const emailName = userData.user.email?.split('@')[0];
                setUserName(metaName || emailName);
            }

            // 2. Busca se tem partida ativa
            const activeMatch = await matchService.getActiveMatch();
            setHasActiveMatch(!!activeMatch); // Se tiver partida, vira true

        } catch (error) {
            console.error('Erro ao carregar home', error);
        } finally {
            setLoading(false);
        }
    };
    loadData();
  }, []);

  const handleLogout = async () => {
      await supabase.auth.signOut();
      window.location.reload();
  };

  return (
    <Layout title="Gerenciador de Peladas ⚽">
      
      {/* --- CABEÇALHO DO USUÁRIO --- */}
      {!loading && userName ? (
          <div className="mb-6 flex justify-between items-center bg-blue-600 text-white p-5 rounded-2xl shadow-lg shadow-blue-200 animate-in slide-in-from-top-4">
              <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-full text-white">
                      <User size={24} />
                  </div>
                  <div>
                      <p className="text-xs opacity-80 uppercase tracking-wider font-bold mb-0.5">Bem-vindo,</p>
                      <h2 className="text-xl font-black capitalize truncate max-w-45 leading-none">
                        {userName}
                      </h2>
                  </div>
              </div>
              <button 
                onClick={handleLogout} 
                className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/10"
                title="Sair da conta"
              >
                  <LogOut size={20} />
              </button>
          </div>
      ) : (
        loading && <div className="h-24 bg-slate-100 rounded-2xl mb-6 animate-pulse"></div>
      )}

      {/* --- MENU GRID --- */}
      <div className="grid grid-cols-1 gap-4">
        
        {/* LÓGICA DO BOTÃO: Se tem jogo ativo, muda cor e texto */}
        <Link 
          to="/match" 
          className={`p-6 rounded-2xl shadow-sm border flex items-center gap-5 transition-all group ${
            hasActiveMatch 
              ? 'bg-orange-50 border-orange-200 hover:border-orange-500 hover:shadow-md' 
              : 'bg-white border-slate-200 hover:border-blue-500 hover:shadow-md'
          }`}
        >
          <div className={`p-4 rounded-full transition-colors ${
            hasActiveMatch 
              ? 'bg-orange-100 text-orange-600 group-hover:bg-orange-600 group-hover:text-white' 
              : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
          }`}>
            {hasActiveMatch ? <Activity size={32} /> : <PlayCircle size={32} />}
          </div>
          <div>
            <h2 className={`text-lg font-bold transition-colors ${
               hasActiveMatch ? 'text-orange-700 group-hover:text-orange-600' : 'text-slate-800 group-hover:text-blue-600'
            }`}>
                {hasActiveMatch ? 'Voltar ao Jogo' : 'Iniciar Partida'}
            </h2>
            <p className="text-slate-500 text-sm">
                {hasActiveMatch ? 'Partida em andamento...' : 'Gerenciar lista, times e placar'}
            </p>
          </div>
        </Link>

        <Link to="/players" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5 hover:border-green-500 hover:shadow-md transition-all group">
          <div className="bg-green-50 p-4 rounded-full text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
            <Users size={32} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 group-hover:text-green-600 transition-colors">Gerenciar Elenco</h2>
            <p className="text-slate-500 text-sm">Adicionar, editar ou remover craques</p>
          </div>
        </Link>

        <Link to="/ranking" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5 hover:border-yellow-500 hover:shadow-md transition-all group">
          <div className="bg-yellow-50 p-4 rounded-full text-yellow-600 group-hover:bg-yellow-600 group-hover:text-white transition-colors">
            <BarChart3 size={32} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 group-hover:text-yellow-600 transition-colors">Ranking Geral</h2>
            <p className="text-slate-500 text-sm">Quem são os artilheiros e líderes</p>
          </div>
        </Link>
        
        <Link to="/history" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5 hover:border-purple-500 hover:shadow-md transition-all group">
          <div className="bg-purple-50 p-4 rounded-full text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <History size={32} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 group-hover:text-purple-600 transition-colors">Histórico</h2>
            <p className="text-slate-500 text-sm">Ver resultados de jogos passados</p>
          </div>
        </Link>

      </div>
    </Layout>
  );
}