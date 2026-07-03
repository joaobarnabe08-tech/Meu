import { createContext, useContext, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import FoodsLibrary from './pages/FoodsLibrary';
import ExercisesLibrary from './pages/ExercisesLibrary';
import Appointments from './pages/Appointments';
import Login from './pages/Login';
import ActivateAccount from './pages/ActivateAccount';
import ClientArea from './pages/ClientArea';
import { AuthProvider, useAuth } from './lib/auth';

type AppModeContextType = {
  isTrainer: boolean;
  isClient: boolean;
};

export const AppModeContext = createContext<AppModeContextType>({
  isTrainer: true,
  isClient: false,
});

export function useAppMode() {
  return useContext(AppModeContext);
}

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-viper-50">
      <div className="w-8 h-8 border-3 border-gold-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ProtectedTrainerRoutes() {
  const { user, role, loading } = useAuth();

  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (role === 'client') return <Navigate to="/area-cliente" replace />;
  if (role !== 'trainer') return <Navigate to="/login" replace />;

  return (
    <AppModeContext.Provider value={{ isTrainer: true, isClient: false }}>
      <AppLayout />
    </AppModeContext.Provider>
  );
}

function ProtectedClientArea() {
  const { user, role, loading } = useAuth();

  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (role === 'trainer') return <Navigate to="/dashboard" replace />;
  if (role !== 'client') return <Navigate to="/login" replace />;

  return (
    <AppModeContext.Provider value={{ isTrainer: false, isClient: true }}>
      <ClientArea />
    </AppModeContext.Provider>
  );
}

function LoginRoute() {
  const { user, role, loading } = useAuth();

  if (loading) return <FullScreenLoader />;
  if (user && role === 'trainer') return <Navigate to="/dashboard" replace />;
  if (user && role === 'client') return <Navigate to="/area-cliente" replace />;

  return <Login />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/login-cliente" element={<Navigate to="/login" replace />} />
          <Route path="/ativar-conta" element={<ActivateAccount />} />

          {/* Client area */}
          <Route path="/area-cliente" element={<ProtectedClientArea />} />

          {/* Trainer routes (protected) */}
          <Route element={<ProtectedTrainerRoutes />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clientes" element={<Clients />} />
            <Route path="/clientes/:clienteId" element={<ClientDetail />} />
            <Route path="/agenda" element={<Appointments />} />
            <Route path="/alimentos" element={<FoodsLibrary />} />
            <Route path="/exercicios" element={<ExercisesLibrary />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
