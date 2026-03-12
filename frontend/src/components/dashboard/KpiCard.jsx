
export function KpiCard({ title, value, subtext, isWarning, isPercentage, tooltip }) {
    const isMonetary = !isPercentage && (
        title.toLowerCase().includes('factura') ||
        title.toLowerCase().includes('comisión') ||
        title.toLowerCase().includes('pendiente') ||
        title.toLowerCase().includes('cobro') ||
        title.toLowerCase().includes('pago') ||
        title.toLowerCase().includes('saldo') ||
        title.toLowerCase().includes('importe') ||
        title.toLowerCase().includes('beneficio') ||
        title.toLowerCase().includes('margen') ||
        title.toLowerCase().includes('total')
    )
        && !title.toLowerCase().includes('número')
        && !title.toLowerCase().includes('nº')
        && !title.toLowerCase().includes('partes')
        && title.toLowerCase() !== 'facturas' // Literal "Facturas" is a count
        && !title.toLowerCase().includes('clientes');

    const formattedValue = typeof value !== 'number'
        ? value
        : isPercentage
            ? new Intl.NumberFormat('es-ES', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value / 100)
            : new Intl.NumberFormat('es-ES', {
                style: isMonetary ? 'currency' : 'decimal',
                currency: 'EUR',
                maximumFractionDigits: 0,
            }).format(value);

    // Dynamic styles
    const titleColor = isWarning ? "text-orange-600 dark:text-orange-400" : "text-gray-500 dark:text-slate-400";
    const valueColor = isWarning ? "text-orange-700 dark:text-orange-300" : "text-gray-900 dark:text-slate-100";
    const borderColor = isWarning ? "border-orange-200 dark:border-orange-900" : "border-gray-200 dark:border-slate-800";
    const bgColor = isWarning ? "bg-orange-50 dark:bg-orange-950/30" : "bg-white dark:bg-slate-900";

    return (
        <div className={`group relative ${bgColor} p-4 rounded-lg shadow-sm border ${borderColor} flex flex-col items-center justify-center text-center transition-all hover:shadow-md cursor-help h-full`}>
            {tooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 dark:bg-slate-700 text-white text-[10px] rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {tooltip}
                    {/* Tooltip arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800 dark:border-t-slate-700"></div>
                </div>
            )}
            <h3 className={`${titleColor} font-bold text-[10px] uppercase tracking-tighter mb-1`}>{title}</h3>
            <div className={`text-2xl font-black ${valueColor}`}>{formattedValue}</div>
            {subtext && <div className="text-gray-400 dark:text-slate-500 text-[9px] mt-1 font-medium">{subtext}</div>}
        </div>
    );
}
