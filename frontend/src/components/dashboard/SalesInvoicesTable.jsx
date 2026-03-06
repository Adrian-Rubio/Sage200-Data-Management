
import { useState } from 'react';

export function SalesInvoicesTable({ data }) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredData = data.filter(inv =>
        inv.NumeroFactura?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.Cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.Comisionista?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <div className="flex flex-col">
                    <h2 className="text-lg font-bold text-slate-800 uppercase">Lista de Facturas</h2>
                    <p className="text-xs text-slate-500">Últimas 100 facturas según filtros</p>
                </div>

                <div className="relative">
                    <input
                        type="text"
                        placeholder="Nº Factura, Cliente o Comercial..."
                        className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-72 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <svg className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50/50">
                        <tr>
                            <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nº Factura</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Comercial</th>
                            <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Base Imponible</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-50">
                        {filteredData.length > 0 ? (
                            filteredData.map((inv, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-slate-700">
                                        #{inv.NumeroFactura}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">
                                        {inv.FechaFactura}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-700">
                                        <div className="font-medium max-w-[250px] truncate" title={inv.Cliente}>
                                            <span className="text-slate-400 font-normal mr-1">{inv.CodigoCliente}</span>
                                            {inv.Cliente}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">
                                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-medium uppercase">
                                            {inv.Comisionista}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-xs text-right font-bold text-slate-800">
                                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(inv.TotalBase || 0)}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-10 text-center text-sm text-slate-400">
                                    No se encontraron facturas con los filtros actuales.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
