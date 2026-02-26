import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#10b981', '#f87171']; // Emerald for Margin, Red for Cost

// Custom Tooltip for Margin
const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg text-sm z-50">
                <p className="font-semibold text-gray-700 mb-1">{data.name}</p>
                <p className="text-gray-900">
                    <span className="font-bold">
                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(data.value)}
                    </span>
                    <span className="text-gray-500 ml-2">({data.percentage.toFixed(2)}%)</span>
                </p>
            </div>
        );
    }
    return null;
};

export function SalesMarginChart({ data, marginPercentage }) {
    // Determine the color based on the margin percentage
    // e.g. red if negative or very low, green if good. For now, static emerald is fine for margin.

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 h-full flex flex-col relative">
            <h3 className="text-gray-700 font-semibold mb-2 text-center">Margen de Ventas</h3>

            {/* Center Text displaying the overall margin */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-4">
                <span className="text-2xl font-bold text-gray-800">
                    {marginPercentage ? marginPercentage.toFixed(2) : '0.00'}%
                </span>
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Margen</span>
            </div>

            <div style={{ width: '100%', height: '240px', minHeight: '240px', flexGrow: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={95}
                            startAngle={90}
                            endAngle={-270}
                            paddingAngle={2}
                            dataKey="value"
                            nameKey="name"
                            stroke="none"
                        >
                            {data && data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
