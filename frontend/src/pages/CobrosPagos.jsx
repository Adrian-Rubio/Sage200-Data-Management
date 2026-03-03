import { useState, useEffect } from 'react';
import { fetchFinancePayments } from '../services/api';
import { Link } from 'react-router-dom';
import { KpiCard } from '../components/dashboard/KpiCard';
import useAuthStore from '../store/authStore';

export default function CobrosPagos() {
    const { logoutUser } = useAuthStore();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        start_date: '',
        end_date: new Date().toISOString().split('T')[0],
        company_id: ''
    });

    const companies = [
        { id: '100', name: 'Cenval (100)' },
        { id: '2', name: 'Cenvalsa Industrial (2)' },
        { id: '4', name: 'Dubes (4)' },
        { id: '6', name: 'Saratur (6)' }
    ];

    useEffect(() => {
        loadData();
    }, [filters]);

    const loadData = async () => {
        setLoading(true);
        try {
            const result = await fetchFinancePayments(filters);
            setData(result);
        } catch (err) {
            setError("Error cargando datos de tesorería.");
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value || null }));
    };

    const formatCurrency = (val) => new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0
    }).format(val);

    return (
        <div className="w-full min-h-screen bg-[#f8fafc] p-6 text-gray-800 font-sans">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded">FINANZAS</span>
                    Tesorería: Cobros y Pagos
                </h1>
                <div className="flex gap-4">
                    <Link to="/contabilidad" className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 transition font-medium text-sm">
                        Volver a Contabilidad
                    </Link>
                    <button onClick={logoutUser} className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded hover:bg-red-100 transition font-medium text-sm">
                        Cerrar Sesión
                    </button>
                </div>
            </div>

            {/* Filters Row */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-end">
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1">Empresa</label>
                    <select name="company_id" value={filters.company_id || ''} onChange={handleFilterChange} className="block w-48 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-xs p-2 text-gray-900 bg-white">
                        <option value="">Todas (100, 2, 4, 6)</option>
                        {companies.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1">Vencimiento Desde</label>
                    <input
                        type="date"
                        name="start_date"
                        value={filters.start_date || ''}
                        onChange={handleFilterChange}
                        className="block w-40 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-xs p-2 text-gray-900 bg-white"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1">Vencimiento Hasta</label>
                    <input
                        type="date"
                        name="end_date"
                        value={filters.end_date || ''}
                        onChange={handleFilterChange}
                        className="block w-40 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-xs p-2 text-gray-900 bg-white"
                    />
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <KpiCard title="Total Cobros" value={data?.kpis?.total_cobros || 0} subtext="Pendientes" />
                <KpiCard title="Total Pagos" value={data?.kpis?.total_pagos || 0} subtext="Pendientes" isWarning={true} />
                <KpiCard title="Saldo Neto" value={data?.kpis?.net_balance || 0} subtext="Diferencia" />
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-12">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-700">Detalle de Efectos en Cartera</h3>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-bold uppercase tracking-wider">
                        {data?.items?.length || 0} Registros
                    </span>
                </div>
                <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-[#fcfdff] text-gray-500 font-bold uppercase text-[9px] tracking-wider sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 border-b">Empresa</th>
                                <th className="px-4 py-3 border-b">Tipo</th>
                                <th className="px-4 py-3 border-b">Vencimiento</th>
                                <th className="px-4 py-3 border-b">Entidad (Cliente/Prov)</th>
                                <th className="px-4 py-3 border-b text-right">Importe</th>
                                <th className="px-4 py-3 border-b">Concepto (Cuenta)</th>
                                <th className="px-4 py-3 border-b">Documento</th>
                                <th className="px-4 py-3 border-b">Comentario</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="8" className="px-6 py-10 text-center text-gray-400">Cargando...</td></tr>
                            ) : data?.items?.map((item, i) => (
                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-4 font-bold text-slate-400">{item.CodigoEmpresa}</td>
                                    <td className="px-4 py-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${item.Prevision === 'Cobros' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                            {item.Prevision}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-slate-600">{new Date(item.FechaVencimiento).toLocaleDateString('es-ES')}</td>
                                    <td className="px-4 py-4 text-slate-800 font-medium">
                                        {item.Prevision === 'Cobros' ? item.RazonSocial : item.NombreProveedor}
                                    </td>
                                    <td className={`px-4 py-4 text-right font-bold ${item.Prevision === 'Cobros' ? 'text-emerald-700' : 'text-red-700'}`}>
                                        {formatCurrency(item.Prevision === 'Cobros' ? item.Cobro : item.Pago)}
                                    </td>
                                    <td className="px-4 py-4 text-slate-500 text-[10px] italic">
                                        {item.ConceptoCuenta} <span className="text-slate-300 font-normal">({item.CuentaID})</span>
                                    </td>
                                    <td className="px-4 py-4 text-slate-500">{item.DocumentoConta}</td>
                                    <td className="px-4 py-4 text-slate-400 max-w-[200px] truncate" title={item.Comentario}>{item.Comentario}</td>
                                </tr>
                            ))}
                            {!loading && (!data?.items || data.items.length === 0) && (
                                <tr>
                                    <td colSpan="8" className="px-6 py-10 text-center text-gray-400">
                                        No hay efectos pendientes para los filtros seleccionados
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
