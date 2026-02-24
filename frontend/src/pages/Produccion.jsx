import { useState, useEffect, Fragment } from 'react';
import { fetchProductionOrders, fetchProductionOperations } from '../services/api';
import { Link } from 'react-router-dom';
import useDataStore from '../store/dataStore';

// Helper for status badges
const StatusBadge = ({ statusId, statusDesc }) => {
    switch (statusId) {
        case 0:
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800">● {statusDesc}</span>;
        case 1:
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">● {statusDesc}</span>;
        case 2:
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">● {statusDesc}</span>;
        case 3:
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">● {statusDesc}</span>;
        default:
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">● {statusDesc || 'Desconocido'}</span>;
    }
};

const OperationsTable = ({ exercise, workNum }) => {
    const [ops, setOps] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadOps = async () => {
            setLoading(true);
            const data = await fetchProductionOperations(exercise, workNum);
            setOps(data);
            setLoading(false);
        };
        loadOps();
    }, [exercise, workNum]);

    if (loading) return <div className="p-4 text-sm text-slate-500 italic flex items-center justify-center gap-2"><div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-300 border-t-indigo-500" /> Cargando operaciones...</div>;
    if (!ops || ops.length === 0) return <div className="p-4 text-sm text-slate-400 italic text-center">No se han registrado operaciones de taller para esta orden.</div>;

    return (
        <div className="p-4 bg-indigo-50/40 border-y border-indigo-100 shadow-inner">
            <h4 className="text-xs font-bold text-indigo-800 uppercase mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                Ruta de Operaciones
            </h4>
            <div className="overflow-hidden rounded border border-indigo-100 bg-white">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-indigo-50/50">
                        <tr className="text-left text-slate-500 font-medium">
                            <th className="px-3 py-2">Orden</th>
                            <th className="px-3 py-2">Artículo</th>
                            <th className="px-3 py-2">Descripción Tarea</th>
                            <th className="px-3 py-2">Operario/s</th>
                            <th className="px-3 py-2 text-center">Tipo</th>
                            <th className="px-3 py-2 text-right">T. Unitario</th>
                            <th className="px-3 py-2 text-right">T. Total</th>
                            <th className="px-3 py-2 text-right">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {ops.map((op, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                                <td className="px-3 py-2 text-slate-600 font-mono font-bold">{op.Orden}</td>
                                <td className="px-3 py-2 text-indigo-700 font-medium">{op.CodigoArticulo}</td>
                                <td className="px-3 py-2 text-slate-700">{op.DescripcionOperacion}</td>
                                <td className="px-3 py-2 text-slate-500 text-xs italic">{op.Operarios || '-'}</td>
                                <td className="px-3 py-2 text-center">
                                    {op.OperacionExterna === 1
                                        ? <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200">EXTERNA</span>
                                        : <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">TALLER</span>}
                                </td>
                                <td className="px-3 py-2 text-right text-slate-600 font-mono">{op.TiempoUnFabricacionFormat}</td>
                                <td className="px-3 py-2 text-right text-slate-800 font-mono font-bold">{op.TiempoTotalFormat}</td>
                                <td className="px-3 py-2 text-right">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${op.EstadoOperacion === 2 ? 'bg-green-100 text-green-700' :
                                        op.EstadoOperacion === 1 ? 'bg-blue-100 text-blue-700' :
                                            op.EstadoOperacion === 3 ? 'bg-red-100 text-red-700' :
                                                'bg-slate-100 text-slate-600'
                                        }`}>
                                        {op.EstadoDesc}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default function Produccion() {
    const { productionData, productionFiltersHash, setProductionData } = useDataStore();
    const [data, setData] = useState(productionData || []);
    const [loading, setLoading] = useState(!productionData);
    const [error, setError] = useState(null);

    // Detailed Filters
    const [filters, setFilters] = useState({
        exercise: new Date().getFullYear(),
        work_num: '',
        series: '',
        fabrication_num: '',
        article: '',
        status: '',
        period: ''
    });

    const [expandedRows, setExpandedRows] = useState({});

    useEffect(() => {
        loadData();
    }, []); // Initial load

    const toggleRow = (workNum) => {
        setExpandedRows(prev => ({
            ...prev,
            [workNum]: !prev[workNum]
        }));
    };

    const loadData = async (e) => {
        if (e) e.preventDefault();

        const currentHash = JSON.stringify(filters);
        if (productionData && productionFiltersHash === currentHash) {
            setData(productionData);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // Mapping UI filters to API
            const apiFilters = {
                exercise: filters.exercise ? parseInt(filters.exercise) : null,
                work_num: filters.work_num ? parseInt(filters.work_num) : null,
                series: filters.series || null,
                fabrication_num: filters.fabrication_num ? parseInt(filters.fabrication_num) : null,
                article: filters.article || null,
                status: filters.status !== '' ? parseInt(filters.status) : null,
                period: filters.period ? parseInt(filters.period) : null
            };

            const result = await fetchProductionOrders(apiFilters);
            if (Array.isArray(result)) {
                setData(result);
                setProductionData(result, currentHash);
            } else if (result && result.error) {
                setError(`Error del Servidor: ${result.error}`);
                setData([]);
            } else {
                setData([]);
            }
        } catch (err) {
            setError("Error cargando órdenes de fabricación. Verifica el backend.");
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="w-full min-h-screen bg-[#f8fafc] p-4 text-gray-800 font-sans">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <span className="bg-[#d88900] text-white px-3 py-1 rounded text-lg">CENVALSA</span>
                        Módulo de Producción
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
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 items-end">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ejercicio</label>
                        <input name="exercise" type="number" value={filters.exercise || ''} onChange={handleFilterChange} placeholder="2026" className="w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Serie</label>
                        <input name="series" type="text" value={filters.series || ''} onChange={handleFilterChange} placeholder="PAF" className="w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nº Trabajo</label>
                        <input name="work_num" type="number" value={filters.work_num || ''} onChange={handleFilterChange} placeholder="Trabajo" className="w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nº Fabricación</label>
                        <input name="fabrication_num" type="number" value={filters.fabrication_num || ''} onChange={handleFilterChange} placeholder="Fabricación" className="w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Periodo</label>
                        <input name="period" type="number" min="1" max="12" value={filters.period || ''} onChange={handleFilterChange} placeholder="Mes (1-12)" className="w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Artículo</label>
                        <input name="article" type="text" value={filters.article || ''} onChange={handleFilterChange} placeholder="Código o nomb..." className="w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Estado OF</label>
                        <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2">
                            <option value="">Todos</option>
                            <option value="0">Preparada</option>
                            <option value="1">Abierta</option>
                            <option value="2">Finalizada</option>
                            <option value="3">Retenida</option>
                        </select>
                    </div>
                    <div>
                        <button type="submit" className="w-full bg-[#d88900] text-white px-4 py-2 rounded-lg hover:bg-[#b57300] transition font-bold text-sm h-[38px] flex items-center justify-center gap-2">
                            Filtrar
                        </button>
                    </div>
                </div>
            </form>

            {/* Density Data Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-20 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-[#d88900] mb-4"></div>
                        <div className="text-slate-500 font-medium">Recuperando información de planta...</div>
                    </div>
                ) : error ? (
                    <div className="p-20 text-center text-red-500 font-medium">{error}</div>
                ) : data.length === 0 ? (
                    <div className="p-20 text-center text-slate-400 font-medium">No hay órdenes de fabricación para estos filtros.</div>
                ) : (
                    <div className="overflow-x-auto max-h-[70vh]">
                        <table className="min-w-full divide-y divide-slate-200 relative">
                            <thead className="bg-[#444b41] text-white sticky top-0 z-10 shadow-sm">
                                <tr className="divide-x divide-slate-600">
                                    <th className="px-2 py-2 w-8"></th>
                                    <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider">Ejercicio</th>
                                    <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider">Serie</th>
                                    <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider">Nº Trabajo</th>
                                    <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider">Fecha Creada</th>
                                    <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider">Fecha Prev.</th>
                                    <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider">Nº Fab.</th>
                                    <th className="px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wider">Per.</th>
                                    <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider">Artículo</th>
                                    <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider">Descripción</th>
                                    <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wider">U. a Fabricar</th>
                                    <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wider">U. Fabricadas</th>
                                    <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider min-w-[150px]">Observaciones</th>
                                    <th className="px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wider">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {data.map((order, idx) => {
                                    const progress = (order.UnidadesFabricadas / (order.UnidadesFabricar || 1)) * 100;
                                    const progressClamped = Math.min(Math.max(progress, 0), 100);

                                    const isExpanded = expandedRows[order.NumeroTrabajo];

                                    return (
                                        <Fragment key={idx}>
                                            <tr
                                                onClick={() => toggleRow(order.NumeroTrabajo)}
                                                className={`divide-x divide-slate-100 transition-colors text-[12px] cursor-pointer ${isExpanded ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`}
                                            >
                                                <td className="px-2 py-2 text-center text-slate-400">
                                                    <svg className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-slate-600">{order.Ejercicio}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-slate-600 font-mono">{order.SerieDocumento}</td>
                                                <td className="px-3 py-2 whitespace-nowrap font-bold text-slate-900 font-mono">{order.NumeroTrabajo}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-slate-600">
                                                    {order.FechaCreacion ? new Date(order.FechaCreacion).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-slate-600">
                                                    {order.FechaFinalPrevista ? new Date(order.FechaFinalPrevista).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap font-bold text-indigo-600 font-mono">{order.NumeroFabricacion}</td>
                                                <td className="px-2 py-2 whitespace-nowrap text-center text-slate-500 font-mono">{order.Periodo}</td>
                                                <td className="px-3 py-2 whitespace-nowrap font-bold text-slate-800">{order.CodigoArticulo}</td>
                                                <td className="px-3 py-2 text-slate-600 max-w-[250px] truncate" title={order.DescripcionArticulo}>
                                                    {order.DescripcionArticulo}
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-right text-slate-600 font-medium">
                                                    {parseFloat(order.UnidadesFabricar || 0).toLocaleString('es-ES')}
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-right">
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="font-bold text-slate-800">{parseFloat(order.UnidadesFabricadas || 0).toLocaleString('es-ES')}</span>
                                                        <div className="w-full bg-slate-200 rounded-full h-1.5 ml-2 mt-1">
                                                            <div
                                                                className={`h-1.5 rounded-full ${progressClamped >= 100 ? 'bg-green-500' : 'bg-blue-500'} ${order.EstadoOF === 3 ? '!bg-red-500' : ''}`}
                                                                style={{ width: `${progressClamped}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2 text-slate-500 max-w-[150px] truncate italic" title={order.Observaciones}>
                                                    {order.Observaciones || '-'}
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-center">
                                                    <StatusBadge statusId={order.EstadoOF} statusDesc={order.EstadoDesc} />
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan="14" className="p-0 border-b border-indigo-100">
                                                        <OperationsTable exercise={order.Ejercicio} workNum={order.NumeroTrabajo} />
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })}
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
