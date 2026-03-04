import {
    ResponsiveContainer,
    BarChart, Bar,
    XAxis, YAxis,
    CartesianGrid, Tooltip,
    Cell
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function TopProvidersChart({ data, isEmbed = false }) {
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
                    <div className="w-2 h-4 bg-emerald-500 rounded-full"></div>
                    Top 5 Proveedores por Volumen
                </h3>
            )}
            <div className={isEmbed ? "h-full" : "h-[300px]"}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data || []} layout="vertical" margin={{ left: 140, right: 80, top: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 9, fontWeight: 'black', fill: '#475569' }}
                            width={130}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24} label={{ position: 'right', fill: '#6366f1', fontSize: 10, fontWeight: 'bold', formatter: (val) => formatCurrency(val) }}>
                            {(data || []).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
