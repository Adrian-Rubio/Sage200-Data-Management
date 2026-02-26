import { useState, useEffect } from 'react';
import { fetchSalesDashboard, fetchFilterOptions } from '../services/api';
import { Link } from 'react-router-dom';
import { KpiCard } from '../components/dashboard/KpiCard';
import { SalesByRepChart } from '../components/dashboard/SalesByRepChart';
import { SalesByDayChart } from '../components/dashboard/SalesByDayChart';
import { SalesMarginEvolutionChart } from '../components/dashboard/SalesMarginEvolutionChart';
import { DashboardCarousel } from '../components/dashboard/DashboardCarousel';
import { TopClientsTable } from '../components/dashboard/TopClientsTable';
import useAuthStore from '../store/authStore';
import useDataStore from '../store/dataStore';

export default function Dashboard() {
    const { user, logoutUser } = useAuthStore();
    const { dashboardData, dashboardFiltersHash, setDashboardData, filterOptions, setFilterOptions } = useDataStore();
    const [data, setData] = useState(dashboardData);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [options, setOptions] = useState({ companies: [], reps: [], clients: [], series: [] });

    const hasManagePermission = user?.role === 'admin' || user?.permissions?.admin || user?.role_obj?.name === 'admin' || user?.role_obj?.can_manage_users;

    // Un usuario solo está restringido a su comercial si NO tiene permisos de admin Y SÍ tiene un sales_rep_id asignado en su cuenta
    const isRestrictedToRep = !hasManagePermission && !!user?.sales_rep_id;
    const initialSalesRepId = isRestrictedToRep ? user?.sales_rep_id?.toUpperCase() : null;

    // Filters State
    const [filters, setFilters] = useState(() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        return {
            start_date: firstDay.toISOString().split('T')[0],
            end_date: lastDay.toISOString().split('T')[0],
            company_id: null,
            sales_rep_id: initialSalesRepId,
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

    const loadDashboard = async () => {
        const currentHash = JSON.stringify(filters);
        if (dashboardData && dashboardFiltersHash === currentHash) {
            setData(dashboardData);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const result = await fetchSalesDashboard(filters);
            setData(result);
            setDashboardData(result, currentHash);
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
                'Conectrónica': ['JOSE CESPEDES BLANCO', 'ANTONIO MACHO MACHO', 'JESUS COLLADO ARAQUE', 'ADRIÁN ROMERO JIMENEZ'],
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
        <div className="w-full min-h-screen bg-[#f8fafc] p-4 text-gray-800 font-sans">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <span className="bg-slate-800 text-white px-3 py-1 rounded text-lg">CENVALSA</span>
                        Módulo de Ventas
                    </h1>
                </div>
                <div className="flex gap-3">
                    <span className="text-slate-600 font-medium text-sm flex items-center mr-2">{user?.sub}</span>
                    <button onClick={logoutUser} className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-4 py-2 rounded shadow-sm transition font-medium text-sm h-[38px] flex items-center justify-center">
                        Cerrar Sesión
                    </button>
                    <Link to="/" className="bg-white text-slate-600 border border-slate-300 px-4 py-2 rounded shadow-sm hover:bg-slate-50 transition font-medium text-sm h-[38px] flex items-center justify-center">
                        Volver al Menú
                    </Link>
                    <button onClick={() => window.location.reload(true)} className="bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2 rounded shadow-sm hover:bg-blue-100 transition font-medium text-sm h-[38px] flex items-center justify-center">
                        Refrescar App
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4 items-end w-full">
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Inicio</label>
                    <input type="date" name="start_date" value={filters.start_date || ''} onChange={handleFilterChange} className="block w-40 rounded-md border border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 text-gray-900 bg-white" />
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Fin</label>
                    <input type="date" name="end_date" value={filters.end_date || ''} onChange={handleFilterChange} className="block w-40 rounded-md border border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 text-gray-900 bg-white" />
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
                                const divisions = {
                                    'Conectrónica': ['JOSE CESPEDES BLANCO', 'ANTONIO MACHO MACHO', 'JESUS COLLADO ARAQUE', 'ADRIÁN ROMERO JIMENEZ'],
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

                <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Buscar Cliente (Código)</label>
                    <input
                        type="text"
                        placeholder="Ej: 430001"
                        value={filters.client_id || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, client_id: e.target.value }))}
                        className="block w-40 rounded-md border border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 text-gray-900 bg-white"
                    />
                </div>

                <div className="flex gap-2 ml-auto">
                    {/* Botón de pedidos pendientes temporalmente oculto a petición del usuario
                    <Link to="/pending-orders" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition font-medium h-10 flex items-center justify-center shadow-sm">
                        Pedidos Pendientes →
                    </Link>
                    */}
                    <Link to="/comparison" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition font-medium h-10 flex items-center justify-center shadow-sm">
                        Comparativa Anual →
                    </Link>
                </div>
            </div>



            {/* Top Row: KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <KpiCard title="Facturación" value={data?.kpis?.revenue || 0} subtext="Total periodo" />
                <KpiCard title="Margen" value={data?.kpis?.sales_margin || 0} subtext="Promedio comercial" isPercentage={true} />
                <KpiCard title="Pdte. Facturar" value={data?.kpis?.pending_invoice || 0} subtext="Albaranes" isWarning={true} />
                <KpiCard title="Clientes" value={data?.kpis?.clients || 0} subtext="Activos" />
                <KpiCard title="Facturas" value={data?.kpis?.invoices || 0} subtext="Emitidas" />
            </div>

            {/* Carousel Area (Zona Roja) */}
            <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-slate-100 mb-6 relative overflow-hidden">
                {/* Decorative background for the "Zona Roja" concept */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 pointer-events-none" />

                <div className="min-h-[500px] h-[600px]">
                    <DashboardCarousel
                        salesByRepData={data?.charts?.sales_by_rep || []}
                        salesByDayData={data?.charts?.sales_by_day || []}
                        marginEvolutionData={data?.charts?.sales_margin_evolution || []}
                    />
                </div>
            </div>

            {/* Bottom Section: Table */}
            <div className="grid grid-cols-1 gap-6">
                <TopClientsTable data={data?.charts?.top_clients || []} />
            </div>

        </div>
    );
}
