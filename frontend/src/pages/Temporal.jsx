import React, { useState, useEffect } from 'react';
import { fetchAbcAnalysis, downloadAbcAnalysis, sendAbcAnalysisEmail, fetchAbcProviders, fetchAbcSubfamilies } from '../services/api';
import { PageHeader } from '../components/common/PageHeader';


export default function Temporal() {
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({
        search: '',
        division: '',
        tipo2025: '',
        tipo2026: '',
        proveedor: '',
        subfamilia: ''
    });
    const [providers, setProviders] = useState([]);
    const [subfamilies, setSubfamilies] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: 'Venta2026', order: 'desc' });
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailMessage, setEmailMessage] = useState(null);

    // Debounce search
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const loadFilters = async () => {
            try {
                const [pList, sList] = await Promise.all([
                    fetchAbcProviders(),
                    fetchAbcSubfamilies()
                ]);
                setProviders(pList);
                setSubfamilies(sList);
            } catch (error) {
                console.error("Error loading filters:", error);
            }
        };
        loadFilters();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                page_size: 50,
                search: debouncedSearch,
                division: filters.division,
                tipo2025: filters.tipo2025,
                tipo2026: filters.tipo2026,
                proveedor: filters.proveedor,
                subfamilia: filters.subfamilia,
                sort_by: sortConfig.key,
                sort_order: sortConfig.order
            };
            const result = await fetchAbcAnalysis(params);
            setData(result.data);
            setTotal(result.total);
            setTotalPages(result.total_pages);
        } catch (error) {
            console.error("Error fetching ABC analysis:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [page, debouncedSearch, filters.division, filters.tipo2025, filters.tipo2026, filters.proveedor, filters.subfamilia, sortConfig]);

    // Reset page on filter change
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, filters.division, filters.tipo2025, filters.tipo2026, filters.proveedor, filters.subfamilia]);

    const requestSort = (key) => {
        let order = 'desc';
        if (sortConfig.key === key && sortConfig.order === 'desc') {
            order = 'asc';
        }
        setSortConfig({ key, order });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return (
            <svg className="w-3 h-3 ml-1 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
        );
        return sortConfig.order === 'asc' ? (
            <svg className="w-3 h-3 ml-1 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
        ) : (
            <svg className="w-3 h-3 ml-1 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
        );
    };

    const handleDownload = async () => {
        try {
            const params = {
                search: debouncedSearch,
                division: filters.division,
                tipo2025: filters.tipo2025,
                tipo2026: filters.tipo2026,
                proveedor: filters.proveedor,
                subfamilia: filters.subfamilia,
                sort_by: sortConfig.key,
                sort_order: sortConfig.order
            };
            const blob = await downloadAbcAnalysis(params);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Analisis_ABC_Pareto_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error("Error downloading ABC report:", error);
            alert("Error al descargar el informe ABC");
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const formatNumber = (num) => {
        const value = Number(num) || 0;
        return new Intl.NumberFormat('es-ES', { 
            useGrouping: true, 
            maximumFractionDigits: 0 
        }).format(value);
    };
    const formatPercent = (num) => (num || 0).toFixed(2) + '%';

    const getTipoColor = (tipo) => {
        if (tipo === 'A') return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
        if (tipo === 'B') return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700';
    };

    const handleSendEmail = async () => {
        try {
            setSendingEmail(true);
            setEmailMessage(null);
            const params = {
                search: debouncedSearch,
                division: filters.division,
                tipo2025: filters.tipo2025,
                tipo2026: filters.tipo2026,
                proveedor: filters.proveedor,
                subfamilia: filters.subfamilia,
                sort_by: sortConfig.key,
                sort_order: sortConfig.order
            };
            const response = await sendAbcAnalysisEmail(params);
            setEmailMessage({ type: 'success', text: response.message || "Correo enviado correctamente." });
        } catch (error) {
            console.error("Error sending ABC report via email:", error);
            setEmailMessage({ type: 'error', text: "Error al enviar el informe. Revisa la configuración del servidor." });
        } finally {
            setSendingEmail(false);
            setTimeout(() => setEmailMessage(null), 5000); // clear after 5s
        }
    };

    return (

        <div className="p-6 max-w-[1720px] mx-auto min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-gray-800 dark:text-slate-200 font-sans transition-colors">
            <PageHeader moduleName="Análisis de Rotación (ABC)" showRefresh={false}>
                <div className="flex gap-3">
                    <button
                        onClick={fetchData}
                        className="bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded shadow-sm border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition font-bold text-xs h-[34px] flex items-center gap-2"
                    >
                        Actualizar
                    </button>
                    <button
                        onClick={handleDownload}
                        className="bg-emerald-600 text-white px-3 py-1.5 rounded shadow-sm hover:bg-emerald-700 transition font-bold text-xs h-[34px] flex items-center gap-2 whitespace-nowrap"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Descargar
                    </button>
                    <button
                        onClick={handleSendEmail}
                        disabled={sendingEmail}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-bold text-xs h-[34px] flex items-center gap-2 whitespace-nowrap"
                    >
                        {sendingEmail ? (
                            <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        )}
                        {sendingEmail ? "Enviando..." : "Enviar a mi correo"}
                    </button>
                </div>
            </PageHeader>

            {/* Email notification toast */}
            {emailMessage && (
                <div className={`mb-4 p-4 rounded-xl shadow-sm text-sm font-bold flex items-center gap-3 animate-fade-in-down ${
                    emailMessage.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' 
                    : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                }`}>
                    {emailMessage.type === 'success' ? (
                        <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    ) : (
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                    {emailMessage.text}
                </div>
            )}

            {/* Filters Section */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-wrap gap-6 items-end mb-8 transition-colors">
                <div className="flex flex-col flex-grow min-w-[300px]">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 tracking-wider">Buscar Artículo</label>
                    <div className="relative">
                        <input
                            type="text"
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                            placeholder="Código o descripción..."
                            className="w-full rounded-xl border-slate-200 dark:border-slate-700 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2.5 pl-10 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 transition-colors"
                        />
                        <svg className="absolute left-3 top-3 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                </div>

                <div className="flex flex-col w-48">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 tracking-wider">Subfamilia</label>
                    <select
                        name="subfamilia"
                        value={filters.subfamilia}
                        onChange={handleFilterChange}
                        className="w-full rounded-xl border-slate-200 dark:border-slate-700 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2.5 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 transition-colors"
                    >
                        <option value="">Todas</option>
                        {subfamilies.map((s, idx) => (
                            <option key={idx} value={s}>{s}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col w-48">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 tracking-wider">División (Interna)</label>
                    <select
                        name="division"
                        value={filters.division}
                        onChange={handleFilterChange}
                        className="w-full rounded-xl border-slate-200 dark:border-slate-700 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2.5 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 transition-colors"
                    >
                        <option value="">Todas</option>
                        <option value="Conectrónica">Conectrónica</option>
                        <option value="Mecánica">Mecánica</option>
                        <option value="Informática Industrial">Informática Industrial</option>
                        <option value="Otros">Otros</option>
                    </select>
                </div>

                <div className="flex flex-col w-64">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 tracking-wider">Proveedor</label>
                    <select
                        name="proveedor"
                        value={filters.proveedor}
                        onChange={handleFilterChange}
                        className="w-full rounded-xl border-slate-200 dark:border-slate-700 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2.5 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 transition-colors"
                    >
                        <option value="">Todos</option>
                        {providers.map((p, idx) => (
                            <option key={idx} value={p}>{p}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col w-32">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 tracking-wider">Tipo 2025</label>
                    <select
                        name="tipo2025"
                        value={filters.tipo2025}
                        onChange={handleFilterChange}
                        className="w-full rounded-xl border-slate-200 dark:border-slate-700 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2.5 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 transition-colors"
                    >
                        <option value="">Todos</option>
                        <option value="A">Tipo A</option>
                        <option value="B">Tipo B</option>
                        <option value="C">Tipo C</option>
                    </select>
                </div>

                <div className="flex flex-col w-32">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 tracking-wider">Tipo 2026</label>
                    <select
                        name="tipo2026"
                        value={filters.tipo2026}
                        onChange={handleFilterChange}
                        className="w-full rounded-xl border-slate-200 dark:border-slate-700 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2.5 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 transition-colors"
                    >
                        <option value="">Todos</option>
                        <option value="A">Tipo A</option>
                        <option value="B">Tipo B</option>
                        <option value="C">Tipo C</option>
                    </select>
                </div>

                <div className="flex items-center h-[42px] px-2 text-xs font-bold text-slate-400 italic">
                    {total} artículos filtrados de la base total
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors flex flex-col h-[calc(100vh-320px)]">
                <div className="overflow-x-auto flex-grow custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/90 backdrop-blur-sm z-10 transition-colors">
                            <tr className="border-b border-slate-100 dark:border-slate-700">
                                <th 
                                    onClick={() => requestSort('CodigoArticulo')}
                                    className="p-4 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest min-w-[140px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <div className="flex items-center">Artículo {getSortIcon('CodigoArticulo')}</div>
                                </th>
                                <th 
                                    onClick={() => requestSort('Descripcion')}
                                    className="p-4 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest min-w-[250px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <div className="flex items-center">Descripción {getSortIcon('Descripcion')}</div>
                                </th>
                                <th 
                                    onClick={() => requestSort('Familia')}
                                    className="p-4 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest min-w-[120px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <div className="flex items-center">Familia {getSortIcon('Familia')}</div>
                                </th>
                                <th 
                                    onClick={() => requestSort('Subfamilia')}
                                    className="p-4 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest min-w-[120px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <div className="flex items-center">Subfamilia {getSortIcon('Subfamilia')}</div>
                                </th>
                                <th 
                                    onClick={() => requestSort('Proveedor')}
                                    className="p-4 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest min-w-[180px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <div className="flex items-center">Proveedor {getSortIcon('Proveedor')}</div>
                                </th>
                                <th 
                                    onClick={() => requestSort('Venta2025')}
                                    className="p-4 py-5 text-right text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-emerald-50/50 dark:bg-emerald-900/10 cursor-pointer hover:bg-emerald-100/50 transition-colors"
                                >
                                    <div className="flex items-center justify-end">Uds 2025 {getSortIcon('Venta2025')}</div>
                                </th>
                                <th className="p-4 py-5 text-right text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-emerald-50/50 dark:bg-emerald-900/10">% 2025</th>
                                <th className="p-4 py-5 text-center text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-emerald-50/50 dark:bg-emerald-900/10">Cat 25</th>
                                <th 
                                    onClick={() => requestSort('Venta2026')}
                                    className="p-4 py-5 text-right text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-blue-50/50 dark:bg-blue-900/10 cursor-pointer hover:bg-blue-100/50 transition-colors"
                                >
                                    <div className="flex items-center justify-end">Uds 2026 {getSortIcon('Venta2026')}</div>
                                </th>
                                <th className="p-4 py-5 text-right text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-blue-50/50 dark:bg-blue-900/10">% 2026</th>
                                <th className="p-4 py-5 text-center text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-blue-50/50 dark:bg-blue-900/10">Cat 26</th>
                                <th 
                                    onClick={() => requestSort('StockActual')}
                                    className="p-4 py-5 text-right text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-l border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <div className="flex items-center justify-end">Stock {getSortIcon('StockActual')}</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {loading ? (
                                <tr>
                                    <td colSpan="10" className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest animate-pulse">Cargando página...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="p-20 text-center text-slate-400 font-bold italic">No se encontraron artículos con estos filtros</td>
                                </tr>
                            ) : (
                                data.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                                        <td className="p-4 text-xs font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight">{item.CodigoArticulo}</td>
                                        <td className="p-4 text-xs font-semibold text-slate-600 dark:text-slate-400 truncate max-w-[300px]" title={item.Descripcion}>{item.Descripcion}</td>
                                        <td className="p-4">
                                            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-tighter">{item.Familia}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-tighter">{item.Subfamilia}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate block max-w-[180px]" title={item.Proveedor}>{item.Proveedor || '---'}</span>
                                        </td>
                                        <td className="p-4 text-right text-xs font-bold text-slate-700 dark:text-slate-300 bg-emerald-50/20 dark:bg-emerald-900/5">{formatNumber(item.Venta2025)}</td>
                                        <td className="p-4 text-right text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-emerald-50/20 dark:bg-emerald-900/5">{formatPercent(item.Porcentaje2025)}</td>
                                        <td className="p-4 text-center bg-emerald-50/20 dark:bg-emerald-900/5">
                                            <span className={`px-2 py-0.5 rounded text-[11px] font-black border ${getTipoColor(item.Tipo2025)} shadow-sm`}>
                                                {item.Tipo2025}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right text-xs font-bold text-slate-700 dark:text-slate-300 bg-blue-50/20 dark:bg-blue-900/5">{formatNumber(item.Venta2026)}</td>
                                        <td className="p-4 text-right text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-blue-50/20 dark:bg-blue-900/5">{formatPercent(item.Porcentaje2026)}</td>
                                        <td className="p-4 text-center bg-blue-50/20 dark:bg-blue-900/5">
                                            <span className={`px-2 py-0.5 rounded text-[11px] font-black border ${getTipoColor(item.Tipo2026)} shadow-sm`}>
                                                {item.Tipo2026}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right text-xs font-black text-slate-900 dark:text-slate-100 border-l border-slate-50 dark:border-slate-800/50">
                                            <span className={item.StockActual < 0 ? 'text-red-500' : ''}>{formatNumber(item.StockActual)}</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Página {page} de {totalPages} <span className="mx-2 opacity-50">|</span> Total {total} artículos
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-4 py-1.5 rounded-xl font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || loading}
                            className="bg-emerald-600 text-white px-4 py-1.5 rounded-xl font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed hover:bg-emerald-700 shadow-sm transition-all"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
