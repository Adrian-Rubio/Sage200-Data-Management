import { useState, useEffect } from 'react';
import { fetchPendingPurchases, fetchFilterOptions } from '../services/api';
import { Link } from 'react-router-dom';
import useDataStore from '../store/dataStore';

// Helper for status badges
const StatusBadge = ({ status }) => {
    switch (status) {
        case 'Entregado':
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">● Entregado</span>;
        case 'Parcial':
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">● Parcial</span>;
        case 'Pendiente':
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">● Pendiente</span>;
        default:
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">● {status || 'Desconocido'}</span>;
    }
};

// Component for rendering order lines
const LinesTable = ({ lines, isHijo = false }) => {
    if (!lines || lines.length === 0) return <div className="p-4 text-sm text-gray-500 italic">No hay líneas detalladas.</div>;

    return (
        <div className={`p-4 ${isHijo ? 'bg-indigo-50/50' : 'bg-gray-50'}`}>
            <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                    <tr className="text-left text-gray-500">
                        <th className="pb-2 font-medium">Línea</th>
                        <th className="pb-2 font-medium">Artículo</th>
                        <th className="pb-2 font-medium">Descripción</th>
                        <th className="pb-2 font-medium text-right">Pedidas</th>
                        <th className="pb-2 font-medium text-right">Recibidas</th>
                        <th className="pb-2 font-medium text-right">Pendientes</th>
                        <th className="pb-2 font-medium text-right">Estado</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {lines.map((l, idx) => (
                        <tr key={idx} className="hover:bg-white transition-colors">
                            <td className="py-2 text-gray-600 font-mono text-xs">{l.LineaOrden}</td>
                            <td className="py-2 text-gray-900 font-medium">{l.CodigoArticulo}</td>
                            <td className="py-2 text-gray-500 truncate max-w-xs" title={l.DescripcionArticulo}>{l.DescripcionArticulo}</td>
                            <td className="py-2 text-right text-gray-600">{l.UnidadesPedidas}</td>
                            <td className="py-2 text-right text-green-600 font-medium">{l.UnidadesRecibidas}</td>
                            <td className="py-2 text-right text-red-600">{l.UnidadesPendientes}</td>
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


export default function Purchases() {
    const { purchasesData, setPurchasesData, filterOptions, setFilterOptions } = useDataStore();
    const [data, setData] = useState(purchasesData || []);
    const [loading, setLoading] = useState(!purchasesData);
    const [error, setError] = useState(null);
    const [options, setOptions] = useState(filterOptions || { companies: [], reps: [], clients: [], series: [] });

    // Detailed Filters
    const [filters, setFilters] = useState({
        company_id: '100', // CENVALSA INDUSTRIAL default
        status: '',
        exercise: null,
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
                provider_id: filters.provider || null,
                division: filters.division || null,
                origin: filters.origin || null
            };

            const result = await fetchPendingPurchases(apiFilters);
            setData(result);
            if (!filters.status && !filters.exercise && !filters.series && !filters.order_num && !filters.parent_order_num && !filters.provider && !filters.division && !filters.origin && filters.company_id === '100') {
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
        <div className="w-full min-h-screen bg-[#f8fafc] p-4 text-gray-800 font-sans">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <span className="bg-slate-800 text-white px-3 py-1 rounded text-lg">CENVALSA</span>
                        Módulo de Compras
                    </h1>
                </div>
                <div className="flex gap-3">
                    <Link to="/" className="bg-white text-slate-600 border border-slate-300 px-4 py-2 rounded shadow-sm hover:bg-slate-50 transition font-medium text-sm">
                        Volver al Menú
                    </Link>
                </div>
            </div>

            {/* Advanced Filters Bar - ERP Style */}
            <form onSubmit={loadData} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-9 gap-4 items-end">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Empresa</label>
                        <select name="company_id" value={filters.company_id || ''} onChange={handleFilterChange} className="w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2">
                            <option value="">Todas</option>
                            {options.companies?.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ejercicio</label>
                        <input name="exercise" type="number" value={filters.exercise || ''} onChange={handleFilterChange} placeholder="2026" className="w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Serie</label>
                        <input name="series" type="text" value={filters.series || ''} onChange={handleFilterChange} placeholder="CEE" className="w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nº Pedido</label>
                        <input name="order_num" type="number" value={filters.order_num || ''} onChange={handleFilterChange} placeholder="Número" className="w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nº Pedido Origen</label>
                        <input name="parent_order_num" type="number" value={filters.parent_order_num || ''} onChange={handleFilterChange} placeholder="Origen" className="w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Proveedor / Razón Social</label>
                        <input name="provider" type="text" value={filters.provider || ''} onChange={handleFilterChange} placeholder="Buscar..." className="w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Estado</label>
                        <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2">
                            <option value="">Activos</option>
                            <option value="partial">Parciales</option>
                            <option value="completed">Completos</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Origen</label>
                        <select name="origin" value={filters.origin} onChange={handleFilterChange} className="w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2">
                            <option value="">Todos</option>
                            <option value="PADRE">Solo Padres</option>
                            <option value="HIJO">Solo Hijos</option>
                        </select>
                    </div>
                    <div>
                        <button type="submit" className="w-full bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition font-bold text-sm h-[38px] flex items-center justify-center gap-2">
                            Filtrar
                        </button>
                    </div>
                </div>
            </form>

            {/* Density Data Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-20 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-indigo-600 mb-4"></div>
                        <div className="text-slate-500 font-medium">Recuperando información...</div>
                    </div>
                ) : error ? (
                    <div className="p-20 text-center text-red-500 font-medium">{error}</div>
                ) : data.length === 0 ? (
                    <div className="p-20 text-center text-slate-400 font-medium">No hay registros para estos filtros.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-[#444b41] text-white">
                                <tr className="divide-x divide-slate-600">
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
                            <tbody className="bg-white divide-y divide-slate-100">
                                {data.map((pedido, idx) => (
                                    <PurchaseEnhancedRow key={idx} pedido={pedido} formatCurrency={formatCurrency} formatDate={formatDate} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <div className="mt-4 text-[11px] text-slate-400 flex justify-between px-2">
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
            <tr className={`divide-x divide-slate-100 hover:bg-slate-50 transition-colors text-[12px] ${isHijo ? 'bg-amber-50/30' : ''}`}>
                <td className="px-2 py-2 whitespace-nowrap text-slate-600">{pedido.EjercicioPedido}</td>
                <td className="px-2 py-2 whitespace-nowrap text-slate-600 font-mono">{pedido.SeriePedido}</td>
                <td className="px-3 py-2 whitespace-nowrap font-bold text-slate-900 flex items-center gap-1">
                    {(hasChildren || (pedido.lineas && pedido.lineas.length > 0)) && (
                        <button onClick={() => setExpanded(!expanded)} className="hover:text-indigo-600 p-0.5">
                            <span className="text-[10px]">{expanded ? '▼' : '▶'}</span>
                        </button>
                    )}
                    {pedido.NumeroPedido}
                    {isHijo && <span className="bg-amber-100 text-amber-700 px-1 rounded text-[10px] uppercase font-bold ml-1">Hijo</span>}
                </td>
                <td className={`px-2 py-2 whitespace-nowrap font-mono ${pedidoOrigen !== "N/A" ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
                    {pedidoOrigen}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-slate-600">{formatDate(pedido.FechaPedido)}</td>
                <td className="px-2 py-2 whitespace-nowrap text-slate-600 font-mono">{pedido.CodigoProveedor}</td>
                <td className="px-3 py-2 whitespace-nowrap font-medium text-slate-800 max-w-[150px] truncate" title={pedido.RazonSocial}>{pedido.RazonSocial}</td>
                <td className="px-3 py-2 whitespace-nowrap text-slate-600">{formatDate(pedido.FechaNecesaria)}</td>
                <td className="px-3 py-2 whitespace-nowrap text-slate-600">{formatDate(pedido.FechaTope)}</td>
                <td className="px-2 py-2 whitespace-nowrap text-center text-slate-500">{pedido.NumeroLineas || pedido.lineas?.length || 0}</td>
                <td className="px-3 py-2 whitespace-nowrap text-right font-semibold text-slate-900">{formatCurrency(pedido.ImporteLiquido)}</td>
                <td className="px-3 py-2 whitespace-nowrap text-center">
                    <StatusBadge status={pedido.status_global} />
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-slate-500 max-w-[200px] truncate italic" title={pedido.ObservacionesPedido}>
                    {pedido.ObservacionesPedido || '-'}
                </td>
            </tr>

            {expanded && (
                <tr className="bg-slate-100/50">
                    <td colSpan="13" className="p-4 border-l-4 border-indigo-500 shadow-inner">
                        {/* Lines of this specific order */}
                        {pedido.lineas && pedido.lineas.length > 0 && (
                            <div className="mb-4">
                                <h4 className="text-[11px] font-bold text-slate-500 uppercase mb-2">Detalle de Líneas</h4>
                                <LinesTable lines={pedido.lineas} />
                            </div>
                        )}

                        {/* If it's a parent, show children links or summary */}
                        {!isHijo && hasChildren && (
                            <div>
                                <h4 className="text-[11px] font-bold text-indigo-600 uppercase mb-2">Entregas Derivadas (Pedidos Hijo)</h4>
                                <div className="space-y-2">
                                    {pedido.pedidos_hijos.map((hijo, hidx) => (
                                        <div key={hidx} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-700 text-xs">Pedido {hijo.SeriePedido}-{hijo.NumeroPedido}</span>
                                                    {hijo._AEL_NumeroPedOrigen && (
                                                        <span className="text-[10px] bg-slate-100 px-1 rounded text-slate-500 font-mono">Origen: {hijo._AEL_NumeroPedOrigen}</span>
                                                    )}
                                                </div>
                                                <span className="text-slate-500 text-[11px]">Fecha: {formatDate(hijo.FechaPedido)}</span>
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
