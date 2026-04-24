import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, Label
} from 'recharts';
import { 
    Calendar, 
    Target, 
    Users, 
    Truck, 
    Factory, 
    ChevronDown, 
    Search,
    AlertCircle,
    TrendingUp,
    Clock,
    CheckCircle2
} from 'lucide-react';

const GaugeChart = ({ value, target, title, color }) => {
    const data = [
        { name: 'A Tiempo', value: value },
        { name: 'Retraso', value: Math.max(0, 100 - value) }
    ];

    const COLORS = [color, 'rgba(255, 255, 255, 0.05)'];

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-48 h-32">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="100%"
                            startAngle={180}
                            endAngle={0}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={0}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute bottom-0 left-0 right-0 text-center">
                    <span className="text-2xl font-bold text-white">{value.toFixed(1)}%</span>
                </div>
            </div>
            <div className="mt-2 text-center">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">{title}</span>
                <div className="flex items-center justify-center gap-1 mt-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
                    <span className="text-[10px] text-gray-500 font-bold">OBJETIVO: {target}%</span>
                </div>
            </div>
        </div>
    );
};

const KPICard = ({ title, total = 0, aTiempo = 0, icon: Icon, color, target = 80 }) => {
    const percentage = total > 0 ? (aTiempo / total) * 100 : 0;
    const isMet = percentage >= target;

    return (
        <div className="bg-[#1e2227]/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-10 group-hover:scale-110 transition-transform duration-500`} style={{ backgroundColor: color, borderRadius: '50%' }}></div>
            
            <div className="flex items-start justify-between relative z-10">
                <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">{title}</span>
                    <h3 className="text-3xl font-bold text-white mb-2">{percentage.toFixed(1)}%</h3>
                </div>
                <div className={`p-3 rounded-xl bg-opacity-20`} style={{ backgroundColor: color }}>
                    <Icon size={24} color={color} />
                </div>
            </div>

            <div className="flex items-end justify-between mt-4 relative z-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400">Total:</span>
                        <span className="text-white font-bold">{(total || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400">A Tiempo:</span>
                        <span className="text-emerald-400 font-bold">{(aTiempo || 0).toLocaleString()}</span>
                    </div>
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${isMet ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                    {isMet ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                    {isMet ? 'Objetivo Cumplido' : 'Bajo Objetivo'}
                </div>
            </div>
        </div>
    );
};

export default function EntregasTiempoPBIX() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(null);
    const [target, setTarget] = useState(80);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('clientes');

    const years = [2024, 2025, 2026];
    const months = [
        { id: 1, name: 'Enero' }, { id: 2, name: 'Febrero' }, { id: 3, name: 'Marzo' },
        { id: 4, name: 'Abril' }, { id: 5, name: 'Mayo' }, { id: 6, name: 'Junio' },
        { id: 7, name: 'Julio' }, { id: 8, name: 'Agosto' }, { id: 9, name: 'Septiembre' },
        { id: 10, name: 'Octubre' }, { id: 11, name: 'Noviembre' }, { id: 12, name: 'Diciembre' }
    ];
    const targets = Array.from({ length: 10 }, (_, i) => (i + 1) * 10);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = { year };
            if (month) params.month = month;
            const res = await api.get('/entregas/kpi-data', { params });
            setData(res.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [year, month]);

    const filteredDetails = useMemo(() => {
        if (!data) return [];
        const items = data.details[activeTab] || [];
        return items.filter(item => 
            item.label.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [data, activeTab, searchTerm]);

    return (
        <div className="min-h-screen bg-[#0f1115] text-gray-100 font-sans p-6 md:p-8">
            {/* Header */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20">
                        <TrendingUp size={28} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white">Entregas a Tiempo <span className="text-indigo-500">Cenvalsa Industrial</span></h1>
                        <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
                            <Clock size={14} /> Análisis de puntualidad logística y productiva
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Filtro Año */}
                    <div className="bg-[#1e2227] border border-white/5 rounded-xl px-4 py-2 flex items-center gap-3">
                        <Calendar size={16} className="text-gray-400" />
                        <select 
                            value={year} 
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="bg-transparent border-none outline-none text-sm font-bold text-white cursor-pointer"
                        >
                            {years.map(y => <option key={y} value={y} className="bg-[#1e2227]">{y}</option>)}
                        </select>
                    </div>

                    {/* Filtro Mes */}
                    <div className="bg-[#1e2227] border border-white/5 rounded-xl px-4 py-2 flex items-center gap-3">
                        <ChevronDown size={16} className="text-gray-400" />
                        <select 
                            value={month || ''} 
                            onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : null)}
                            className="bg-transparent border-none outline-none text-sm font-bold text-white cursor-pointer"
                        >
                            <option value="" className="bg-[#1e2227]">Todos los meses</option>
                            {months.map(m => <option key={m.id} value={m.id} className="bg-[#1e2227]">{m.name}</option>)}
                        </select>
                    </div>

                    {/* Filtro Objetivo */}
                    <div className="bg-indigo-600/20 border border-indigo-500/30 rounded-xl px-4 py-2 flex items-center gap-3">
                        <Target size={16} className="text-indigo-400" />
                        <select 
                            value={target} 
                            onChange={(e) => setTarget(Number(e.target.value))}
                            className="bg-transparent border-none outline-none text-sm font-bold text-indigo-400 cursor-pointer"
                        >
                            {targets.map(t => <option key={t} value={t} className="bg-[#1e2227]">{t}% Objetivo</option>)}
                        </select>
                    </div>
                </div>
            </header>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-[60vh]">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-400 animate-pulse font-bold tracking-widest uppercase text-xs">Sincronizando con Sage200...</p>
                </div>
            ) : (
                <>
                    {/* Top Grid: KPI Cards & Gauges */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        <KPICard 
                            title="Entregas a Clientes" 
                            total={data?.totals?.clientes?.total || 0} 
                            aTiempo={data?.totals?.clientes?.a_tiempo || 0} 
                            icon={Users} 
                            color="#10b981" 
                            target={target}
                        />
                        <KPICard 
                            title="Entregas de Proveedores" 
                            total={data?.totals?.proveedores?.total || 0} 
                            aTiempo={data?.totals?.proveedores?.a_tiempo || 0} 
                            icon={Truck} 
                            color="#3b82f6" 
                            target={target}
                        />
                        <KPICard 
                            title="Pedidos de Fabricación" 
                            total={data?.totals?.fabricacion?.total || 0} 
                            aTiempo={data?.totals?.fabricacion?.a_tiempo || 0} 
                            icon={Factory} 
                            color="#f59e0b" 
                            target={target}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
                        {/* Gauges Section */}
                        <div className="lg:col-span-1 bg-[#1e2227]/50 border border-white/5 rounded-3xl p-6 flex flex-col justify-around gap-8">
                            <GaugeChart 
                                value={data?.totals?.clientes?.total > 0 ? (data?.totals?.clientes?.a_tiempo / data?.totals?.clientes?.total) * 100 : 0} 
                                target={target} 
                                title="Clientes" 
                                color="#10b981" 
                            />
                            <GaugeChart 
                                value={data?.totals?.proveedores?.total > 0 ? (data?.totals?.proveedores?.a_tiempo / data?.totals?.proveedores?.total) * 100 : 0} 
                                target={target} 
                                title="Proveedores" 
                                color="#3b82f6" 
                            />
                            <GaugeChart 
                                value={data?.totals?.fabricacion?.total > 0 ? (data?.totals?.fabricacion?.a_tiempo / data?.totals?.fabricacion?.total) * 100 : 0} 
                                target={target} 
                                title="Fabricación" 
                                color="#f59e0b" 
                            />
                        </div>

                        {/* Detailed Table Section */}
                        <div className="lg:col-span-3 bg-[#1e2227]/50 border border-white/5 rounded-3xl overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-2 bg-[#0f1115] rounded-xl px-4 py-2 flex-1 max-w-md border border-white/5 focus-within:border-indigo-500 transition-colors">
                                    <Search size={16} className="text-gray-500" />
                                    <input 
                                        type="text" 
                                        placeholder={`Buscar en ${activeTab}...`} 
                                        className="bg-transparent border-none outline-none text-sm text-white w-full"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center bg-[#0f1115] p-1 rounded-xl border border-white/5">
                                    <button 
                                        onClick={() => setActiveTab('clientes')}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'clientes' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                                    >
                                        Clientes
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('proveedores')}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'proveedores' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                                    >
                                        Proveedores
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('fabricacion')}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'fabricacion' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                                    >
                                        Fabricación
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[#0f1115]/50">
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5">Identificador / Razón Social</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5 text-center">Total Pedidos</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5 text-center">A Tiempo</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5">Cumplimiento</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredDetails.length > 0 ? filteredDetails.map((item, idx) => {
                                            const pct = (item.a_tiempo / item.total) * 100;
                                            return (
                                                <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-medium text-gray-300 group-hover:text-white">{item.label}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="text-sm font-bold text-white">{item.total}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="text-sm font-bold text-emerald-400">{item.a_tiempo}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1 h-1.5 bg-[#0f1115] rounded-full overflow-hidden">
                                                                <div 
                                                                    className={`h-full transition-all duration-1000 ${pct >= target ? 'bg-emerald-500' : 'bg-red-500'}`} 
                                                                    style={{ width: `${pct}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className={`text-xs font-bold w-12 text-right ${pct >= target ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                {pct.toFixed(0)}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }) : (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-20 text-center text-gray-600 font-medium italic">
                                                    No se encontraron resultados para los filtros aplicados.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
