import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899']; // Emerald, Blue, Purple, Amber, Pink

const TopDivisionsChart = ({ data }) => {
    if (!data || data.length === 0) {
        return <div className="h-full flex items-center justify-center text-slate-500 font-medium">No hay datos por división</div>;
    }

    return (
        <div className="w-full h-full pb-8">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 10, right: 40, left: 100, bottom: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis
                        type="number"
                        tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        type="category"
                        dataKey="name"
                        stroke="#334155"
                        fontSize={13}
                        fontWeight={600}
                        tickLine={false}
                        axisLine={false}
                        width={100}
                    />
                    <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(value) => [`€${value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Importe Comprado']}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={32}>
                        <LabelList
                            dataKey="value"
                            position="right"
                            formatter={(value) => `€${(value / 1000).toFixed(1)}k`}
                            fill="#64748b"
                            fontSize={12}
                            fontWeight={600}
                        />
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default TopDivisionsChart;
