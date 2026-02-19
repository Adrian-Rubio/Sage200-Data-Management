
export function KpiCard({ title, value, subtext, isWarning }) {
    // Format value (e.g. 1.2M or 150k)
    // If it's a large monetary value, maybe compact is fine, but let's just make it look good.
    // For pending invoice which is monetary, we usually want to see the currency symbol.

    const isMonetary = (title.toLowerCase().includes('factura') || title.toLowerCase().includes('comisión') || title.toLowerCase().includes('pendiente'))
        && !title.toLowerCase().includes('número')
        && !title.toLowerCase().includes('clientes');

    const formattedValue = new Intl.NumberFormat('es-ES', {
        style: isMonetary ? 'currency' : 'decimal',
        currency: 'EUR',
        maximumFractionDigits: 0,
        // notation: "compact", // Compact can be confusing for exact amounts like 123.456 €
        // compactDisplay: "short"
    }).format(value);

    // Dynamic styles
    const titleColor = isWarning ? "text-orange-600" : "text-gray-500";
    const valueColor = isWarning ? "text-orange-700" : "text-gray-900";
    const borderColor = isWarning ? "border-orange-200" : "border-gray-200";
    const bgColor = isWarning ? "bg-orange-50" : "bg-white";

    return (
        <div className={`${bgColor} p-6 rounded-lg shadow-sm border ${borderColor} flex flex-col items-center justify-center text-center transition-all hover:shadow-md`}>
            <h3 className={`${titleColor} font-medium text-sm uppercase tracking-wider mb-2`}>{title}</h3>
            <div className={`text-3xl font-bold ${valueColor}`}>{formattedValue}</div>
            {subtext && <p className="text-gray-400 text-xs mt-2">{subtext}</p>}
        </div>
    );
}
