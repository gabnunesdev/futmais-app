import { type ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, PlayCircle, Trophy, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: ReactNode;
  title: string;
  action?: ReactNode; // Botão extra opcional no topo (ex: "Novo Jogador")
}

export default function Layout({ children, title, action }: LayoutProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { label: 'Jogadores', icon: Users, path: '/players' },
    { label: 'Partida', icon: PlayCircle, path: '/' }, // Dashboard é a partida
    { label: 'Ranking', icon: Trophy, path: '/ranking' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* --- HEADER MOBILE & DESKTOP --- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          {/* Menu Hamburguer (Mobile) */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 -ml-2 rounded-md hover:bg-slate-100 lg:hidden text-slate-600"
          >
            <Menu size={24} />
          </button>
          
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            FutMais
          </h1>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex gap-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Botão de Sair (Sempre visível, mas ícone no mobile) */}
        <button 
          onClick={() => signOut()}
          className="p-2 text-slate-400 hover:text-red-600 transition-colors"
          title="Sair"
        >
          <LogOut size={20} />
        </button>
      </header>

      {/* --- MENU MOBILE (DRAWER) --- */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop Escuro */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Conteúdo do Menu */}
          <div className="absolute top-16 left-0 w-64 bg-white shadow-xl h-[calc(100vh-64px)] p-4 border-r border-slate-100 animate-in slide-in-from-left duration-200">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-colors ${
                      isActive 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <item.icon size={20} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- ÁREA DE CONTEÚDO PRINCIPAL --- */}
      <main className="max-w-5xl mx-auto p-4 lg:p-6 space-y-6">
        {/* Cabeçalho da Página (Breadcrumb/Title) */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h2>
          {action && <div>{action}</div>}
        </div>

        {/* O Conteúdo da página entra aqui */}
        <div className="animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}