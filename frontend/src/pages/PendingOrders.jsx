import { useState, useEffect } from 'react';
import { fetchPendingOrders, fetchFilterOptions } from '../services/api';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { PageHeader } from '../components/common/PageHeader';

export default function PendingOrders() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [options, setOptions] = useState({ companies: [], reps: [], clients: [], series: [] });

    // Filters
    const [filters, setFilters] = useState({
        start_date: null,
        end_date: null,
        company_id: null,
        sales_rep_id: null,
        division: null
    });

    useEffect(() => {
        loadFilters();
    }, []);

    useEffect(() => {
        loadData();
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
            const result = await fetchPendingOrders(filters);
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

    return (
        <div className="w-full min-h-screen bg-[#f8fafc] p-6 text-gray-800">
            <PageHeader moduleName="Ventas Pendientes" onRefresh={loadData}>
                <Link to="/ventas" className="bg-white text-slate-600 border border-slate-200 px-3 py-1.5 rounded shadow-sm hover:bg-slate-50 transition font-bold text-xs h-[34px] flex items-center justify-center whitespace-nowrap">
                    Ventas
                </Link>
                <Link to="/comparison" className="bg-white text-slate-600 border border-slate-200 px-3 py-1.5 rounded shadow-sm hover:bg-slate-50 transition font-bold text-xs h-[34px] flex items-center justify-center whitespace-nowrap">
                    Comparativa
                </Link>
            </PageHeader>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4 items-end">
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Empresa</label>
                    <select name="company_id" value={filters.company_id || ''} onChange={handleFilterChange} className="block w-48 rounded-md border border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 text-gray-900 bg-white">
                        <option value="">Todas</option>
                        {options.companies.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">División</label>
                    <select name="division" value={filters.division || ''} onChange={handleFilterChange} className="block w-48 rounded-md border border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 text-gray-900 bg-white">
                        <option value="">Todas</option>
                        <option value="Conectrónica">Conectrónica</option>
                        <option value="Mecánica">Mecánica</option>
                        <option value="Informática Industrial">Informática Industrial</option>
                    </select>
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Comercial</label>
                    <select name="sales_rep_id" value={filters.sales_rep_id || ''} onChange={handleFilterChange} className="block w-48 rounded-md border border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 text-gray-900 bg-white">
                        <option value="">Todos</option>
                        {options.reps.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Top Section: KPIs + Main Chart */}
            <div className="bg-white p-6 rounded-lg shadow mb-6 relative">
                <div className="flex flex-col md:flex-row h-[450px]">
                    {/* Left KPI */}
                    <div className="md:w-1/6 flex flex-col justify-start pt-8 items-center z-10">
                        <h3 className="text-gray-600 font-medium text-lg mb-1">Pedidos totales</h3>
                        <p className="text-5xl font-bold text-gray-800">{data?.kpis?.total_orders || 0}</p>
                    </div>

                    {/* Center Chart */}
                    <div className="md:w-4/6 h-full">
                        <h3 className="text-xl font-bold text-gray-700 text-center mb-2">Importe de pedidos pendientes por Comisionista</h3>
                        <ResponsiveContainer width="100%" height="90%">
                            <BarChart data={data?.by_division} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="Division" tick={{ fontSize: 13, fontWeight: 600 }} />
                                <YAxis hide />
                                <Tooltip formatter={(val) => formatCurrency(val)} cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="PendingAmount" fill="#6ee7b7" radius={[4, 4, 0, 0]} barSize={120}>
                                    <LabelList dataKey="PendingAmount" position="top" formatter={(val) => `${(val / 1000).toFixed(0)} mil`} style={{ fontSize: '14px', fontWeight: 'bold', fill: '#6b7280' }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Right KPI */}
                    <div className="md:w-1/6 flex flex-col justify-start pt-8 items-center z-10">
                        <h3 className="text-gray-600 font-medium text-lg mb-1">Importe total</h3>
                        <p className="text-4xl font-bold text-gray-800">{formatCurrency(data?.kpis?.total_amount || 0)}</p>
                    </div>
                </div>
            </div>

            {/* Bottom Row Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* 2. Margen % */}
                <div className="bg-white p-6 rounded-lg shadow h-[400px]">
                    <h3 className="text-lg font-bold text-gray-700 text-center mb-6">Margen sobre venta total pedidos</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={data?.by_division} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="Division" tick={{ fontSize: 13, fontWeight: 600 }} />
                            <YAxis hide />
                            <Tooltip formatter={(val) => `${(val * 100).toFixed(2)}%`} cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="MarginPct" fill="#9ca3af" radius={[4, 4, 0, 0]} barSize={80}>
                                <LabelList dataKey="MarginPct" position="top" formatter={(val) => `${(val * 100).toFixed(2)}%`} style={{ fontSize: '14px', fontWeight: 'bold', fill: '#6b7280' }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* 3. Número Pedidos */}
                <div className="bg-white p-6 rounded-lg shadow h-[400px]">
                    <h3 className="text-lg font-bold text-gray-700 text-center mb-6">Número de pedidos por Comisionista</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={data?.by_division} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="Division" tick={{ fontSize: 13, fontWeight: 600 }} />
                            <YAxis hide />
                            <Tooltip cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="OrderCount" fill="#fca5a5" radius={[4, 4, 0, 0]} barSize={80}>
                                <LabelList dataKey="OrderCount" position="top" style={{ fontSize: '14px', fontWeight: 'bold', fill: '#6b7280' }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Detailed Orders Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-12">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-gray-700">Listado Detallado de Pedidos</h3>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold uppercase tracking-wider">
                        {data?.detailed_orders?.length || 0} Pedidos
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[11px] tracking-wider">
                            <tr>
                                <th className="px-6 py-3 border-b">Nº Pedido</th>
                                <th className="px-6 py-3 border-b">Cliente</th>
                                <th className="px-6 py-3 border-b">Comercial</th>
                                <th className="px-6 py-3 border-b">División</th>
                                <th className="px-6 py-3 border-b text-right">Importe</th>
                                <th className="px-6 py-3 border-b text-center">Unidades</th>
                                <th className="px-6 py-3 border-b text-right">Margen (%)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data?.detailed_orders?.map((order, i) => (
                                <tr key={i} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-900">{order.NumeroPedido}</td>
                                    <td className="px-6 py-4 text-gray-700">{order.Cliente}</td>
                                    <td className="px-6 py-4 text-gray-600">{order.Comisionista}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${order.Division === 'Conectrónica' ? 'bg-blue-100 text-blue-700' :
                                            order.Division === 'Mecánica' ? 'bg-orange-100 text-orange-700' :
                                                'bg-purple-100 text-purple-700'
                                            }`}>
                                            {order.Division}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(order.Importe)}</td>
                                    <td className="px-6 py-4 text-center text-gray-600">{order.Unidades.toLocaleString('es-ES')}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`font-bold ${order.MarginPct > 20 ? 'text-green-600' : order.MarginPct > 10 ? 'text-amber-600' : 'text-red-600'}`}>
                                            {order.MarginPct.toFixed(2)}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {(!data?.detailed_orders || data.detailed_orders.length === 0) && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-10 text-center text-gray-400 font-medium">
                                        No hay pedidos que coincidan con los filtros seleccionados
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
