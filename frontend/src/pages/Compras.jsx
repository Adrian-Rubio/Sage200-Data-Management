import { useState, useEffect } from 'react';
import { fetchPurchasesDashboard, fetchFilterOptions } from '../services/api';
import { Link } from 'react-router-dom';
import { KpiCard } from '../components/dashboard/KpiCard';
import { PurchasesCarousel } from '../components/dashboard/PurchasesCarousel';
import { DivisionPurchasesTable } from '../components/dashboard/DivisionPurchasesTable';
import useAuthStore from '../store/authStore';
import { PageHeader } from '../components/common/PageHeader';

export default function ComprasDashboard() {
    const { user, logoutUser } = useAuthStore();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [options, setOptions] = useState({ companies: [] });

    const currentYear = new Date().getFullYear();
    const [filters, setFilters] = useState(() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        return {
            exercise: currentYear,
            company_id: '',
            provider_id: '',
            start_date: firstDay.toISOString().split('T')[0],
            end_date: lastDay.toISOString().split('T')[0]
        };
    });

    useEffect(() => {
        loadFilters();
    }, []);

    useEffect(() => {
        loadDashboard();
    }, [filters]);

    const loadFilters = async () => {
        try {
            const opts = await fetchFilterOptions();
            setOptions(opts || { companies: [] });
        } catch (e) {
            console.error("Failed to load filters", e);
        }
    };

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const result = await fetchPurchasesDashboard(filters);
            setData(result);
        } catch (err) {
            setError("Error cargando el dashboard de compras.");
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value || '' }));
    };

    return (
        <div className="w-full min-h-screen bg-[#f8fafc] dark:bg-slate-950 p-6 text-gray-800 dark:text-slate-100 font-sans flex flex-col transition-colors">
            <PageHeader moduleName="Compras" onRefresh={loadDashboard} />

            {/* Filters Bar - Balanced */}
            <div className="bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 mb-6 flex flex-wrap gap-6 items-end transition-colors">
                <div className="flex flex-col">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ejercicio</label>
                    <select name="exercise" value={filters.exercise} onChange={handleFilterChange} className="block w-28 rounded-xl border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 shadow-sm focus:border-indigo-500 focus:ring-0 text-xs p-2.5 font-bold text-slate-700 dark:text-slate-200">
                        {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Empresa</label>
                    <select name="company_id" value={filters.company_id} onChange={handleFilterChange} className="block w-40 rounded-xl border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 shadow-sm focus:border-indigo-500 focus:ring-0 text-xs p-2.5 font-bold text-slate-700 dark:text-slate-200">
                        <option value="">Todas</option>
                        {options.companies?.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Proveedor</label>
                    <input
                        type="text"
                        name="provider_id"
                        placeholder="Nombre o ID..."
                        value={filters.provider_id}
                        onChange={handleFilterChange}
                        className="block w-48 rounded-xl border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 shadow-sm focus:border-indigo-500 focus:ring-0 text-xs p-2.5 font-bold text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Desde</label>
                    <input
                        type="date"
                        name="start_date"
                        value={filters.start_date}
                        onChange={handleFilterChange}
                        className="block w-36 rounded-xl border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 shadow-sm focus:border-indigo-500 focus:ring-0 text-xs p-2.5 font-bold text-slate-700 dark:text-slate-200"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Hasta</label>
                    <input
                        type="date"
                        name="end_date"
                        value={filters.end_date}
                        onChange={handleFilterChange}
                        className="block w-36 rounded-xl border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 shadow-sm focus:border-indigo-500 focus:ring-0 text-xs p-2.5 font-bold text-slate-700 dark:text-slate-200"
                    />
                </div>
                <div className="ml-auto flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Online</span>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></div>
                        </div>
                    </div>
                </div>
            ) : error ? (
                <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-8 rounded-2xl border border-red-100 dark:border-red-900/50 text-center font-bold shadow-sm">
                    {error}
                </div>
            ) : (
                <div className="flex flex-col">
                    {/* KPI Cards - Prominent but efficient */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-center items-center text-center hover:shadow-md transition-all">
                            <h3 className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-center w-full">Total Compras</h3>
                            <p className="text-3xl font-black text-slate-800 dark:text-slate-100">
                                {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(data?.kpis?.total_purchases || 0)}
                            </p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-center items-center text-center hover:shadow-md transition-all">
                            <h3 className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-center w-full">Proveedor Principal</h3>
                            <p className="text-xl font-black text-slate-800 dark:text-slate-100 truncate w-full px-4" title={data?.kpis?.top_provider}>
                                {data?.kpis?.top_provider || 'N/A'}
                            </p>
                        </div>
                        <div className="bg-indigo-600 rounded-2xl px-6 py-5 shadow-lg flex justify-between items-center text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" /></svg>
                            </div>
                            <div className="z-10">
                                <h3 className="text-indigo-100 text-[10px] font-black uppercase tracking-widest leading-none mb-2">Control Activo</h3>
                                <p className="text-lg font-black tracking-tight">Pedidos Pendientes</p>
                            </div>
                            <Link to="/compras/pedidos-pendientes" className="z-10 bg-white text-indigo-600 hover:bg-indigo-50 transition-colors py-2 px-6 rounded-xl text-xs font-bold shadow-sm">
                                Gestionar →
                            </Link>
                        </div>
                        <div className="bg-emerald-600 rounded-2xl px-6 py-5 shadow-lg flex justify-between items-center text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2m-7 9h-2V7h-2v5H6v2h2v5h2v-5h2v-2z" /></svg>
                            </div>
                            <div className="z-10">
                                <h3 className="text-emerald-100 text-[10px] font-black uppercase tracking-widest leading-none mb-2">Previsión</h3>
                                <p className="text-lg font-black tracking-tight">Aprovisionamiento</p>
                            </div>
                            <Link to="/compras/prevision-aprovisionamiento" className="z-10 bg-white text-emerald-600 hover:bg-emerald-50 transition-colors py-2 px-6 rounded-xl text-xs font-bold shadow-sm">
                                Previsión →
                            </Link>
                        </div>
                    </div>

                    {/* Main Visualization Area - Balanced height */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-800 relative overflow-hidden mb-6 transition-colors">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full -mr-16 -mt-16 pointer-events-none" />

                        <div className="h-[480px]">
                            <PurchasesCarousel
                                evolutionData={data?.evolution || []}
                                providersData={data?.top_providers || []}
                                articlesData={data?.top_articles || []}
                                subfamiliesData={data?.top_subfamilies || []}
                                divisionsData={data?.top_divisions || []}
                                repsData={data?.top_reps || []}
                            />
                        </div>
                    </div>

                    {/* Tabla de desglose por división */}
                    <DivisionPurchasesTable data={data?.division_table || []} />
                </div>
            )}
        </div>
    );
}
