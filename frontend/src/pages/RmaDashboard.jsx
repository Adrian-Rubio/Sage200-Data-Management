import { useState, useEffect, useMemo } from 'react';
import { fetchRmaData, fetchFilterOptions } from '../services/api';
import { PageHeader } from '../components/common/PageHeader';
import { KpiCard } from '../components/dashboard/KpiCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

export default function RmaDashboard() {
    const [data, setData] = useState([]);
    const [kpis, setKpis] = useState({ total: 0, abiertos: 0, cerrados: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [options, setOptions] = useState({ companies: [] });

    // Filters
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        companyId: '',
        status: '',
        errorType: '',
        search: ''
    });

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [rmaResult, filterOpts] = await Promise.all([
                fetchRmaData(),
                fetchFilterOptions()
            ]);

            if (rmaResult && rmaResult.data) {
                setData(rmaResult.data);
                setKpis(rmaResult.kpis);
            }
            if (filterOpts) {
                setOptions(filterOpts);
            }
        } catch (err) {
            setError("Error cargando los datos de devoluciones (RMA).");
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const errorTypes = useMemo(() => {
        const types = new Set();
        data.forEach(item => {
            if (item["Tipo error"]) types.add(item["Tipo error"]);
        });
        return Array.from(types).sort();
    }, [data]);

    const filteredData = useMemo(() => {
        return data.filter(item => {
            if (filters.status && item.Estado !== filters.status) return false;
            if (filters.errorType && item["Tipo error"] !== filters.errorType) return false;
            if (filters.companyId && item.CodigoEmpresa?.toString() !== filters.companyId) return false;
            if (filters.search && !item.NombreCliente?.toLowerCase().includes(filters.search.toLowerCase())) return false;

            if (item.FechaAlta) {
                const date = new Date(item.FechaAlta);
                const dateStr = date.toISOString().split('T')[0];

                if (filters.startDate && dateStr < filters.startDate) return false;
                if (filters.endDate && dateStr > filters.endDate) return false;
            } else if (filters.startDate || filters.endDate) {
                return false;
            }
            return true;
        });
    }, [data, filters]);

    // Error Frequency for Chart
    const errorChartData = useMemo(() => {
        const counts = {};
        filteredData.forEach(item => {
            const type = item["Tipo error"] || "Sin clasificar";
            counts[type] = (counts[type] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    }, [filteredData]);

    const getErrorColor = (tipoError) => {
        const mapping = {
            "Error preparacion": "#3b82f6",
            "Error administrativo": "#eab308",
            "Error produccion": "#a855f7",
            "Error cliente": "#22c55e",
            "Error proveedor": "#f97316",
            "Error comercial": "#ef4444"
        };
        return mapping[tipoError] || "#94a3b8";
    };

    const getBadgeStyle = (tipoError) => {
        const mapping = {
            "Error preparacion": "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/50",
            "Error administrativo": "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/50",
            "Error produccion": "bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/50",
            "Error cliente": "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800/50",
            "Error proveedor": "bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800/50",
            "Error comercial": "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800/50"
        };
        return mapping[tipoError] || "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";
    };

    return (
        <div className="w-full min-h-screen bg-[#f8fafc] dark:bg-slate-950 p-4 text-slate-800 dark:text-slate-200 font-sans transition-colors">
            <PageHeader moduleName="Partes de no conformidad" showRefresh={false} />

            {/* Filters Bar ERP Style */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6 transition-colors">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 transition-colors">Fecha Inicio</label>
                        <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full rounded border-slate-200 dark:border-slate-700 text-xs p-2 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 transition-colors">Fecha Fin</label>
                        <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full rounded border-slate-200 dark:border-slate-700 text-xs p-2 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 transition-colors">Empresa</label>
                        <select name="companyId" value={filters.companyId} onChange={handleFilterChange} className="w-full rounded border-slate-200 dark:border-slate-700 text-xs p-2 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none">
                            <option value="">Todas</option>
                            {options.companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 transition-colors">Estado</label>
                        <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full rounded border-slate-200 dark:border-slate-700 text-xs p-2 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none">
                            <option value="">Cualquier estado</option>
                            <option value="Abierto">Abierto</option>
                            <option value="Cerrado">Cerrado</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 transition-colors">Tipo de Error</label>
                        <select name="errorType" value={filters.errorType} onChange={handleFilterChange} className="w-full rounded border-slate-200 dark:border-slate-700 text-xs p-2 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none">
                            <option value="">Todos los errores</option>
                            {errorTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 transition-colors">Buscar Cliente</label>
                        <input type="text" name="search" value={filters.search} onChange={handleFilterChange} placeholder="Nombre cliente..." className="w-full rounded border-slate-200 dark:border-slate-700 text-xs p-2 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none" />
                    </div>
                </div>
            </div>

            {/* Horizontal KPIs Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <KpiCard title="Nº Partes Totales" value={kpis.total} subtext="En el periodo" />
                <KpiCard title="Partes Abiertos" value={kpis.abiertos} isWarning={true} subtext="Pdte. Resolución" />
                <KpiCard title="Partes Cerrados" value={kpis.cerrados} subtext="Finalizados" />
            </div>

            {/* Main Table Layer (NOW FIRST) */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-8 transition-colors">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 transition-colors">
                    <h2 className="text-sm font-bold text-indigo-900 dark:text-indigo-400 uppercase flex items-center gap-2 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                        Listado de Partes de No Conformidad
                    </h2>
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm transition-colors">
                        {filteredData.length} registros encontrados
                    </span>
                </div>

                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400 mb-4 transition-colors"></div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight transition-colors">Consultando base de datos Sage...</p>
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="p-20 text-center text-slate-400 dark:text-slate-500 italic transition-colors">No se han encontrado registros con los filtros actuales.</div>
                ) : (
                    <div className="overflow-x-auto max-h-[50vh] relative custom-scrollbar">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-[11px] transition-colors">
                            <thead className="bg-[#444b41] dark:bg-slate-950 text-white sticky top-0 z-10 transition-colors">
                                <tr>
                                    <th className="px-4 py-3 text-left font-bold uppercase tracking-wider border-b border-transparent dark:border-slate-800">Cliente</th>
                                    <th className="px-4 py-3 text-left font-bold uppercase tracking-wider border-b border-transparent dark:border-slate-800">Artículo</th>
                                    <th className="px-4 py-3 text-center font-bold uppercase tracking-wider border-b border-transparent dark:border-slate-800">Fecha Alta</th>
                                    <th className="px-4 py-3 text-center font-bold uppercase tracking-wider border-b border-transparent dark:border-slate-800">Estado</th>
                                    <th className="px-4 py-3 text-left font-bold uppercase tracking-wider border-b border-transparent dark:border-slate-800">Tipo Error</th>
                                    <th className="px-4 py-3 text-center font-bold uppercase tracking-wider border-b border-transparent dark:border-slate-800">Cant.</th>
                                    <th className="px-4 py-3 text-left font-bold uppercase tracking-wider border-b border-transparent dark:border-slate-800 max-w-[300px]">Razon / Observaciones</th>
                                    <th className="px-4 py-3 text-left font-bold uppercase tracking-wider border-b border-transparent dark:border-slate-800">Doc. PDF</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800/50 transition-colors">
                                {filteredData.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10 transition-colors border-l-2 border-transparent hover:border-indigo-600 dark:hover:border-indigo-400">
                                        <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200 max-w-[200px] truncate transition-colors" title={item.NombreCliente}>
                                            <div className="flex flex-col">
                                                <span>{item.NombreCliente || "-"}</span>
                                                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono transition-colors">ID: {item.CodigoEmpresa}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-indigo-600 dark:text-indigo-400 font-mono font-bold transition-colors">{item.CodigoArticulo || "-"}</td>
                                        <td className="px-4 py-3 text-center text-slate-500 dark:text-slate-400 font-medium transition-colors">{item.FechaAlta ? new Date(item.FechaAlta).toLocaleDateString() : "-"}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm transition-colors ${item.Estado === 'Abierto' ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800/50' : 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-800/50'}`}>
                                                {item.Estado || "???"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {item["Tipo error"] ? (
                                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors ${getBadgeStyle(item["Tipo error"])}`}>
                                                    {item["Tipo error"]}
                                                </span>
                                            ) : <span className="text-slate-300 dark:text-slate-600 italic transition-colors">No clasificado</span>}
                                        </td>
                                        <td className="px-4 py-3 text-center font-black font-mono text-indigo-900 dark:text-indigo-300 bg-slate-50/50 dark:bg-slate-800/50 transition-colors">{item.Unidades ?? "-"}</td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 leading-relaxed font-medium transition-colors" style={{ minWidth: '200px' }}>
                                            {item.Razon || "-"}
                                        </td>
                                        <td className="px-4 py-3 text-slate-400 dark:text-slate-500 font-mono text-[9px] truncate transition-colors" title={item.DOCNombreLc}>{item.DOCNombreLc || "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Error Distribution Chart (NOW BOTTOM) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[400px] transition-colors">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                        Análisis de Distribución por Tipo de Error
                    </h3>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 transition-colors">Puntaje Operativo</span>
                        </div>
                    </div>
                </div>
                <div className="flex-1 w-full relative z-0">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={errorChartData}
                            margin={{ top: 20, right: 40, left: 100, bottom: 20 }}
                            layout="vertical"
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" opacity={0.3} />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
                                width={100}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(236, 253, 245, 0.1)' }}
                                contentStyle={{ borderRadius: '12px', border: '1px solid #334155', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)', backgroundColor: '#0f172a', color: '#f8fafc' }}
                                itemStyle={{ fontWeight: 'bold' }}
                            />
                            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={32}>
                                {errorChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={getErrorColor(entry.name)} />
                                ))}
                                <LabelList dataKey="value" position="right" style={{ fontSize: '12px', fontWeight: '900', fill: '#64748b' }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="mt-8 flex justify-between items-center text-[10px] text-slate-300 dark:text-slate-600 font-black uppercase tracking-widest px-1 transition-colors">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-600 animate-pulse transition-colors"></div>
                    Conexión Directa Sage200
                </div>
                <span>Sync v2.1.0 • {new Date().toLocaleTimeString()}</span>
            </div>
        </div>
    );
}
