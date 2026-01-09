import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, Trophy } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const result = await signIn(email, password);

    if (result.error) {
      // Traduzindo erros comuns para PT-BR
      const msg = result.error.message.includes('Invalid login') 
        ? 'Email ou senha incorretos.' 
        : 'Ocorreu um erro ao tentar entrar.';
      setError(msg);
      setIsSubmitting(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {/* Container Principal com Animação de Entrada */}
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Cabeçalho do Card */}
        <div className="px-8 pt-10 pb-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-600 mb-6 shadow-sm">
            <Trophy size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Bem-vindo, Craque
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            Painel administrativo do FutMais
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-5">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-md text-sm flex items-center animate-pulse">
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Input Email */}
            <div className="group">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all sm:text-sm bg-slate-50 focus:bg-white"
                  placeholder="admin@futmais.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Input Senha */}
            <div className="group">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all sm:text-sm bg-slate-50 focus:bg-white"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Acessando...
              </>
            ) : (
              'Entrar no Sistema'
            )}
          </button>
        </form>
        
        {/* Rodapé Decorativo */}
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            Protegido por criptografia de ponta a ponta.
          </p>
        </div>
      </div>
    </div>
  );
}