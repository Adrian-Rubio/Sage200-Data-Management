
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
    const titleColor = isWarning ? "text-orange-600" : "text-gray-500";
    const valueColor = isWarning ? "text-orange-700" : "text-gray-900";
    const borderColor = isWarning ? "border-orange-200" : "border-gray-200";
    const bgColor = isWarning ? "bg-orange-50" : "bg-white";

    return (
        <div className={`group relative ${bgColor} p-4 rounded-lg shadow-sm border ${borderColor} flex flex-col items-center justify-center text-center transition-all hover:shadow-md cursor-help h-full`}>
            {tooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {tooltip}
                    {/* Tooltip arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
                </div>
            )}
            <h3 className={`${titleColor} font-bold text-[10px] uppercase tracking-tighter mb-1`}>{title}</h3>
            <div className={`text-2xl font-black ${valueColor}`}>{formattedValue}</div>
            {subtext && <div className="text-gray-400 text-[9px] mt-1 font-medium">{subtext}</div>}
        </div>
    );
}
