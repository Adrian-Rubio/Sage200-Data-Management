import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend, Cell
} from 'recharts';
import { 
  Building2, Users, Receipt, DollarSign, Calendar, Search, ArrowRight, RefreshCw, Landmark, Home as HomeIcon, Percent
} from 'lucide-react';
import { fetchSaraturDashboard } from '../services/saraturApi';
import { PageHeader } from '../components/common/PageHeader';
import { KpiCard } from '../components/dashboard/KpiCard';

const formatEuro = (val) => {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val || 0);
};

const formatNumber = (val) => {
  return new Intl.NumberFormat('es-ES').format(val || 0);
};

const Saratur = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Date and filter states
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSaraturDashboard({
        start_date: startDate || null,
        end_date: endDate || null
      });
      setData(res);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los datos de Saratur. Comprueba tus permisos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <div className="flex flex-col gap-6 min-h-screen text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <PageHeader 
        title="Dashboard Saratur" 
        subtitle="Analíticas y control del complejo de apartamentos de alquiler"
      />

      {/* Date Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Calendar size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Rango de fechas</h4>
            <p className="text-xs text-slate-500">Filtrar facturación de apartamentos</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Desde:</span>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Hasta:</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <button 
            onClick={loadData}
            className="flex items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Recargar datos"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold tracking-widest uppercase text-slate-400">Cargando métricas de Saratur...</span>
        </div>
      ) : error ? (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-center text-rose-500 max-w-lg mx-auto">
          <span className="font-bold text-sm block mb-1">Error de acceso</span>
          <span className="text-xs">{error}</span>
        </div>
      ) : (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
            <KpiCard 
              title="Ingresos Totales" 
              value={data?.kpis?.revenue} 
              subtext="Total neto percibido"
              icon={<DollarSign size={20} />}
            />
            <KpiCard 
              title="Base Imponible" 
              value={data?.kpis?.base_imponible} 
              subtext="Ingresos antes de impuestos"
              icon={<Landmark size={20} />}
            />
            <KpiCard 
              title="Porcentaje Ocupación" 
              value={data?.kpis?.occupancy_rate} 
              isPercentage={true}
              subtext="Uso medio de los 21 aptos."
              icon={<Percent size={20} />}
              tooltip="Porcentaje medio de ocupación de las 21 unidades físicas disponibles en Saratur durante el periodo seleccionado"
            />
            <KpiCard 
              title="Huéspedes / Clientes" 
              value={data?.kpis?.clients} 
              subtext="Clientes únicos en el periodo"
              icon={<Users size={20} />}
            />
            <KpiCard 
              title="Total Alquileres" 
              value={data?.kpis?.bookings} 
              subtext="Movimientos / contratos"
              icon={<Receipt size={20} />}
            />
          </div>

          {/* Main Charts Row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Income Evolution Monthly */}
            <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex flex-col h-[400px]">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
                <Building2 size={14} className="text-blue-500" />
                Evolución de Ingresos de Alquileres
              </h3>
              <div className="flex-1 w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.charts?.evolution} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="saraturRevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="Periodo" stroke="rgba(0,0,0,0.3)" fontSize={10} fontWeight="700" tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="rgba(0,0,0,0.3)" fontSize={10} fontWeight="700" tickLine={false} axisLine={false} tickFormatter={(v)=>`${formatNumber(v)}€`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }} 
                      formatter={(v)=>formatEuro(v)} 
                    />
                    <Area type="monotone" dataKey="ImporteLiquido" name="Ingresos (€)" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#saraturRevGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Income by Complex */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex flex-col h-[400px]">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
                <HomeIcon size={14} className="text-cyan-500" />
                Distribución por Complejo
              </h3>
              <div className="flex-1 w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.charts?.by_complex} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="Complex" stroke="rgba(0,0,0,0.3)" fontSize={9} fontWeight="700" tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="rgba(0,0,0,0.3)" fontSize={10} fontWeight="700" tickLine={false} axisLine={false} tickFormatter={(v)=>`${formatNumber(v)}€`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }} 
                      formatter={(v)=>formatEuro(v)} 
                    />
                    <Bar dataKey="ImporteLiquido" name="Ingresos (€)" fill="#06b6d4" radius={[6, 6, 0, 0]} maxBarSize={45}>
                      {data?.charts?.by_complex?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Lower Row: Ranking & List */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Horizontal Bar Chart: Apartment Profitability */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex flex-col h-[480px]">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
                <HomeIcon size={14} className="text-emerald-500" />
                Ranking de Rentabilidad por Apartamento (Top 15)
              </h3>
              <div className="flex-1 w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.charts?.by_apartment} layout="vertical" margin={{ top: 0, right: 20, left: 30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis type="number" stroke="rgba(0,0,0,0.3)" fontSize={10} fontWeight="700" tickLine={false} axisLine={false} tickFormatter={(v)=>`${formatNumber(v)}€`} />
                    <YAxis type="category" dataKey="CodigoArticulo" stroke="rgba(0,0,0,0.3)" fontSize={9} fontWeight="700" tickLine={false} axisLine={false} width={100} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }} 
                      formatter={(v)=>formatEuro(v)} 
                    />
                    <Bar dataKey="revenue" name="Ingresos (€)" fill="#10b981" radius={[0, 6, 6, 0]} maxBarSize={15} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* List: Recent Rentals */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex flex-col h-[480px]">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
                <Receipt size={14} className="text-blue-500" />
                Últimos Alquileres / Movimientos Registrados
              </h3>
              
              <div className="overflow-auto flex-1 pr-2 custom-scrollbar">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/80">
                      <th className="pb-3 pl-2">Apartamento</th>
                      <th className="pb-3">Huésped</th>
                      <th className="pb-3">Fecha</th>
                      <th className="pb-3 text-right pr-2">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {data?.charts?.recent_albaranes?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-all duration-150">
                        <td className="py-3.5 pl-2">
                          <span className="text-xs font-bold text-blue-500 dark:text-blue-400 uppercase bg-blue-500/5 dark:bg-blue-400/5 border border-blue-500/10 dark:border-blue-400/10 px-2 py-0.5 rounded-lg">
                            {item.Apartamento}
                          </span>
                        </td>
                        <td className="py-3.5 max-w-[150px] truncate">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300" title={item.Cliente}>
                            {item.Cliente}
                          </span>
                        </td>
                        <td className="py-3.5 text-xs text-slate-400 font-medium">
                          {item.FechaAlbaran}
                        </td>
                        <td className="py-3.5 text-right pr-2 font-bold text-slate-900 dark:text-white text-xs">
                          {formatEuro(item.Total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Saratur;
