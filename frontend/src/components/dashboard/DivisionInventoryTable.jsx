import React, { useState } from 'react';

export function DivisionInventoryTable({ data }) {
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
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-6">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">Detalle de Stock por División</h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Estado actual del inventario por familias. Haz clic para ver el desglose.</p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-wider sticky top-0">
                        <tr>
                            <th className="px-6 py-4">Artículo / Referencia</th>
                            <th className="px-6 py-4 text-right">Existencias</th>
                            <th className="px-6 py-4 text-right">Valor en Stock</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {Object.entries(groupedData).map(([division, divData]) => (
                            <React.Fragment key={division}>
                                <tr
                                    className="bg-slate-50/80 hover:bg-slate-100 cursor-pointer transition-colors"
                                    onClick={() => toggleDivision(division)}
                                >
                                    <td className="px-6 py-4 font-black text-slate-800 flex items-center gap-3">
                                        <div className={`transform transition-transform text-emerald-500 ${expandedDivisions[division] ? 'rotate-90' : 'rotate-0'}`}>
                                            ▶
                                        </div>
                                        <span className={expandedDivisions[division] ? 'text-emerald-700' : ''}>{division}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-600">
                                        {divData.totalUnits.toLocaleString('es-ES', { maximumFractionDigits: 0 })} u.
                                    </td>
                                    <td className="px-6 py-4 text-right font-black text-slate-800 text-base">
                                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(divData.totalAmount)}
                                    </td>
                                </tr>

                                {expandedDivisions[division] && divData.items.map((item, idx) => (
                                    <tr key={`${division}-${idx}`} className="hover:bg-emerald-50/30 transition-colors border-l-4 border-l-emerald-400">
                                        <td className="px-6 py-4 pl-12">
                                            <div className="font-bold text-slate-700 w-full mb-1">{item.DescripcionArticulo}</div>
                                            <div className="text-xs text-slate-500 w-full flex items-center gap-2">
                                                <span className="bg-white border border-slate-100 px-2 py-0.5 rounded text-slate-400 font-semibold uppercase text-[9px]">SKU</span>
                                                {item.DescripcionArticulo.split(' ')[0]}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-500">
                                            {item.Unidades > 0 ? `${item.Unidades.toLocaleString('es-ES', { maximumFractionDigits: 0 })} u.` : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-600">
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
