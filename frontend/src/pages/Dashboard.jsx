import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchSalesDashboard, fetchFilterOptions } from '../services/api';
import { Link } from 'react-router-dom';
import { KpiCard } from '../components/dashboard/KpiCard';
import { SalesByRepChart } from '../components/dashboard/SalesByRepChart';
import { SalesByDayChart } from '../components/dashboard/SalesByDayChart';
import { SalesMarginEvolutionChart } from '../components/dashboard/SalesMarginEvolutionChart';
import { DashboardCarousel } from '../components/dashboard/DashboardCarousel';
import { DashboardTablesCarousel } from '../components/dashboard/DashboardTablesCarousel';
import useAuthStore from '../store/authStore';
import useDataStore from '../store/dataStore';
import { PageHeader } from '../components/common/PageHeader';
import GeographyMapModal from '../components/dashboard/GeographyMapModal';
import ClientSearchSelect from '../components/common/ClientSearchSelect';

const DIVISIONS_MAP = {
    'Conectrónica': ['JOSE CESPEDES BLANCO', 'ANTONIO MACHO MACHO', 'JESUS COLLADO ARAQUE', 'ADRIÁN ROMERO JIMENEZ'],
    'Sismecánica': ['JUAN CARLOS BENITO RAMOS', 'JAVIER ALLEN PERKINS'],
    'Informática Industrial': ['JUAN CARLOS VALDES ANTON']
};

export default function Dashboard() {
    const { user, logoutUser } = useAuthStore();
    const { dashboardData, dashboardFiltersHash, setDashboardData, filterOptions, setFilterOptions } = useDataStore();
    const [data, setData] = useState(dashboardData);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [options, setOptions] = useState({ companies: [], reps: [], clients: [], series: [] });
    const [showTables, setShowTables] = useState(false);
    const [showGeoMap, setShowGeoMap] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();

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
            client_id: searchParams.get('client_id') || null,
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
            if (name === 'sales_rep_id' && value) {
                // Find rep name from options
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

            if (name === 'division') {
                // If division changes, clear selected rep if they don't belong to new division
                if (value && prev.sales_rep_id) {
                    const allowedReps = DIVISIONS_MAP[value] || [];
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
        <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 text-slate-900 dark:text-slate-100 font-sans scale-[0.98] origin-top transition-all duration-500">
            <PageHeader moduleName="Ventas">
                <Link 
                    to="/clientes" 
                    className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 rounded shadow-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition font-bold text-xs flex items-center h-[34px] gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    Índice Clientes
                </Link>
            </PageHeader>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg shadow-sm mb-4 flex flex-wrap gap-3 items-end w-full border border-slate-100 dark:border-slate-800 transition-colors">
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-tighter">Inicio</label>
                    <input type="date" name="start_date" value={filters.start_date || ''} onChange={handleFilterChange} className="block w-32 rounded border border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs p-1.5 text-slate-700 bg-white" />
                </div>
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-tighter">Fin</label>
                    <input type="date" name="end_date" value={filters.end_date || ''} onChange={handleFilterChange} className="block w-32 rounded border border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs p-1.5 text-slate-700 bg-white" />
                </div>

                <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-tighter">División</label>
                    <select name="division" value={filters.division || ''} onChange={handleFilterChange} className="block w-40 rounded border border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs p-1.5 text-slate-700 bg-white">
                        <option value="">Todas</option>
                        <option value="Conectrónica">Conectrónica</option>
                        <option value="Sismecánica">Sismecánica</option>
                        <option value="Informática Industrial">Informática Industrial</option>
                    </select>
                </div>

                <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-tighter">Comercial</label>
                    <select
                        name="sales_rep_id"
                        value={filters.sales_rep_id || ''}
                        onChange={handleFilterChange}
                        disabled={isRestrictedToRep}
                        className={`block w-40 rounded border border-slate-200 shadow-sm text-xs p-1.5 ${isRestrictedToRep ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'focus:border-blue-500 focus:ring-blue-500 text-slate-700 bg-white'}`}
                    >
                        {!isRestrictedToRep && <option value="">Todos</option>}
                        {options.reps
                            .filter(r => {
                                if (!filters.division) return true;
                                const rep_name = (r.name || '').toUpperCase();
                                return DIVISIONS_MAP[filters.division]?.some(d => rep_name.includes(d.toUpperCase()));
                            })
                            .map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                    </select>
                </div>

                <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-tighter">Cliente (Nombre o Cód)</label>
                    <ClientSearchSelect 
                        value={filters.client_id} 
                        onChange={handleFilterChange} 
                        name="client_id"
                        placeholder="Buscar por nombre o ID..."
                    />
                </div>

                <div className="flex gap-2 ml-auto">
                    <Link to="/pedidos-pendientes-pbix" className="bg-slate-800 text-white px-3 py-1.5 rounded hover:bg-slate-900 transition font-bold text-xs h-8 flex items-center justify-center shadow-md">
                        Pendientes →
                    </Link>
                    <Link to="/comparison" className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition font-bold text-xs h-8 flex items-center justify-center shadow-md">
                        Comparativa →
                    </Link>
                </div>
            </div>



            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
                <KpiCard
                    title="Facturación"
                    value={data?.kpis?.revenue_gross || 0}
                    tooltip={`Facturación total en el periodo: ${filters.start_date || 'inicio'} hasta ${filters.end_date || 'fin'}`}
                    subtext={
                        <div className="flex flex-col items-center gap-0.5">
                            <span className="scale-90 tracking-tighter dark:text-slate-400">Ventas Brutas</span>
                            <div className="flex gap-1.5 text-[9px] font-bold">
                                <span className="text-red-500 dark:text-red-400">Abonos: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(data?.kpis?.returns || 0)}</span>
                                <span className="text-slate-500 dark:text-slate-400">Neto: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(data?.kpis?.revenue || 0)}</span>
                            </div>
                        </div>
                    }
                />
                <KpiCard
                    title="Margen"
                    value={data?.kpis?.sales_margin || 0}
                    subtext="Promedio comercial"
                    isPercentage={true}
                    tooltip="Porcentaje de beneficio sobre preventa"
                />
                <KpiCard
                    title="Pdte. Facturar"
                    value={data?.kpis?.pending_invoice || 0}
                    subtext="Albaranes"
                    isWarning={true}
                    tooltip="Importe total de albaranes pendientes de facturar en el periodo seleccionado"
                />
                <div onClick={() => setShowGeoMap(true)} className="h-full cursor-pointer transform hover:scale-[1.02] transition-transform active:scale-95">
                    <KpiCard
                        title="Clientes"
                        value={data?.kpis?.clients || 0}
                        subtext="Activos"
                        tooltip="Haz clic para ver la distribución geográfica (Mapa de Calor)"
                    />
                </div>
                <div onClick={() => setShowTables(!showTables)} className="h-full cursor-pointer transform hover:scale-[1.02] transition-transform active:scale-95">
                    <KpiCard
                        title="Facturas"
                        value={data?.kpis?.invoices || 0}
                        subtext={showTables ? "Ocultar detalles" : "Ver detalles"}
                        tooltip="Haz clic para alternar con la lista detallada"
                    />
                </div>
            </div>

            {/* Main Content Area: Alternates between Charts and Tables */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow border border-slate-100 dark:border-slate-800 mb-6 relative overflow-hidden min-h-[500px] transition-colors">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 dark:bg-slate-800/50 rounded-full -mr-12 -mt-12 pointer-events-none" />

                {!showTables ? (
                    <div className="h-[460px] animate-fadeIn">
                        <DashboardCarousel
                            salesByRepData={data?.charts?.sales_by_rep || []}
                            salesByDayData={data?.charts?.sales_by_day || []}
                            marginEvolutionData={data?.charts?.sales_margin_evolution || []}
                        />
                    </div>
                ) : (
                    <div className="animate-fadeIn">
                        <DashboardTablesCarousel
                            filters={filters}
                            topClientsData={data?.charts?.top_clients || []}
                            invoicesListData={data?.charts?.invoices_list || []}
                        />
                    </div>
                )}
            </div>

            {showGeoMap && (
                <GeographyMapModal
                    filters={filters}
                    onClose={() => setShowGeoMap(false)}
                />
            )}
        </div>
    );
}
