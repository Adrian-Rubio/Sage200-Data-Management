import { useState, useEffect } from 'react';
import { fetchSalesInvoices } from '../../services/api';

export function SalesInvoicesTable({ initialData, filters }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(50);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [invoices, setInvoices] = useState(initialData || []);
    const [isLoading, setIsLoading] = useState(false);

    // Initial load: if we have initial data, use it for page 1
    useEffect(() => {
        // We only use initial data if it's the first render and we are on page 1
        // But since filters can change, we should probably just fetch to be safe
        // Or if initialData is exactly the 100 we requested, we can use it.
        // For simplicity and "ver todas", let's just fetch when things change.
        loadInvoices();
    }, [filters, page]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setPage(1);
    }, [filters]);

    const loadInvoices = async () => {
        setIsLoading(true);
        try {
            const result = await fetchSalesInvoices({
                ...filters,
                page,
                page_size: pageSize
            });
            setInvoices(result.data || []);
            setTotal(result.total || 0);
            setTotalPages(result.total_pages || 1);
        } catch (error) {
            console.error("Error loading invoices:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredData = invoices.filter(inv =>
        inv.NumeroFactura?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.Cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.Comisionista?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 flex flex-col h-full bg-white dark:bg-slate-900 transition-colors">
            <div className="flex justify-between items-center mb-6">
                <div className="flex flex-col">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 uppercase flex items-center gap-2">
                        Lista de Facturas
                        {isLoading && (
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        )}
                    </h2>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight"> Mostrando {invoices.length} de {total} resultados</p>
                </div>

                <div className="relative">
                    <input
                        type="text"
                        placeholder="Filtrar en esta página..."
                        className="pl-10 pr-4 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <svg className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            <div className="overflow-x-auto flex-grow">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                    <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                        <tr>
                            <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Nº Factura</th>
                            <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Fecha</th>
                            <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Cliente</th>
                            <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Comercial</th>
                            <th className="px-4 py-3 text-right text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Importe</th>
                        </tr>
                    </thead>
                    <tbody className={`bg-white dark:bg-slate-900 divide-y divide-slate-50 dark:divide-slate-800/50 ${isLoading ? 'opacity-50' : ''}`}>
                        {filteredData.length > 0 ? (
                            filteredData.map((inv, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-4 py-2.5 whitespace-nowrap text-xs font-bold text-slate-700 dark:text-slate-300">
                                        #{inv.NumeroFactura}
                                    </td>
                                    <td className="px-4 py-2.5 whitespace-nowrap text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                        {inv.FechaFactura}
                                    </td>
                                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-slate-700 dark:text-slate-300">
                                        <div className="font-semibold max-w-[300px] truncate flex items-center gap-2" title={inv.Cliente}>
                                            <span className="text-slate-300 dark:text-slate-600 font-black text-[10px]">{inv.CodigoCliente}</span>
                                            {inv.Cliente}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5 whitespace-nowrap">
                                        <span className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700 px-2 py-0.5 rounded-[4px] text-[9px] font-black uppercase tracking-tighter">
                                            {inv.Comisionista}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-right font-black text-slate-900 dark:text-slate-100">
                                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(inv.TotalBase || 0)}
                                    </td>
                                </tr>
                            ))
                        ) : (
                                // This block handles the empty state
                            <tr>
                                <td colSpan="5" className="px-6 py-10 text-center text-sm text-slate-400 dark:text-slate-500 font-bold italic">
                                    {isLoading ? 'Cargando facturas...' : 'No se encontraron facturas.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-50 dark:border-slate-800">
                <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Página {page} de {totalPages}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || isLoading}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        Anterior
                    </button>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || isLoading}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 dark:bg-blue-500 text-white text-xs font-bold hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                        Siguiente
                    </button>
                </div>
            </div>
        </div>
    );
}
