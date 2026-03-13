import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const pendingDocs = data.pending_invoices;
        const totalPending = data.pending_total || 0;

        const formatCurrency = (val) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

        return (
            <div className="bg-white dark:bg-slate-800 p-4 border border-gray-200 dark:border-slate-700 shadow-2xl rounded-lg text-sm z-50 min-w-[320px] transition-colors">
                <h4 className="font-bold text-gray-900 dark:text-slate-100 mb-3 border-b border-gray-100 dark:border-slate-700 pb-2 text-base">{label}</h4>

                <div className="flex justify-between items-center mb-4 text-base">
                    <span className="text-gray-500 dark:text-slate-400 font-medium">Facturado</span>
                    <span className="font-bold text-green-600 dark:text-green-400 text-lg">
                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(payload[0].value)}
                    </span>
                </div>

                {pendingDocs && pendingDocs.length > 0 && (
                    <div className="mt-2 bg-orange-50 dark:bg-orange-950/30 rounded-md border border-orange-100 dark:border-orange-900/50 overflow-hidden">
                        <div className="bg-orange-100 dark:bg-orange-900/40 px-3 py-2 flex justify-between items-center border-b border-orange-200 dark:border-orange-900/50">
                            <span className="text-xs font-bold text-orange-800 dark:text-orange-400 uppercase tracking-wider">Pendiente Facturar</span>
                            <span className="font-bold text-orange-900 dark:text-orange-300">{formatCurrency(totalPending)}</span>
                        </div>
                        <ul className="p-2 space-y-2">
                            {pendingDocs.map((item, idx) => (
                                <li key={idx} className="text-xs flex justify-between gap-4 items-center">
                                    <span className="text-gray-700 dark:text-slate-300 truncate flex-1" title={item.RazonSocial}>
                                        {item.RazonSocial}
                                    </span>
                                    <span className="font-mono font-medium text-gray-900 dark:text-slate-100 whitespace-nowrap bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-orange-100 dark:border-orange-900/50 shadow-sm">
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

export function SalesByRepChart({ data, isEmbed }) {
    const containerClass = isEmbed
        ? "w-full h-full flex flex-col"
        : "bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 h-full flex flex-col transition-colors";

    const getDivisionColor = (division) => {
        switch (division) {
            case 'Conectrónica': return { fill: '#10b981', stroke: '#047857' }; // Emerald
            case 'Sismecánica': return { fill: '#3b82f6', stroke: '#1d4ed8' }; // Blue
            case 'Informática Industrial': return { fill: '#8b5cf6', stroke: '#6d28d9' }; // Purple
            default: return { fill: '#94a3b8', stroke: '#475569' }; // Gray/Slate
        }
    };

    return (
        <div className={containerClass}>
            <div className="flex justify-between items-center mb-2 px-2">
                <h3 className="text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-tight">Ventas por Comercial</h3>
                <div className="flex gap-3 text-[9px] font-bold uppercase tracking-tighter">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-sm bg-[#10b981]"></div>
                        <span className="text-slate-400">CONE</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-sm bg-[#3b82f6]"></div>
                        <span className="text-slate-400">SISM</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-sm bg-[#8b5cf6]"></div>
                        <span className="text-slate-400">INDU</span>
                    </div>
                </div>
            </div>
            <div style={{ width: '100%', height: '100%', minHeight: 0, flexGrow: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
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
                        <YAxis tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}M€` : val >= 1000 ? `${(val / 1000).toFixed(0)}k€` : `${val}€`} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
                        <Bar
                            dataKey="BaseImponible"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={80}
                            label={{
                                position: 'top',
                                fill: '#4b5563',
                                fontSize: 11,
                                fontWeight: 700,
                                formatter: (val) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}M€` : val >= 1000 ? `${(val / 1000).toFixed(1)}k€` : `${val.toFixed(0)}€`
                            }}
                        >
                            {data.map((entry, index) => {
                                const colors = getDivisionColor(entry.division);
                                return (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={colors.fill}
                                        stroke={colors.stroke}
                                        strokeWidth={2}
                                    />
                                );
                            })}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
