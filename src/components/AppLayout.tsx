import { useState, useRef } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Users, Menu, X, Activity, ChevronRight, Upload, ImageIcon, BookOpen, Dumbbell,
} from 'lucide-react';
import { useAppMode } from '../App';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/clientes', label: 'Clientes', icon: Users },
  { path: '/exercicios', label: 'Exercícios', icon: Dumbbell },
  { path: '/alimentos', label: 'Alimentos', icon: BookOpen },
];

export default function AppLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logo, setLogo] = useState<string | null>(() => localStorage.getItem('fitpro_logo'));
  const fileRef = useRef<HTMLInputElement>(null);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setLogo(dataUrl);
      localStorage.setItem('fitpro_logo', dataUrl);
    };
    reader.readAsDataURL(file);
  }

  function removeLogo() {
    setLogo(null);
    localStorage.removeItem('fitpro_logo');
    if (fileRef.current) fileRef.current.value = '';
  }

  const SidebarHeader = () => (
    <div className="px-4 py-5 border-b border-slate-800">
      <div className="flex items-center gap-3">
        {logo ? (
          <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
            <img src={logo} alt="Logo" className="w-10 h-10 rounded-xl object-contain bg-white p-0.5" />
            <div className="absolute inset-0 rounded-xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Upload className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-10 h-10 rounded-xl bg-slate-700 border-2 border-dashed border-slate-500 flex items-center justify-center hover:border-emerald-400 hover:bg-slate-600 transition-all group"
            title="Carregar logo"
          >
            <ImageIcon className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-base leading-tight text-white">FitPro</h1>
          <button onClick={() => fileRef.current?.click()} className="text-xs text-slate-400 hover:text-emerald-400 transition-colors truncate block">
            {logo ? 'Alterar logo' : 'Carregar logo'}
          </button>
        </div>
        {logo && (
          <button onClick={removeLogo} className="text-slate-500 hover:text-rose-400 transition-colors" title="Remover logo">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
    </div>
  );

  const NavItems = ({ onClose }: { onClose?: () => void }) => {
    const { mode, setMode, isTrainer } = useAppMode();
    return (
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                active ? 'bg-emerald-500/15 text-emerald-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {item.label}
              {active && <ChevronRight className="w-4 h-4 ml-auto" />}
            </Link>
          );
        })}

        <div className="pt-4 mt-4 border-t border-slate-700">
          <div className="px-3 py-2">
            <p className="text-xs text-slate-400 font-medium mb-2">Modo de Visualização</p>
            <div className="flex bg-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setMode('trainer')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs font-medium transition-all ${
                  isTrainer ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Treinador
              </button>
              <button
                onClick={() => setMode('client')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs font-medium transition-all ${
                  !isTrainer ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                Cliente
              </button>
            </div>
          </div>
        </div>
      </nav>
    );
  };

  const { isTrainer } = useAppMode();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white fixed h-screen z-30">
        <SidebarHeader />
        <NavItems />
        <div className="px-4 py-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isTrainer ? 'bg-slate-700' : 'bg-blue-500/20'}`}>
              {isTrainer ? <Users className="w-4 h-4 text-emerald-400" /> : <Activity className="w-4 h-4 text-blue-400" />}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{isTrainer ? 'Modo Treinador' : 'Modo Cliente'}</p>
              <p className="text-xs text-slate-400">{isTrainer ? 'Edição completa' : 'Só visualização'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile Sidebar (drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-slate-900 text-white z-50 flex flex-col transform transition-transform md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
          {logo ? (
            <img src={logo} alt="Logo" className="h-8 object-contain" />
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">FitPro</span>
            </div>
          )}
          <button onClick={() => setMobileOpen(false)} className="p-2 -mr-2">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>
        <NavItems onClose={() => setMobileOpen(false)} />
      </aside>

      {/* Main */}
      <div className="flex-1 md:ml-64">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-20">
          <button onClick={() => setMobileOpen(true)} className="p-1 -ml-1">
            <Menu className="w-6 h-6 text-slate-700" />
          </button>
          {logo ? (
            <img src={logo} alt="Logo" className="h-7 object-contain" />
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-800">FitPro</span>
            </div>
          )}
        </div>

        <main className="p-4 md:p-6 lg:p-8 min-h-[calc(100vh-56px)] md:min-h-screen pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-30 flex items-center justify-around px-2 py-1.5 safe-area-pb">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg min-w-[60px] transition-colors ${
                active ? 'text-emerald-600' : 'text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
