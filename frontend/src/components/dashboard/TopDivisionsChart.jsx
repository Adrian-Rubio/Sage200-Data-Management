import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899']; // Emerald, Blue, Purple, Amber, Pink

const TopDivisionsChart = ({ data }) => {
    if (!data || data.length === 0) {
        return <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400 font-medium">No hay datos por división</div>;
    }

    return (
        <div className="w-full h-full pb-8">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 10, right: 40, left: 100, bottom: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                    <XAxis
                        type="number"
                        tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                        tick={{ fill: 'currentColor' }}
                        className="text-slate-400 dark:text-slate-500"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fill: 'currentColor' }}
                        className="text-slate-700 dark:text-slate-300"
                        fontSize={13}
                        fontWeight={600}
                        tickLine={false}
                        axisLine={false}
                        width={100}
                    />
                    <Tooltip
                        cursor={{ fill: 'currentColor', opacity: 0.1 }}
                        content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="bg-white dark:bg-slate-900 p-3 shadow-lg border border-gray-100 dark:border-slate-800 rounded-lg transition-colors">
                                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-1">{label}</p>
                                        <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                                            €{payload[0].value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={32}>
                        <LabelList
                            dataKey="value"
                            position="right"
                            formatter={(value) => `€${(value / 1000).toFixed(1)}k`}
                            fill="currentColor"
                            className="text-slate-500 dark:text-slate-400"
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
