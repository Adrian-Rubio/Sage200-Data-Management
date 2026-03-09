import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Comparison from './pages/Comparison';
import PendingOrders from './pages/PendingOrders';
import PedidosPendientesPBIX from './pages/PedidosPendientesPBIX';
import ComingSoon from './pages/ComingSoon';
import Login from './pages/Login';
import Compras from './pages/Compras';
import PedidosCompra from './pages/PedidosCompra';
import Usuarios from './pages/Usuarios';
import Produccion from './pages/Produccion';
import Almacen from './pages/Almacen';
import CobrosPagos from './pages/CobrosPagos';
import CuentaExplotacion from './pages/CuentaExplotacion';
import Contabilidad from './pages/Contabilidad';
import Inventario from './pages/Inventario';
import CierreMes from './pages/CierreMes';
import PrivateRoute from './components/PrivateRoute';
import RmaDashboard from './pages/RmaDashboard';

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
          <Route path="/pedidos-pendientes-pbix" element={<PedidosPendientesPBIX />} />
          <Route path="/compras" element={<Compras />} />
          <Route path="/compras/pedidos-pendientes" element={<PedidosCompra />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/produccion" element={<Produccion />} />
          <Route path="/produccion/rma" element={<RmaDashboard />} />
          <Route path="/almacen" element={<Almacen />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/cierre-mes" element={<CierreMes />} />
          <Route path="/contabilidad" element={<Contabilidad />} />
          <Route path="/finanzas/tesoreria" element={<CobrosPagos />} />
          <Route path="/finanzas/explotacion" element={<CuentaExplotacion />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
