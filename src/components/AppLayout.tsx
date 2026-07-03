import { useState, useRef } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Menu, X, Upload, ImageIcon, BookOpen, Dumbbell, LogOut, Calendar,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import Logo from './Logo';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/clientes', label: 'Clientes', icon: Users },
  { path: '/agenda', label: 'Agenda', icon: Calendar },
  { path: '/exercicios', label: 'Exercícios', icon: Dumbbell },
  { path: '/alimentos', label: 'Alimentos', icon: BookOpen },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logo, setLogo] = useState<string | null>(() => localStorage.getItem('viper_logo'));
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
      localStorage.setItem('viper_logo', dataUrl);
    };
    reader.readAsDataURL(file);
  }

  function removeLogo() {
    setLogo(null);
    localStorage.removeItem('viper_logo');
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  const SidebarHeader = () => (
    <div className="px-4 py-5 border-b border-viper-700">
      <div className="flex items-center gap-3">
        {logo ? (
          <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
            <img src={logo} alt="Logo" className="w-10 h-10 rounded-xl object-contain bg-viper-800 p-0.5" />
            <div className="absolute inset-0 rounded-xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Upload className="w-3.5 h-3.5 text-gold-400" />
            </div>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-10 h-10 rounded-xl bg-viper-700 border-2 border-dashed border-viper-500 flex items-center justify-center hover:border-gold-400 hover:bg-viper-600 transition-all group"
            title="Carregar logo"
          >
            <ImageIcon className="w-4 h-4 text-viper-400 group-hover:text-gold-400 transition-colors" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-base leading-tight text-white tracking-tight">Viper Factory</h1>
          <button onClick={() => fileRef.current?.click()} className="text-xs text-viper-400 hover:text-gold-400 transition-colors truncate block">
            {logo ? 'Alterar logo' : 'Carregar logo'}
          </button>
        </div>
        {logo && (
          <button onClick={removeLogo} className="text-viper-500 hover:text-rose-400 transition-colors" title="Remover logo">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
    </div>
  );

  const NavItems = ({ onClose }: { onClose?: () => void }) => (
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
              active
                ? 'bg-gold-400/10 text-gold-400 border-l-2 border-gold-400'
                : 'text-viper-200 hover:bg-viper-700 hover:text-white border-l-2 border-transparent'
            }`}
          >
            <Icon className="w-5 h-5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-viper-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-viper-900 text-white fixed h-screen z-30">
        <SidebarHeader />
        <NavItems />
        <div className="px-4 py-4 border-t border-viper-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-viper-700">
              <Users className="w-4 h-4 text-gold-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Modo Treinador</p>
              <p className="text-xs text-viper-400">Edição completa</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-viper-200 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Terminar sessão
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile Sidebar (drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-viper-900 text-white z-50 flex flex-col transform transition-transform md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-viper-700">
          <Logo size="sm" />
          <button onClick={() => setMobileOpen(false)} className="p-2 -mr-2">
            <X className="w-6 h-6 text-viper-400" />
          </button>
        </div>
        <NavItems onClose={() => setMobileOpen(false)} />
        <div className="px-4 py-4 border-t border-viper-700">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-viper-200 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Terminar sessão
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 md:ml-64">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-viper-900 border-b border-viper-700 sticky top-0 z-20">
          <button onClick={() => setMobileOpen(true)} className="p-1 -ml-1">
            <Menu className="w-6 h-6 text-gold-400" />
          </button>
          <Logo size="sm" />
        </div>

        <main className="p-4 md:p-6 lg:p-8 min-h-[calc(100vh-56px)] md:min-h-screen pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-viper-900 border-t border-viper-700 z-30 flex items-center justify-around px-2 py-1.5 safe-area-pb">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg min-w-[60px] transition-colors ${
                active ? 'text-gold-400' : 'text-viper-400'
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
