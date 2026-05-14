import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ComposedChart, Legend 
} from 'recharts';
import { 
  LayoutDashboard, TrendingUp, Clock, Receipt, Users, DollarSign, ArrowUpRight, ArrowDownRight, Menu, X, ChevronRight, Gift, Calendar, Search, FileText, ArrowRight, ArrowLeft, ArrowRightLeft, ArrowUpDown, ArrowUp, ArrowDown, RefreshCw, Sparkles, Info
} from 'lucide-react';
import { dashboardService } from '../services/dubesApi';
import { PageHeader } from '../components/common/PageHeader';
import { KpiCard } from '../components/dashboard/KpiCard';

// --- Formateadores Europeos ---
const formatEuro = (val) => {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val || 0);
};

const formatNumber = (val) => {
  return new Intl.NumberFormat('es-ES').format(val || 0);
};

const formatDateToES = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// --- Formateadores Europeos ---

const TicketModal = ({ ticket, onClose }) => {
  if (!ticket) return null;
  const isEvent = ticket.amount >= 400 || ticket.items?.some(i => i.description.toLowerCase().includes('menú') || i.description.toLowerCase().includes('menu') || i.description.toLowerCase().includes('coctel') || i.description.toLowerCase().includes('boda'));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
        {isEvent && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2 text-black font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-inner">
            <Sparkles size={14} className="animate-spin" />
            <span>Ticket de Gran Evento / Celebración Registrado</span>
          </div>
        )}
        <div className="p-6 border-b border-white/10 bg-white/[0.02] flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <Receipt size={28} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-3xl font-black tracking-tighter uppercase leading-none">ORDEN #{ticket.number}</h3>
                  {isEvent && <span className="bg-amber-500/20 text-amber-500 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full font-black uppercase">Evento 🎉</span>}
                </div>
                <p className="text-xs text-slate-400 font-black uppercase tracking-wider mt-1">ID: {ticket.id}</p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10 bg-white/5 p-6 rounded-3xl border border-white/10">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Mesa</span>
              <span className="font-black text-sm uppercase text-indigo-400">{ticket.table}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Camarero</span>
              <span className="font-black text-sm">{ticket.waiter}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Comensales</span>
              <span className="font-black text-sm">{ticket.guests} PAX</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Estancia</span>
              <span className="font-black text-sm text-emerald-400">{ticket.duration} Min</span>
            </div>
          </div>

          <div className="max-h-[350px] overflow-y-auto custom-scrollbar mb-8 pr-2">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-black text-slate-400 uppercase tracking-wider border-b border-white/10">
                  <th className="pb-3">Artículo / Detalle</th>
                  <th className="pb-3 text-right">Cantidad</th>
                  <th className="pb-3 text-right pr-4">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {ticket.items.map((item, i) => (
                  <tr key={i} className="group">
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-200 group-hover:text-white">{item.description}</span>
                        {item.observation && (
                          <span className="text-xs text-indigo-400 font-bold italic mt-0.5 opacity-80">
                            " {item.observation} "
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 text-right">
                       <span className="text-xs text-slate-400 font-black">{item.amount} ud × {formatEuro(item.unitPrice)}</span>
                    </td>
                    <td className="py-4 text-right pr-4">
                      <span className={`text-xs font-black ${item.total <= 0 ? 'text-indigo-400' : 'text-white'}`}>
                        {item.total <= 0 ? 'INVITACIÓN' : formatEuro(item.total)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-gradient-to-r from-primary/10 to-transparent p-6 rounded-3xl border border-white/10 flex justify-between items-center relative overflow-hidden">
            <div className="flex flex-col gap-2 relative z-10">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-indigo-400" />
                <span className="text-xs font-black text-slate-300 uppercase tracking-wider">{ticket.checkIn} - {ticket.time}</span>
              </div>
              <div className="text-sm font-black text-slate-200 uppercase tracking-wider">
                Ticket Medio/pax: <span className="text-indigo-400 ml-1">{formatEuro(ticket.amount / (ticket.guests || 1))}</span>
              </div>
            </div>
            <div className="text-right relative z-10">
               <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Importe Total</span>
               <span className="text-5xl font-black text-white tracking-tighter drop-shadow-lg">{formatEuro(ticket.amount)}</span>
            </div>
            <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
              <Receipt size={120} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InvitationsModal = ({ isOpen, invitations, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
          <div>
            <h3 className="text-3xl font-black flex items-center gap-4 tracking-tighter">
              <Gift size={32} className="text-indigo-400"/>
              DESGLOSE DE INVITACIONES
            </h3>
            <p className="text-sm text-slate-400 font-black uppercase tracking-wider mt-2 italic">Análisis detallado de cortesías y motivos registrados</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white hover:rotate-90">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-slate-400 text-xs font-black uppercase tracking-wider">
                <th className="pb-4 pl-4">Artículo</th>
                <th className="pb-4">Concepto / Razón</th>
                <th className="pb-4">Mesa</th>
                <th className="pb-4">Hora</th>
                <th className="pb-4 text-right pr-6">Valor</th>
              </tr>
            </thead>
            <tbody>
              {invitations.length > 0 ? (
                invitations.map((item, idx) => (
                  <tr key={idx} className="bg-white/[0.02] hover:bg-white/[0.05] transition-all group rounded-2xl">
                    <td className="py-5 pl-4 rounded-l-2xl">
                       <span className="font-black text-slate-200 group-hover:text-indigo-400 transition-colors">{item.description}</span>
                    </td>
                    <td className="py-5">
                       <span className={`px-3 py-1 rounded-lg text-xs font-black tracking-wide border ${item.concept !== 'Sin especificar' ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 border-indigo-500/30' : 'bg-white/5 text-slate-400 border-white/10 italic'}`}>
                        {item.concept}
                       </span>
                    </td>
                    <td className="py-5">
                       <span className="text-xs font-black text-slate-400 uppercase">{item.table}</span>
                    </td>
                    <td className="py-5 text-xs font-bold text-slate-400 tracking-wider">{item.time}</td>
                    <td className="py-5 text-right pr-6 font-black text-white group-hover:text-indigo-400 transition-colors rounded-r-2xl">
                      {formatEuro(item.unitPrice)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-24 text-center text-slate-400 text-sm font-black uppercase tracking-wider italic">No hay invitaciones registradas</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-6 border-t border-white/10 bg-indigo-600/[0.03] flex justify-between items-center">
          <div>
             <span className="font-black text-slate-400 uppercase text-xs tracking-wider block mb-1">Impacto Total</span>
             <span className="text-sm font-black text-indigo-400 uppercase tracking-wider">{invitations.length} artículos regalados</span>
          </div>
          <span className="text-5xl font-black text-indigo-400 tracking-tighter drop-shadow-[0_0_30px_rgba(56,189,248,0.3)]">
            {formatEuro(invitations.reduce((acc, curr) => acc + (curr.unitPrice * curr.amount), 0))}
          </span>
        </div>
      </div>
    </div>
  );
};

const DubesDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [kpis, setKpis] = useState(null);
  const [trends, setTrends] = useState([]);
  const [hourly, setHourly] = useState([]);
  const [ticketsData, setTicketsData] = useState({ data: [], pagination: {} });
  const [invitationsDetails, setInvitationsDetails] = useState([]);
  const [closuresData, setClosuresData] = useState({ items: [], total: 0, total_pages: 0 });
  const [cashflowsData, setCashflowsData] = useState([]);
  const [cashflowSort, setCashflowSort] = useState({ field: 'date', direction: 'desc' });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  
  // Invitations analytical states
  const [invStats, setInvStats] = useState({ totalAmount: 0, totalCount: 0, topArticle: '--', topWaiter: '--', reasonDistribution: [] });
  
  // Local/Restaurant states
  const [locals, setLocals] = useState([]);
  const [selectedLocal, setSelectedLocal] = useState('all');
  
  // Filter states
  const [dateRange, setDateRange] = useState('month');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [closuresPage, setClosuresPage] = useState(1);
  const [ticketsLimit, setTicketsLimit] = useState(10);

  const fetchLocals = async () => {
    try {
      const res = await dashboardService.getLocals();
      setLocals(res.data);
    } catch (error) {
      console.error("Error fetching locals:", error);
    }
  };

  const getDateParams = (range) => {
    const today = new Date();
    let s = new Date();
    let e = new Date();
    
    if (range === 'today') {
      return { start: null, end: null };
    }
    if (range === 'week') {
      s.setDate(today.getDate() - 7);
      return { start: s.toISOString().split('T')[0], end: today.toISOString().split('T')[0] };
    }
    if (range === 'month') {
      s.setDate(1); 
      return { start: s.toISOString().split('T')[0], end: today.toISOString().split('T')[0] };
    }
    if (range === 'custom') {
      return { start: startDate, end: endDate };
    }
    return { start: null, end: null };
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateParams(dateRange);
      const [kpiRes, trendRes, hourRes, ticketRes, invRes, closureRes, cashRes] = await Promise.all([
        dashboardService.getKpiSummary(start, end, selectedLocal),
        dashboardService.getRevenueTrends(start, end, selectedLocal),
        dashboardService.getHourlyDistribution(start, end, selectedLocal),
        dashboardService.getRecentTickets(currentPage, ticketsLimit, start, end, selectedLocal),
        dashboardService.getInvitationDetails(start, end, selectedLocal),
        dashboardService.getClosures(start, end, selectedLocal, closuresPage),
        dashboardService.getCashflows(start, end, selectedLocal)
      ]);
      setKpis(kpiRes.data);
      const trendData = trendRes.data.labels?.map((label, idx) => ({
        date: label, revenue: trendRes.data.values[idx]
      })) || [];
      setTrends(trendData);
      const hourlyData = hourRes.data.hours?.map((hour, idx) => ({
        hour: hour,
        revenue: hourRes.data.revenue[idx],
        guests: hourRes.data.guests[idx],
        avg_ticket: hourRes.data.avg_ticket[idx],
      })) || [];
      setHourly(hourlyData);
      setTicketsData(ticketRes.data || { data: [], pagination: {} });
      setInvitationsDetails(invRes.data || []);
      
      // Calcular métricas de invitaciones
      calculateInvitationStats(invRes.data || []);
      
      // Manejar tanto el formato nuevo (objeto con items) como el antiguo (array)
      const cData = closureRes.data;
      if (cData && cData.items) {
        setClosuresData(cData);
      } else if (Array.isArray(cData)) {
        setClosuresData({ items: cData, total: cData.length, total_pages: 1 });
      } else {
        setClosuresData({ items: [], total: 0, total_pages: 0 });
      }

      setCashflowsData(cashRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage('Iniciando sincronización con el servidor TPV...');
    try {
      await dashboardService.syncData();
      setSyncMessage('Sincronización iniciada en segundo plano. Los datos aparecerán en unos momentos.');
      // Refrescar datos locales después de un breve delay para dar tiempo a que empiece la sincronización
      setTimeout(() => {
        fetchData();
        setSyncing(false);
        setTimeout(() => setSyncMessage(''), 5000);
      }, 3000);
    } catch (error) {
      console.error("Error triggering sync:", error);
      setSyncMessage('Error al conectar con el servidor de sincronización.');
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchLocals();
  }, []);

  useEffect(() => {
    fetchData();
  }, [dateRange, startDate, endDate, currentPage, closuresPage, ticketsLimit, selectedLocal]);

  useEffect(() => {
    if (activeTab === 'tickets') {
      setTicketsLimit(25);
    } else {
      setTicketsLimit(10);
    }
    setCurrentPage(1);
  }, [activeTab]);

  const getCurrentPeriodLabel = () => {
    if (dateRange === 'today') return "Hoy (" + formatDateToES(new Date()) + ")";
    if (dateRange === 'week') return "Últimos 7 días";
    if (dateRange === 'month') return "Último mes";
    return `Del ${formatDateToES(startDate)} al ${formatDateToES(endDate)}`;
  };

  const getHourlyStats = () => {
    if (!hourly || hourly.length === 0) return { peakRevenue: 0, peakHour: '--:--', totalGuests: 0, avgGuests: 0 };
    let peakRev = 0;
    let peakHr = '--:--';
    let totalG = 0;
    let activeHours = 0;
    
    hourly.forEach(h => {
      totalG += h.guests;
      if (h.revenue > 0) activeHours++;
      if (h.revenue > peakRev) {
        peakRev = h.revenue;
        peakHr = h.hour;
      }
    });
    
    return {
      peakRevenue: peakRev,
      peakHour: peakHr,
      totalGuests: totalG,
      avgGuests: activeHours > 0 ? Math.round(totalG / activeHours) : 0
    };
  };

  const calculateInvitationStats = (data) => {
    if (!data || data.length === 0) {
      setInvStats({ totalAmount: 0, totalCount: 0, topArticle: '--', topWaiter: '--', reasonDistribution: [] });
      return;
    }

    const totalAmount = data.reduce((acc, curr) => acc + (curr.unitPrice * curr.amount), 0);
    const totalCount = data.length;

    // Artículos
    const articleCounts = {};
    data.forEach(d => { articleCounts[d.description] = (articleCounts[d.description] || 0) + 1; });
    const topArticle = Object.entries(articleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '--';

    // Camareros
    const waiterAmounts = {};
    data.forEach(d => { waiterAmounts[d.waiter] = (waiterAmounts[d.waiter] || 0) + (d.unitPrice * d.amount); });
    const topWaiter = Object.entries(waiterAmounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '--';

    // Razones
    const reasons = {};
    data.forEach(d => { reasons[d.concept] = (reasons[d.concept] || 0) + 1; });
    const reasonDistribution = Object.entries(reasons)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    setInvStats({ totalAmount, totalCount, topArticle, topWaiter, reasonDistribution });
  };

  const hrStats = getHourlyStats();

  const renderDashboard = () => (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {selectedLocal === 'all' && (
        <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-4 flex items-start gap-3">
          <Info size={20} className="text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs font-black text-indigo-950 dark:text-indigo-300 uppercase tracking-wider">Vista Agregada Multi-Restaurante</span>
            <span className="text-xs text-indigo-700 dark:text-indigo-400 font-medium mt-0.5">
              Estás visualizando la suma global de facturación de todos los locales sincronizados. Los picos elevados en fines de semana suelen incluir grandes eventos, bodas y menús de celebración de El Jardín de Arturo Soria. Utiliza el selector superior para analizar un local individual.
            </span>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard title="Ingresos Brutos" value={kpis?.today_revenue} subtext={dateRange === 'today' ? `Ayer: ${formatEuro(kpis?.yesterday_revenue)}` : 'Periodo Filtrado'} />
        <KpiCard title="Nº Clientes" value={kpis?.total_guests_today} subtext="Comensales Totales" />
        <KpiCard title="Tk. Medio (Pax)" value={kpis?.avg_ticket_pax} subtext="Promedio por persona" />
        <KpiCard title="Tk. Medio (Mesa)" value={kpis?.avg_ticket_table} subtext="Promedio por ticket" />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 h-[500px]">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-3">
            <TrendingUp size={14} className="text-indigo-400" />
            Evolución de Ventas
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="date" stroke="rgba(0,0,0,0.2)" fontSize={9} fontWeight="900" tickLine={false} axisLine={false} dy={15} />
              <YAxis stroke="rgba(0,0,0,0.2)" fontSize={9} fontWeight="900" tickLine={false} axisLine={false} tickFormatter={(v)=>`${formatNumber(v)}€`} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '16px', fontSize: '11px', fontWeight: '900' }} formatter={(v)=>formatEuro(v)} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={5} fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderHours = () => (
    <div className="flex flex-col gap-4 h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="Hora Pico (Ventas)" value={hrStats.peakHour} subtext={`${formatEuro(hrStats.peakRevenue)} generados`} />
        <KpiCard title="Total Comensales" value={hrStats.totalGuests} subtext="En el periodo seleccionado" />
        <KpiCard title="Media por Hora Activa" value={`${hrStats.avgGuests} Pax`} subtext="Promedio de comensales/hora" />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex flex-col">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-10 flex items-center gap-3">
          <Clock size={14} className="text-indigo-400" />
          Rendimiento Horario
        </h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={hourly} margin={{ top: 20, right: 20, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="hour" stroke="rgba(0,0,0,0.2)" fontSize={11} fontWeight="900" tickLine={false} axisLine={false} dy={20} />
              <YAxis yAxisId="rev" stroke="rgba(0,0,0,0.2)" fontSize={11} fontWeight="900" tickLine={false} axisLine={false} tickFormatter={(v)=>`${formatNumber(v)}€`} />
              <YAxis yAxisId="qty" orientation="right" stroke="rgba(0,0,0,0.2)" fontSize={11} fontWeight="900" tickLine={false} axisLine={false} />
              
              <Tooltip 
                cursor={{fill: 'rgba(0,0,0,0.02)'}}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '20px', padding: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}
                formatter={(v, name) => [name.includes('€') ? formatEuro(v) : formatNumber(v), <span className="font-black uppercase text-xs tracking-wider">{name}</span>]}
              />
              <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '40px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px' }} />
              
              <Bar yAxisId="rev" dataKey="revenue" name="Ventas (€)" fill="#6366f1" radius={[8, 8, 0, 0]} maxBarSize={60} />
              <Line yAxisId="qty" type="monotone" dataKey="guests" name="Comensales" stroke="#3b82f6" strokeWidth={5} dot={{r:6, fill: '#3b82f6', strokeWidth: 0}} activeDot={{r:8}} />
              <Line yAxisId="rev" type="monotone" dataKey="avg_ticket" name="Ticket Medio (€)" stroke="#10b981" strokeWidth={5} strokeDasharray="10 5" dot={{r:6, fill: '#10b981', strokeWidth: 0}} activeDot={{r:8}} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderTickets = () => {
    const { data: tks, pagination } = ticketsData;
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h3 className="text-lg font-black uppercase tracking-tighter flex items-center gap-3">
              <Receipt size={20} className="text-indigo-400" />
              Historial de Ventas
            </h3>
            <p className="text-xs text-slate-400 font-black uppercase tracking-wider mt-1">
              Página {pagination.page} de {pagination.total_pages} ({pagination.total_items} tickets)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              disabled={pagination.page <= 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-2 bg-white/5 rounded-lg hover:bg-indigo-600 hover:text-white disabled:opacity-20 transition-all"
            >
              <ArrowLeft size={18} />
            </button>
            <span className="font-black text-xs min-w-[3rem] text-center">{pagination.page} / {pagination.total_pages || 1}</span>
            <button 
              disabled={pagination.page >= pagination.total_pages}
              onClick={() => setCurrentPage(prev => Math.min(pagination.total_pages, prev + 1))}
              className="p-2 bg-white/5 rounded-lg hover:bg-indigo-600 hover:text-white disabled:opacity-20 transition-all"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="pb-4 pl-4">Mesa</th>
                <th className="pb-4">Hora</th>
                <th className="pb-4">Orden</th>
                <th className="pb-4 text-right pr-12">Total</th>
                <th className="pb-4 text-center">Ver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {tks.map((t) => {
                const isEvt = t.amount >= 400 || t.items?.some(i => i.description.toLowerCase().includes('menú') || i.description.toLowerCase().includes('menu') || i.description.toLowerCase().includes('coctel') || i.description.toLowerCase().includes('boda'));
                return (
                  <tr key={t.id} className="hover:bg-white/[0.03] transition-all group cursor-pointer" onClick={() => setSelectedTicket(t)}>
                    <td className="py-4 pl-4">
                      <div className="flex items-center gap-2">
                        <span className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 px-3 py-1 rounded-lg font-black text-xs group-hover:bg-indigo-600 group-hover:text-white transition-all uppercase">{t.table}</span>
                        {isEvt && (
                          <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1">
                            <Sparkles size={10} /> Evento
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 text-slate-400 text-xs font-black">{t.time}</td>
                    <td className="py-4 text-slate-400 text-xs font-mono">REF_{t.number}</td>
                    <td className="py-4 font-black text-right pr-12 text-lg tracking-tighter group-hover:text-indigo-400 transition-colors">{formatEuro(t.amount)}</td>
                    <td className="py-4 text-center">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all mx-auto">
                        <FileText size={14}/>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderClosures = () => (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className="text-lg font-black uppercase tracking-tighter flex items-center gap-3">
            <LayoutDashboard size={20} className="text-slate-400" />
            Cierres de Caja
          </h3>
          <p className="text-xs text-slate-400 font-black uppercase tracking-wider mt-1">
            Resumen de cierres y descuadres registrados
          </p>
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <th className="pb-4 pl-4">Local</th>
              <th className="pb-4">Fecha Cierre</th>
              <th className="pb-4">Responsable</th>
              <th className="pb-4 text-right">Tickets</th>
              <th className="pb-4 text-right">Total Sistema</th>
              <th className="pb-4 text-right pr-6">Descuadre</th>
            </tr>
          </thead>
          <tbody>
            {closuresData.items?.length > 0 ? (
              closuresData.items.map((c) => (
                <tr key={c.id} className="bg-white/[0.02] hover:bg-slate-50 transition-all group rounded-2xl">
                  <td className="py-4 pl-4 rounded-l-2xl">
                    <span className="text-xs font-black uppercase text-slate-500">{c.local}</span>
                  </td>
                  <td className="py-4 text-slate-600 text-xs font-black">{c.date}</td>
                  <td className="py-4 text-slate-400 text-xs font-black uppercase">{c.employee}</td>
                  <td className="py-4 text-right text-xs font-black">{c.tickets}</td>
                  <td className="py-4 text-right font-black text-slate-900">{formatEuro(c.sales)}</td>
                  <td className={`py-4 text-right pr-6 font-black rounded-r-2xl ${
                    c.difference === 0 ? 'text-emerald-500' : 
                    c.difference < 0 ? 'text-rose-500' : 'text-amber-500'
                  }`}>
                    {formatEuro(c.difference)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="py-24 text-center text-slate-400 text-sm font-black uppercase tracking-wider italic">No hay cierres registrados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls for Closures */}
      {closuresData.total_pages > 1 && (
        <div className="flex items-center justify-between mt-6 px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Página <span className="text-slate-900">{closuresPage}</span> de <span className="text-slate-900">{closuresData.total_pages}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setClosuresPage(p => Math.max(1, p - 1))}
              disabled={closuresPage === 1}
              className={`p-2 rounded-xl border border-slate-200 transition-all ${closuresPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <ArrowLeft size={18} />
            </button>
            <button
              onClick={() => setClosuresPage(p => Math.min(closuresData.total_pages, p + 1))}
              disabled={closuresPage === closuresData.total_pages}
              className={`p-2 rounded-xl border border-slate-200 transition-all ${closuresPage === closuresData.total_pages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const handleCashflowSort = (field) => {
    setCashflowSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const getSortedCashflows = () => {
    return [...cashflowsData].sort((a, b) => {
      let valA = a[cashflowSort.field] || '';
      let valB = b[cashflowSort.field] || '';
      
      if (cashflowSort.field === 'amount') {
        valA = Number(valA);
        valB = Number(valB);
      }
      
      if (valA < valB) return cashflowSort.direction === 'asc' ? -1 : 1;
      if (valA > valB) return cashflowSort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const SortIcon = ({ field }) => {
    if (cashflowSort.field !== field) return <ArrowUpDown size={12} className="opacity-20" />;
    return cashflowSort.direction === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />;
  };

  const renderCashflows = () => {
    const sortedData = getSortedCashflows();
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h3 className="text-lg font-black uppercase tracking-tighter flex items-center gap-3">
              <ArrowRightLeft size={20} className="text-slate-400" />
              Movimientos de Caja
            </h3>
            <p className="text-xs text-slate-400 font-black uppercase tracking-wider mt-1">
              Entradas, salidas e ingresos registrados
            </p>
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <th className="pb-4 pl-4 cursor-pointer hover:text-slate-600 transition-colors" onClick={() => handleCashflowSort('local')}>
                  <div className="flex items-center gap-2">
                    Local <SortIcon field="local" />
                  </div>
                </th>
                <th className="pb-4 cursor-pointer hover:text-slate-600 transition-colors" onClick={() => handleCashflowSort('date')}>
                  <div className="flex items-center gap-2">
                    Fecha/Hora <SortIcon field="date" />
                  </div>
                </th>
                <th className="pb-4">Concepto</th>
                <th className="pb-4">Responsable</th>
                <th className="pb-4 text-right pr-6 cursor-pointer hover:text-slate-600 transition-colors" onClick={() => handleCashflowSort('amount')}>
                  <div className="flex items-center justify-end gap-2">
                    Importe <SortIcon field="amount" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedData.length > 0 ? (
                sortedData.map((cf) => (
                  <tr key={cf.id} className="bg-white/[0.02] hover:bg-slate-50 transition-all group rounded-2xl">
                    <td className="py-4 pl-4 rounded-l-2xl">
                      <span className="text-xs font-black uppercase text-slate-500">{cf.local}</span>
                    </td>
                    <td className="py-4 text-slate-600 text-xs font-black">{cf.date}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-black tracking-wide border ${
                        cf.subject.toLowerCase().includes('ingreso') 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                        : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}>
                        {cf.subject}
                      </span>
                    </td>
                    <td className="py-4 text-slate-400 text-xs font-black uppercase">{cf.responsible}</td>
                    <td className={`py-4 text-right pr-6 font-black rounded-r-2xl ${cf.amount < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {formatEuro(cf.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-24 text-center text-slate-400 text-sm font-black uppercase tracking-wider italic">No hay movimientos registrados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderInvitations = () => (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard title="Impacto Invitaciones" value={invStats.totalAmount} subtext={`${invStats.totalCount} artículos regalados`} />
        <KpiCard title="Producto Top" value={invStats.topArticle} subtext="Más invitado (unidades)" />
        <KpiCard title="Camarero Top" value={invStats.topWaiter} subtext="Mayor importe invitado" />
        <KpiCard title="Concepto Principal" value={invStats.reasonDistribution[0]?.name || '--'} subtext="Motivo más frecuente" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-10 flex items-center gap-3">
            <TrendingUp size={14} className="text-slate-400" />
            Distribución por Motivo
          </h3>
          <div className="space-y-6">
            {invStats.reasonDistribution.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-black uppercase tracking-wider">
                  <span className="text-slate-600">{item.name}</span>
                  <span className="text-slate-400">{item.value} veces</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-slate-400 transition-all duration-1000" 
                    style={{ width: `${(item.value / invStats.totalCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {invStats.reasonDistribution.length === 0 && <p className="text-center text-slate-500 text-xs py-10 uppercase font-black">Sin motivos registrados</p>}
          </div>
        </div>

        <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 overflow-hidden flex flex-col">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-3">
            <FileText size={14} className="text-slate-400" />
            Desglose Detallado
          </h3>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <th className="pb-4 pl-4">Fecha/Hora</th>
                  <th className="pb-4">Artículo</th>
                  <th className="pb-4">Tipo</th>
                  <th className="pb-4">Concepto</th>
                  <th className="pb-4">Responsable</th>
                  <th className="pb-4 text-center">Mesa</th>
                  <th className="pb-4 text-right pr-6">Valor</th>
                </tr>
              </thead>
              <tbody>
                {invitationsDetails.map((item, idx) => (
                  <tr key={idx} className="bg-white/[0.02] hover:bg-slate-50 transition-all group rounded-2xl">
                    <td className="py-4 pl-4 rounded-l-2xl text-[10px] font-black text-slate-400">
                      {item.date} {item.time}
                    </td>
                    <td className="py-4">
                       <span className="font-black text-slate-200 text-xs">{item.description}</span>
                    </td>
                    <td className="py-4">
                       <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${item.type === 'Producto' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'}`}>
                        {item.type}
                       </span>
                    </td>
                    <td className="py-4">
                       <span className={`px-2 py-1 rounded text-[10px] font-black tracking-wide border ${item.concept !== 'Sin especificar' ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-white/5 text-slate-500 border-white/10 italic'}`}>
                        {item.concept}
                       </span>
                    </td>
                    <td className="py-4 text-xs font-black text-slate-400 uppercase">{item.waiter}</td>
                    <td className="py-4 text-center">
                       <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">{item.table}</span>
                    </td>
                    <td className="py-4 text-right pr-6 font-black text-white rounded-r-2xl text-xs">
                      {formatEuro(item.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col relative font-sans scale-[0.98] origin-top transition-all duration-500">
      <div className="p-4 md:p-6">
        <PageHeader moduleName="Restauración" showRefresh={false}>
          <div className="flex items-center gap-2 mr-2">
            {syncMessage && (
              <span className="text-[10px] font-black uppercase text-indigo-500 animate-pulse bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                {syncMessage}
              </span>
            )}
            <button 
              onClick={handleSync} 
              disabled={syncing}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-black text-[10px] uppercase transition-all shadow-sm ${syncing ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-700 active:scale-95'}`}
              title="Sincronizar datos reales desde los TPVs de los locales"
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Sincronizando...' : 'Actualizar Datos TPV'}
            </button>
          </div>
          <button onClick={fetchData} className="bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 p-2 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 hover:bg-slate-50 transition-colors">
            <RefreshCw size={18} />
          </button>
        </PageHeader>

        {/* Filters and Tabs row */}
        <div className="bg-white dark:bg-slate-900 p-3 rounded-lg shadow-sm mb-4 flex flex-wrap gap-3 items-end w-full border border-slate-100 dark:border-slate-800 transition-colors">
          {/* Restaurant Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Restaurante</label>
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg border border-slate-100 dark:border-slate-700">
              <button 
                onClick={() => setSelectedLocal('all')}
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-md transition-all whitespace-nowrap ${selectedLocal === 'all' ? 'bg-white dark:bg-slate-600 text-black dark:text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                Todos
              </button>
              {locals.map(local => (
                <button 
                  key={local.Id}
                  onClick={() => setSelectedLocal(local.Id)}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-md transition-all whitespace-nowrap ${selectedLocal === local.Id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  {local.Name}
                </button>
              ))}
            </div>
          </div>

          <div className="h-10 w-px bg-slate-100 dark:bg-slate-800 mx-1"></div>

          {/* Date Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Periodo</label>
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg border border-slate-100 dark:border-slate-700">
              {['today', 'week', 'month', 'custom'].map(r => (
                <button 
                  key={r} onClick={() => setDateRange(r)}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-md transition-all ${dateRange === r ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-white'}`}
                >
                  {r === 'today' ? 'Hoy' : r === 'week' ? 'Semana' : r === 'month' ? 'Mes' : 'Elegir'}
                </button>
              ))}
            </div>
          </div>

          {dateRange === 'custom' && (
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg border border-slate-100 dark:border-slate-700 animate-in fade-in slide-in-from-left-4">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-[10px] font-black uppercase text-slate-600 dark:text-white p-1.5 outline-none" />
              <ArrowRight size={12} className="text-slate-400" />
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-[10px] font-black uppercase text-slate-600 dark:text-white p-1.5 outline-none" />
            </div>
          )}

          <div className="h-10 w-px bg-slate-100 dark:bg-slate-800 mx-1"></div>

          {/* Tabs Selector */}
          <div className="flex flex-col gap-1.5 flex-grow">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Módulo</label>
            <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar">
              {[
                { id: 'dashboard', label: 'Ventas', icon: LayoutDashboard },
                { id: 'invitations', label: 'Invitaciones', icon: Gift },
                { id: 'hours', label: 'Horarios', icon: Clock },
                { id: 'tickets', label: 'Tickets', icon: Receipt },
                { id: 'closures', label: 'Cierres', icon: FileText },
                { id: 'cashflows', label: 'Caja', icon: ArrowRightLeft }
              ].map((item) => (
                <button 
                  key={item.id} onClick={() => setActiveTab(item.id)} 
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${activeTab === item.id ? 'bg-indigo-600 text-white font-black shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-white border border-slate-100 dark:border-slate-700 font-bold'}`}
                >
                  <item.icon size={14} />
                  <span className="text-[10px] uppercase tracking-wider">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 overflow-y-auto w-full">
        {loading ? (
          <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-indigo-500"></div>
            <p className="text-xs font-black text-indigo-400 uppercase tracking-wider animate-pulse">Sincronizando</p>
          </div>
        ) : (
          <div className="h-full">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'invitations' && renderInvitations()}
            {activeTab === 'hours' && renderHours()}
            {activeTab === 'tickets' && renderTickets()}
            {activeTab === 'closures' && renderClosures()}
            {activeTab === 'cashflows' && renderCashflows()}
          </div>
        )}
      </main>


      <TicketModal 
        ticket={selectedTicket} 
        onClose={() => setSelectedTicket(null)} 
      />
    </div>
  );
};

export default DubesDashboard;
