import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = {
    'Conectrónica': '#e11d48', // Pinkish/Red
    'Sismecánica': '#2563eb', // Blue
    'Informática Industrial': '#059669', // Green
    'Otros': '#94a3b8' // Gray
};

export function SalesMarginEvolutionChart({ data, isEmbed }) {
    // Get unique divisions from data to render lines
    const divisions = data.length > 0
        ? Object.keys(data[0]).filter(key => key !== 'Periodo')
        : [];

    const containerClass = isEmbed
        ? "w-full h-full flex flex-col pt-0"
        : "bg-white p-4 rounded-lg shadow-sm border border-gray-200 h-full flex flex-col";

    return (
        <div className={containerClass}>
            <h3 className="text-gray-700 font-semibold mb-4 text-center">Evolución de Margen por División (%)</h3>
            <div style={{ width: '100%', height: '100%', minHeight: 0, flexGrow: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="Periodo"
                            tick={{ fontSize: 10 }}
                            tickFormatter={(val) => {
                                // Dynamic parsing for YYYY-MM or YYYY-MM-DD
                                const isDaily = val.length > 7;
                                if (isDaily) {
                                    const d = new Date(val);
                                    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                                }
                                const date = new Date(val + '-01');
                                return date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
                            }}
                        />
                        <YAxis
                            tickFormatter={(val) => `${val}%`}
                            domain={[0, 'auto']}
                            tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                            formatter={(val, name) => [`${val.toFixed(1)}%`, name]}
                            labelFormatter={(label) => {
                                const isDaily = label.length > 7;
                                if (isDaily) {
                                    return new Date(label).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
                                }
                                const date = new Date(label + '-01');
                                return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
                            }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend />
                        {divisions.map((div) => (
                            <Line
                                key={div}
                                type="monotone"
                                dataKey={div}
                                stroke={COLORS[div] || COLORS.Otros}
                                strokeWidth={3}
                                dot={data.length > 31 ? false : { r: 3 }}
                                activeDot={{ r: 6 }}
                                name={div}
                                label={data.length > 32 ? false : {
                                    position: 'top',
                                    fontSize: 10,
                                    fill: COLORS[div] || '#666',
                                    formatter: (val) => `${val.toFixed(0)}%`
                                }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
