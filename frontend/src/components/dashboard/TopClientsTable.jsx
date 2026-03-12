export function TopClientsTable({ data }) {
    return (
        <div className="p-4 bg-white dark:bg-slate-900 transition-colors">
            <div className="flex flex-col mb-6">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Top 15 Clientes</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Ranking por facturación en el periodo</p>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                    <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                        <tr>
                            <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ranking</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cliente</th>
                            <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Facturación</th>
                            <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pedidos</th>
                            <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ticket Medio</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-50 dark:divide-slate-800/50">
                        {data.length > 0 ? data.map((client, index) => (
                            <tr key={index} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group text-xs">
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${index === 0 ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400' :
                                            index === 1 ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300' :
                                                index === 2 ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400' :
                                                    'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                        }`}>
                                        {index + 1}
                                    </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]" title={client.RazonSocial}>
                                    {client.RazonSocial}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-slate-800 dark:text-slate-200">
                                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(client.revenue)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right text-slate-600 dark:text-slate-400">
                                    {client.orders}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right text-slate-500 dark:text-slate-400">
                                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(client.ticket_avg)}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-10 text-center text-sm text-slate-400 dark:text-slate-500">
                                    No hay datos de clientes para este periodo.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
