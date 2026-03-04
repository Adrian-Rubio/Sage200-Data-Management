import {
    ResponsiveContainer,
    BarChart, Bar,
    XAxis, YAxis,
    CartesianGrid, Tooltip,
    Cell
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function TopArticlesChart({ data, isEmbed = false }) {
    const formatCurrency = (val) => {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val || 0);
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 shadow-lg border border-gray-100 rounded-lg">
                    <p className="text-[10px] font-bold text-gray-400 mb-1">{label}</p>
                    <p className="text-sm font-black text-indigo-600">
                        {formatCurrency(payload[0].value)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className={`w-full ${isEmbed ? 'h-full' : 'h-[350px] bg-white p-6 rounded-2xl shadow-sm border border-slate-100'}`}>
            {!isEmbed && (
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <div className="w-2 h-4 bg-amber-500 rounded-full"></div>
                    Top 5 Artículos Comprados
                </h3>
            )}
            <div className={isEmbed ? "h-full" : "h-[300px]"}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data || []} margin={{ bottom: 40, top: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94a3b8', angle: -15, textAnchor: 'end' }} interval={0} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={35} label={{ position: 'top', fill: '#f59e0b', fontSize: 9, fontWeight: 'bold', formatter: (val) => `${(val / 1000).toFixed(0)}k` }}>
                            {(data || []).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
