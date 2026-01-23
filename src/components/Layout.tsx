import {
  ArrowLeft,
  Home as HomeIcon,
  Menu,
  PlayCircle,
  Trophy,
  Users,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
  title: string;
  action?: ReactNode;
}

export default function Layout({ children, title, action }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isDev = import.meta.env.DEV;

  // Verifica se estamos na página inicial
  const isHome = location.pathname === "/";
  

  const menuItems = [
    { label: "Início", icon: HomeIcon, path: "/" },
    { label: "Partida", icon: PlayCircle, path: "/match" },
    { label: "Jogadores", icon: Users, path: "/players" },
    { label: "Ranking", icon: Trophy, path: "/ranking" },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-10">
      {/* FAIXA DE ALERTA DE DEV */}
      {isDev && (
        <div className="bg-yellow-400 text-yellow-900 text-xs font-bold text-center py-1 sticky top-0 z-60 shadow-sm">
          🚧 AMBIENTE DE DESENVOLVIMENTO (Banco de Teste) 🚧
        </div>
      )}
      {/* --- HEADER GLOBAL (FIXO) --- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          {/* Menu Hamburguer (Mobile) */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 -ml-2 rounded-md hover:bg-slate-100 lg:hidden text-slate-600 active:bg-slate-200 transition-colors"
          >
            <Menu size={24} />
          </button>

          <h1
            onClick={() => navigate("/")}
            className="text-xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent cursor-pointer"
          >
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
                    ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* --- MENU MOBILE (DRAWER) --- */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in"
            onClick={() => setIsMenuOpen(false)}
          />
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
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50"
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
        {/* CABEÇALHO DA PÁGINA COM BOTÃO VOLTAR */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* Lógica: Se NÃO for Home, mostra o botão Voltar */}
            {!isHome && (
              <button
                onClick={() => navigate(-1)} // Volta 1 histórico
                className="p-1.5 -ml-2 mr-1 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors active:scale-95"
                title="Voltar"
              >
                <ArrowLeft size={26} />
              </button>
            )}
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              {title}
            </h2>
          </div>

          {/* Botão de Ação (ex: Novo Jogador) */}
          {action && <div>{action}</div>}
        </div>

        {/* Conteúdo */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </div>
      </main>

      {/* --- RODAPÉ COM CRÉDITOS (ADICIONADO) --- */}
      <footer className="mt-8 py-6 text-center border-t border-slate-200 mx-auto max-w-5xl px-4">
        <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
          Desenvolvido por
          <a
            href="https://www.linkedin.com/in/gabrielnunes-dev/" // <--- Mude seu link aqui
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 transition-colors"
          >
            Gabriel Nunes {/* <--- Mude seu nome aqui */}
          </a>
        </p>
        <p className="text-[10px] text-slate-300 mt-1">
          v1.0.0 • {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}