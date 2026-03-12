import React, { useState, useEffect } from 'react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';

import { Link } from 'react-router-dom';
import { fetchMonthlyClose } from '../services/api';
import useAuthStore from '../store/authStore';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
    PieChart, Pie
} from 'recharts';
import { PageHeader } from '../components/common/PageHeader';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function CierreMes() {
    const { user, logoutUser } = useAuthStore();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState(() => {
        const now = new Date();
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return {
            exercise: prevMonth.getFullYear(),
            period: prevMonth.getMonth() + 1
        };
    });


    const fetchData = async () => {
        setLoading(true);
        try {
            const result = await fetchMonthlyClose(filters);
            setData(result);
        } catch (error) {
            console.error("Error fetching monthly close report:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filters]);

    // Prepare data for charts
    const invData = data?.inventario?.por_division ?
        Object.entries(data.inventario.por_division).map(([name, value]) => ({ name, value })) : [];

    const factDivData = data?.facturación?.por_division ?
        Object.entries(data.facturación.por_division).map(([name, value]) => ({ name, value })) : [];

    const factRepData = data?.facturación?.por_comercial ?
        Object.entries(data.facturación.por_comercial).map(([name, value]) => ({ name, value })) : [];

    const formatCurrency = (val) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

    const handleExport = async () => {
        if (!data) return;
        const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const monthName = months[filters.period - 1];

        // Helper to create a heading
        const createHeading = (text) => new Paragraph({
            text: text,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
        });

        // Helper for summary lines
        const createLine = (label, value, isBold = false) => new Paragraph({
            children: [
                new TextRun({ text: `${label}: `, bold: isBold }),
                new TextRun({ text: value, bold: true, color: "000000" })
            ],
            spacing: { after: 120 }
        });

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        text: `DATOS Cierre de Mes`,
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 100 }
                    }),
                    new Paragraph({
                        text: `${monthName} ${filters.exercise}`,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 }
                    }),

                    createHeading("FACTURACIÓN GENERAL"),
                    createLine("TOTAL FACTURADO", formatCurrency(data?.facturación?.total), true),
                    ...Object.entries(data?.facturación?.por_division || {}).map(([name, val]) =>
                        createLine(`   • ${name}`, formatCurrency(val))
                    ),

                    createHeading("INVENTARIO GENERAL"),
                    createLine("VALOR TOTAL INVENTARIO", formatCurrency(data?.inventario?.total), true),
                    ...Object.entries(data?.inventario?.por_division || {}).map(([name, val]) =>
                        createLine(`   • ${name}`, formatCurrency(val))
                    ),

                    createHeading("COMPRAS Y VENTAS"),
                    createLine("PEDIDOS DE COMPRAS", formatCurrency(data?.compras)),
                    createLine("PEDIDOS VENTAS TOTAL (CARTERA)", formatCurrency(data?.cartera?.total)),
                    ...Object.entries(data?.cartera?.por_division || {}).map(([name, val]) =>
                        createLine(`   • ${name}`, formatCurrency(val))
                    ),
                    new Paragraph({ text: "" }),
                    createLine("VENTAS DEL MES (PEDIDOS)", formatCurrency(data?.ventas?.total), true),

                    createHeading("FACTURACIÓN POR COMERCIAL"),
                    ...Object.entries(data?.facturación?.por_comercial || {}).map(([name, val]) =>
                        createLine(name, formatCurrency(val))
                    ),

                    createHeading("DATOS ESPECÍFICOS"),
                    createLine("VENTAS CATALUÑA", formatCurrency(data?.ventas?.catalunya)),
                    createLine("VENTAS CYME", formatCurrency(data?.ventas?.cyme)),
                ],
            }],
        });

        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Cierre_Mes_${monthName}_${filters.exercise}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };


    return (
        <div className="p-6 max-w-[1720px] mx-auto min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-gray-800 dark:text-slate-200 font-sans transition-colors">

            <PageHeader moduleName="Cierre de Mes" showRefresh={false}>
                <button
                    onClick={handleExport}
                    className="bg-emerald-600 text-white px-3 py-1.5 rounded shadow-sm hover:bg-emerald-700 transition font-bold text-xs h-[34px] flex items-center gap-2 whitespace-nowrap"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Exportar
                </button>
            </PageHeader>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-wrap gap-8 items-end mb-10 animate-fadeIn transition-colors">

                <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 tracking-wider">Ejercicio</label>
                    <select
                        className="block w-32 rounded-xl border-slate-200 dark:border-slate-700 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2.5 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 font-semibold transition-colors"
                        value={filters.exercise}
                        onChange={(e) => setFilters(prev => ({ ...prev, exercise: parseInt(e.target.value) }))}
                    >
                        {[2024, 2025, 2026].map(year => <option key={year} value={year}>{year}</option>)}
                    </select>
                </div>
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 tracking-wider">Mes de Cierre</label>
                    <select
                        className="block w-48 rounded-xl border-slate-200 dark:border-slate-700 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2.5 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 font-semibold transition-colors"
                        value={filters.period}
                        onChange={(e) => setFilters(prev => ({ ...prev, period: parseInt(e.target.value) }))}
                    >
                        {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((m, i) => (
                            <option key={i + 1} value={i + 1}>{m}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-grow flex justify-end gap-10">
                    <div className="text-right">
                        <div className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Catuluña Mensual</div>
                        <div className="text-lg font-black text-slate-800 dark:text-slate-100">{formatCurrency(data?.ventas?.catalunya)}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Ventas CYME</div>
                        <div className="text-lg font-black text-slate-800 dark:text-slate-100">{formatCurrency(data?.ventas?.cyme)}</div>
                    </div>

                </div>
            </div>

            {loading ? (
                <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest animate-pulse">Generando reporte de cierre...</p>
                </div>
            ) : (
                <div className="animate-fadeIn space-y-6">
                    {/* Main KPIs Row */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <KPIBlock title="Facturación" value={formatCurrency(data?.facturación?.total)} icon="💰" color="emerald" />
                        <KPIBlock title="Ventas (Pedidos)" value={formatCurrency(data?.ventas?.total)} icon="📈" color="blue" />
                        <KPIBlock title="Compras" value={formatCurrency(data?.compras)} icon="🛒" color="amber" />
                        <KPIBlock title="Stock" value={formatCurrency(data?.inventario?.total)} icon="📦" color="slate" />
                    </div>


                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Inventario Breakdown */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                    Inventario
                                </div>
                            </h3>

                            <div className="space-y-4">
                                {invData.sort((a, b) => b.value - a.value).map((item, i) => (
                                    <div key={item.name} className="flex flex-col gap-2">
                                        <div className="flex justify-between text-[13px] font-bold text-slate-600 dark:text-slate-400">
                                            <span className="truncate pr-2">{item.name}</span>
                                            <span className="text-slate-900 dark:text-slate-100">{formatCurrency(item.value)}</span>
                                        </div>

                                        <div className="w-full bg-slate-50 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-100/50 dark:border-slate-700/50">
                                            <div
                                                className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full transition-all duration-1000 shadow-[2px_0_5px_rgba(0,0,0,0.1)]"
                                                style={{ width: `${(item.value / (data?.inventario?.total || 1)) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Facturación Breakdown */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                                    Facturado (Div)
                                </div>
                            </h3>

                            <div className="space-y-4">
                                {factDivData.sort((a, b) => b.value - a.value).map((item, i) => (
                                    <div key={item.name} className="flex flex-col gap-2">
                                        <div className="flex justify-between text-[13px] font-bold text-slate-600 dark:text-slate-400">
                                            <span className="truncate pr-2">{item.name}</span>
                                            <span className="text-slate-900 dark:text-slate-100">{formatCurrency(item.value)}</span>
                                        </div>

                                        <div className="w-full bg-slate-50 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-100/50 dark:border-slate-700/50">
                                            <div
                                                className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full transition-all duration-1000 shadow-[2px_0_5px_rgba(0,0,0,0.1)]"
                                                style={{ width: `${(item.value / (data?.facturación?.total || 1)) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Cartera Breakdown */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
                                    Cartera Pendiente
                                </div>
                            </h3>

                            <div className="space-y-4">
                                {Object.entries(data?.cartera?.por_division || {}).sort((a, b) => b[1] - a[1]).map(([name, value], i) => (
                                    <div key={name} className="flex flex-col gap-2">
                                        <div className="flex justify-between text-[13px] font-bold text-slate-600 dark:text-slate-400">
                                            <span className="truncate pr-2">{name}</span>
                                            <span className="text-slate-900 dark:text-slate-100">{formatCurrency(value)}</span>
                                        </div>

                                        <div className="w-full bg-slate-50 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-100/50 dark:border-slate-700/50">
                                            <div
                                                className="bg-gradient-to-r from-amber-400 to-amber-600 h-full rounded-full transition-all duration-1000 shadow-[2px_0_5px_rgba(0,0,0,0.1)]"
                                                style={{ width: `${(value / (data?.cartera?.total || 1)) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Ranking Facturación */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 bg-violet-500 rounded-full shadow-[0_0_8px_rgba(139,92,246,0.5)]"></span>
                                    Ranking Facturado
                                </div>
                            </h3>

                            <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                <table className="w-full text-xs">
                                    <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10 transition-colors">
                                        <tr className="text-slate-400 dark:text-slate-500">
                                            <th className="text-left py-3 font-black uppercase tracking-tighter w-8">Pos</th>
                                            <th className="text-left py-3 font-black uppercase tracking-tighter">Nombre</th>
                                            <th className="text-right py-3 font-black uppercase tracking-tighter">Neto</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                        {factRepData.map((rep, idx) => (
                                            <tr key={rep.name} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                                                <td className="py-3 font-bold text-slate-300 dark:text-slate-600 group-hover:text-violet-400 dark:group-hover:text-violet-400 transition-colors">{idx + 1}</td>
                                                <td className="py-3 font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{rep.name}</td>
                                                <td className="py-3 text-right font-black text-slate-900 dark:text-slate-100">{formatCurrency(rep.value)}</td>
                                            </tr>
                                        ))}

                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function KPIBlock({ title, value, icon, color }) {
    const colorClasses = {
        emerald: "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50",
        blue: "bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800/50",
        amber: "bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/50",
        slate: "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-700"
    };

    return (
        <div className={`p-8 rounded-3xl border shadow-sm ${colorClasses[color]} hover:shadow-md transition-all duration-300 group`}>
            <div className="flex justify-between items-start mb-6">
                <span className="text-3xl group-hover:scale-125 transition-transform duration-500">{icon}</span>
                <span className="text-xs font-black uppercase tracking-widest opacity-60">{title}</span>
            </div>
            <div className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight transition-colors">{value}</div>
        </div>
    );

}

function ChartCard({ title, children }) {
    return (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group transition-colors">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                {title}
            </h3>
            {children}
        </div>
    );
}
