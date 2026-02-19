import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Comparison from './pages/Comparison';
import PendingOrders from './pages/PendingOrders';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/comparison" element={<Comparison />} />
        <Route path="/pending-orders" element={<PendingOrders />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
