import { useState, useEffect } from 'react';
import { fetchSalesDashboard, fetchFilterOptions } from '../services/api';
import { Link } from 'react-router-dom';
import { KpiCard } from '../components/dashboard/KpiCard';
import { SalesByRepChart } from '../components/dashboard/SalesByRepChart';
import { SalesByDayChart } from '../components/dashboard/SalesByDayChart';
import { CommissionDonutChart } from '../components/dashboard/CommissionDonutChart';
import { TopClientsTable } from '../components/dashboard/TopClientsTable';

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [options, setOptions] = useState({ companies: [], reps: [], clients: [], series: [] });

    // Filters State
    const [filters, setFilters] = useState(() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        return {
            start_date: firstDay.toISOString().split('T')[0],
            end_date: lastDay.toISOString().split('T')[0],
            company_id: null,
            sales_rep_id: null,
            client_id: null,
            series_id: null,
            division: null
        };
    });

    useEffect(() => {
        loadFilters();
    }, []);

    useEffect(() => {
        loadDashboard();
    }, [filters]);

    const loadFilters = async () => {
        try {
            const opts = await fetchFilterOptions();
            setOptions(opts || { companies: [], reps: [], clients: [], series: [] });
        } catch (e) {
            console.error("Failed to load filters", e);
        }
    };

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const result = await fetchSalesDashboard(filters);
            // Backend returns: { kpis: {...}, charts: { sales_by_rep: [], sales_by_day: [], ... } }
            setData(result);
        } catch (err) {
            setError("Error loading dashboard data. Please check backend connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;

        setFilters(prev => {
            const newFilters = { ...prev, [name]: value || null };

            const divisions = {
                'Conectrónica': ['JOSE CESPEDES BLANCO', 'ANTONIO MACHO MACHO', 'JESUS COLLADO ARAQUE'],
                'Sismecánica': ['JUAN CARLOS BENITO RAMOS', 'JAVIER ALLEN PERKINS'],
                'Informática Industrial': ['JUAN CARLOS VALDES ANTON']
            };

            if (name === 'sales_rep_id' && value) {
                // Find rep name from options
                const rep = options.reps.find(r => r.id === value);
                if (rep) {
                    for (const [div, reps] of Object.entries(divisions)) {
                        if (reps.includes(rep.name)) {
                            newFilters.division = div;
                            break;
                        }
                    }
                }
            }

            if (name === 'division') {
                // If division changes, clear selected rep if they don't belong to new division
                if (value && prev.sales_rep_id) {
                    const allowedReps = divisions[value] || [];
                    const currentRep = options.reps.find(r => r.id === prev.sales_rep_id);
                    if (currentRep && !allowedReps.includes(currentRep.name)) {
                        newFilters.sales_rep_id = null;
                    }
                } else if (!value) {
                    // If division cleared, keep the rep? Or clear? Keeping seems fine.
                }
            }

            return newFilters;
        });
    };

    if (loading && !data) return <div className="p-8 text-center">Cargando datos...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="w-full min-h-screen bg-[#dcfce7] p-6 text-gray-800">
            <h1 className="text-3xl font-bold text-green-900 mb-6 flex items-center gap-2">
                <span className="bg-green-800 text-white p-2 rounded">CENVALSA</span>
                Dashboard Ventas
            </h1>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4 items-end w-full">
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                    <input type="date" name="start_date" value={filters.start_date || ''} onChange={handleFilterChange} className="block w-40 rounded-md border border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 text-gray-900 bg-white" />
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                    <input type="date" name="end_date" value={filters.end_date || ''} onChange={handleFilterChange} className="block w-40 rounded-md border border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 text-gray-900 bg-white" />
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Empresa</label>
                    <select name="company_id" value={filters.company_id || ''} onChange={handleFilterChange} className="block w-48 rounded-md border border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 text-gray-900 bg-white">
                        <option value="">Todas</option>
                        {options.companies.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">SERIE</label>
                    <select name="series_id" value={filters.series_id || ''} onChange={handleFilterChange} className="block w-48 rounded-md border border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 text-gray-900 bg-white">
                        <option value="">Todas</option>
                        {options.series && options.series.map(s => (
                            <option key={s.id} value={s.id}>{s.name || s.id}</option>
                        ))}
                    </select>
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
                    <select name="sales_rep_id" value={filters.sales_rep_id || ''} onChange={handleFilterChange} className="block w-48 rounded-md border border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 text-gray-900 bg-white">
                        <option value="">Todos</option>
                        {options.reps
                            .filter(r => {
                                if (!filters.division) return true;
                                const divisions = {
                                    'Conectrónica': ['JOSE CESPEDES BLANCO', 'ANTONIO MACHO MACHO', 'JESUS COLLADO ARAQUE'],
                                    'Sismecánica': ['JUAN CARLOS BENITO RAMOS', 'JAVIER ALLEN PERKINS'],
                                    'Informática Industrial': ['JUAN CARLOS VALDES ANTON']
                                };
                                return divisions[filters.division] ? divisions[filters.division].includes(r.name) : true;
                            })
                            .map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                    </select>
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Cliente (Top 50)</label>
                    <select name="client_id" value={filters.client_id || ''} onChange={handleFilterChange} className="block w-48 rounded-md border border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 text-gray-900 bg-white">
                        <option value="">Todos</option>
                        {options.clients.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex gap-2 ml-auto">
                    <Link to="/pending-orders" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition font-medium h-10 flex items-center justify-center shadow-sm">
                        Pedidos Pendientes →
                    </Link>
                    <Link to="/comparison" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition font-medium h-10 flex items-center justify-center shadow-sm">
                        Comparativa Anual →
                    </Link>
                </div>
            </div>

            {/* Top Row: KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <KpiCard title="Facturación" value={data?.kpis?.revenue || 0} subtext="Total periodo" />
                <KpiCard title="Pendiente de Facturar" value={data?.kpis?.pending_invoice || 0} subtext="Albaranes pendientes" isWarning={true} />
                <KpiCard title="Clientes Únicos" value={data?.kpis?.clients || 0} subtext="Activos" />
                <KpiCard title="Número Facturas" value={data?.kpis?.invoices || 0} subtext="Emitidas" />
            </div>

            {/* Middle Row: Sales by Rep Details */}
            <div className="grid grid-cols-1 gap-6 mb-6">
                <div className="h-80">
                    <SalesByRepChart data={data?.charts?.sales_by_rep || []} />
                </div>
            </div>

            {/* Bottom Row: Charts & Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="h-80">
                    <SalesByDayChart data={data?.charts?.sales_by_day || []} />
                </div>
                <div className="h-80">
                    <CommissionDonutChart data={data?.charts?.commission_dist || []} />
                </div>
            </div>

            {/* Detailed Table */}
            <div className="grid grid-cols-1 gap-6">
                <TopClientsTable data={data?.charts?.top_clients || []} />
            </div>
        </div>
    );
}
