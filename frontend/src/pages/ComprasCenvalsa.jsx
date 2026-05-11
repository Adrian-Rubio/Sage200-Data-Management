import { useState, useEffect, useCallback } from 'react';
import { 
    fetchCenvalsaPurchases, 
    updateCenvalsaTracking, 
    fetchCenvalsaAlbaranes, 
    fetchCenvalsaFacturas 
} from '../services/api';
import { PageHeader } from '../components/common/PageHeader';
import { 
    Calendar, 
    Package, 
    Truck, 
    FileText, 
    Search, 
    ChevronLeft, 
    ChevronRight, 
    Edit3, 
    Save, 
    X,
    Check,
    MoreHorizontal,
    Globe,
    Clock,
    MapPin,
    AlertCircle
} from 'lucide-react';

const TABS = [
    { id: 'pedidos', name: 'Pedidos de Compra', icon: Package },
    { id: 'albaranes', name: 'Albaranes', icon: Truck },
    { id: 'facturas', name: 'Facturas', icon: FileText },
];

const MEDIOS_TRANSPORTE = ['AIR', 'OCEAN', 'LAND'];

export default function ComprasCenvalsa() {
    const [activeTab, setActiveTab] = useState('pedidos');
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [totalOrders, setTotalOrders] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(50);
    
    // Filters
    const [filters, setFilters] = useState({
        start_date: '',
        end_date: '',
        order_num: '',
        provider: '',
        status: null
    });

    // Edit state
    const [editingId, setEditingId] = useState(null); // format: "ejercicio-serie-numero"
    const [editData, setEditData] = useState({});

    // Related data state (for detail view)
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [relatedAlbaranes, setRelatedAlbaranes] = useState([]);
    const [relatedFacturas, setRelatedFacturas] = useState([]);
    const [loadingRelated, setLoadingRelated] = useState(false);

    const loadOrders = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchCenvalsaPurchases({
                page: currentPage,
                page_size: pageSize,
                ...filters
            });
            setOrders(data.items);
            setTotalOrders(data.total);
        } catch (error) {
            console.error("Error loading orders:", error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, filters]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1); // Reset to first page on filter change
    };

    const startEdit = (order) => {
        const id = `${order.EjercicioPedido}-${order.SeriePedido}-${order.NumeroPedido}`;
        setEditingId(id);
        setEditData({
            codigo_empresa: order.CodigoEmpresa,
            ejercicio_pedido: order.EjercicioPedido,
            serie_pedido: order.SeriePedido,
            numero_pedido: order.NumeroPedido,
            incoterm: order.incoterm || '',
            medio_transporte: order.medio_transporte || '',
            agencia_transporte: order.agencia_transporte || '',
            ref_envio: order.ref_envio || '',
            bultos: order.bultos || '',
            volumen: order.volumen || '',
            peso: order.peso || '',
            fecha_establecida_inicial: order.fecha_establecida_inicial || '',
            fecha_real_proveedor: order.fecha_real_proveedor || '',
            fecha_recogida_real: order.fecha_recogida_real || '',
            fecha_salida_origen: order.fecha_salida_origen || '',
            fecha_llegada_espana: order.fecha_llegada_espana || '',
            fecha_llegada_nosotros: order.fecha_llegada_nosotros || '',
            fecha_recepcion_almacen: order.fecha_recepcion_almacen || '',
            anotaciones: order.anotaciones || ''
        });
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditData(prev => ({ ...prev, [name]: value }));
    };

    const saveEdit = async () => {
        try {
            await updateCenvalsaTracking(editData);
            setEditingId(null);
            loadOrders();
        } catch (error) {
            console.error("Error saving tracking:", error);
            alert("Error al guardar los cambios.");
        }
    };

    const selectOrder = async (order) => {
        setSelectedOrder(order);
        setLoadingRelated(true);
        try {
            const [albs, facts] = await Promise.all([
                fetchCenvalsaAlbaranes(order.EjercicioPedido, order.SeriePedido, order.NumeroPedido),
                fetchCenvalsaFacturas(order.EjercicioPedido, order.SeriePedido, order.NumeroPedido)
            ]);
            setRelatedAlbaranes(albs);
            setRelatedFacturas(facts);
        } catch (error) {
            console.error("Error loading related data:", error);
        } finally {
            setLoadingRelated(false);
        }
    };

    const totalPages = Math.ceil(totalOrders / pageSize);

    return (
        <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 text-slate-800 dark:text-slate-100 transition-colors">
            <PageHeader moduleName="Seguimiento de Compras - Cenvalsa Industrial" onRefresh={loadOrders} />

            {/* Tabs Navigation */}
            <div className="flex space-x-1 bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl mb-6 w-fit border border-slate-200 dark:border-slate-800 backdrop-blur-sm">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all
                            ${activeTab === tab.id 
                                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}
                        `}
                    >
                        <tab.icon className="w-4 h-4" />
                        <span>{tab.name}</span>
                    </button>
                ))}
            </div>

            {/* Content based on Active Tab */}
            {activeTab === 'pedidos' && (
                <div className="space-y-6">
                    {/* Filters Section */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-all">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Desde</label>
                                <input 
                                    type="date" 
                                    name="start_date"
                                    value={filters.start_date}
                                    onChange={handleFilterChange}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm p-2.5 font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hasta</label>
                                <input 
                                    type="date" 
                                    name="end_date"
                                    value={filters.end_date}
                                    onChange={handleFilterChange}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm p-2.5 font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nº Pedido (Padre o Hijo)</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        name="order_num"
                                        placeholder="Ej: 240001"
                                        value={filters.order_num}
                                        onChange={handleFilterChange}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm p-2.5 pl-9 font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                                    />
                                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Proveedor</label>
                                <input 
                                    type="text" 
                                    name="provider"
                                    placeholder="Nombre o ID..."
                                    value={filters.provider}
                                    onChange={handleFilterChange}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm p-2.5 font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado</label>
                                <select 
                                    name="status"
                                    value={filters.status || ''}
                                    onChange={(e) => handleFilterChange({ target: { name: 'status', value: e.target.value ? parseInt(e.target.value) : null }})}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm p-2.5 font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                                >
                                    <option value="">Activos (Pend/Parcial)</option>
                                    <option value="0">Pendiente</option>
                                    <option value="1">Parcial</option>
                                    <option value="2">Entregado</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all flex flex-col">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[2000px]">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Ped. PADRE</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nº Ped. PADRE</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nº Ped. HIJO</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Proveedor</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Origen</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Incoterm</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transporte</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Agencia</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ref. Envío / Booking</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bultos</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Volumen</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Peso</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Inicial</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Proveedor</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Recogida Real</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Salida Origen</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Llegada ES</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Llegada Nosotros</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Recepción Almacén</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Anotaciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="22" className="p-12 text-center">
                                                <div className="flex flex-col items-center justify-center space-y-4">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                                    <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Cargando pedidos...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : orders.length === 0 ? (
                                        <tr>
                                            <td colSpan="22" className="p-12 text-center">
                                                <div className="flex flex-col items-center justify-center space-y-2 opacity-50">
                                                    <AlertCircle className="w-12 h-12 text-slate-300" />
                                                    <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">No se encontraron pedidos</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : orders.map((order) => {
                                        const id = `${order.EjercicioPedido}-${order.SeriePedido}-${order.NumeroPedido}`;
                                        const isEditing = editingId === id;
                                        const isChild = !!order.NumeroPedidoPadre;

                                        return (
                                            <tr 
                                                key={id} 
                                                className={`
                                                    hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors
                                                    ${selectedOrder?.NumeroPedido === order.NumeroPedido ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}
                                                `}
                                            >
                                                <td className="p-4">
                                                    <div className="flex items-center space-x-2">
                                                        {isEditing ? (
                                                            <>
                                                                <button onClick={saveEdit} className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg hover:scale-110 transition-all">
                                                                    <Save className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => setEditingId(null)} className="p-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg hover:scale-110 transition-all">
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => startEdit(order)} className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:scale-110 transition-all">
                                                                    <Edit3 className="w-4 h-4" />
                                                                </button>
                                                                <button 
                                                                    onClick={() => selectOrder(order)} 
                                                                    className={`
                                                                        p-2 rounded-lg hover:scale-110 transition-all
                                                                        ${selectedOrder?.NumeroPedido === order.NumeroPedido 
                                                                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
                                                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}
                                                                    `}
                                                                >
                                                                    {selectedOrder?.NumeroPedido === order.NumeroPedido 
                                                                        ? <Check className="w-4 h-4" /> 
                                                                        : <MoreHorizontal className="w-4 h-4" />
                                                                    }
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 whitespace-nowrap">
                                                    <span className={`
                                                        px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider
                                                        ${order.Estado === 2 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                                                          order.Estado === 1 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 
                                                          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}
                                                    `}>
                                                        {order.Estado === 2 ? 'Entregado' : order.Estado === 1 ? 'Parcial' : 'Pendiente'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-sm font-bold whitespace-nowrap text-indigo-600 dark:text-indigo-400">
                                                    {order.FechaPedidoPadre}
                                                </td>
                                                <td className="p-4 text-sm font-bold text-slate-500">
                                                    {order.NumeroPedidoPadre || '-'}
                                                </td>
                                                <td className="p-4 text-sm font-black">
                                                    {order.SeriePedido}/{order.NumeroPedido}
                                                </td>
                                                <td className="p-4 text-xs font-bold max-w-xs truncate" title={order.Proveedor}>
                                                    {order.Proveedor}
                                                </td>
                                                <td className="p-4 text-xs font-bold text-slate-500 uppercase">
                                                    {order.PaisOrigen || 'ES'}
                                                </td>
                                                <td className="p-4">
                                                    {isEditing ? (
                                                        <input type="text" name="incoterm" value={editData.incoterm} onChange={handleEditChange} className="w-24 bg-white dark:bg-slate-800 border-indigo-200 dark:border-slate-700 rounded-lg text-xs p-1.5 font-bold" />
                                                    ) : (
                                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{order.incoterm}</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    {isEditing ? (
                                                        <select name="medio_transporte" value={editData.medio_transporte} onChange={handleEditChange} className="w-24 bg-white dark:bg-slate-800 border-indigo-200 dark:border-slate-700 rounded-lg text-xs p-1.5 font-bold">
                                                            <option value="">-</option>
                                                            {MEDIOS_TRANSPORTE.map(m => <option key={m} value={m}>{m}</option>)}
                                                        </select>
                                                    ) : (
                                                        <div className="flex items-center space-x-1">
                                                            {order.medio_transporte === 'AIR' && <Globe className="w-3 h-3 text-sky-500" />}
                                                            {order.medio_transporte === 'OCEAN' && <Truck className="w-3 h-3 text-blue-500" />}
                                                            {order.medio_transporte === 'LAND' && <Truck className="w-3 h-3 text-emerald-500" />}
                                                            <span className="text-xs font-black">{order.medio_transporte}</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    {isEditing ? (
                                                        <input type="text" name="agencia_transporte" value={editData.agencia_transporte} onChange={handleEditChange} className="w-32 bg-white dark:bg-slate-800 border-indigo-200 dark:border-slate-700 rounded-lg text-xs p-1.5 font-bold" />
                                                    ) : (
                                                        <span className="text-xs font-bold">{order.agencia_transporte}</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    {isEditing ? (
                                                        <input type="text" name="ref_envio" value={editData.ref_envio} onChange={handleEditChange} className="w-32 bg-white dark:bg-slate-800 border-indigo-200 dark:border-slate-700 rounded-lg text-xs p-1.5 font-bold" />
                                                    ) : (
                                                        <span className="text-xs font-bold text-indigo-500">{order.ref_envio}</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    {isEditing ? (
                                                        <input type="number" name="bultos" value={editData.bultos} onChange={handleEditChange} className="w-16 bg-white dark:bg-slate-800 border-indigo-200 dark:border-slate-700 rounded-lg text-xs p-1.5 font-bold" />
                                                    ) : (
                                                        <span className="text-xs font-bold">{order.bultos}</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    {isEditing ? (
                                                        <input type="text" name="volumen" value={editData.volumen} onChange={handleEditChange} className="w-16 bg-white dark:bg-slate-800 border-indigo-200 dark:border-slate-700 rounded-lg text-xs p-1.5 font-bold" />
                                                    ) : (
                                                        <span className="text-xs font-bold">{order.volumen}</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    {isEditing ? (
                                                        <input type="text" name="peso" value={editData.peso} onChange={handleEditChange} className="w-16 bg-white dark:bg-slate-800 border-indigo-200 dark:border-slate-700 rounded-lg text-xs p-1.5 font-bold" />
                                                    ) : (
                                                        <span className="text-xs font-bold">{order.peso}</span>
                                                    )}
                                                </td>
                                                {/* Date Fields */}
                                                {[
                                                    'fecha_establecida_inicial', 'fecha_real_proveedor', 'fecha_recogida_real',
                                                    'fecha_salida_origen', 'fecha_llegada_espana', 'fecha_llegada_nosotros',
                                                    'fecha_recepcion_almacen'
                                                ].map(f => (
                                                    <td key={f} className="p-4">
                                                        {isEditing ? (
                                                            <input type="date" name={f} value={editData[f]} onChange={handleEditChange} className="w-28 bg-white dark:bg-slate-800 border-indigo-200 dark:border-slate-700 rounded-lg text-[10px] p-1 font-bold" />
                                                        ) : (
                                                            <div className="flex items-center space-x-1 whitespace-nowrap">
                                                                <Clock className="w-3 h-3 text-slate-400" />
                                                                <span className="text-[11px] font-bold">{order[f] || '-'}</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                ))}
                                                <td className="p-4 min-w-[200px]">
                                                    {isEditing ? (
                                                        <textarea name="anotaciones" value={editData.anotaciones} onChange={handleEditChange} className="w-full bg-white dark:bg-slate-800 border-indigo-200 dark:border-slate-700 rounded-lg text-xs p-1.5 font-bold h-12" />
                                                    ) : (
                                                        <p className="text-xs font-medium text-slate-500 italic truncate max-w-[200px]">{order.anotaciones}</p>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                Mostrando <span className="text-slate-800 dark:text-white">{(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalOrders)}</span> de <span className="text-slate-800 dark:text-white">{totalOrders}</span> pedidos
                            </span>
                            <div className="flex items-center space-x-2">
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-100 transition-all"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <div className="flex items-center space-x-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) pageNum = i + 1;
                                        else if (currentPage <= 3) pageNum = i + 1;
                                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                        else pageNum = currentPage - 2 + i;

                                        return (
                                            <button 
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`
                                                    w-8 h-8 rounded-lg text-xs font-black transition-all
                                                    ${currentPage === pageNum ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}
                                                `}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-100 transition-all"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {(activeTab === 'albaranes' || activeTab === 'facturas') && (
                <div className="space-y-6">
                    {selectedOrder ? (
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <div className="inline-flex p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl mb-4">
                                <Package className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                             </div>
                             <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
                                {activeTab === 'albaranes' ? 'Albaranes del Pedido' : 'Facturas del Pedido'} {selectedOrder.SeriePedido}/{selectedOrder.NumeroPedido}
                             </h2>
                             <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mb-8">
                                {selectedOrder.Proveedor}
                             </p>

                             {loadingRelated ? (
                                <div className="py-12 flex flex-col items-center">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                                </div>
                             ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {(activeTab === 'albaranes' ? relatedAlbaranes : relatedFacturas).map((item, idx) => (
                                        <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 text-left hover:shadow-lg transition-all group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Número</span>
                                                    <span className="text-lg font-black text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                        {activeTab === 'albaranes' ? `${item.SerieAlbaran}/${item.NumeroAlbaran}` : `${item.SerieFactura}/${item.NumeroFactura}`}
                                                    </span>
                                                </div>
                                                <div className={`p-2 rounded-lg ${activeTab === 'albaranes' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'}`}>
                                                    {activeTab === 'albaranes' ? <Truck className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Fecha</span>
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                        {activeTab === 'albaranes' ? item.FechaAlbaran : item.FechaFactura}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Importe</span>
                                                    <span className="text-sm font-black text-slate-800 dark:text-white">
                                                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(item.ImporteLiquido)}
                                                    </span>
                                                </div>
                                                {activeTab === 'facturas' && (
                                                    <div className="col-span-2 mt-2 pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Albaranes Incluidos</span>
                                                        <div className="flex flex-wrap gap-1">
                                                            {(item.AlbaranesAsociados || '').split(',').filter(Boolean).map((alb, i) => (
                                                                <span key={i} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded text-[10px] font-black border border-indigo-100/50 dark:border-indigo-500/20">
                                                                    {alb.trim()}
                                                                </span>
                                                            ))}
                                                            {!item.AlbaranesAsociados && <span className="text-[10px] font-bold text-slate-400">Directa (sin albaranes)</span>}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {(activeTab === 'albaranes' ? relatedAlbaranes : relatedFacturas).length === 0 && (
                                        <div className="col-span-full py-12 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                                            No se han encontrado {activeTab === 'albaranes' ? 'albaranes' : 'facturas'} asociados a este pedido.
                                        </div>
                                    )}
                                </div>
                             )}
                             
                             <button 
                                onClick={() => setActiveTab('pedidos')}
                                className="mt-8 px-8 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                             >
                                ← Volver al listado
                             </button>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 text-center">
                            <AlertCircle className="w-16 h-16 text-indigo-200 dark:text-slate-700 mx-auto mb-6" />
                            <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight">Selecciona un pedido</h2>
                            <p className="text-slate-500 font-medium max-w-sm mx-auto mb-8">
                                Debes seleccionar un pedido del listado principal para ver sus albaranes o facturas relacionadas.
                            </p>
                            <button 
                                onClick={() => setActiveTab('pedidos')}
                                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-200 dark:shadow-none transition-all"
                            >
                                Ir al Listado →
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
