import { useState, useEffect } from 'react';
import { fetchFinancePayments } from '../services/api';
import { Link } from 'react-router-dom';
import { KpiCard } from '../components/dashboard/KpiCard';
import useAuthStore from '../store/authStore';
import { PageHeader } from '../components/common/PageHeader';

export default function CobrosPagos() {
    const { logoutUser } = useAuthStore();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        start_date: null,
        end_date: new Date().toISOString().split('T')[0],
        company_id: null,
        status: 0, // Default to Pendiente
        invoice_start_date: '',
        invoice_end_date: '',
        client_search: ''
    });

    const companies = [
        { id: '100', name: 'Cenval' },
        { id: '2', name: 'Cenvalsa Industrial' },
        { id: '4', name: 'Dubes' },
        { id: '6', name: 'Saratur' }
    ];

    useEffect(() => {
        loadData();
    }, [filters]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Remove empty strings or nulls for clean API call
            const cleanFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v !== '' && v !== null)
            );
            const result = await fetchFinancePayments(cleanFilters);
            setData(result);

            // Auto-set the start date to the oldest pending item if not already set
            if (!filters.start_date && result?.kpis?.oldest_date) {
                setFilters(prev => ({ ...prev, start_date: result.kpis.oldest_date }));
            }
        } catch (err) {
            setError("Error cargando datos de tesorería.");
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        let finalValue = value;

        // Handle numeric values for status
        if (name === 'status') {
            finalValue = value === "" ? null : parseInt(value);
        } else if (value === "") {
            finalValue = null;
        }

        setFilters(prev => ({ ...prev, [name]: finalValue }));
    };

    const formatCurrency = (val) => new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0
    }).format(val);

    return (
        <div className="w-full min-h-screen bg-[#f8fafc] p-6 text-gray-800 font-sans">
            <PageHeader moduleName="Cobros y Pagos" onRefresh={loadData}>
                <Link to="/contabilidad" className="bg-white text-slate-600 border border-slate-200 px-3 py-1.5 rounded shadow-sm hover:bg-slate-50 transition font-bold text-xs h-[34px] flex items-center justify-center whitespace-nowrap">
                    Contabilidad
                </Link>
            </PageHeader>

            {/* Filters Row */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6 space-y-4">
                <div className="flex flex-wrap gap-6 items-end">
                    <div className="flex flex-col">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Empresa</label>
                        <select name="company_id" value={filters.company_id || ''} onChange={handleFilterChange} className="block w-48 rounded-lg border-gray-200 bg-gray-50/50 shadow-sm focus:border-blue-500 focus:ring-0 text-xs p-2.5 font-bold text-slate-700">
                            <option value="">Todo</option>
                            {companies.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Estado</label>
                        <select name="status" value={filters.status ?? ''} onChange={handleFilterChange} className="block w-36 rounded-lg border-gray-200 bg-gray-50/50 shadow-sm focus:border-blue-500 focus:ring-0 text-xs p-2.5 font-bold text-slate-700">
                            <option value="">Todos</option>
                            <option value="0">Pendiente</option>
                            <option value="-1">Realizado</option>
                        </select>
                    </div>

                    <div className="h-10 w-px bg-gray-100 mx-2 self-center hidden md:block"></div>

                    <div className="flex flex-col">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Vencimiento Desde</label>
                        <input
                            type="date"
                            name="start_date"
                            value={filters.start_date || ''}
                            onChange={handleFilterChange}
                            className="block w-36 rounded-lg border-gray-200 bg-gray-50/50 shadow-sm focus:border-blue-500 focus:ring-0 text-xs p-2.5 font-bold text-slate-700"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Vencimiento Hasta</label>
                        <input
                            type="date"
                            name="end_date"
                            value={filters.end_date || ''}
                            onChange={handleFilterChange}
                            className="block w-36 rounded-lg border-gray-200 bg-gray-50/50 shadow-sm focus:border-blue-500 focus:ring-0 text-xs p-2.5 font-bold text-slate-700"
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-6 items-end pt-2 border-t border-gray-50">
                    <div className="flex flex-col flex-1 min-w-[200px]">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Buscar Cliente / Proveedor</label>
                        <input
                            type="text"
                            name="client_search"
                            placeholder="Nombre o Número..."
                            value={filters.client_search || ''}
                            onChange={handleFilterChange}
                            className="block w-full rounded-lg border-gray-200 bg-white placeholder-gray-300 shadow-sm focus:border-blue-500 focus:ring-0 text-xs p-2.5 font-bold text-slate-700"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5">Fecha Factura Desde</label>
                        <input
                            type="date"
                            name="invoice_start_date"
                            value={filters.invoice_start_date || ''}
                            onChange={handleFilterChange}
                            className="block w-36 rounded-lg border-blue-50 bg-blue-50/20 shadow-sm focus:border-blue-500 focus:ring-0 text-xs p-2.5 font-bold text-blue-700"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5">Fecha Factura Hasta</label>
                        <input
                            type="date"
                            name="invoice_end_date"
                            value={filters.invoice_end_date || ''}
                            onChange={handleFilterChange}
                            className="block w-36 rounded-lg border-blue-50 bg-blue-50/20 shadow-sm focus:border-blue-500 focus:ring-0 text-xs p-2.5 font-bold text-blue-700"
                        />
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <KpiCard title="Total Cobros" value={data?.kpis?.total_cobros || 0} subtext={filters.status === 0 ? "Pendientes" : (filters.status === -1 ? "Realizados" : "Seleccionados")} />
                <KpiCard title="Total Pagos" value={data?.kpis?.total_pagos || 0} subtext={filters.status === 0 ? "Pendientes" : (filters.status === -1 ? "Realizados" : "Seleccionados")} isWarning={true} />
                <KpiCard title="Saldo Neto" value={data?.kpis?.net_balance || 0} subtext="Diferencia" />
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-12">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-700">Detalle de Efectos en Cartera</h3>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-bold uppercase tracking-wider">
                        Mostrando {data?.items?.length || 0} {data?.kpis?.total_count > data?.items?.length ? ` de ${data.kpis.total_count}` : ''} Registros
                    </span>
                </div>
                <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead className="text-gray-600 font-bold uppercase text-[9px] tracking-wider sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-3 py-3 border border-gray-300 bg-gray-100">Empresa</th>
                                <th className="px-3 py-3 border border-gray-300 bg-gray-100">Concepto (Cuenta)</th>
                                <th className="px-3 py-3 border border-gray-300 bg-gray-100">F. Factura</th>
                                <th className="px-3 py-3 border border-gray-300 bg-gray-100">F. Vencim.</th>
                                <th className="px-3 py-3 border border-gray-300 bg-gray-100">Entidad (Cliente/Prov)</th>
                                <th className="px-3 py-3 border border-gray-300 bg-gray-100 text-right">Importe</th>
                                <th className="px-3 py-3 border border-gray-300 bg-gray-100">Documento</th>
                                <th className="px-3 py-3 border border-gray-300 bg-gray-100">Comentario</th>
                                <th className="px-3 py-3 border border-gray-300 bg-gray-100 text-center">Tipo</th>
                                <th className="px-3 py-3 border border-gray-300 bg-gray-100 text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan="10" className="px-6 py-10 text-center text-gray-400">Cargando...</td></tr>
                            ) : data?.items?.map((item, i) => (
                                <tr key={i} className="hover:bg-blue-50/50 even:bg-slate-50 transition-colors">
                                    <td className="px-3 py-2.5 border border-gray-200 font-bold text-slate-500 text-center">{item.CodigoEmpresa}</td>
                                    <td className="px-3 py-2.5 border border-gray-200 text-slate-600 text-[10px] leading-tight max-w-[200px] truncate" title={item.ConceptoCuenta}>
                                        <span className="font-semibold">{item.CuentaID}</span> - {item.ConceptoCuenta}
                                    </td>
                                    <td className="px-3 py-2.5 border border-gray-200 text-slate-500 font-medium">{item.FechaFactura ? new Date(item.FechaFactura).toLocaleDateString('es-ES') : '-'}</td>
                                    <td className="px-3 py-2.5 border border-gray-200 text-slate-700 font-bold">{new Date(item.FechaVencimiento).toLocaleDateString('es-ES')}</td>
                                    <td className="px-3 py-2.5 border border-gray-200 text-slate-800 font-medium">
                                        <span className="text-gray-400 text-[10px] mr-1.5 font-normal">[{item.CodigoClienteProveedor}]</span>
                                        {item.Prevision === 'Cobros' ? item.RazonSocial : item.NombreProveedor}
                                    </td>
                                    <td className={`px-3 py-2.5 border border-gray-200 text-right font-bold whitespace-nowrap ${item.Prevision === 'Cobros' ? 'text-emerald-700' : 'text-red-700'}`}>
                                        {formatCurrency(item.Prevision === 'Cobros' ? item.Cobro : item.Pago)}
                                    </td>
                                    <td className="px-3 py-2.5 border border-gray-200 text-slate-600 text-[10px]">{item.DocumentoConta}</td>
                                    <td className="px-3 py-2.5 border border-gray-200 text-slate-500 text-[10px] max-w-[200px] truncate" title={item.Comentario}>{item.Comentario}</td>
                                    <td className="px-3 py-2.5 border border-gray-200 text-center">
                                        <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold border ${item.Prevision === 'Cobros' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                            {item.Prevision}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2.5 border border-gray-200 text-center">
                                        <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-wide border ${item.Status === -1 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                            {item.Status === -1 ? 'Realizado' : 'Pendiente'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {!loading && (!data?.items || data.items.length === 0) && (
                                <tr>
                                    <td colSpan="10" className="px-6 py-10 text-center text-gray-500 font-medium">
                                        No hay efectos que coincidan con los filtros seleccionados
                                    </td>
                                </tr>
                            )}
                            {!loading && data?.items?.length > 0 && data?.kpis?.total_count > data?.items?.length && (
                                <tr>
                                    <td colSpan="10" className="px-6 py-4 text-center text-xs font-bold text-amber-700 bg-amber-50 border-t border-amber-200">
                                        Mostrando los primeros {data.items.length} registros más antiguos. Se están ocultando otros {data.kpis.total_count - data.items.length} efectos. (Usa los filtros para reducir el tamaño de búsqueda).
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
