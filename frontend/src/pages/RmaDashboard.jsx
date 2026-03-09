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
            "Error preparacion": "bg-blue-100 text-blue-800 border-blue-200",
            "Error administrativo": "bg-yellow-100 text-yellow-800 border-yellow-200",
            "Error produccion": "bg-purple-100 text-purple-800 border-purple-200",
            "Error cliente": "bg-green-100 text-green-800 border-green-200",
            "Error proveedor": "bg-orange-100 text-orange-800 border-orange-200",
            "Error comercial": "bg-red-100 text-red-800 border-red-200"
        };
        return mapping[tipoError] || "bg-slate-100 text-slate-800 border-slate-200";
    };

    return (
        <div className="w-full min-h-screen bg-[#f8fafc] p-4 text-slate-800 font-sans">
            <PageHeader moduleName="Partes de no conformidad" showRefresh={false} />

            {/* Filters Bar ERP Style */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fecha Inicio</label>
                        <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full rounded border-slate-200 text-xs p-2 bg-slate-50/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fecha Fin</label>
                        <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full rounded border-slate-200 text-xs p-2 bg-slate-50/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Empresa</label>
                        <select name="companyId" value={filters.companyId} onChange={handleFilterChange} className="w-full rounded border-slate-200 text-xs p-2 bg-slate-50/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all">
                            <option value="">Todas</option>
                            {options.companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Estado</label>
                        <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full rounded border-slate-200 text-xs p-2 bg-slate-50/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all">
                            <option value="">Cualquier estado</option>
                            <option value="Abierto">Abierto</option>
                            <option value="Cerrado">Cerrado</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo de Error</label>
                        <select name="errorType" value={filters.errorType} onChange={handleFilterChange} className="w-full rounded border-slate-200 text-xs p-2 bg-slate-50/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all">
                            <option value="">Todos los errores</option>
                            {errorTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Buscar Cliente</label>
                        <input type="text" name="search" value={filters.search} onChange={handleFilterChange} placeholder="Nombre cliente..." className="w-full rounded border-slate-200 text-xs p-2 bg-slate-50/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" />
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
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-sm font-bold text-indigo-900 uppercase flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                        Listado de Partes de No Conformidad
                    </h2>
                    <span className="text-[10px] font-black text-slate-400 bg-white border border-slate-200 px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm">
                        {filteredData.length} registros encontrados
                    </span>
                </div>

                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                        <p className="text-slate-500 font-medium tracking-tight">Consultando base de datos Sage...</p>
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="p-20 text-center text-slate-400 italic">No se han encontrado registros con los filtros actuales.</div>
                ) : (
                    <div className="overflow-x-auto max-h-[50vh] relative custom-scrollbar">
                        <table className="min-w-full divide-y divide-slate-200 text-[11px]">
                            <thead className="bg-[#444b41] text-white sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Cliente</th>
                                    <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Artículo</th>
                                    <th className="px-4 py-3 text-center font-bold uppercase tracking-wider">Fecha Alta</th>
                                    <th className="px-4 py-3 text-center font-bold uppercase tracking-wider">Estado</th>
                                    <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Tipo Error</th>
                                    <th className="px-4 py-3 text-center font-bold uppercase tracking-wider">Cant.</th>
                                    <th className="px-4 py-3 text-left font-bold uppercase tracking-wider max-w-[300px]">Razon / Observaciones</th>
                                    <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Doc. PDF</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {filteredData.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-indigo-50/40 transition-colors border-l-2 border-transparent hover:border-indigo-600">
                                        <td className="px-4 py-3 font-bold text-slate-700 max-w-[200px] truncate" title={item.NombreCliente}>
                                            <div className="flex flex-col">
                                                <span>{item.NombreCliente || "-"}</span>
                                                <span className="text-[9px] text-slate-400 font-mono">ID: {item.CodigoEmpresa}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-indigo-600 font-mono font-bold">{item.CodigoArticulo || "-"}</td>
                                        <td className="px-4 py-3 text-center text-slate-500 font-medium">{item.FechaAlta ? new Date(item.FechaAlta).toLocaleDateString() : "-"}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm ${item.Estado === 'Abierto' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                                                {item.Estado || "???"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {item["Tipo error"] ? (
                                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${getBadgeStyle(item["Tipo error"])}`}>
                                                    {item["Tipo error"]}
                                                </span>
                                            ) : <span className="text-slate-300 italic">No clasificado</span>}
                                        </td>
                                        <td className="px-4 py-3 text-center font-black font-mono text-indigo-900 bg-slate-50/50">{item.Unidades ?? "-"}</td>
                                        <td className="px-4 py-3 text-slate-600 leading-relaxed font-medium" style={{ minWidth: '200px' }}>
                                            {item.Razon || "-"}
                                        </td>
                                        <td className="px-4 py-3 text-slate-400 font-mono text-[9px] truncate" title={item.DOCNombreLc}>{item.DOCNombreLc || "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Error Distribution Chart (NOW BOTTOM) */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[400px]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                        Análisis de Distribución por Tipo de Error
                    </h3>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                            <span className="text-[10px] font-bold text-slate-400">Puntaje Operativo</span>
                        </div>
                    </div>
                </div>
                <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                        <BarChart
                            data={errorChartData}
                            margin={{ top: 20, right: 40, left: 100, bottom: 20 }}
                            layout="vertical"
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                tick={{ fontSize: 11, fontWeight: 700, fill: '#475569' }}
                                width={100}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ fontWeight: 'bold' }}
                            />
                            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={32}>
                                {errorChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={getErrorColor(entry.name)} />
                                ))}
                                <LabelList dataKey="value" position="right" style={{ fontSize: '12px', fontWeight: '900', fill: '#1e3a8a' }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="mt-8 flex justify-between items-center text-[10px] text-slate-300 font-black uppercase tracking-widest px-1">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    Conexión Directa Sage200
                </div>
                <span>Sync v2.1.0 • {new Date().toLocaleTimeString()}</span>
            </div>
        </div>
    );
}
