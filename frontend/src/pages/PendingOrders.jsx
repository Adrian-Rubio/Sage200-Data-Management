import { useState, useEffect } from 'react';
import { fetchPendingOrders, fetchFilterOptions } from '../services/api';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

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
        <div className="w-full min-h-screen bg-[#dcfce7] p-6 text-gray-800">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-green-900 flex items-center gap-2">
                    <span className="bg-green-800 text-white p-2 rounded">CENVALSA</span>
                    Pedidos Pendientes
                </h1>
                <div className="flex gap-4">
                    <Link to="/" className="bg-white text-green-700 border border-green-600 px-4 py-2 rounded hover:bg-green-50 transition font-medium">
                        Dashboard Ventas
                    </Link>
                    <Link to="/comparison" className="bg-white text-green-700 border border-green-600 px-4 py-2 rounded hover:bg-green-50 transition font-medium">
                        Comparativa Anual
                    </Link>
                </div>
            </div>

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>
    );
}
