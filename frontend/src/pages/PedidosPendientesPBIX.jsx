import { useState, useEffect } from 'react';
import { fetchPendingOrders, fetchFilterOptions } from '../services/api';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { KpiCard } from '../components/dashboard/KpiCard';
import useAuthStore from '../store/authStore';

export default function PedidosPendientesPBIX() {
    const { user, logoutUser } = useAuthStore();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [options, setOptions] = useState({ companies: [], reps: [], clients: [], series: [] });

    // PBIX specific filters
    const [selectedEndDate, setSelectedEndDate] = useState('');
    const [carouselIndex, setCarouselIndex] = useState(0);

    const hasManagePermission = user?.role === 'admin' || user?.permissions?.admin || user?.role_obj?.name === 'admin' || user?.role_obj?.can_manage_users;
    const isRestrictedToRep = !hasManagePermission && !!user?.sales_rep_id;
    const initialSalesRepId = isRestrictedToRep ? user?.sales_rep_id?.toUpperCase() : null;

    // Filters to send to API
    const [filters, setFilters] = useState({
        start_date: null,
        end_date: null,
        company_id: null,
        sales_rep_id: initialSalesRepId,
        division: null
    });

    const years = ['2023', '2024', '2025', '2026'];
    const months = [
        { id: '1', name: 'Enero' }, { id: '2', name: 'Febrero' }, { id: '3', name: 'Marzo' },
        { id: '4', name: 'Abril' }, { id: '5', name: 'Mayo' }, { id: '6', name: 'Junio' },
        { id: '7', name: 'Julio' }, { id: '8', name: 'Agosto' }, { id: '9', name: 'Septiembre' },
        { id: '10', name: 'Octubre' }, { id: '11', name: 'Noviembre' }, { id: '12', name: 'Diciembre' }
    ];

    useEffect(() => {
        loadFilters();
    }, []);

    useEffect(() => {
        // Update date filter based on single selected date
        setFilters(prev => ({
            ...prev,
            start_date: null, // Always search from beginning
            end_date: selectedEndDate || null
        }));
    }, [selectedEndDate]);

    useEffect(() => {
        if (!isRestrictedToRep || (isRestrictedToRep && filters.sales_rep_id)) {
            loadData();
        }
    }, [filters]);

    const loadFilters = async () => {
        try {
            const opts = await fetchFilterOptions();
            setOptions(opts || { companies: [], reps: [], clients: [], series: [] });
        } catch (e) {
            console.error("Failed to load filters", e);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            let result = await fetchPendingOrders(filters);
            if (result && result.by_division) {
                result.by_division = result.by_division.map(d => ({
                    ...d,
                    "Importe pendiente": d.PendingAmount,
                    "Margen": d.MarginPct,
                    "pedidos": d.OrderCount
                }));
            }
            setData(result);
        } catch (err) {
            setError("Error loading pending orders.");
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value || null }));
    };

    const formatCurrency = (val) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

    const getDivisionColor = (division) => {
        switch (division) {
            case 'Conectrónica': return { fill: '#10b981', label: '#065f46' }; // Emerald
            case 'Mecánica':
            case 'Sismecánica': return { fill: '#3b82f6', label: '#1e40af' }; // Blue
            case 'Informática Industrial':
            case 'I. Industrial': return { fill: '#8b5cf6', label: '#5b21b6' }; // Purple
            default: return { fill: '#94a3b8', label: '#334155' }; // Slate
        }
    };

    return (
        <div className="w-full min-h-screen bg-[#f8fafc] p-6 text-gray-800 font-sans">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <span className="bg-slate-800 text-white px-3 py-1 rounded">CENVALSA</span>
                    Pedidos Pendientes
                </h1>
                <div className="flex gap-4">
                    <Link to="/" className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 transition font-medium text-sm">
                        Menú Principal
                    </Link>
                    <Link to="/ventas" className="bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded hover:bg-slate-50 transition font-medium text-sm">
                        Dashboard Ventas
                    </Link>
                    <button onClick={logoutUser} className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded hover:bg-red-100 transition font-medium text-sm">
                        Cerrar Sesión
                    </button>
                </div>
            </div>

            {/* Filters Row */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-end">
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1">Pendientes Hasta:</label>
                    <input
                        type="date"
                        value={selectedEndDate}
                        onChange={(e) => setSelectedEndDate(e.target.value)}
                        className="block w-40 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-xs p-2 text-gray-900 bg-white"
                    />
                </div>
                <div className="h-8 border-r border-gray-200 mx-1" />
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1">Empresa</label>
                    <select name="company_id" value={filters.company_id || ''} onChange={handleFilterChange} className="block w-36 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-xs p-2 text-gray-900 bg-white">
                        <option value="">Todas</option>
                        {options.companies.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1">División</label>
                    <select name="division" value={filters.division || ''} onChange={handleFilterChange} className="block w-40 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-xs p-2 text-gray-900 bg-white">
                        <option value="">Todas</option>
                        <option value="Conectrónica">Conectrónica</option>
                        <option value="Sismecánica">Sismecánica</option>
                        <option value="Informática Industrial">Informática Industrial</option>
                    </select>
                </div>
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1">Comercial</label>
                    <select
                        name="sales_rep_id"
                        value={filters.sales_rep_id || ''}
                        onChange={handleFilterChange}
                        disabled={isRestrictedToRep}
                        className={`block w-44 rounded-md border border-gray-300 shadow-sm sm:text-xs p-2 ${isRestrictedToRep ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white'}`}
                    >
                        {!isRestrictedToRep && <option value="">Todos</option>}
                        {options.reps.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Row 1: KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <KpiCard title="Pedidos" value={data?.kpis?.total_orders || 0} subtext="Nº Total" />
                <KpiCard title="Imp. Pendiente" value={data?.kpis?.total_amount || 0} subtext="Importe Total" isWarning={true} />
                <KpiCard title="Margen Pdte." value={data?.kpis?.global_margin_pct || 0} subtext="Global" isPercentage={true} />
                <KpiCard title="Unidades" value={data?.kpis?.total_units || 0} subtext="Pendientes" />
            </div>

            {/* Row 2: Consolidated Carousel for all charts */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 h-[600px] relative group mb-6">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-3 z-10 bg-slate-50 px-4 py-2 rounded-full border border-gray-100 shadow-sm">
                    {[0, 1, 2].map((idx) => (
                        <button
                            key={idx}
                            onClick={() => setCarouselIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === carouselIndex ? 'bg-slate-800 w-8' : 'bg-slate-300 hover:bg-slate-400'}`}
                        />
                    ))}
                </div>

                <div className="absolute top-4 right-8 flex items-center gap-6">
                    <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-sm bg-[#10b981]"></div>
                            <span className="text-slate-500">Conectrónica</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-sm bg-[#3b82f6]"></div>
                            <span className="text-slate-500">Mecánica</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-sm bg-[#8b5cf6]"></div>
                            <span className="text-slate-500">I. Industrial</span>
                        </div>
                    </div>
                    <div className="bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded">
                        {carouselIndex + 1} / 3
                    </div>
                </div>

                <div className="w-full h-full pt-12">
                    {carouselIndex === 0 ? (
                        <>
                            <h3 className="text-xl font-bold text-slate-700 text-center mb-6">Importe pendiente por División</h3>
                            <ResponsiveContainer width="100%" height="90%">
                                <BarChart data={data?.by_division} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="Division" tick={{ fontSize: 13, fontWeight: 600, fill: '#374151' }} axisLine={false} tickLine={false} />
                                    <YAxis hide />
                                    <Tooltip
                                        formatter={(val) => formatCurrency(val)}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="Importe pendiente" radius={[6, 6, 0, 0]} barSize={120}>
                                        {data?.by_division?.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={getDivisionColor(entry.Division).fill} />
                                        ))}
                                        <LabelList
                                            dataKey="Importe pendiente"
                                            position="top"
                                            formatter={(val) => `${(val / 1000).toFixed(0)}k€`}
                                            style={{ fontSize: '14px', fontWeight: '800', fill: '#1e40af' }}
                                        />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </>
                    ) : carouselIndex === 1 ? (
                        <>
                            <h3 className="text-xl font-bold text-slate-700 text-center mb-6">Margen por División</h3>
                            <ResponsiveContainer width="100%" height="90%">
                                <BarChart data={data?.by_division} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="Division" tick={{ fontSize: 13, fontWeight: 600, fill: '#374151' }} axisLine={false} tickLine={false} />
                                    <YAxis hide />
                                    <Tooltip formatter={(val) => `${(val * 100).toFixed(1)}%`} />
                                    <Bar dataKey="Margen" radius={[6, 6, 0, 0]} barSize={100}>
                                        {data?.by_division?.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={getDivisionColor(entry.Division).fill} />
                                        ))}
                                        <LabelList
                                            dataKey="Margen"
                                            position="top"
                                            formatter={(val) => `${(val * 100).toFixed(1)}%`}
                                            style={{ fontSize: '14px', fontWeight: '800', fill: '#065f46' }}
                                        />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </>
                    ) : (
                        <>
                            <h3 className="text-xl font-bold text-slate-700 text-center mb-6">Número de Pedidos por División</h3>
                            <ResponsiveContainer width="100%" height="90%">
                                <BarChart data={data?.by_division} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="Division" tick={{ fontSize: 13, fontWeight: 600, fill: '#374151' }} axisLine={false} tickLine={false} />
                                    <YAxis hide />
                                    <Tooltip />
                                    <Bar dataKey="pedidos" radius={[6, 6, 0, 0]} barSize={100}>
                                        {data?.by_division?.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={getDivisionColor(entry.Division).fill} />
                                        ))}
                                        <LabelList
                                            dataKey="pedidos"
                                            position="top"
                                            style={{ fontSize: '14px', fontWeight: '800', fill: '#92400e' }}
                                        />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </>
                    )}
                </div>

                {/* Arrow Controls */}
                <button
                    onClick={() => setCarouselIndex(prev => (prev - 1 + 3) % 3)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-50 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity border border-gray-100 hover:bg-white hover:text-slate-800"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button
                    onClick={() => setCarouselIndex(prev => (prev + 1) % 3)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-50 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity border border-gray-100 hover:bg-white hover:text-slate-800"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>
        </div>
    );
}
