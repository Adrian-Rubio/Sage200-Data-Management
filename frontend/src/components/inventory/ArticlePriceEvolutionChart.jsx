import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function ArticlePriceEvolutionChart({ data, isModal = false }) {
    if (!data || data.length === 0) {
        return (
            <div className={`flex flex-col items-center justify-center min-h-[300px] transition-colors ${isModal ? '' : 'bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800'}`}>
                <svg className="w-16 h-16 text-slate-200 dark:text-slate-800 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-slate-400 dark:text-slate-500 font-bold uppercase text-xs tracking-widest text-center">
                    No hay suficientes datos históricos<br/>de precios para este artículo.
                </p>
            </div>
        );
    }

    const { maxSale, minPurchase, avgMargin } = useMemo(() => {
        const salesData = data.filter(d => d.sale_price != null && d.sale_price > 0);
        const purchasesData = data.filter(d => d.purchase_price != null && d.purchase_price > 0);

        const mSale = salesData.length > 0 ? Math.max(...salesData.map(d => d.sale_price)) : null;
        const mPurchase = purchasesData.length > 0 ? Math.min(...purchasesData.map(d => d.purchase_price)) : null;
        
        const aSale = salesData.length > 0 ? salesData.reduce((acc, curr) => acc + curr.sale_price, 0) / salesData.length : 0;
        const aPurchase = purchasesData.length > 0 ? purchasesData.reduce((acc, curr) => acc + curr.purchase_price, 0) / purchasesData.length : 0;
        const aMargin = aSale > 0 ? ((aSale - aPurchase) / aSale) * 100 : null;

        return { maxSale: mSale, minPurchase: mPurchase, avgMargin: aMargin };
    }, [data]);

    const formatCurrency = (val) => {
        if (val == null || isNaN(val) || val === 0 /* sometimes 0 is missing data */) return '---';
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-slate-800 p-4 border border-slate-100 dark:border-slate-700 shadow-xl rounded-2xl transition-colors">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-50 dark:border-slate-700 pb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between gap-6 mb-2 last:mb-0">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-4 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{entry.name}</span>
                            </div>
                            <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                                {formatCurrency(entry.value)}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    const containerClasses = isModal 
        ? "flex flex-col gap-6 transition-colors" 
        : "bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col transition-colors";

    return (
        <div className={containerClasses}>
            {!isModal && (
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-purple-500 rounded-full"></div>
                        Evolución de Precios (Compras vs Ventas)
                    </h3>
                </div>
            )}

            {isModal && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl p-4 flex flex-col justify-center">
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest block mb-1">Precio Venta Máx.</span>
                        <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(maxSale)}</span>
                    </div>
                    <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl p-4 flex flex-col justify-center">
                        <span className="text-[10px] font-black text-rose-600 dark:text-rose-500 uppercase tracking-widest block mb-1">Coste Compra Mín.</span>
                        <span className="text-xl font-bold text-rose-700 dark:text-rose-400">{formatCurrency(minPurchase)}</span>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl p-4 flex flex-col justify-center">
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-widest block mb-1">Margen Medio (Venta)</span>
                        <span className="text-xl font-bold text-blue-700 dark:text-blue-400">
                            {avgMargin !== null ? `${avgMargin > 0 ? '+' : ''}${avgMargin.toFixed(2)}%` : '---'}
                        </span>
                    </div>
                </div>
            )}

            <div className="flex-1 w-full min-h-[350px]">
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.4} />
                        <XAxis 
                            dataKey="month" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                            tickFormatter={(value) => `${value} €`}
                            width={80}
                            dx={-10}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '5 5' }} />
                        <Legend 
                            wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 'bold' }}
                            iconType="circle"
                        />
                        <Line 
                            type="monotone" 
                            dataKey="sale_price" 
                            name="Precio Venta Medio" 
                            stroke="#10b981" 
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                            connectNulls
                        />
                        <Line 
                            type="monotone" 
                            dataKey="purchase_price" 
                            name="Coste Compra Medio" 
                            stroke="#f43f5e" 
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 6, strokeWidth: 0, fill: '#f43f5e' }}
                            connectNulls
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            
            {!isModal && (
                <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 text-center">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">
                        * Muestra la media de precios por mes (relleno automático si no hay operaciones en meses intermedios).
                    </p>
                </div>
            )}

            {isModal && (
                <div className="mt-2 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto custom-scrollbar max-h-64">
                        <table className="w-full text-left text-xs">
                            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-10">
                                <tr className="text-slate-500 dark:text-slate-400 font-black uppercase text-[9px] tracking-widest">
                                    <th className="py-3 px-4">Mes</th>
                                    <th className="py-3 px-4 text-right">Coste Medio Compra</th>
                                    <th className="py-3 px-4 text-right">Precio Medio Venta</th>
                                    <th className="py-3 px-4 text-right">Margen Bruto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900/50">
                                {data.slice().reverse().map((row, idx) => {
                                    const hasPurchase = row.purchase_price != null && row.purchase_price > 0;
                                    const hasSale = row.sale_price != null && row.sale_price > 0;
                                    
                                    const diff = hasSale && hasPurchase ? row.sale_price - row.purchase_price : null;
                                    const marginPct = hasSale && hasPurchase && row.sale_price > 0 
                                        ? (diff / row.sale_price) * 100 
                                        : null;

                                    return (
                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                                            <td className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300">{row.month}</td>
                                            <td className="py-3 px-4 text-right font-medium text-rose-600 dark:text-rose-400">
                                                {formatCurrency(hasPurchase ? row.purchase_price : null)}
                                            </td>
                                            <td className="py-3 px-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                                                {formatCurrency(hasSale ? row.sale_price : null)}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                {marginPct !== null ? (
                                                    <span className={`font-black ${marginPct > 0 ? 'text-blue-500 dark:text-blue-400' : 'text-orange-500 dark:text-orange-400'}`}>
                                                        {marginPct > 0 ? '+' : ''}{marginPct.toFixed(2)}% ({formatCurrency(diff)})
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 dark:text-slate-600">---</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 py-3 px-4 text-center border-t border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">
                            * Los meses sin datos de compra o venta muestran valores interpolados en la gráfica para mantener la continuidad, pero no se calculan márgenes. Listado de más reciente a más antiguo.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
