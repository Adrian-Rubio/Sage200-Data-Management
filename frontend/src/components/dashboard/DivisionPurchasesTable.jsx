import React, { useState } from 'react';

export function DivisionPurchasesTable({ data }) {
    const [expandedDivisions, setExpandedDivisions] = useState({});

    if (!data || data.length === 0) {
        return null;
    }

    const toggleDivision = (division) => {
        setExpandedDivisions(prev => ({ ...prev, [division]: !prev[division] }));
    };

    // Group data by division for the table
    const groupedData = data.reduce((acc, item) => {
        if (!acc[item.Division]) {
            acc[item.Division] = { items: [], totalAmount: 0, totalUnits: 0 };
        }
        acc[item.Division].items.push(item);
        acc[item.Division].totalAmount += item.Importe;
        acc[item.Division].totalUnits += item.Unidades;
        return acc;
    }, {});

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-800 overflow-hidden mb-6 transition-colors">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between transition-colors">
                <div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">Detalle de Compras por División</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Desglose de productos agrupados por familia. Haz clic en cada fila para ver el detalle.</p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-wider sticky top-0 transition-colors">
                        <tr>
                            <th className="px-6 py-4 rounded-tl-lg">Proveedor / Artículo</th>
                            <th className="px-6 py-4 text-right">Unidades</th>
                            <th className="px-6 py-4 text-right rounded-tr-lg">Importe</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 transition-colors">
                        {Object.entries(groupedData).map(([division, divData]) => (
                            <React.Fragment key={division}>
                                {/* Cabecera de División */}
                                <tr
                                    className="bg-slate-50/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                                    onClick={() => toggleDivision(division)}
                                >
                                    <td className="px-6 py-4 font-black text-slate-800 dark:text-slate-200 flex items-center gap-3">
                                        <div className={`transform transition-transform text-indigo-500 dark:text-indigo-400 ${expandedDivisions[division] ? 'rotate-90' : 'rotate-0'}`}>
                                            ▶
                                        </div>
                                        <span className={expandedDivisions[division] ? 'text-indigo-600 dark:text-indigo-400' : ''}>{division}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-600 dark:text-slate-300">
                                        {divData.totalUnits.toLocaleString('es-ES', { maximumFractionDigits: 0 })} u.
                                    </td>
                                    <td className="px-6 py-4 text-right font-black text-slate-800 dark:text-slate-100 text-base">
                                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(divData.totalAmount)}
                                    </td>
                                </tr>

                                {/* Detalles de la división (Colapsables) */}
                                {expandedDivisions[division] && divData.items.map((item, idx) => (
                                    <tr key={`${division}-${idx}`} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/30 transition-colors border-l-4 border-l-indigo-400 dark:border-l-indigo-500">
                                        <td className="px-6 py-4 pl-12">
                                            <div className="font-bold text-slate-700 dark:text-slate-300 w-full mb-1">{item.Proveedor}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 w-full flex items-center gap-2">
                                                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400 font-medium transition-colors">Art:</span>
                                                {item.Articulo}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-500 dark:text-slate-400">
                                            {item.Unidades > 0 ? `${item.Unidades.toLocaleString('es-ES', { maximumFractionDigits: 0 })} u.` : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-600 dark:text-slate-300">
                                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(item.Importe)}
                                        </td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
