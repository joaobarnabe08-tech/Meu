import { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import FoodsLibrary from './pages/FoodsLibrary';
import ExercisesLibrary from './pages/ExercisesLibrary';
import ClientLogin from './pages/ClientLogin';
import ActivateAccount from './pages/ActivateAccount';
import ClientArea from './pages/ClientArea';
import { AuthProvider, useAuth } from './lib/auth';

type AppMode = 'trainer' | 'client';

type AppModeContextType = {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  isTrainer: boolean;
  isClient: boolean;
};

export const AppModeContext = createContext<AppModeContextType>({
  mode: 'trainer',
  setMode: () => {},
  isTrainer: true,
  isClient: false,
});

export function useAppMode() {
  return useContext(AppModeContext);
}

function ProtectedClientArea() {
  const { user, clientProfile, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user || !clientProfile) return <Navigate to="/login-cliente" replace />;
  return <ClientArea />;
}

function App() {
  const [mode, setMode] = useState<AppMode>(() => {
    const saved = localStorage.getItem('fitpro_mode');
    return (saved as AppMode) || 'trainer';
  });

  useEffect(() => {
    localStorage.setItem('fitpro_mode', mode);
  }, [mode]);

  const value: AppModeContextType = {
    mode,
    setMode,
    isTrainer: mode === 'trainer',
    isClient: mode === 'client',
  };

  return (
    <AuthProvider>
      <AppModeContext.Provider value={value}>
        <BrowserRouter>
          <Routes>
            {/* Client auth routes */}
            <Route path="/login-cliente" element={<ClientLogin />} />
            <Route path="/ativar-conta" element={<ActivateAccount />} />
            <Route path="/area-cliente" element={<ProtectedClientArea />} />

            {/* Trainer routes */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/clientes" element={<Clients />} />
              <Route path="/clientes/:clienteId" element={<ClientDetail />} />
              <Route path="/alimentos" element={<FoodsLibrary />} />
              <Route path="/exercicios" element={<ExercisesLibrary />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppModeContext.Provider>
    </AuthProvider>
  );
}

export default App;
