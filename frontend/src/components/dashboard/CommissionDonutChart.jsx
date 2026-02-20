import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function CommissionDonutChart({ data }) {
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
            <h3 className="text-gray-700 font-semibold mb-4 text-center">Porcentajes de Comisión</h3>
            <div style={{ width: '100%', height: '100%', minHeight: 0, flexGrow: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="amount"
                            nameKey="percentage"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(val) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val)} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
