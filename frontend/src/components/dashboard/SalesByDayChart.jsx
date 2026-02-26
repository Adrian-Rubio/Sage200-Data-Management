import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function SalesByDayChart({ data, isEmbed }) {
    const containerClass = isEmbed
        ? "w-full h-full flex flex-col pt-0"
        : "bg-white p-4 rounded-lg shadow-sm border border-gray-200 h-full flex flex-col";

    return (
        <div className={containerClass}>
            <h3 className="text-gray-700 font-semibold mb-4 text-center">Facturación Total por Día</h3>
            <div style={{ width: '100%', height: '100%', minHeight: 0, flexGrow: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} minTickGap={30} />
                        <YAxis tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                        <Tooltip
                            labelFormatter={(label) => new Date(label).toLocaleDateString('es-ES')}
                            formatter={(val) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val)}
                        />
                        <Line
                            type="monotone"
                            dataKey="amount"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={data.length < 32 ? { r: 3 } : false}
                            activeDot={{ r: 6 }}
                            fill="url(#colorUv)"
                            label={data.length < 20 ? {
                                position: 'top',
                                fontSize: 10,
                                fill: '#2563eb',
                                formatter: (val) => val > 0 ? `${(val / 1000).toFixed(1)}k` : ''
                            } : false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
