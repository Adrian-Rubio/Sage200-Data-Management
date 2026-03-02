import React, { useState, useEffect, useMemo, Fragment } from 'react';
import { Link } from 'react-router-dom';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, LabelList
} from 'recharts';
import { fetchAlmacenStats, fetchOperators } from '../services/api';
import { KpiCard } from '../components/dashboard/KpiCard';
import useAuthStore from '../store/authStore';

export default function Almacen() {
    const { logoutUser } = useAuthStore();
    const [data, setData] = useState({ kpis: {}, data: [], chart_data: [], operators: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [operators, setOperators] = useState([]);

    // Filters
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
    const [selectedOperator, setSelectedOperator] = useState('');
    const [carouselIndex, setCarouselIndex] = useState(0);
    const [expandedOperators, setExpandedOperators] = useState([]);

    const years = ['2023', '2024', '2025', '2026'];
    const monthsInfo = [
        { id: '1', name: 'Enero' }, { id: '2', name: 'Febrero' }, { id: '3', name: 'Marzo' },
        { id: '4', name: 'Abril' }, { id: '5', name: 'Mayo' }, { id: '6', name: 'Junio' },
        { id: '7', name: 'Julio' }, { id: '8', name: 'Agosto' }, { id: '9', name: 'Septiembre' },
        { id: '10', name: 'Octubre' }, { id: '11', name: 'Noviembre' }, { id: '12', name: 'Diciembre' }
    ];

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        loadStats();
    }, [selectedYear, selectedMonth, selectedOperator]);

    const loadInitialData = async () => {
        try {
            const ops = await fetchOperators();
            setOperators(ops);
        } catch (e) {
            console.error("Failed to load operators", e);
        }
    };

    const loadStats = async () => {
        setLoading(true);
        try {
            const filters = {
                year: selectedYear ? parseInt(selectedYear) : null,
                month: selectedMonth ? parseInt(selectedMonth) : null,
                operario_id: selectedOperator ? parseInt(selectedOperator) : null
            };
            const result = await fetchAlmacenStats(filters);

            // Prepare data for multi-metric chart
            // We need chart_data_lines and chart_data_units pivots
            // For simplicity, we use the existing chart_data if it contains the metric needed
            // Actually, the backend current pivot only returns 'count' (Pedidos).
            // Let's enhance chart_data processing in frontend if needed, but for now
            // let's assume we show Pedidos, and if we want Lines/Units we would need more data.
            // Wait, the backend pivot is: pivot_table(values='EjercicioAlbaran', aggfunc='count')

            setData(result);
            setError(null);
        } catch (err) {
            setError("Error al cargar las estadísticas de almacén.");
        } finally {
            setLoading(false);
        }
    };

    // Group data by operator for table and bar charts
    const groupedData = useMemo(() => {
        if (!data?.data) return [];

        const groups = {};
        data.data.forEach(row => {
            const op = row.NombreOperario;
            if (!groups[op]) {
                groups[op] = {
                    NombreOperario: op,
                    TotalPedidos: 0,
                    TotalLineas: 0,
                    TotalUnidades: 0,
                    details: []
                };
            }
            groups[op].TotalPedidos += row.Pedidos || 0;
            groups[op].TotalLineas += row.Lineas || 0;
            groups[op].TotalUnidades += row.Unidades || 0;
            groups[op].details.push(row);
        });

        return Object.values(groups).sort((a, b) => b.TotalPedidos - a.TotalPedidos);
    }, [data?.data]);

    const toggleOperator = (opName) => {
        setExpandedOperators(prev =>
            prev.includes(opName) ? prev.filter(n => n !== opName) : [...prev, opName]
        );
    };

    // Color palette for chart lines
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#475569'];

    return (
        <div className="w-full min-h-screen bg-[#f8fafc] p-6 text-gray-800 font-sans">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <span className="bg-[#f04a24] text-white px-3 py-1 rounded">CENVALSA</span>
                    Dashboard Almacén
                </h1>
                <div className="flex gap-4">
                    <Link to="/" className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 transition font-medium text-sm">
                        Menú Principal
                    </Link>
                    <button onClick={logoutUser} className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded hover:bg-red-100 transition font-medium text-sm">
                        Cerrar Sesión
                    </button>
                </div>
            </div>

            {/* Filters Row */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-end">
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1">Año</label>
                    <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="block w-28 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-xs p-2 text-gray-900 bg-white">
                        <option value="">Todos</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1">Mes</label>
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="block w-36 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-xs p-2 text-gray-900 bg-white">
                        <option value="">Todos</option>
                        {monthsInfo.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
                <div className="h-8 border-r border-gray-200 mx-1" />
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1">Operario</label>
                    <select value={selectedOperator} onChange={(e) => setSelectedOperator(e.target.value)} className="block w-48 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-xs p-2 text-gray-900 bg-white">
                        <option value="">Todos los operarios</option>
                        {operators.map(op => (
                            <option key={`${op.id}-${op.name}`} value={op.id}>{op.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
                </div>
            ) : error ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 text-center">
                    {error}
                </div>
            ) : (
                <>
                    {/* Row 1: KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <KpiCard title="Pedidos Preparados" value={data?.kpis?.total_pedidos || 0} subtext="Total en el periodo" />
                        <KpiCard title="Nº Líneas" value={data?.kpis?.total_lineas || 0} subtext="Lineas acumuladas" isWarning={true} />
                        <KpiCard title="Unidades" value={data?.kpis?.total_unidades || 0} subtext="Unidades totales" />
                    </div>

                    {/* Row 2: Grid for Carousel and Table side-by-side */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
                        {/* Carousel of Charts */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[650px] relative group overflow-hidden">
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-3 z-10 bg-slate-50 px-4 py-2 rounded-full border border-gray-100 shadow-sm">
                                {[0, 1, 2].map((idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCarouselIndex(idx)}
                                        className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === carouselIndex ? 'bg-slate-800 w-8' : 'bg-slate-300 hover:bg-slate-400'}`}
                                    />
                                ))}
                            </div>

                            <div className="absolute top-4 right-8 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded">
                                {carouselIndex + 1} / 3
                            </div>

                            <div className="w-full h-full pt-10">
                                {carouselIndex === 0 ? (
                                    <>
                                        <h3 className="text-lg font-bold text-slate-700 text-center mb-4">Evolución de Pedidos</h3>
                                        <ResponsiveContainer width="100%" height="90%">
                                            <LineChart data={data?.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                                <XAxis
                                                    dataKey="Fecha"
                                                    tick={{ fontSize: 10 }}
                                                    tickFormatter={(str) => str.split('-').slice(1).reverse().join('/')}
                                                />
                                                <YAxis tick={{ fontSize: 10 }} />
                                                <Tooltip />
                                                <Legend wrapperStyle={{ fontSize: '10px' }} />
                                                {data?.operators?.map((op, idx) => (
                                                    <Line
                                                        key={op}
                                                        type="monotone"
                                                        dataKey={op}
                                                        stroke={colors[idx % colors.length]}
                                                        strokeWidth={2}
                                                        dot={{ r: 3 }}
                                                    />
                                                ))}
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </>
                                ) : carouselIndex === 1 ? (
                                    <>
                                        <h3 className="text-lg font-bold text-slate-700 text-center mb-4">Líneas por Operario</h3>
                                        <ResponsiveContainer width="100%" height="90%">
                                            <BarChart data={groupedData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                                <XAxis dataKey="NombreOperario" tick={{ fontSize: 9, angle: -45, textAnchor: 'end' }} height={80} interval={0} />
                                                <YAxis tick={{ fontSize: 10 }} />
                                                <Tooltip />
                                                <Bar dataKey="TotalLineas" fill="#10b981" radius={[4, 4, 0, 0]}>
                                                    <LabelList dataKey="TotalLineas" position="top" style={{ fontSize: '9px', fontWeight: 'bold' }} />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="text-lg font-bold text-slate-700 text-center mb-4">Unidades por Operario</h3>
                                        <ResponsiveContainer width="100%" height="90%">
                                            <BarChart data={groupedData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                                <XAxis dataKey="NombreOperario" tick={{ fontSize: 9, angle: -45, textAnchor: 'end' }} height={80} interval={0} />
                                                <YAxis tick={{ fontSize: 10 }} />
                                                <Tooltip />
                                                <Bar dataKey="TotalUnidades" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                                                    <LabelList dataKey="TotalUnidades" position="top" style={{ fontSize: '9px', fontWeight: 'bold' }} />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </>
                                )}
                            </div>

                            {/* Arrow Controls */}
                            <button
                                onClick={() => setCarouselIndex(prev => (prev - 1 + 3) % 3)}
                                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-50 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity border border-gray-100 hover:bg-white hover:text-slate-800"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button
                                onClick={() => setCarouselIndex(prev => (prev + 1) % 3)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-50 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity border border-gray-100 hover:bg-white hover:text-slate-800"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>

                        {/* Grouped Table with Expandable Rows */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[650px]">
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-bold text-slate-700">Resumen por Operario</h3>
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-bold uppercase tracking-wider">
                                    {groupedData.length} Operarios
                                </span>
                            </div>
                            <div className="overflow-y-auto flex-1 custom-scrollbar">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-[#fcfdff] text-gray-500 font-bold uppercase text-[9px] tracking-wider sticky top-0 z-10">
                                        <tr>
                                            <th className="px-4 py-3 border-b w-8"></th>
                                            <th className="px-4 py-3 border-b">Operario</th>
                                            <th className="px-2 py-3 border-b text-center">Pedidos</th>
                                            <th className="px-2 py-3 border-b text-center">Líneas</th>
                                            <th className="px-2 py-3 border-b text-center">Unidades</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {groupedData.map((opGroup, i) => (
                                            <React.Fragment key={opGroup.NombreOperario}>
                                                <tr
                                                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                                                    onClick={() => toggleOperator(opGroup.NombreOperario)}
                                                >
                                                    <td className="px-4 py-4 text-center">
                                                        <span className={`inline-block transition-transform duration-200 ${expandedOperators.includes(opGroup.NombreOperario) ? 'rotate-90' : ''}`}>
                                                            ▶
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 font-bold text-slate-800">{opGroup.NombreOperario}</td>
                                                    <td className="px-2 py-4 text-center">
                                                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-black">
                                                            {opGroup.TotalPedidos}
                                                        </span>
                                                    </td>
                                                    <td className="px-2 py-4 text-center font-bold text-slate-600">{opGroup.TotalLineas.toLocaleString('es-ES')}</td>
                                                    <td className="px-2 py-4 text-center font-bold text-slate-600">{opGroup.TotalUnidades.toLocaleString('es-ES')}</td>
                                                </tr>
                                                {expandedOperators.includes(opGroup.NombreOperario) && (
                                                    <tr>
                                                        <td colSpan="5" className="bg-slate-50/30 p-0">
                                                            <div className="px-8 py-3 border-l-4 border-slate-200 ml-4">
                                                                <table className="w-full text-[10px] text-slate-500">
                                                                    <thead>
                                                                        <tr className="text-left border-b border-slate-200 font-bold text-slate-400">
                                                                            <th className="py-2">Mes / Día</th>
                                                                            <th className="py-2 text-center">Ped.</th>
                                                                            <th className="py-2 text-center">Lin.</th>
                                                                            <th className="py-2 text-center">Uni.</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {opGroup.details.map((detail, idx) => (
                                                                            <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-white transition-colors">
                                                                                <td className="py-2">
                                                                                    {monthsInfo.find(m => m.id === detail.Mes.toString())?.name} {detail.Dia}
                                                                                </td>
                                                                                <td className="py-2 text-center font-medium text-slate-600">{detail.Pedidos}</td>
                                                                                <td className="py-2 text-center">{detail.Lineas}</td>
                                                                                <td className="py-2 text-center">{detail.Unidades.toLocaleString('es-ES')}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                        {groupedData.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-10 text-center text-gray-400">
                                                    No hay datos para el periodo seleccionado
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
