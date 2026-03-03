import { useState, useEffect } from 'react';
import { fetchFinancePnL, fetchFinancePnLEvolution } from '../services/api';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Wallet, BarChart3, ChevronRight, LogOut, Home } from 'lucide-react';
import useAuthStore from '../store/authStore';

export default function CuentaExplotacion() {
    const { logoutUser } = useAuthStore();
    const [data, setData] = useState({ details: [], summary: {} });
    const [evolution, setEvolution] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        year: new Date().getFullYear(),
        month_up_to: new Date().getMonth() + 1,
        company_id: '100' // Default to Cenval
    });

    const companies = [
        { id: '100', name: 'Cenval (100)' },
        { id: '2', name: 'Cenvalsa Industrial (2)' },
        { id: '4', name: 'Dubes (4)' },
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
        try {
            const [pnlRes, evolutionRes] = await Promise.all([
                fetchFinancePnL(filters),
                fetchFinancePnLEvolution({ ...filters })
            ]);
            setData(pnlRes);
            setEvolution(evolutionRes);
        } catch (err) {
            setError("Error cargando la cuenta de explotación.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const formatCurrency = (val) => new Intl.NumberFormat('es-ES', {
        style: 'currency', currency: 'EUR', maximumFractionDigits: 0
    }).format(val || 0);

    const formatK = (val) => {
        if (Math.abs(val) >= 1000000) return `${(val / 1000).toFixed(0)}k€`; // Sage usually works in thousands in reports
        if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(0)}k€`;
        return `${val}€`;
    };

    const details = data.details || [];
    const summary = data.summary || {};

    // Grouping for the professional table
    const expl_details = details.filter(d => d.Grupo === 'EXPLOTACION').sort((a, b) => a.Apartado_PyG.localeCompare(b.Apartado_PyG, undefined, { numeric: true }));
    const fin_details = details.filter(d => d.Grupo === 'FINANCIERO').sort((a, b) => a.Apartado_PyG.localeCompare(b.Apartado_PyG, undefined, { numeric: true }));
    const tax_details = details.filter(d => d.Grupo === 'IMPUESTOS').sort((a, b) => a.Apartado_PyG.localeCompare(b.Apartado_PyG, undefined, { numeric: true }));

    // Chart Data
    const summaryData = [
        { name: 'Explotación', value: summary.resultado_explotacion },
        { name: 'Financiero', value: summary.resultado_financiero },
        { name: 'Resultado', value: summary.resultado_ejercicio }
    ];

    return (
        <div className="w-full min-h-screen bg-[#f1f5f9] p-4 md:p-8 text-slate-900 font-sans">
            {/* Header / Nav */}
            <div className="max-w-7xl mx-auto flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-lg">
                        <BarChart3 className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Cuenta de Explotación</h1>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Análisis P&G (PGC)</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link to="/contabilidad" className="bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition shadow-sm font-bold text-xs uppercase tracking-wider">
                        Volver
                    </Link>
                    <button onClick={logoutUser} className="bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-xl hover:bg-red-100 transition font-bold text-xs uppercase tracking-wider">
                        Salir
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="max-w-7xl mx-auto bg-white p-3 px-6 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-wrap items-center gap-8">
                <div className="flex items-center gap-4">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Empresa</label>
                    <select name="company_id" value={filters.company_id} onChange={handleFilterChange} className="bg-slate-50 border-none rounded-lg font-bold text-slate-700 text-xs py-1.5 focus:ring-0">
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-4">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Ejercicio</label>
                    <select name="year" value={filters.year} onChange={handleFilterChange} className="bg-slate-50 border-none rounded-lg font-bold text-slate-700 text-xs py-1.5 focus:ring-0">
                        {[2026, 2025, 2024].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-4">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Hasta</label>
                    <select name="month_up_to" value={filters.month_up_to} onChange={handleFilterChange} className="bg-slate-50 border-none rounded-lg font-bold text-slate-700 text-xs py-1.5 focus:ring-0">
                        {months.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Legal Table */}
                <div className="lg:col-span-3 bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                    <div className="bg-slate-800 p-6 flex justify-between items-center text-white">
                        <h3 className="font-bold text-lg">Estado de Resultados</h3>
                        <div className="text-[10px] font-black bg-white/10 px-3 py-1 rounded-full uppercase tracking-tighter">
                            Formato Legal PGC
                        </div>
                    </div>

                    <div className="p-0 overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-400 font-black text-[9px] uppercase tracking-[0.2em]">
                                    <th className="px-6 py-2.5 border-b">Estructura de Cuentas</th>
                                    <th className="px-6 py-2.5 border-b text-right">Saldo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 italic">
                                {loading ? (
                                    <tr><td colSpan="2" className="px-8 py-20 text-center text-slate-300">Generando reporte legal...</td></tr>
                                ) : (
                                    <>
                                        {/* EXPLOTACION */}
                                        {expl_details.map((item, i) => (
                                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-2 text-slate-600 font-medium pl-8">{item.Apartado_PyG}</td>
                                                <td className={`px-6 py-2 text-right font-bold ${item.Total >= 0 ? 'text-slate-700' : 'text-slate-400'}`}>{formatCurrency(item.Total)}</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-slate-100/50 border-y border-slate-200">
                                            <td className="px-6 py-2.5 text-slate-800 font-black uppercase text-[10px]">A) RESULTADO DE EXPLOTACIÓN</td>
                                            <td className={`px-6 py-2.5 text-right font-black text-xs ${summary.resultado_explotacion >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatCurrency(summary.resultado_explotacion)}</td>
                                        </tr>

                                        {/* FINANCIERO */}
                                        {fin_details.map((item, i) => (
                                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-2 text-slate-500 font-medium pl-8">{item.Apartado_PyG}</td>
                                                <td className={`px-6 py-2 text-right font-bold ${item.Total >= 0 ? 'text-slate-700' : 'text-slate-400'}`}>{formatCurrency(item.Total)}</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-slate-100/50 border-y border-slate-200">
                                            <td className="px-6 py-2.5 text-slate-800 font-black uppercase text-[10px]">B) RESULTADO FINANCIERO</td>
                                            <td className={`px-6 py-2.5 text-right font-black text-xs ${summary.resultado_financiero >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{formatCurrency(summary.resultado_financiero)}</td>
                                        </tr>

                                        <tr className="bg-slate-900 text-white">
                                            <td className="px-6 py-3 font-black uppercase text-[10px] tracking-widest pl-6">C) RESULTADO ANTES DE IMPUESTOS</td>
                                            <td className="px-6 py-3 text-right font-black text-sm">{formatCurrency(summary.resultado_antes_impuestos)}</td>
                                        </tr>

                                        {/* TAXES */}
                                        {tax_details.map((item, i) => (
                                            <tr key={i} className="bg-slate-50/30">
                                                <td className="px-6 py-1.5 text-slate-400 font-medium pl-8">{item.Apartado_PyG}</td>
                                                <td className="px-6 py-1.5 text-right text-slate-400 font-bold">{formatCurrency(item.Total)}</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-blue-600 text-white">
                                            <td className="px-6 py-5 font-black uppercase text-xs tracking-tighter pl-6">RESULTADO DEL EJERCICIO</td>
                                            <td className="px-6 py-5 text-right font-black text-xl">{formatCurrency(summary.resultado_ejercicio)}</td>
                                        </tr>
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Evolution & Charts */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Monthly Bar Chart */}
                    <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 h-[380px]">
                        <h3 className="font-bold text-slate-700 mb-6 flex items-center justify-between">
                            Evolución {filters.year}
                            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Millones €</span>
                        </h3>
                        <div className="w-full h-full pb-8">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={evolution.map(m => ({ ...m, Resultado: m.Ingresos - m.Gastos }))}>
                                    <CartesianGrid strokeDasharray="1 4" vertical={false} stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="Month"
                                        axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }}
                                        tickFormatter={m => months.find(mo => mo.id === m)?.name.substring(0, 3)}
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        formatter={val => formatCurrency(val)}
                                    />
                                    <Bar dataKey="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
                                    <Bar dataKey="Gastos" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={12} />
                                    <Bar dataKey="Resultado" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
