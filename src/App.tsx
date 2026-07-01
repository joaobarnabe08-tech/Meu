import { createContext, useState, useContext, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import FoodsLibrary from './pages/FoodsLibrary';
import ExercisesLibrary from './pages/ExercisesLibrary';

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
    <AppModeContext.Provider value={value}>
      <BrowserRouter>
        <Routes>
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
  );
}

export default App;
