import { useState, useEffect } from 'react';
import { fetchPendingOrders, fetchFilterOptions } from '../services/api';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { KpiCard } from '../components/dashboard/KpiCard';
import useAuthStore from '../store/authStore';
import { PageHeader } from '../components/common/PageHeader';

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
        <div className="w-full min-h-screen bg-[#f8fafc] dark:bg-slate-950 p-6 text-gray-800 dark:text-slate-200 font-sans transition-colors">
            <PageHeader moduleName="Pedidos Pendientes (Vista PBIX)" onRefresh={loadData}>
                <Link to="/ventas" className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition font-bold text-xs h-[34px] flex items-center justify-center whitespace-nowrap">
                    Ventas
                </Link>
            </PageHeader>

            {/* Filters Row */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-slate-800 mb-6 flex flex-wrap gap-4 items-end transition-colors">
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1 transition-colors">Pendientes Hasta:</label>
                    <input
                        type="date"
                        value={selectedEndDate}
                        onChange={(e) => setSelectedEndDate(e.target.value)}
                        className="block w-40 rounded-md border border-gray-300 dark:border-slate-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-xs p-2 text-gray-900 dark:text-slate-200 bg-white dark:bg-slate-800 transition-colors"
                    />
                </div>
                <div className="h-8 border-r border-gray-200 dark:border-slate-700 mx-1 transition-colors" />
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1 transition-colors">Empresa</label>
                    <select name="company_id" value={filters.company_id || ''} onChange={handleFilterChange} className="block w-36 rounded-md border border-gray-300 dark:border-slate-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-xs p-2 text-gray-900 dark:text-slate-200 bg-white dark:bg-slate-800 transition-colors">
                        <option value="">Todas</option>
                        {options.companies.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1 transition-colors">División</label>
                    <select name="division" value={filters.division || ''} onChange={handleFilterChange} className="block w-40 rounded-md border border-gray-300 dark:border-slate-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-xs p-2 text-gray-900 dark:text-slate-200 bg-white dark:bg-slate-800 transition-colors">
                        <option value="">Todas</option>
                        <option value="Conectrónica">Conectrónica</option>
                        <option value="Sismecánica">Sismecánica</option>
                        <option value="Informática Industrial">Informática Industrial</option>
                    </select>
                </div>
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1 transition-colors">Comercial</label>
                    <select
                        name="sales_rep_id"
                        value={filters.sales_rep_id || ''}
                        onChange={handleFilterChange}
                        disabled={isRestrictedToRep}
                        className={`block w-44 rounded-md border border-gray-300 dark:border-slate-700 shadow-sm sm:text-xs p-2 transition-colors ${isRestrictedToRep ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 cursor-not-allowed' : 'focus:border-blue-500 focus:ring-blue-500 text-gray-900 dark:text-slate-200 bg-white dark:bg-slate-800'}`}
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
            <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 h-[600px] relative group mb-6 transition-colors">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-3 z-10 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-full border border-gray-100 dark:border-slate-700 shadow-sm transition-colors">
                    {[0, 1, 2].map((idx) => (
                        <button
                            key={idx}
                            onClick={() => setCarouselIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === carouselIndex ? 'bg-slate-800 dark:bg-slate-200 w-8' : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'}`}
                        />
                    ))}
                </div>

                <div className="absolute top-4 right-8 flex items-center gap-6">
                    <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-sm bg-[#10b981]"></div>
                            <span className="text-slate-500 dark:text-slate-400 transition-colors">Conectrónica</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-sm bg-[#3b82f6]"></div>
                            <span className="text-slate-500 dark:text-slate-400 transition-colors">Mecánica</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-sm bg-[#8b5cf6]"></div>
                            <span className="text-slate-500 dark:text-slate-400 transition-colors">I. Industrial</span>
                        </div>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded transition-colors">
                        {carouselIndex + 1} / 3
                    </div>
                </div>

                <div className="w-full h-full pt-12">
                    {carouselIndex === 0 ? (
                        <>
                            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 text-center mb-6 transition-colors">Importe pendiente por División</h3>
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
                                            formatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}M€` : `${(val / 1000).toFixed(0)}k€`}
                                            style={{ fontSize: '14px', fontWeight: '800', fill: '#1e40af' }}
                                        />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </>
                    ) : carouselIndex === 1 ? (
                        <>
                            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 text-center mb-6 transition-colors">Margen por División</h3>
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
                            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 text-center mb-6 transition-colors">Número de Pedidos por División</h3>
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
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-all border border-gray-100 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-300"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button
                    onClick={() => setCarouselIndex(prev => (prev + 1) % 3)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-all border border-gray-100 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-300"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>

            {/* Row 3: Detailed Orders Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden mb-12 transition-colors">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 transition-colors">
                    <h3 className="font-bold text-slate-700 dark:text-slate-300">Listado Detallado de Pedidos</h3>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded font-bold uppercase tracking-wider transition-colors">
                        {data?.detailed_orders?.length || 0} Pedidos
                    </span>
                </div>
                <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-[#fcfdff] dark:bg-slate-950 text-gray-500 dark:text-gray-400 font-bold uppercase text-[9px] tracking-wider sticky top-0 z-10 transition-colors">
                            <tr>
                                <th className="px-4 py-3 border-b dark:border-slate-800">Nº Pedido</th>
                                <th className="px-4 py-3 border-b dark:border-slate-800">Cliente</th>
                                <th className="px-4 py-3 border-b dark:border-slate-800">Comercial</th>
                                <th className="px-4 py-3 border-b dark:border-slate-800">División</th>
                                <th className="px-4 py-3 border-b dark:border-slate-800 text-right">Importe</th>
                                <th className="px-4 py-3 border-b dark:border-slate-800 text-center">Unidades</th>
                                <th className="px-4 py-3 border-b dark:border-slate-800 text-right">Margen (%)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50 transition-colors">
                            {data?.detailed_orders?.map((order, i) => (
                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-4 py-4 font-bold text-slate-800 dark:text-slate-200 transition-colors">{order.NumeroPedido}</td>
                                    <td className="px-4 py-4 text-slate-600 dark:text-slate-400 max-w-[250px] truncate transition-colors" title={order.Cliente}>{order.Cliente}</td>
                                    <td className="px-4 py-4 text-slate-500 dark:text-slate-500 transition-colors">{order.Comisionista}</td>
                                    <td className="px-4 py-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition-colors ${order.Division === 'Conectrónica' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                                            order.Division === 'Mecánica' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                                'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                                            }`}>
                                            {order.Division}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-right font-bold text-slate-800 dark:text-slate-200 transition-colors">{formatCurrency(order.Importe)}</td>
                                    <td className="px-4 py-4 text-center text-slate-500 dark:text-slate-500 transition-colors">{order.Unidades.toLocaleString('es-ES')}</td>
                                    <td className="px-4 py-4 text-right">
                                        <span className={`font-bold transition-colors ${order.MarginPct > 20 ? 'text-emerald-600 dark:text-emerald-400' : order.MarginPct > 10 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400'}`}>
                                            {order.MarginPct.toFixed(2)}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {(!data?.detailed_orders || data.detailed_orders.length === 0) && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-10 text-center text-gray-400 dark:text-gray-500 transition-colors">
                                        No hay pedidos para el periodo o filtros seleccionados
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
