import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { InventoryCarousel } from '../components/dashboard/InventoryCarousel';
import { DivisionInventoryTable } from '../components/dashboard/DivisionInventoryTable';
import { fetchInventoryDashboard } from '../services/api';
import useAuthStore from '../store/authStore';

export default function Inventario() {
    const { user, token, logoutUser } = useAuthStore();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        exercise: new Date().getFullYear(),
        period: new Date().getMonth() + 1, // Current month as default
        warehouse_id: ''
    });

    // Effect to sync filters once data is loaded (if backend chose a different latest period)
    useEffect(() => {
        if (data?.kpis?.period && data.kpis.period !== 'N/D') {
            const [p, e] = data.kpis.period.split('/');
            if (parseInt(e) !== filters.exercise || parseInt(p) !== filters.period) {
                setFilters(prev => ({ ...prev, exercise: parseInt(e), period: parseInt(p) }));
            }
        }
    }, [data]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const result = await fetchInventoryDashboard(filters);
            setData(result);
        } catch (error) {
            console.error("Error fetching inventory data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filters]);

    return (
        <div className="p-4 max-w-[1600px] mx-auto min-h-screen bg-[#f8fafc] text-gray-800 font-sans">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <span className="bg-slate-800 text-white px-3 py-1 rounded text-lg">CENVALSA</span>
                        Módulo de Inventario
                    </h1>
                </div>
                <div className="flex gap-3">
                    <span className="text-slate-600 font-medium text-sm flex items-center mr-2">{user?.sub || user?.username}</span>
                    <button onClick={logoutUser} className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-4 py-2 rounded shadow-sm transition font-medium text-sm h-[38px] flex items-center justify-center">
                        Cerrar Sesión
                    </button>
                    <Link to="/" className="bg-white text-slate-600 border border-slate-300 px-4 py-2 rounded shadow-sm hover:bg-slate-50 transition font-medium text-sm h-[38px] flex items-center justify-center">
                        Volver al Menú
                    </Link>
                    <button onClick={() => window.location.reload(true)} className="bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2 rounded shadow-sm hover:bg-blue-100 transition font-medium text-sm h-[38px] flex items-center justify-center">
                        Refrescar App
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4 items-end w-full border border-gray-100">
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1">Ejercicio</label>
                    <select
                        className="block w-32 rounded-md border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-xs p-2 text-gray-900 bg-white"
                        value={filters.exercise}
                        onChange={(e) => setFilters({ ...filters, exercise: parseInt(e.target.value) })}
                    >
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                    </select>
                </div>

                <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1">Periodo (Mes)</label>
                    <select
                        className="block w-40 rounded-md border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-xs p-2 text-gray-900 bg-white"
                        value={filters.period}
                        onChange={(e) => setFilters({ ...filters, period: parseInt(e.target.value) })}
                    >
                        <option value="0">Apertura (0)</option>
                        <option value="1">Enero (1)</option>
                        <option value="2">Febrero (2)</option>
                        <option value="3">Marzo (3)</option>
                        <option value="4">Abril (4)</option>
                        <option value="5">Mayo (5)</option>
                        <option value="6">Junio (6)</option>
                        <option value="7">Julio (7)</option>
                        <option value="8">Agosto (8)</option>
                        <option value="9">Septiembre (9)</option>
                        <option value="10">Octubre (10)</option>
                        <option value="11">Noviembre (11)</option>
                        <option value="12">Diciembre (12)</option>
                        <option value="13">Cierre (13)</option>
                    </select>
                </div>

                <div className="flex-grow text-right text-xs text-slate-400 font-medium">
                    Restringido a <span className="text-emerald-600 font-bold underline">Empresa 2 (Cenval S.L)</span>
                </div>
            </div>

            {loading ? (
                <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest animate-pulse">Analizando existencias...</p>
                </div>
            ) : (
                <div className="flex flex-col animate-fadeIn">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3">Valor Total de Stock</h3>
                            <p className="text-4xl font-black text-slate-800 tracking-tight">
                                {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(data?.kpis?.total_value || 0)}
                            </p>
                            <div className="mt-2 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Saldo Activo</div>
                        </div>

                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3">Existencias Totales</h3>
                            <p className="text-4xl font-black text-slate-800 tracking-tight">
                                {Math.round(data?.kpis?.total_units || 0).toLocaleString('es-ES')} <span className="text-lg text-slate-400">u.</span>
                            </p>
                            <div className="mt-2 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Unidades en Almacén</div>
                        </div>

                        <div className="bg-emerald-600 rounded-3xl p-8 shadow-xl flex flex-col justify-center items-center text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M20 7h-4V5l-2-2h-4L8 5v2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM10 5h4v2h-4V5zM4 9h16v11H4V9z" /></svg>
                            </div>
                            <div className="z-10 text-center">
                                <h3 className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mb-3">Estado de Inventario</h3>
                                <p className="text-2xl font-black tracking-tight mb-1">Periodo: {data?.kpis?.period || 'N/A'}</p>
                                <p className="text-emerald-200 text-xs font-medium">Actualizado con cierre mensual de Sage</p>
                            </div>
                        </div>
                    </div>

                    {/* Charts Area */}
                    <div className="bg-white p-8 rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden mb-10">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full -mr-24 -mt-24 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full -ml-16 -mb-16 pointer-events-none" />

                        <div className="h-[500px]">
                            <InventoryCarousel
                                evolutionData={data?.evolution || []}
                                divisionsData={data?.top_divisions || []}
                            />
                        </div>
                    </div>

                    {/* Details Table */}
                    <DivisionInventoryTable data={data?.inventory_table || []} />
                </div>
            )}
        </div>
    );
}
