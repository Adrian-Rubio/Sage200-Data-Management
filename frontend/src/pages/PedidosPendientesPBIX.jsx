import { useState, useEffect } from 'react';
import { fetchPendingOrders, fetchFilterOptions } from '../services/api';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { KpiCard } from '../components/dashboard/KpiCard';
import useAuthStore from '../store/authStore';
import { PageHeader } from '../components/common/PageHeader';
import { FilterBar, FilterSelect } from '../components/ui/Filters';
import { GenericTable } from '../components/ui/GenericTable';
import { ChartCarousel } from '../components/ui/ChartCarousel';
import { getDivisionColor } from '../utils/constants';

export default function PedidosPendientesPBIX() {
    const { user } = useAuthStore();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [options, setOptions] = useState({ companies: [], reps: [], clients: [], series: [] });

    // PBIX specific filters
    const [selectedEndDate, setSelectedEndDate] = useState('');

    const hasManagePermission = user?.role === 'admin' || user?.permissions?.admin || (user?.role_name || '').toLowerCase() === 'admin';
    const isRestrictedToRep = !hasManagePermission && !!user?.sales_rep_id;
    const initialSalesRepId = isRestrictedToRep ? user?.sales_rep_id?.toUpperCase() : null;

    // Filters to send to API
    const [filters, setFilters] = useState({
        start_date: null,
        end_date: null,
        company_id: null,
        sales_rep_id: initialSalesRepId,
        division: null
    });

    useEffect(() => {
        loadFilters();
    }, []);

    useEffect(() => {
        // Update date filter based on single selected date
        setFilters(prev => ({
            ...prev,
            start_date: null, // Always search from beginning
            end_date: selectedEndDate || null
        }));
    }, [selectedEndDate]);

    useEffect(() => {
        if (!isRestrictedToRep || (isRestrictedToRep && filters.sales_rep_id)) {
            loadData();
        }
    }, [filters]);

    const loadFilters = async () => {
        try {
            const opts = await fetchFilterOptions();
            setOptions(opts || { companies: [], reps: [], clients: [], series: [] });
        } catch (e) {
            console.error("Failed to load filters", e);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            let result = await fetchPendingOrders(filters);
            if (result && result.by_division) {
                result.by_division = result.by_division.map(d => ({
                    ...d,
                    "Importe pendiente": d.PendingAmount,
                    "Margen": d.MarginPct,
                    "pedidos": d.OrderCount
                }));
            }
            setData(result);
        } catch (err) {
            setError("Error loading pending orders.");
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value || null }));
    };

    const formatCurrency = (val) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

    // Columns Definition for Detailed Table
    const columns = [
        {
            key: 'NumeroPedido',
            label: 'Nº Pedido',
            className: 'font-bold text-slate-800 dark:text-slate-200'
        },
        {
            key: 'Cliente',
            label: 'Cliente',
            className: 'text-slate-600 dark:text-slate-400 max-w-[250px] truncate',
            render: (val) => <span title={val}>{val}</span>
        },
        {
            key: 'Comisionista',
            label: 'Comercial',
            className: 'text-slate-500 dark:text-slate-500'
        },
        {
            key: 'Division',
            label: 'División',
            render: (val) => {
                const color = getDivisionColor(val);
                return (
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition-colors ${color.bg}`}>
                        {val}
                    </span>
                );
            }
        },
        {
            key: 'Importe',
            label: 'Importe',
            align: 'right',
            className: 'font-bold text-slate-800 dark:text-slate-200',
            render: (val) => formatCurrency(val)
        },
        {
            key: 'Unidades',
            label: 'Unidades',
            align: 'center',
            className: 'text-slate-500 dark:text-slate-500',
            render: (val) => val.toLocaleString('es-ES')
        },
        {
            key: 'MarginPct',
            label: 'Margen (%)',
            align: 'right',
            render: (val) => (
                <span className={`font-bold transition-colors ${val > 20 ? 'text-emerald-600 dark:text-emerald-400' : val > 10 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400'}`}>
                    {val.toFixed(2)}%
                </span>
            )
        }
    ];

    // Carousel slides definitions
    const divisionHeaderRight = (
        <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-[#10b981]"></div>
                <span className="text-slate-500 dark:text-slate-400 transition-colors">Conectrónica</span>
            </div>
            <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-[#3b82f6]"></div>
                <span className="text-slate-500 dark:text-slate-400 transition-colors">Mecánica</span>
            </div>
            <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-[#8b5cf6]"></div>
                <span className="text-slate-500 dark:text-slate-400 transition-colors">I. Industrial</span>
            </div>
        </div>
    );

    const slides = [
        {
            title: 'Importe pendiente por División',
            headerRight: divisionHeaderRight,
            render: () => (
                <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={data?.by_division} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="Division" tick={{ fontSize: 13, fontWeight: 600, fill: '#374151' }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip
                            formatter={(val) => formatCurrency(val)}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="Importe pendiente" radius={[6, 6, 0, 0]} barSize={120}>
                            {data?.by_division?.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getDivisionColor(entry.Division).fill} />
                            ))}
                            <LabelList
                                dataKey="Importe pendiente"
                                position="top"
                                formatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}M€` : `${(val / 1000).toFixed(0)}k€`}
                                style={{ fontSize: '14px', fontWeight: '800', fill: '#1e40af' }}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )
        },
        {
            title: 'Margen por División',
            headerRight: divisionHeaderRight,
            render: () => (
                <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={data?.by_division} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="Division" tick={{ fontSize: 13, fontWeight: 600, fill: '#374151' }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip formatter={(val) => `${(val * 100).toFixed(1)}%`} />
                        <Bar dataKey="Margen" radius={[6, 6, 0, 0]} barSize={100}>
                            {data?.by_division?.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getDivisionColor(entry.Division).fill} />
                            ))}
                            <LabelList
                                dataKey="Margen"
                                position="top"
                                formatter={(val) => `${(val * 100).toFixed(1)}%`}
                                style={{ fontSize: '14px', fontWeight: '800', fill: '#065f46' }}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )
        },
        {
            title: 'Número de Pedidos por División',
            headerRight: divisionHeaderRight,
            render: () => (
                <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={data?.by_division} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="Division" tick={{ fontSize: 13, fontWeight: 600, fill: '#374151' }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip />
                        <Bar dataKey="pedidos" radius={[6, 6, 0, 0]} barSize={100}>
                            {data?.by_division?.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getDivisionColor(entry.Division).fill} />
                            ))}
                            <LabelList
                                dataKey="pedidos"
                                position="top"
                                style={{ fontSize: '14px', fontWeight: '800', fill: '#92400e' }}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )
        }
    ];

    return (
        <div className="w-full text-slate-800 dark:text-slate-200 font-sans transition-colors">
            <PageHeader moduleName="Pedidos Pendientes (Vista PBIX)" onRefresh={loadData}>
                <Link to="/ventas" className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition font-bold text-xs h-[34px] flex items-center justify-center whitespace-nowrap">
                    Ventas
                </Link>
            </PageHeader>

            {/* Filters Row */}
            <FilterBar>
                <div className="flex flex-col">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 transition-colors">Pendientes Hasta:</label>
                    <input
                        type="date"
                        value={selectedEndDate}
                        onChange={(e) => setSelectedEndDate(e.target.value)}
                        className="block w-40 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm focus:border-blue-500 focus:ring-0 text-xs p-2.5 font-bold text-slate-700 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-800/50 transition-colors cursor-pointer outline-none hover:bg-slate-100/50 dark:hover:bg-slate-800"
                    />
                </div>
                <div className="h-8 border-r border-slate-200 dark:border-slate-800 mx-1 self-center" />
                <FilterSelect
                    label="Empresa"
                    value={filters.company_id || ''}
                    onChange={(e) => handleFilterChange({ target: { name: 'company_id', value: e.target.value } })}
                    options={options.companies.map(c => ({ id: c.id, name: c.name }))}
                    placeholder="Todas"
                    widthClass="w-36"
                />
                <FilterSelect
                    label="División"
                    value={filters.division || ''}
                    onChange={(e) => handleFilterChange({ target: { name: 'division', value: e.target.value } })}
                    options={['Conectrónica', 'Sismecánica', 'Informática Industrial']}
                    placeholder="Todas"
                    widthClass="w-40"
                />
                <FilterSelect
                    label="Comercial"
                    value={filters.sales_rep_id || ''}
                    onChange={(e) => handleFilterChange({ target: { name: 'sales_rep_id', value: e.target.value } })}
                    options={options.reps.map(r => ({ id: r.id, name: r.name }))}
                    placeholder={isRestrictedToRep ? null : "Todos"}
                    widthClass="w-44"
                />
            </FilterBar>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
                </div>
            ) : error ? (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-100 dark:border-red-900/50 text-center font-bold text-xs transition-colors">
                    {error}
                </div>
            ) : (
                <>
                    {/* Row 1: KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <KpiCard title="Pedidos" value={data?.kpis?.total_orders || 0} subtext="Nº Total" />
                        <KpiCard title="Imp. Pendiente" value={data?.kpis?.total_amount || 0} subtext="Importe Total" isWarning={true} />
                        <KpiCard title="Margen Pdte." value={data?.kpis?.global_margin_pct || 0} subtext="Global" isPercentage={true} />
                        <KpiCard title="Unidades" value={data?.kpis?.total_units || 0} subtext="Pendientes" />
                    </div>

                    {/* Row 2: Consolidated Carousel for all charts */}
                    <div className="mb-6">
                        <ChartCarousel slides={slides} containerHeightClass="h-[600px]" />
                    </div>

                    {/* Row 3: Detailed Orders Table */}
                    <GenericTable
                        columns={columns}
                        data={data?.detailed_orders || []}
                        title="Listado Detallado de Pedidos"
                        badgeText={`${data?.detailed_orders?.length || 0} Pedidos`}
                        keyField="NumeroPedido"
                        maxHeightClass="max-h-[600px]"
                    />
                </>
            )}
        </div>
    );
}
