import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Comparison from './pages/Comparison';
import PendingOrders from './pages/PendingOrders';
import ComingSoon from './pages/ComingSoon';
import Login from './pages/Login';
import Compras from './pages/Compras';
import Usuarios from './pages/Usuarios';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/ventas" element={<Dashboard />} />
          <Route path="/comparison" element={<Comparison />} />
          <Route path="/pending-orders" element={<PendingOrders />} />
          <Route path="/compras" element={<Compras />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/produccion" element={<ComingSoon title="Producción" />} />
          <Route path="/finanzas" element={<ComingSoon title="Finanzas" />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
