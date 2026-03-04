import {
    ResponsiveContainer,
    AreaChart, Area,
    XAxis, YAxis,
    CartesianGrid, Tooltip
} from 'recharts';

export function InventoryEvolutionChart({ data, isEmbed = false }) {
    const formatCurrency = (val) => {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val || 0);
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 shadow-xl border border-slate-100 rounded-xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                    <p className="text-sm font-black text-emerald-600">
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
                    Evolución del Valor de Inventario
                </h3>
            )}
            <div className={isEmbed ? "h-full" : "h-[300px]"}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data || []} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                        <defs>
                            <linearGradient id="colorValueStock" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                            tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#10b981"
                            strokeWidth={4}
                            fillOpacity={1}
                            fill="url(#colorValueStock)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
