import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const pending = data.pending_invoices;

        // Calculate Total Pending for this Rep
        const totalPending = pending ? pending.reduce((sum, item) => sum + item.ImporteLiquido, 0) : 0;

        const formatCurrency = (val) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

        return (
            <div className="bg-white p-4 border border-gray-200 shadow-2xl rounded-lg text-sm z-50 min-w-[320px]">
                <h4 className="font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2 text-base">{label}</h4>

                <div className="flex justify-between items-center mb-4 text-base">
                    <span className="text-gray-500 font-medium">Facturado</span>
                    <span className="font-bold text-green-600 text-lg">
                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(payload[0].value)}
                    </span>
                </div>

                {pending && pending.length > 0 && (
                    <div className="mt-2 bg-orange-50 rounded-md border border-orange-100 overflow-hidden">
                        <div className="bg-orange-100 px-3 py-2 flex justify-between items-center border-b border-orange-200">
                            <span className="text-xs font-bold text-orange-800 uppercase tracking-wider">Pendiente Facturar</span>
                            <span className="font-bold text-orange-900">{formatCurrency(totalPending)}</span>
                        </div>
                        <ul className="p-2 space-y-2">
                            {pending.map((item, idx) => (
                                <li key={idx} className="text-xs flex justify-between gap-4 items-center">
                                    <span className="text-gray-700 truncate flex-1" title={item.RazonSocial}>
                                        {item.RazonSocial}
                                    </span>
                                    <span className="font-mono font-medium text-gray-900 whitespace-nowrap bg-white px-1.5 py-0.5 rounded border border-orange-100 shadow-sm">
                                        {formatCurrency(item.ImporteLiquido)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    }
    return null;
};

export function SalesByRepChart({ data }) {
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
            <h3 className="text-gray-700 font-semibold mb-4 text-center">Facturación Total por Comercial</h3>
            <div className="flex-grow w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="Comisionista"
                            tick={{ fontSize: 13, fontWeight: 600, fill: '#1f2937' }}
                            interval={0}
                            height={60}
                            tickFormatter={(value) => {
                                // Shorten for display
                                if (value === 'JUAN CARLOS BENITO RAMOS') return 'JUAN C. BENITO';
                                if (value === 'JUAN CARLOS VALDES ANTON') return 'JUAN C. VALDES';
                                const parts = value.split(' ');
                                if (parts.length > 2) return `${parts[0]} ${parts[1]}...`;
                                return value;
                            }}
                        />
                        <YAxis tickFormatter={(val) => `${(val / 1000).toFixed(0)}k€`} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
                        <Bar dataKey="BaseImponible" radius={[4, 4, 0, 0]} maxBarSize={80}>
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={index % 2 === 0 ? '#10b981' : '#3b82f6'}
                                    stroke={index % 2 === 0 ? '#047857' : '#1d4ed8'}
                                    strokeWidth={2}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
