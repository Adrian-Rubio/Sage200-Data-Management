export function TopClientsTable({ data }) {
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <h3 className="text-gray-700 font-semibold mb-4 text-center">Top 15 clientes</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-blue-100 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-4 py-3">Cliente</th>
                            <th scope="col" className="px-4 py-3 text-right">Facturación</th>
                            <th scope="col" className="px-4 py-3 text-right">Pedidos</th>
                            <th scope="col" className="px-4 py-3 text-right">Ticket Medio</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((client, index) => (
                            <tr key={index} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-4 py-2 font-medium text-gray-900 truncate max-w-xs" title={client.RazonSocial}>
                                    {client.RazonSocial}
                                </td>
                                <td className="px-4 py-2 text-right">
                                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(client.revenue)}
                                </td>
                                <td className="px-4 py-2 text-right">
                                    {client.orders}
                                </td>
                                <td className="px-4 py-2 text-right">
                                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(client.ticket_avg)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
