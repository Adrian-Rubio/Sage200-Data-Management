import { useState, useEffect } from 'react';
import { fetchSalesComparison, fetchFilterOptions } from '../services/api';
import { Link } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import useDataStore from '../store/dataStore';
import useAuthStore from '../store/authStore';
import { PageHeader } from '../components/common/PageHeader';

const DIVISIONS_MAP = {
    'Conectrónica': ['JOSE CESPEDES BLANCO', 'ANTONIO MACHO MACHO', 'JESUS COLLADO ARAQUE'],
    'Sismecánica': ['JUAN CARLOS BENITO RAMOS', 'JAVIER ALLEN PERKINS'],
    'Informática Industrial': ['JUAN CARLOS VALDES ANTON']
};

const COLORS = ['#9ca3af', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Comparison() {
    const { user } = useAuthStore();
    const { comparisonData, comparisonFiltersHash, setComparisonData, filterOptions, setFilterOptions } = useDataStore();
    const [dataByRep, setDataByRep] = useState(comparisonData?.by_rep || []);
    const [dataByMonth, setDataByMonth] = useState(comparisonData?.by_month || []);
    const [loading, setLoading] = useState(!comparisonData);
    const [error, setError] = useState(null);
    const [options, setOptions] = useState(filterOptions || { companies: [], reps: [], clients: [], series: [] });

    const hasManagePermission = user?.role === 'admin' || user?.permissions?.admin || user?.role_obj?.name === 'admin' || user?.role_obj?.can_manage_users;
    const isRestrictedToRep = !hasManagePermission && !!user?.sales_rep_id;
    const initialSalesRepId = isRestrictedToRep ? user?.sales_rep_id?.toUpperCase() : null;

    // Filters
    const [filters, setFilters] = useState({
        start_year: 2023,
        end_year: 2026,
        division: null,
        sales_rep_id: initialSalesRepId
    });

    useEffect(() => {
        loadFilters();
    }, []);

    useEffect(() => {
        loadComparison();
    }, [filters]);

    const loadFilters = async () => {
        if (filterOptions) {
            setOptions(filterOptions);
            return;
        }
        try {
            const opts = await fetchFilterOptions();
            setOptions(opts || { companies: [], reps: [], clients: [], series: [] });
            setFilterOptions(opts);
        } catch (e) {
            console.error("Failed to load filters", e);
        }
    };

    const loadComparison = async () => {
        const currentHash = JSON.stringify(filters);
        if (comparisonData && comparisonFiltersHash === currentHash) {
            setDataByRep(comparisonData.by_rep || []);
            setDataByMonth(comparisonData.by_month || []);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const result = await fetchSalesComparison(filters);
            setDataByRep(result.by_rep || []);
            setDataByMonth(result.by_month || []);
            setComparisonData(result, currentHash);
        } catch (err) {
            setError("Error loading comparison data.");
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => {
            const newFilters = { ...prev, [name]: value || null };

            // Division logic (same as Dashboard)
            if (name === 'sales_rep_id' && value) {
                const rep = options.reps.find(r => r.id === value);
                if (rep) {
                    for (const [div, reps] of Object.entries(DIVISIONS_MAP)) {
                        if (reps.includes(rep.name)) {
                            newFilters.division = div;
                            break;
                        }
                    }
                }
            }
            if (name === 'division' && value && prev.sales_rep_id) {
                const allowedReps = DIVISIONS_MAP[value] || [];
                const currentRep = options.reps.find(r => r.id === prev.sales_rep_id);
                if (currentRep && !allowedReps.includes(currentRep.name)) {
                    newFilters.sales_rep_id = null;
                }
            }

            return newFilters;
        });
    };

    // Helper to generate year range for chart bars
    const years = [];
    for (let y = parseInt(filters.start_year); y <= parseInt(filters.end_year); y++) {
        years.push(y);
    }

    // Helper for formatting names
    const formatName = (name) => {
        if (name === 'JUAN CARLOS BENITO RAMOS') return 'JUAN C. BENITO';
        if (name === 'JUAN CARLOS VALDES ANTON') return 'JUAN C. VALDES';

        const parts = name.split(' ');
        if (parts.length > 2) return `${parts[0]} ${parts[1]}...`;
        return name;
    }

    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    return (
        <div className="w-full min-h-screen bg-[#f8fafc] p-6 text-gray-800">
            <PageHeader moduleName="Comparativa Anual" onRefresh={loadComparison}>
                <Link to="/ventas" className="bg-white text-slate-600 border border-slate-200 px-3 py-1.5 rounded shadow-sm hover:bg-slate-50 transition font-bold text-xs h-[34px] flex items-center justify-center whitespace-nowrap">
                    Ventas
                </Link>
                <Link to="/pending-orders" className="bg-white text-slate-600 border border-slate-200 px-3 py-1.5 rounded shadow-sm hover:bg-slate-50 transition font-bold text-xs h-[34px] flex items-center justify-center whitespace-nowrap">
                    Pendientes
                </Link>
            </PageHeader>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4 items-end w-full">
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Año Inicio</label>
                    <input
                        type="number"
                        name="start_year"
                        value={filters.start_year}
                        onChange={handleFilterChange}
                        className="block w-24 rounded-md border border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 text-gray-900 bg-white"
                        min="2020" max="2030"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Año Fin</label>
                    <input
                        type="number"
                        name="end_year"
                        value={filters.end_year}
                        onChange={handleFilterChange}
                        className="block w-24 rounded-md border border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 text-gray-900 bg-white"
                        min="2020" max="2030"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">División</label>
                    <select name="division" value={filters.division || ''} onChange={handleFilterChange} className="block w-48 rounded-md border border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 text-gray-900 bg-white">
                        <option value="">Todas</option>
                        <option value="Conectrónica">Conectrónica</option>
                        <option value="Sismecánica">Sismecánica</option>
                        <option value="Informática Industrial">Informática Industrial</option>
                    </select>
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Comercial</label>
                    <select
                        name="sales_rep_id"
                        value={filters.sales_rep_id || ''}
                        onChange={handleFilterChange}
                        disabled={isRestrictedToRep}
                        className={`block w-48 rounded-md border border-gray-300 shadow-sm sm:text-sm p-2 ${isRestrictedToRep ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' : 'focus:border-green-500 focus:ring-green-500 text-gray-900 bg-white'}`}
                    >
                        {!isRestrictedToRep && <option value="">Todos</option>}
                        {options.reps
                            .filter(r => {
                                if (!filters.division) return true;
                                return DIVISIONS_MAP[filters.division] ? DIVISIONS_MAP[filters.division].includes(r.name) : true;
                            })
                            .map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                    </select>
                </div>
            </div>

            {/* Monthly Trend Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-[500px] flex flex-col mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">Evolución Mensual ({filters.start_year}-{filters.end_year})</h3>

                {loading ? (
                    <div className="flex-grow flex items-center justify-center text-gray-500">Cargando datos...</div>
                ) : error ? (
                    <div className="flex-grow flex items-center justify-center text-red-500">{error}</div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dataByMonth} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="month"
                                tickFormatter={(val) => monthNames[val - 1]}
                            />
                            <YAxis tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}M€` : `${(val / 1000).toFixed(0)}k€`} />
                            <Tooltip
                                formatter={(val) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val)}
                                labelFormatter={(val) => monthNames[val - 1]}
                            />
                            <Legend />
                            {years.map((year, index) => (
                                <Line
                                    key={year}
                                    type="monotone"
                                    dataKey={year.toString()}
                                    stroke={COLORS[index % COLORS.length]}
                                    name={year.toString()}
                                    strokeWidth={3}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 8 }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Yearly Total Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-[600px] flex flex-col">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">Total Anual por Comercial ({filters.start_year}-{filters.end_year})</h3>

                {loading ? (
                    <div className="flex-grow flex items-center justify-center text-gray-500">Cargando datos...</div>
                ) : error ? (
                    <div className="flex-grow flex items-center justify-center text-red-500">{error}</div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dataByRep} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 13, fontWeight: 600, fill: '#1f2937' }}
                                interval={0}
                                height={60}
                                tickFormatter={formatName}
                            />
                            <YAxis tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}M€` : `${(val / 1000).toFixed(0)}k€`} />
                            <Tooltip formatter={(val) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val)} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />

                            {years.map((year, index) => (
                                <Bar
                                    key={year}
                                    dataKey={year.toString()}
                                    fill={COLORS[index % COLORS.length]}
                                    name={year.toString()}
                                    radius={[4, 4, 0, 0]}
                                    stroke={index % 2 === 0 ? '#4b5563' : '#1f2937'} strokeWidth={1}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
            <div className="mt-4 text-sm text-gray-500 italic text-center">
                Nota: Los datos previos a 2025 provienen de CENVAL (Empresa 100), los posteriores de CENVALSA INDUSTRIAL (Empresa 2).
            </div>
        </div>
    );
}
