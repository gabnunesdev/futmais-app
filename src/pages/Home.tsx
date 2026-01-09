import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Users, Trophy, TrendingUp } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  const cards = [
    {
      title: 'Iniciar Partida',
      description: 'Check-in, Sorteio de times e Cronômetro.',
      icon: PlayCircle,
      path: '/match',
      color: 'bg-blue-600',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Gerenciar Elenco',
      description: 'Cadastre novos craques ou edite as notas.',
      icon: Users,
      path: '/players',
      color: 'bg-green-600',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Ranking da Galera',
      description: 'Quem é o artilheiro? Quem mais venceu?',
      icon: Trophy,
      path: '/ranking', // Vamos criar essa em breve
      color: 'bg-amber-500',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    {
      title: 'Histórico',
      description: 'Veja todos os jogos passados.',
      icon: TrendingUp,
      path: '/history',
      color: 'bg-slate-600',
      textColor: 'text-slate-600',
      bgColor: 'bg-slate-50'
    }
  ];

  return (
    <Layout title="Painel Principal">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card) => (
          <button
            key={card.path}
            onClick={() => navigate(card.path)}
            className="flex flex-col text-left bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all group active:scale-[0.98]"
          >
            <div className={`w-12 h-12 ${card.bgColor} ${card.textColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <card.icon size={28} />
            </div>
            
            <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">
              {card.title}
            </h3>
            
            <p className="text-sm text-slate-500">
              {card.description}
            </p>
          </button>
        ))}
      </div>

      {/* Resumo Rápido (Opcional - Futuro Dashboard Analytics) */}
      <div className="mt-8 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg">
        <h3 className="font-bold text-lg mb-2">Próximo Jogo? ⚽</h3>
        <p className="text-slate-300 text-sm mb-4">
          Não esqueça de manter as notas dos jogadores atualizadas para garantir times equilibrados hoje.
        </p>
        <button 
          onClick={() => navigate('/players')}
          className="text-sm font-bold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
        >
          Revisar Notas
        </button>
      </div>
    </Layout>
  );
}