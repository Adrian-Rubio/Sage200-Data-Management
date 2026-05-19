import React, { useState, useEffect, useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, LabelList
} from 'recharts';
import { fetchAlmacenStats, fetchOperators } from '../services/api';
import { KpiCard } from '../components/dashboard/KpiCard';
import { PageHeader } from '../components/common/PageHeader';
import { YEARS, MONTHS, CHART_COLORS } from '../utils/constants';
import { FilterBar, FilterSelect } from '../components/ui/Filters';
import { GenericTable } from '../components/ui/GenericTable';
import { ChartCarousel } from '../components/ui/ChartCarousel';

export default function Almacen() {
    const [data, setData] = useState({ kpis: {}, data: [], chart_data: [], operators: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [operators, setOperators] = useState([]);

    // Filters
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
    const [selectedOperator, setSelectedOperator] = useState('');

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

    // Table Column Definitions
    const columns = [
        {
            key: 'NombreOperario',
            label: 'Operario',
            className: 'font-bold text-slate-800 dark:text-slate-200'
        },
        {
            key: 'TotalPedidos',
            label: 'Pedidos',
            align: 'center',
            render: (val) => (
                <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full text-[10px] font-black transition-colors">
                    {val}
                </span>
            )
        },
        {
            key: 'TotalLineas',
            label: 'Líneas',
            align: 'center',
            className: 'font-bold text-slate-600 dark:text-slate-300',
            render: (val) => val.toLocaleString('es-ES')
        },
        {
            key: 'TotalUnidades',
            label: 'Unidades',
            align: 'center',
            className: 'font-bold text-slate-600 dark:text-slate-300',
            render: (val) => val.toLocaleString('es-ES')
        }
    ];

    // Sub-table renderer for expandable rows
    const renderExpandedOperator = (opGroup) => {
        return (
            <div className="px-8 py-3 border-l-4 border-slate-200 dark:border-slate-700 ml-4 animate-fadeIn">
                <table className="w-full text-[10px] text-slate-500 dark:text-slate-400">
                    <thead>
                        <tr className="text-left border-b border-slate-200 dark:border-slate-700 font-bold text-slate-400 dark:text-slate-500">
                            <th className="py-2">Mes / Día</th>
                            <th className="py-2 text-center">Ped.</th>
                            <th className="py-2 text-center">Lin.</th>
                            <th className="py-2 text-center">Uni.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {opGroup.details.map((detail, idx) => (
                            <tr key={idx} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                                <td className="py-2">
                                    {MONTHS.find(m => m.id === detail.Mes.toString())?.name} {detail.Dia}
                                </td>
                                <td className="py-2 text-center font-medium text-slate-600 dark:text-slate-300">{detail.Pedidos}</td>
                                <td className="py-2 text-center text-slate-600 dark:text-slate-300">{detail.Lineas}</td>
                                <td className="py-2 text-center text-slate-600 dark:text-slate-300">{detail.Unidades.toLocaleString('es-ES')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    // Carousel slides definitions
    const slides = [
        {
            title: 'Evolución de Pedidos',
            render: () => (
                <ResponsiveContainer width="100%" height="90%">
                    <LineChart data={data?.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                        <XAxis
                            dataKey="Fecha"
                            tick={{ fontSize: 10, fill: 'currentColor' }}
                            className="text-slate-500 dark:text-slate-400"
                            tickFormatter={(str) => str.split('-').slice(1).reverse().join('/')}
                        />
                        <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} className="text-slate-500 dark:text-slate-400" />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--tw-colors-white)', borderColor: 'var(--tw-colors-slate-200)', borderRadius: '0.5rem', color: 'var(--tw-colors-slate-800)' }} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} className="text-slate-600 dark:text-slate-300" />
                        {data?.operators?.map((op, idx) => (
                            <Line
                                key={op}
                                type="monotone"
                                dataKey={op}
                                stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                                strokeWidth={2}
                                dot={{ r: 3 }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            )
        },
        {
            title: 'Líneas por Operario',
            render: () => (
                <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={groupedData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                        <XAxis dataKey="NombreOperario" tick={{ fontSize: 9, angle: -45, textAnchor: 'end', fill: 'currentColor' }} className="text-slate-500 dark:text-slate-400" height={80} interval={0} />
                        <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} className="text-slate-500 dark:text-slate-400" />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--tw-colors-white)', borderColor: 'var(--tw-colors-slate-200)', borderRadius: '0.5rem', color: 'var(--tw-colors-slate-800)' }} />
                        <Bar dataKey="TotalLineas" fill="#10b981" radius={[4, 4, 0, 0]}>
                            <LabelList dataKey="TotalLineas" position="top" style={{ fontSize: '9px', fontWeight: 'bold' }} fill="currentColor" className="text-slate-500 dark:text-slate-400" />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )
        },
        {
            title: 'Unidades por Operario',
            render: () => (
                <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={groupedData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                        <XAxis dataKey="NombreOperario" tick={{ fontSize: 9, angle: -45, textAnchor: 'end', fill: 'currentColor' }} className="text-slate-500 dark:text-slate-400" height={80} interval={0} />
                        <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} className="text-slate-500 dark:text-slate-400" />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--tw-colors-white)', borderColor: 'var(--tw-colors-slate-200)', borderRadius: '0.5rem', color: 'var(--tw-colors-slate-800)' }} />
                        <Bar dataKey="TotalUnidades" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                            <LabelList dataKey="TotalUnidades" position="top" style={{ fontSize: '9px', fontWeight: 'bold' }} fill="currentColor" className="text-slate-500 dark:text-slate-400" />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )
        }
    ];

    return (
        <div className="w-full min-h-screen bg-[#f8fafc] dark:bg-slate-950 p-6 text-gray-800 dark:text-slate-100 font-sans transition-colors">
            <PageHeader moduleName="Almacén" showRefresh={true} onRefresh={loadStats} />

            {/* Filters Row */}
            <FilterBar>
                <FilterSelect
                    label="Año"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    options={YEARS}
                    widthClass="w-28"
                />
                <FilterSelect
                    label="Mes"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    options={MONTHS}
                    widthClass="w-36"
                />
                <div className="h-8 border-r border-slate-200 dark:border-slate-800 mx-1 self-center" />
                <FilterSelect
                    label="Operario"
                    value={selectedOperator}
                    onChange={(e) => setSelectedOperator(e.target.value)}
                    options={operators.map(op => ({ id: op.id, name: op.name }))}
                    placeholder="Todos los operarios"
                    widthClass="w-48"
                />
            </FilterBar>

            {loading ? (
                <div className="flex justify-center items-center h-64 animate-pulse">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 dark:border-slate-200"></div>
                </div>
            ) : error ? (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-100 dark:border-red-900/50 text-center font-bold text-xs transition-colors">
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
                        <ChartCarousel slides={slides} containerHeightClass="h-[650px]" />

                        {/* Grouped Table with Expandable Rows */}
                        <GenericTable
                            columns={columns}
                            data={groupedData}
                            title="Resumen por Operario"
                            badgeText={`${groupedData.length} Operarios`}
                            keyField="NombreOperario"
                            maxHeightClass="h-[570px]"
                            expandable={{
                                renderExpanded: renderExpandedOperator
                            }}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
