import { useState, useEffect } from 'react';
import { fetchPendingPurchases, fetchFilterOptions } from '../services/api';
import { Link } from 'react-router-dom';
import useDataStore from '../store/dataStore';
import { PageHeader } from '../components/common/PageHeader';

// Helper for status badges
const StatusBadge = ({ status }) => {
    switch (status) {
        case 'Entregado':
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 transition-colors">● Entregado</span>;
        case 'Parcial':
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 transition-colors">● Parcial</span>;
        case 'Pendiente':
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 transition-colors">● Pendiente</span>;
        default:
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-300 transition-colors">● {status || 'Desconocido'}</span>;
    }
};

// Component for rendering order lines
const LinesTable = ({ lines, isHijo = false }) => {
    if (!lines || lines.length === 0) return <div className="p-4 text-sm text-gray-500 dark:text-slate-400 italic">No hay líneas detalladas.</div>;

    return (
        <div className={`p-4 ${isHijo ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : 'bg-gray-50 dark:bg-slate-800'} transition-colors rounded-b-lg`}>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700 text-sm transition-colors">
                <thead>
                    <tr className="text-left text-gray-500 dark:text-slate-400">
                        <th className="pb-2 font-medium">Línea</th>
                        <th className="pb-2 font-medium">Artículo</th>
                        <th className="pb-2 font-medium">Descripción</th>
                        <th className="pb-2 font-medium text-right">Pedidas</th>
                        <th className="pb-2 font-medium text-right">Recibidas</th>
                        <th className="pb-2 font-medium text-right">Pendientes</th>
                        <th className="pb-2 font-medium text-right">Estado</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50 transition-colors">
                    {lines.map((l, idx) => (
                        <tr key={idx} className="hover:bg-white dark:hover:bg-slate-700/50 transition-colors">
                            <td className="py-2 text-gray-600 dark:text-slate-400 font-mono text-xs">{l.LineaOrden}</td>
                            <td className="py-2 text-gray-900 dark:text-slate-200 font-medium">{l.CodigoArticulo}</td>
                            <td className="py-2 text-gray-500 dark:text-slate-400 truncate max-w-xs" title={l.DescripcionArticulo}>{l.DescripcionArticulo}</td>
                            <td className="py-2 text-right text-gray-600 dark:text-slate-300">{l.UnidadesPedidas}</td>
                            <td className="py-2 text-right text-green-600 dark:text-green-500 font-medium">{l.UnidadesRecibidas}</td>
                            <td className="py-2 text-right text-red-600 dark:text-red-500">{l.UnidadesPendientes}</td>
                            <td className="py-2 text-right"><StatusBadge status={l.status_calculado} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// Component for a nested Row (Padre -> Hijos -> Lineas)
// Replaced by PurchaseEnhancedRow inside Purchases component


export default function PedidosCompra() {
    const { purchasesData, setPurchasesData, filterOptions, setFilterOptions } = useDataStore();
    const [data, setData] = useState(purchasesData || []);
    const [loading, setLoading] = useState(!purchasesData);
    const [error, setError] = useState(null);
    const [options, setOptions] = useState(filterOptions || { companies: [], reps: [], clients: [], series: [] });

    // Detailed Filters
    const [filters, setFilters] = useState({
        company_id: '100', // CENVALSA INDUSTRIAL default
        status: '',
        exercise: new Date().getFullYear(),
        series: '',
        order_num: '',
        parent_order_num: '',
        provider: '',
        division: '',
        origin: ''
    });

    useEffect(() => {
        loadFilters();
        loadData();
    }, []); // Initial load

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

    const loadData = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            // Mapping UI filters to API
            const apiFilters = {
                company_id: filters.company_id || null,
                status: filters.status || null,
                exercise: filters.exercise ? parseInt(filters.exercise) : null,
                series: filters.series || null,
                order_num: filters.order_num ? parseInt(filters.order_num) : null,
                parent_order_num: filters.parent_order_num ? parseInt(filters.parent_order_num) : null,
                provider: filters.provider || null,
                division: filters.division || null,
                origin: filters.origin || null
            };

            const result = await fetchPendingPurchases(apiFilters);
            setData(result);
            if (!filters.status && !filters.series && !filters.order_num && !filters.parent_order_num && !filters.provider && !filters.division && !filters.origin && filters.company_id === '100') {
                setPurchasesData(result);
            }
        } catch (err) {
            setError("Error cargando pedidos de compra. Verifica el backend.");
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const formatCurrency = (val) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val || 0);
    const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('es-ES') : '-';

    return (
        <div className="w-full min-h-screen bg-[#f8fafc] dark:bg-slate-950 p-4 text-gray-800 dark:text-slate-200 font-sans transition-colors">
            <PageHeader moduleName="Gestión de Pedidos de Compra" onRefresh={loadData}>
                <Link to="/compras" className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition font-bold text-xs h-[34px] flex items-center justify-center whitespace-nowrap">
                    Compras
                </Link>
            </PageHeader>

            {/* Advanced Filters Bar - ERP Style */}
            <form onSubmit={(e) => { e.preventDefault(); loadData(); }} className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6 font-sans transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 items-end">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Ejercicio</label>
                        <input name="exercise" type="number" value={filters.exercise || ''} onChange={handleFilterChange} placeholder="2026" className="w-full rounded-lg border-slate-200 dark:border-slate-700 shadow-sm focus:border-indigo-500 focus:ring-0 text-xs p-2.5 font-bold text-slate-700 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 transition-colors" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Empresa</label>
                        <select
                            name="company_id"
                            value={filters.company_id || ''}
                            onChange={handleFilterChange}
                            className="w-full rounded-lg border-slate-200 dark:border-slate-700 shadow-sm focus:border-indigo-500 focus:ring-0 text-xs p-2.5 font-bold text-slate-700 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 transition-colors"
                        >
                            <option value="">Todas</option>
                            <option value="100">Cenvalsa Industrial</option>
                            <option value="400">Siscon</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Estado</label>
                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="w-full rounded-lg border-slate-200 dark:border-slate-700 shadow-sm focus:border-indigo-500 focus:ring-0 text-xs p-2.5 font-bold text-slate-700 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 transition-colors"
                        >
                            <option value="">Todos</option>
                            <option value="pending">Pte. Recibir</option>
                            <option value="partial">Recepción Parcial</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Serie</label>
                        <input name="series" type="text" value={filters.series || ''} onChange={handleFilterChange} placeholder="Ej: CP" className="w-full rounded-lg border-slate-200 dark:border-slate-700 shadow-sm focus:border-indigo-500 focus:ring-0 text-xs p-2.5 font-bold text-slate-700 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 transition-colors" />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Nº Pedido</label>
                        <input name="order_num" type="number" value={filters.order_num || ''} onChange={handleFilterChange} placeholder="Pedido" className="w-full rounded-lg border-slate-200 dark:border-slate-700 shadow-sm focus:border-indigo-500 focus:ring-0 text-xs p-2.5 font-bold text-slate-700 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 transition-colors" />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Proveedor</label>
                        <input name="provider" type="text" value={filters.provider || ''} onChange={handleFilterChange} placeholder="Nombre prov..." className="w-full rounded-lg border-slate-200 dark:border-slate-700 shadow-sm focus:border-indigo-500 focus:ring-0 text-xs p-2.5 font-bold text-slate-700 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 transition-colors" />
                    </div>

                    <div>
                        <button type="submit" className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition font-bold text-xs h-[38px] flex items-center justify-center gap-2 shadow-sm">
                            🔍 Aplicar Filtros
                        </button>
                    </div>
                </div>
            </form>

            {/* Density Data Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
                {loading ? (
                    <div className="p-20 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 dark:border-slate-700 border-t-indigo-600 mb-4"></div>
                        <div className="text-slate-500 dark:text-slate-400 font-medium">Recuperando información...</div>
                    </div>
                ) : error ? (
                    <div className="p-20 text-center text-red-500 font-medium">{error}</div>
                ) : data.length === 0 ? (
                    <div className="p-20 text-center text-slate-400 dark:text-slate-500 font-medium">No hay registros para estos filtros.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 transition-colors">
                            <thead className="bg-[#444b41] dark:bg-slate-800 text-white transition-colors">
                                <tr className="divide-x divide-slate-600 dark:divide-slate-700">
                                    <th className="px-2 py-2 text-left text-[11px] font-bold uppercase tracking-wider">Ejercicio</th>
                                    <th className="px-2 py-2 text-left text-[11px] font-bold uppercase tracking-wider">Serie</th>
                                    <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider">Nº Pedido</th>
                                    <th className="px-2 py-2 text-left text-[11px] font-bold uppercase tracking-wider">P. Origen</th>
                                    <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider">Fecha Pedido</th>
                                    <th className="px-2 py-2 text-left text-[11px] font-bold uppercase tracking-wider">Prov.</th>
                                    <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider">Razón Social</th>
                                    <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider">Fecha Neces.</th>
                                    <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider">Fecha Tope</th>
                                    <th className="px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wider">Líns.</th>
                                    <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wider">Importe Líq.</th>
                                    <th className="px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wider">Estado</th>
                                    <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider">Observaciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800/50 transition-colors">
                                {data.map((pedido, idx) => (
                                    <PurchaseEnhancedRow key={idx} pedido={pedido} formatCurrency={formatCurrency} formatDate={formatDate} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <div className="mt-4 text-[11px] text-slate-400 dark:text-slate-500 flex justify-between px-2">
                <span>Total registros cargados: {data.length}</span>
                <span>Base de Datos Sage200 (Solo lectura)</span>
            </div>
        </div>
    );
}

// Nueva fila mejorada para mayor densidad de información
const PurchaseEnhancedRow = ({ pedido, formatCurrency, formatDate }) => {
    const [expanded, setExpanded] = useState(false);
    const hasChildren = pedido.pedidos_hijos && pedido.pedidos_hijos.length > 0;
    const isHijo = pedido._AEL_OrigenPedido === 'HIJO';

    // Format Pedido Origen
    const rawOrigen = pedido._AEL_NumeroPedOrigen;
    const pedidoOrigen = (rawOrigen && parseInt(rawOrigen) > 0) ? parseInt(rawOrigen) : "N/A";

    return (
        <>
            <tr className={`divide-x divide-slate-100 dark:divide-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-[12px] ${isHijo ? 'bg-amber-50/30 dark:bg-amber-900/10' : ''}`}>
                <td className="px-2 py-2 whitespace-nowrap text-slate-600 dark:text-slate-400">{pedido.EjercicioPedido}</td>
                <td className="px-2 py-2 whitespace-nowrap text-slate-600 dark:text-slate-400 font-mono">{pedido.SeriePedido}</td>
                <td className="px-3 py-2 whitespace-nowrap font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                    {(hasChildren || (pedido.lineas && pedido.lineas.length > 0)) && (
                        <button onClick={() => setExpanded(!expanded)} className="hover:text-indigo-600 dark:hover:text-indigo-400 p-0.5">
                            <span className="text-[10px]">{expanded ? '▼' : '▶'}</span>
                        </button>
                    )}
                    {pedido.NumeroPedido}
                    {isHijo && <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-1 rounded text-[10px] uppercase font-bold ml-1">Hijo</span>}
                    {pedido.tipo === 'NORMAL' && <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1 rounded text-[10px] uppercase font-bold ml-1">Normal</span>}
                </td>
                <td className={`px-2 py-2 whitespace-nowrap font-mono ${pedidoOrigen !== "N/A" ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
                    {pedidoOrigen}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-slate-600 dark:text-slate-400">{formatDate(pedido.FechaPedido)}</td>
                <td className="px-2 py-2 whitespace-nowrap text-slate-600 dark:text-slate-400 font-mono">{pedido.CodigoProveedor}</td>
                <td className="px-3 py-2 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200 max-w-[150px] truncate" title={pedido.RazonSocial}>{pedido.RazonSocial}</td>
                <td className="px-3 py-2 whitespace-nowrap text-slate-600 dark:text-slate-400">{formatDate(pedido.FechaNecesaria)}</td>
                <td className="px-3 py-2 whitespace-nowrap text-slate-600 dark:text-slate-400">{formatDate(pedido.FechaTope)}</td>
                <td className="px-2 py-2 whitespace-nowrap text-center text-slate-500 dark:text-slate-400">{pedido.NumeroLineas || pedido.lineas?.length || 0}</td>
                <td className="px-3 py-2 whitespace-nowrap text-right font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(pedido.ImporteLiquido)}</td>
                <td className="px-3 py-2 whitespace-nowrap text-center">
                    <StatusBadge status={pedido.status_global} />
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-slate-500 dark:text-slate-400 max-w-[200px] truncate italic" title={pedido.ObservacionesPedido}>
                    {pedido.ObservacionesPedido || '-'}
                </td>
            </tr>

            {expanded && (
                <tr className="bg-slate-100/50 dark:bg-slate-800/30 transition-colors">
                    <td colSpan="13" className="p-4 border-l-4 border-indigo-500 dark:border-indigo-400 shadow-inner">
                        {/* Lines of this specific order */}
                        {pedido.lineas && pedido.lineas.length > 0 && (
                            <div className="mb-4">
                                <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Detalle de Líneas</h4>
                                <LinesTable lines={pedido.lineas} />
                            </div>
                        )}

                        {/* If it's a parent, show children links or summary */}
                        {!isHijo && hasChildren && (
                            <div>
                                <h4 className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-2">Entregas Derivadas (Pedidos Hijo)</h4>
                                <div className="space-y-2">
                                    {pedido.pedidos_hijos.map((hijo, hidx) => (
                                        <div key={hidx} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">Pedido {hijo.SeriePedido}-{hijo.NumeroPedido}</span>
                                                    {hijo._AEL_NumeroPedOrigen && (
                                                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1 rounded text-slate-500 dark:text-slate-400 font-mono">Origen: {hijo._AEL_NumeroPedOrigen}</span>
                                                    )}
                                                </div>
                                                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Fecha: {formatDate(hijo.FechaPedido)}</span>
                                            </div>
                                            <LinesTable lines={hijo.lineas} isHijo={true} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </td>
                </tr>
            )}
        </>
    );
};
