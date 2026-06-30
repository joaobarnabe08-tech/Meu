import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import FoodsLibrary from './pages/FoodsLibrary';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clientes" element={<Clients />} />
          <Route path="/clientes/:clienteId" element={<ClientDetail />} />
          <Route path="/alimentos" element={<FoodsLibrary />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
