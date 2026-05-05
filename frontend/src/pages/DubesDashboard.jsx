import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ComposedChart, Legend 
} from 'recharts';
import { 
  LayoutDashboard, TrendingUp, Clock, Receipt, Users, DollarSign, ArrowUpRight, ArrowDownRight, Menu, X, ChevronRight, Gift, Calendar, Search, FileText, ArrowRight, ArrowLeft
} from 'lucide-react';
import { dashboardService } from '../services/dubesApi';

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

const Card = ({ title, value, subValue, icon: Icon, trend, trendValue }) => (
  <div className="bg-[#172035]/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl p-6 flex flex-col gap-4 border-white/10 hover:border-primary/30 transition-all group relative overflow-hidden h-full">
    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
      <Icon size={80} />
    </div>
    <div className="flex justify-between items-start relative z-10">
      <div className="p-3 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-400 group-hover:scale-110 transition-transform">
        <Icon size={24} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-sm font-bold ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
          {trendValue}%
          {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
        </div>
      )}
    </div>
    <div className="relative z-10 mt-auto">
      <p className="text-slate-300 text-xs font-black uppercase tracking-wider">{title}</p>
      <h3 className="text-3xl font-black mt-2 tracking-tighter">{value}</h3>
      <p className="text-slate-400 text-xs mt-2 font-bold uppercase tracking-wider">{subValue}</p>
    </div>
  </div>
);

const TicketModal = ({ ticket, onClose }) => {
  if (!ticket) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4" onClick={onClose}>
      <div className="bg-[#172035]/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border-white/20 shadow-[0_40px_100px_rgba(0,0,0,0.8)]" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-white/10 bg-white/[0.02] flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <Receipt size={28} />
              </div>
              <div>
                <h3 className="text-3xl font-black tracking-tighter uppercase leading-none">ORDEN #{ticket.number}</h3>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4" onClick={onClose}>
      <div className="bg-[#172035]/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border-white/20 shadow-[0_40px_100px_rgba(56,189,248,0.2)]" onClick={e => e.stopPropagation()}>
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
  const [closures, setClosures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showInvitationsModal, setShowInvitationsModal] = useState(false);
  
  // Local/Restaurant states
  const [locals, setLocals] = useState([]);
  const [selectedLocal, setSelectedLocal] = useState('all');
  
  // Filter states
  const [dateRange, setDateRange] = useState('today');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentPage, setCurrentPage] = useState(1);
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
      const [kpiRes, trendRes, hourRes, ticketRes, invRes, closureRes] = await Promise.all([
        dashboardService.getKpiSummary(start, end, selectedLocal),
        dashboardService.getRevenueTrends(start, end, selectedLocal),
        dashboardService.getHourlyDistribution(start, end, selectedLocal),
        dashboardService.getRecentTickets(currentPage, ticketsLimit, start, end, selectedLocal),
        dashboardService.getInvitationDetails(start, end, selectedLocal),
        dashboardService.getClosures(start, end, selectedLocal)
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
      setClosures(closureRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocals();
  }, []);

  useEffect(() => {
    fetchData();
  }, [dateRange, startDate, endDate, currentPage, ticketsLimit, selectedLocal]);

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

  const hrStats = getHourlyStats();

  const renderDashboard = () => (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card title="Ingresos Brutos" value={formatEuro(kpis?.today_revenue)} subValue={dateRange === 'today' ? `Ayer: ${formatEuro(kpis?.yesterday_revenue)}` : 'Periodo Filtrado'} icon={DollarSign} trend={dateRange==='today' ? 'up' : null} trendValue={kpis?.revenue_growth} />
        <Card title="Nº Clientes" value={formatNumber(kpis?.total_guests_today)} subValue="Comensales Totales" icon={Users} />
        <Card title="Tk. Medio (Pax)" value={formatEuro(kpis?.avg_ticket_pax)} subValue="Promedio por persona" icon={TrendingUp} />
        <Card title="Tk. Medio (Mesa)" value={formatEuro(kpis?.avg_ticket_table)} subValue="Promedio por ticket" icon={Receipt} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-[#172035]/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl p-6 h-[450px]">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-8 flex items-center gap-3">
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
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={9} fontWeight="900" tickLine={false} axisLine={false} dy={15} />
              <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} fontWeight="900" tickLine={false} axisLine={false} tickFormatter={(v)=>`${formatNumber(v)}€`} />
              <Tooltip contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '16px', fontSize: '11px', fontWeight: '900' }} formatter={(v)=>formatEuro(v)} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={5} fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#172035]/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl p-6 bg-gradient-to-br from-primary/40 to-background border-indigo-500/30 relative overflow-hidden group shadow-[0_20px_50px_rgba(255,50,50,0.15)] flex flex-col justify-center">
          <div className="relative z-10">
            <div className="bg-white/10 w-10 h-10 rounded-xl flex items-center justify-center mb-6 text-white border border-white/20 shadow-2xl backdrop-blur-md">
              <Gift size={20} />
            </div>
            <h3 className="text-3xl font-black tracking-tighter mb-1 leading-none">{formatEuro(kpis?.total_invitations)}</h3>
            <p className="text-xs text-slate-300 font-black mb-6 uppercase tracking-wider">Total en Invitaciones</p>
            <button 
              onClick={() => setShowInvitationsModal(true)}
              className="w-full bg-white text-black py-4 rounded-xl font-black text-xs uppercase tracking-wider shadow-2xl hover:bg-indigo-600 hover:text-white hover:scale-105 transition-all duration-300"
            >
              Ver Desglose
            </button>
          </div>
          <div className="absolute -right-16 -bottom-16 opacity-[0.07] group-hover:rotate-12 group-hover:scale-110 transition-transform duration-1000">
            <DollarSign size={240} />
          </div>
        </div>
      </div>
    </div>
  );

  const renderHours = () => (
    <div className="flex flex-col gap-8 h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Hora Pico (Ventas)" value={hrStats.peakHour} subValue={`${formatEuro(hrStats.peakRevenue)} generados`} icon={TrendingUp} />
        <Card title="Total Comensales" value={formatNumber(hrStats.totalGuests)} subValue="En el periodo seleccionado" icon={Users} />
        <Card title="Media por Hora Activa" value={`${hrStats.avgGuests} Pax`} subValue="Promedio de comensales/hora" icon={Clock} />
      </div>

      <div className="bg-[#172035]/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl p-6 flex flex-col">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-10 flex items-center gap-3">
          <Clock size={14} className="text-indigo-400" />
          Rendimiento Horario
        </h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={hourly} margin={{ top: 20, right: 20, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="hour" stroke="rgba(255,255,255,0.2)" fontSize={11} fontWeight="900" tickLine={false} axisLine={false} dy={20} />
              <YAxis yAxisId="rev" stroke="rgba(255,255,255,0.2)" fontSize={11} fontWeight="900" tickLine={false} axisLine={false} tickFormatter={(v)=>`${formatNumber(v)}€`} />
              <YAxis yAxisId="qty" orientation="right" stroke="rgba(255,255,255,0.2)" fontSize={11} fontWeight="900" tickLine={false} axisLine={false} />
              
              <Tooltip 
                cursor={{fill: 'rgba(255,255,255,0.02)'}}
                contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}
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
      <div className="bg-[#172035]/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl p-6 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
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
              <tr className="text-slate-400 text-xs font-black uppercase tracking-wider border-b border-white/10">
                <th className="pb-4 pl-4">Mesa</th>
                <th className="pb-4">Hora</th>
                <th className="pb-4">Orden</th>
                <th className="pb-4 text-right pr-12">Total</th>
                <th className="pb-4 text-center">Ver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tks.map((t) => (
                <tr key={t.id} className="hover:bg-white/[0.03] transition-all group cursor-pointer" onClick={() => setSelectedTicket(t)}>
                  <td className="py-4 pl-4">
                    <span className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 px-3 py-1 rounded-lg font-black text-xs border border-indigo-500/30 group-hover:bg-indigo-600 group-hover:text-white transition-all uppercase">{t.table}</span>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderClosures = () => (
    <div className="bg-[#172035]/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl p-6 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className="text-lg font-black uppercase tracking-tighter flex items-center gap-3">
            <LayoutDashboard size={20} className="text-indigo-400" />
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
            <tr className="text-slate-400 text-xs font-black uppercase tracking-wider">
              <th className="pb-4 pl-4">Local</th>
              <th className="pb-4">Fecha Cierre</th>
              <th className="pb-4">Responsable</th>
              <th className="pb-4 text-right">Tickets</th>
              <th className="pb-4 text-right">Total Sistema</th>
              <th className="pb-4 text-right pr-6">Descuadre</th>
            </tr>
          </thead>
          <tbody>
            {closures.length > 0 ? (
              closures.map((c) => (
                <tr key={c.id} className="bg-white/[0.02] hover:bg-white/[0.05] transition-all group rounded-2xl">
                  <td className="py-4 pl-4 rounded-l-2xl">
                    <span className="text-xs font-black uppercase text-indigo-400">{c.local}</span>
                  </td>
                  <td className="py-4 text-slate-200 text-xs font-black">{c.date}</td>
                  <td className="py-4 text-slate-400 text-xs font-black uppercase">{c.employee}</td>
                  <td className="py-4 text-right text-xs font-black">{c.tickets}</td>
                  <td className="py-4 text-right font-black text-white">{formatEuro(c.sales)}</td>
                  <td className={`py-4 text-right pr-6 font-black rounded-r-2xl ${
                    c.difference === 0 ? 'text-emerald-400' : 
                    c.difference < 0 ? 'text-rose-500' : 'text-amber-400'
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
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-slate-200 flex flex-col relative ">
      {/* Top Navbar */}
      <nav className="h-16 bg-[#172035]/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl rounded-none border-x-0 border-t-0 px-8 flex items-center justify-between z-20 sticky top-0 border-white/10 shadow-xl">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20">
              {locals.find(l => l.Id === selectedLocal)?.Name?.charAt(0) || 'D'}
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-white leading-none">DUBES</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Analytics Pro</p>
            </div>
          </div>
          
          <div className="h-8 w-px bg-white/10 mx-2"></div>

          {/* Restaurant Selector */}
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
            <button 
              onClick={() => setSelectedLocal('all')}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${selectedLocal === 'all' ? 'bg-white text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Todos
            </button>
            {locals.map(local => (
              <button 
                key={local.Id}
                onClick={() => setSelectedLocal(local.Id)}
                className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${selectedLocal === local.Id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                {local.Name}
              </button>
            ))}
          </div>

          <div className="hidden xl:flex items-center gap-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'hours', label: 'Horarios', icon: Clock },
              { id: 'tickets', label: 'Tickets', icon: Receipt },
              { id: 'closures', label: 'Cierres', icon: FileText }
            ].map((item) => (
              <button 
                key={item.id} onClick={() => setActiveTab(item.id)} 
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all ${activeTab === item.id ? 'bg-white/10 text-indigo-400 font-black' : 'text-slate-400 hover:text-white hover:bg-white/5 font-bold'}`}
              >
                <item.icon size={16} strokeWidth={activeTab === item.id ? 3 : 2} />
                <span className="text-xs uppercase tracking-wider">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 bg-white/5 p-1 rounded-2xl border border-white/10 pr-4">
            <div className="gap-1 flex">
              {['today', 'week', 'month', 'custom'].map(r => (
                <button 
                  key={r} onClick={() => setDateRange(r)}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${dateRange === r ? 'bg-indigo-500/30 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-white'}`}
                >
                  {r === 'today' ? 'Hoy' : r === 'week' ? 'Semana' : r === 'month' ? 'Mes' : 'Custom'}
                </button>
              ))}
            </div>
            
            <div className="h-4 w-px bg-white/10"></div>
            
            <div className="flex items-center gap-2">
              <Calendar size={12} className="text-slate-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-300">{getCurrentPeriodLabel()}</span>
            </div>
          </div>

          {dateRange === 'custom' && (
            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10 animate-in fade-in slide-in-from-right-4 duration-300">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-xs font-black uppercase text-white p-2 outline-none" />
              <ArrowRight size={12} className="text-slate-400" />
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-xs font-black uppercase text-white p-2 outline-none" />
            </div>
          )}
          
          <button onClick={fetchData} className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg px-4 py-2 rounded-xl transition-all !p-2.5">
            <Search size={16} strokeWidth={3} />
          </button>
        </div>
      </nav>

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
            {activeTab === 'hours' && renderHours()}
            {activeTab === 'tickets' && renderTickets()}
            {activeTab === 'closures' && renderClosures()}
          </div>
        )}
      </main>

      <InvitationsModal 
        isOpen={showInvitationsModal} 
        invitations={invitationsDetails} 
        onClose={() => setShowInvitationsModal(false)} 
      />

      <TicketModal 
        ticket={selectedTicket} 
        onClose={() => setSelectedTicket(null)} 
      />
    </div>
  );
};

export default DubesDashboard;
