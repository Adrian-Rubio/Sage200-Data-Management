
export function KpiCard({ title, value, subtext }) {
    // Format value (e.g. 1.2M or 150k)
    const formattedValue = new Intl.NumberFormat('es-ES', {
        maximumFractionDigits: 2,
        notation: "compact",
        compactDisplay: "short"
    }).format(value);

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center">
            <h3 className="text-gray-500 font-medium text-sm uppercase tracking-wider mb-2">{title}</h3>
            <div className="text-4xl font-bold text-gray-800">{formattedValue}</div>
            {subtext && <p className="text-gray-400 text-xs mt-2">{subtext}</p>}
        </div>
    );
}
