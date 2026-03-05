import React, { useState, useEffect, Fragment } from 'react';
import { fetchFinancePnLDetailed } from '../services/api';
import { Link } from 'react-router-dom';
import { BarChart3, ChevronRight, ChevronDown, Home, Download, AlertCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';

export default function CuentaExplotacion() {
    const { logoutUser } = useAuthStore();
    const [treeData, setTreeData] = useState([]);
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedNodes, setExpandedNodes] = useState(new Set(['A', 'B']));

    const [filters, setFilters] = useState({
        year: 2026,
        month_from: 1, // Start month
        month_up_to: new Date().getMonth() + 1,
        company_id: '100' // Default to Cenval
    });

    const companies = [
        { id: '100', name: 'Grupo Cenval (100)' },
        { id: '2', name: 'Cenvalsa Industrial (2)' },
        { id: '4', name: 'D&M (4)' },
        { id: '6', name: 'Saratur (6)' }
    ];

    const months = [
        { id: 1, name: 'Enero' }, { id: 2, name: 'Febrero' }, { id: 3, name: 'Marzo' },
        { id: 4, name: 'Abril' }, { id: 5, name: 'Mayo' }, { id: 6, name: 'Junio' },
        { id: 7, name: 'Julio' }, { id: 8, name: 'Agosto' }, { id: 9, name: 'Septiembre' },
        { id: 10, name: 'Octubre' }, { id: 11, name: 'Noviembre' }, { id: 12, name: 'Diciembre' }
    ];

    useEffect(() => {
        loadData();
    }, [filters]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchFinancePnLDetailed(filters);
            setTreeData(res.tree);
            setSummary(res.summary);
        } catch (err) {
            setError("Error cargando la cuenta de explotación detallada.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const toggleNode = (id) => {
        const newSet = new Set(expandedNodes);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedNodes(newSet);
    };

    const formatCurrency = (val) => {
        if (val === undefined || val === null) return '-';
        return new Intl.NumberFormat('es-ES', {
            style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2
        }).format(val);
    };

    const formatPercent = (val) => {
        if (!val || isNaN(val) || !isFinite(val)) return '0,00';
        return new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: 2, maximumFractionDigits: 2
        }).format(val * 100);
    };

    const getDiffColor = (real, presu, isIncome = true) => {
        const diff = real - presu;
        if (Math.abs(diff) < 0.01) return 'text-slate-400';
        if (isIncome) {
            return diff >= 0 ? 'text-emerald-600' : 'text-red-600';
        } else {
            // For expenses, if real > presu it's bad
            return diff <= 0 ? 'text-emerald-600' : 'text-red-600';
        }
    };

    const renderRows = (nodes, depth = 0) => {
        return nodes.map(node => {
            const isExpanded = expandedNodes.has(node.id);
            const hasChildren = (node.children && node.children.length > 0) || (node.accounts && node.accounts.length > 0);

            // Calculate differences and percentages
            const diff_p = node.real_p - node.presu_p;
            const desv_p = node.presu_p !== 0 ? (diff_p / Math.abs(node.presu_p)) : (node.real_p !== 0 ? 1 : 0);
            const diff_a = node.real_a - node.presu_a;
            const desv_a = node.presu_a !== 0 ? (diff_a / Math.abs(node.presu_a)) : (node.real_a !== 0 ? 1 : 0);

            const isIncome = !node.name.toLowerCase().includes('gastos') && !node.name.toLowerCase().includes('aprovisionamientos');

            return (
                <Fragment key={node.id}>
                    <tr className={`hover:bg-slate-50 transition-colors border-b border-slate-100 ${depth === 0 ? 'bg-slate-50/50 font-bold' : ''}`}>
                        <td className="px-4 py-2 border-r border-slate-100 sticky left-0 bg-inherit z-10" style={{ paddingLeft: `${depth * 20 + 16}px` }}>
                            <div className="flex items-center gap-2">
                                {hasChildren ? (
                                    <button onClick={() => toggleNode(node.id)} className="p-0.5 hover:bg-slate-200 rounded transition">
                                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </button>
                                ) : <div className="w-[18px]" />}
                                <span className={`${depth === 0 ? 'text-slate-800' : depth === 1 ? 'text-slate-700' : 'text-slate-600'} truncate max-w-[300px]`} title={node.name}>
                                    {node.name}
                                </span>
                            </div>
                        </td>

                        {/* Period Data */}
                        <td className="px-4 py-2 text-right border-r border-slate-100 text-slate-400">{formatCurrency(node.presu_p)}</td>
                        <td className="px-4 py-2 text-right border-r border-slate-100 font-semibold">{formatCurrency(node.real_p)}</td>
                        <td className={`px-4 py-2 text-right border-r border-slate-100 font-medium ${getDiffColor(node.real_p, node.presu_p, isIncome)}`}>
                            {formatCurrency(diff_p)}
                        </td>
                        <td className={`px-4 py-2 text-right border-r border-slate-100 text-[10px] font-bold ${getDiffColor(node.real_p, node.presu_p, isIncome)}`}>
                            {formatPercent(desv_p)}%
                        </td>

                        {/* Accumulated Data */}
                        <td className="px-4 py-2 text-right border-r border-slate-100 text-slate-400 bg-slate-50/30">{formatCurrency(node.presu_a)}</td>
                        <td className="px-4 py-2 text-right border-r border-slate-100 font-bold bg-slate-50/30">{formatCurrency(node.real_a)}</td>
                        <td className={`px-4 py-2 text-right border-r border-slate-100 font-black bg-slate-50/30 ${getDiffColor(node.real_a, node.presu_a, isIncome)}`}>
                            {formatCurrency(diff_a)}
                        </td>
                        <td className={`px-4 py-2 text-right text-[10px] font-black bg-slate-50/30 ${getDiffColor(node.real_a, node.presu_a, isIncome)}`}>
                            {formatPercent(desv_a)}%
                        </td>
                    </tr>
                    {isExpanded && node.children && renderRows(node.children, depth + 1)}
                    {isExpanded && node.accounts && node.accounts.map(acc => {
                        const d_p = acc.real_p - acc.presu_p;
                        const ds_p = acc.presu_p !== 0 ? (d_p / Math.abs(acc.presu_p)) : (acc.real_p !== 0 ? 1 : 0);
                        const d_a = acc.real_a - acc.presu_a;
                        const ds_a = acc.presu_a !== 0 ? (d_a / Math.abs(acc.presu_a)) : (acc.real_a !== 0 ? 1 : 0);
                        const isAccIncome = acc.code.startsWith('7');

                        return (
                            <tr key={acc.code} className="hover:bg-slate-50/80 transition-colors border-b border-slate-50 text-[11px] text-slate-500 italic">
                                <td className="px-4 py-1.5 border-r border-slate-100 sticky left-0 bg-white z-10" style={{ paddingLeft: `${(depth + 1) * 20 + 24}px` }}>
                                    <span className="opacity-60 mr-2">{acc.code}</span>
                                    {acc.name}
                                </td>
                                <td className="px-4 py-1.5 text-right border-r border-slate-100 opacity-60">{formatCurrency(acc.presu_p)}</td>
                                <td className="px-4 py-1.5 text-right border-r border-slate-100 font-medium text-slate-600">{formatCurrency(acc.real_p)}</td>
                                <td className={`px-4 py-1.5 text-right border-r border-slate-100 ${getDiffColor(acc.real_p, acc.presu_p, isAccIncome)}`}>{formatCurrency(d_p)}</td>
                                <td className={`px-4 py-1.5 text-right border-r border-slate-100 text-[9px] ${getDiffColor(acc.real_p, acc.presu_p, isAccIncome)}`}>{formatPercent(ds_p)}%</td>

                                <td className="px-4 py-1.5 text-right border-r border-slate-100 opacity-60 bg-slate-50/20">{formatCurrency(acc.presu_a)}</td>
                                <td className="px-4 py-1.5 text-right border-r border-slate-100 font-bold text-slate-700 bg-slate-50/20">{formatCurrency(acc.real_a)}</td>
                                <td className={`px-4 py-1.5 text-right border-r border-slate-100 bg-slate-50/20 ${getDiffColor(acc.real_a, acc.presu_a, isAccIncome)}`}>{formatCurrency(d_a)}</td>
                                <td className={`px-4 py-1.5 text-right text-[9px] bg-slate-50/20 ${getDiffColor(acc.real_a, acc.presu_a, isAccIncome)}`}>{formatPercent(ds_a)}%</td>
                            </tr>
                        );
                    })}
                </Fragment>
            );
        });
    };

    return (
        <div className="w-full min-h-screen bg-[#f8fafc] p-6 lg:p-8 font-sans text-slate-900">
            {/* Header */}
            <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div className="flex items-center gap-5">
                    <div className="bg-emerald-600 text-white p-3.5 rounded-2xl shadow-xl shadow-emerald-200">
                        <BarChart3 className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2">Cuenta de Explotación Detallada</h1>
                        <div className="flex items-center gap-3">
                            <span className="bg-slate-200 text-slate-600 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">Comparativa Presupuesto</span>
                            <span className="text-slate-400 text-xs font-medium italic">Empresa: {companies.find(c => c.id === filters.company_id)?.name}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 bg-white text-slate-600 border border-slate-200 px-5 py-2.5 rounded-xl hover:bg-slate-50 transition shadow-sm font-bold text-xs uppercase tracking-wider group">
                        <Download className="w-4 h-4 group-hover:scale-110 transition" />
                        Exportar Excel
                    </button>
                    <Link to="/contabilidad" className="bg-white text-slate-600 border border-slate-200 px-5 py-2.5 rounded-xl hover:bg-slate-50 transition shadow-sm font-bold text-xs uppercase tracking-wider">
                        Volver
                    </Link>
                    <button onClick={logoutUser} className="bg-red-50 text-red-600 border border-red-100 px-5 py-2.5 rounded-xl hover:bg-red-100 transition font-bold text-xs uppercase tracking-wider">
                        Cerrar Sesión
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="max-w-[1800px] mx-auto bg-white p-5 px-8 rounded-[2rem] shadow-sm border border-slate-100 mb-8 flex flex-wrap items-center gap-10">
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Entidad Consolidada</label>
                    <select name="company_id" value={filters.company_id} onChange={handleFilterChange} className="bg-slate-50 border-slate-200 rounded-xl font-bold text-slate-700 text-sm py-2 px-4 focus:ring-emerald-500 focus:border-emerald-500 min-w-[240px]">
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ejercicio Fiscal</label>
                    <select name="year" value={filters.year} onChange={handleFilterChange} className="bg-slate-50 border-slate-200 rounded-xl font-bold text-slate-700 text-sm py-2 px-4 focus:ring-emerald-500 focus:border-emerald-500">
                        {[2026, 2025, 2024].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Desde Mes</label>
                    <select name="month_from" value={filters.month_from} onChange={handleFilterChange} className="bg-slate-50 border-slate-200 rounded-xl font-bold text-slate-700 text-sm py-2 px-4 focus:ring-emerald-500 focus:border-emerald-500 min-w-[140px]">
                        {months.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hasta Mes</label>
                    <select name="month_up_to" value={filters.month_up_to} onChange={handleFilterChange} className="bg-slate-50 border-slate-200 rounded-xl font-bold text-slate-700 text-sm py-2 px-4 focus:ring-emerald-500 focus:border-emerald-500 min-w-[140px]">
                        {months.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>

                {filters.company_id === '2' && (
                    <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl border border-blue-100 italic">
                        <AlertCircle size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-tight">Presupuesto Cenvalsa (2) cargando...</span>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="max-w-[1800px] mx-auto bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse min-w-[1200px]">
                        <thead>
                            <tr className="bg-slate-800 text-white/70 font-black text-[9px] uppercase tracking-widest">
                                <th rowSpan="2" className="px-6 py-4 border-r border-white/10 sticky left-0 bg-slate-800 z-20 min-w-[350px]">Descripción Estructural</th>
                                <th colSpan="4" className="px-6 py-4 border-r border-white/10 text-center bg-slate-700/50">
                                    Datos del Periodo (P)
                                    <span className="block text-[8px] opacity-60">[{months.find(m => m.id === parseInt(filters.month_from))?.name} - {months.find(m => m.id === parseInt(filters.month_up_to))?.name}]</span>
                                </th>
                                <th colSpan="4" className="px-6 py-4 text-center bg-slate-900/50">
                                    Datos Acumulados (A)
                                    <span className="block text-[8px] opacity-60">[Enero - {months.find(m => m.id === parseInt(filters.month_up_to))?.name}]</span>
                                </th>
                            </tr>
                            <tr className="bg-slate-900 text-white/50 font-black text-[9px] uppercase tracking-widest">
                                <th className="px-4 py-3 text-right border-r border-white/10">Presu (P)</th>
                                <th className="px-4 py-3 text-right border-r border-white/10 text-emerald-400">Real (P)</th>
                                <th className="px-4 py-3 text-right border-r border-white/10">Difer (P)</th>
                                <th className="px-4 py-3 text-right border-r border-white/10">% Desv (P)</th>

                                <th className="px-4 py-3 text-right border-r border-white/10 bg-black/20">Presu (A)</th>
                                <th className="px-4 py-3 text-right border-r border-white/10 text-emerald-400 bg-black/20">Real (A)</th>
                                <th className="px-4 py-3 text-right border-r border-white/10 bg-black/20">Difer (A)</th>
                                <th className="px-4 py-3 text-right bg-black/20">% Desv (A)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="9" className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest animate-pulse">Analizando Acumulados y Presupuestos...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan="9" className="px-8 py-20 text-center text-red-500 font-bold">{error}</td>
                                </tr>
                            ) : (
                                <>
                                    {renderRows(treeData)}

                                    {/* Final Result Summary (Mocking the A+B sum for total Result) */}
                                    <tr className="bg-slate-900 text-white font-black text-sm">
                                        <td className="px-6 py-4 border-r border-white/10 sticky left-0 bg-slate-900 z-20">RESULTADO DEL EJERCICIO</td>
                                        <td className="px-4 py-4 text-right border-r border-white/10 opacity-60 font-medium text-xs">{formatCurrency(summary.presu_p)}</td>
                                        <td className="px-4 py-4 text-right border-r border-white/10 text-emerald-400">{formatCurrency(summary.real_p)}</td>
                                        <td className="px-4 py-4 text-right border-r border-white/10 font-black">{formatCurrency(summary.real_p - summary.presu_p)}</td>
                                        <td className="px-4 py-4 text-right border-r border-white/10 text-xs">{formatPercent(summary.presu_p !== 0 ? (summary.real_p - summary.presu_p) / Math.abs(summary.presu_p) : 0)}%</td>

                                        <td className="px-4 py-4 text-right border-r border-white/10 opacity-60 font-medium text-xs bg-black/20">{formatCurrency(summary.presu_a)}</td>
                                        <td className="px-4 py-4 text-right border-r border-white/10 text-emerald-400 bg-black/20">{formatCurrency(summary.real_a)}</td>
                                        <td className="px-4 py-4 text-right border-r border-white/10 font-black bg-black/20">{formatCurrency(summary.real_a - summary.presu_a)}</td>
                                        <td className="px-4 py-4 text-right text-xs bg-black/20 font-black">{formatPercent(summary.presu_a !== 0 ? (summary.real_a - summary.presu_a) / Math.abs(summary.presu_a) : 0)}%</td>
                                    </tr>
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <p className="max-w-[1800px] mx-auto mt-6 text-[10px] text-slate-400 font-medium uppercase tracking-[0.2em] text-center">
                * Las diferencias positivas en ingresos se consideran favorables (verde), mientras que en gastos se consideran desfavorables (rojo).
            </p>
        </div>
    );
}
