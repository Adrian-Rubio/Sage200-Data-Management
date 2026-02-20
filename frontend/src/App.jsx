import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Comparison from './pages/Comparison';
import PendingOrders from './pages/PendingOrders';
import ComingSoon from './pages/ComingSoon';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ventas" element={<Dashboard />} />
        <Route path="/comparison" element={<Comparison />} />
        <Route path="/pending-orders" element={<PendingOrders />} />

        <Route path="/compras" element={<ComingSoon title="Compras" />} />
        <Route path="/produccion" element={<ComingSoon title="Producción" />} />
        <Route path="/finanzas" element={<ComingSoon title="Finanzas" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
