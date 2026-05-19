import React, { useState } from 'react';

/**
 * columns: Array of {
 *   key: string,
 *   label: string,
 *   align?: 'left' | 'center' | 'right',
 *   className?: string,
 *   render?: (value, item, index) => ReactNode
 * }
 * data: Array of objects
 * title?: string
 * badgeText?: string
 * keyField?: string (default: id or first key)
 * expandable?: {
 *   renderExpanded: (item, index) => ReactNode,
 *   isExpandedByDefault?: (item) => boolean
 * }
 * maxHeightClass?: string (default: 'max-h-[600px]')
 * emptyMessage?: string (default: 'No hay datos disponibles')
 */
export function GenericTable({
    columns,
    data = [],
    title,
    badgeText,
    keyField = 'id',
    expandable,
    maxHeightClass = 'max-h-[600px]',
    emptyMessage = 'No hay datos para el periodo o filtros seleccionados'
}) {
    const [expandedRows, setExpandedRows] = useState([]);

    const toggleRow = (rowId) => {
        setExpandedRows(prev =>
            prev.includes(rowId) ? prev.filter(id => id !== rowId) : [...prev, rowId]
        );
    };

    const getRowKey = (item, index) => {
        return item[keyField] !== undefined ? item[keyField] : index;
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col transition-colors animate-fadeIn">
            {/* Table Header Bar */}
            {(title || badgeText !== undefined) && (
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 transition-colors">
                    {title && <h3 className="font-bold text-slate-700 dark:text-slate-300">{title}</h3>}
                    {badgeText !== undefined && (
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded font-bold uppercase tracking-wider transition-colors">
                            {badgeText}
                        </span>
                    )}
                </div>
            )}

            {/* Scrollable Container */}
            <div className={`overflow-x-auto overflow-y-auto ${maxHeightClass} custom-scrollbar`}>
                <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#fcfdff] dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold uppercase text-[9px] tracking-wider sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800 transition-colors">
                        <tr>
                            {expandable && <th className="px-4 py-3 w-8"></th>}
                            {columns.map((col, idx) => {
                                const alignClass = col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left';
                                return (
                                    <th
                                        key={col.key || idx}
                                        className={`px-4 py-3 ${alignClass} ${col.className || ''}`}
                                    >
                                        {col.label}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 transition-colors">
                        {data.map((item, index) => {
                            const rowId = getRowKey(item, index);
                            const isExpanded = expandedRows.includes(rowId);

                            return (
                                <React.Fragment key={rowId}>
                                    <tr
                                        onClick={expandable ? () => toggleRow(rowId) : undefined}
                                        className={`transition-colors ${expandable ? 'cursor-pointer' : ''} hover:bg-slate-50 dark:hover:bg-slate-800/50`}
                                    >
                                        {expandable && (
                                            <td className="px-4 py-4 text-center">
                                                <span className={`inline-block transition-transform duration-200 text-slate-400 dark:text-slate-500 ${isExpanded ? 'rotate-90' : ''}`}>
                                                    ▶
                                                </span>
                                            </td>
                                        )}
                                        {columns.map((col, colIdx) => {
                                            const alignClass = col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left';
                                            const cellVal = item[col.key];
                                            return (
                                                <td
                                                    key={col.key || colIdx}
                                                    className={`px-4 py-4 ${alignClass} ${col.className || ''}`}
                                                >
                                                    {col.render ? col.render(cellVal, item, index) : (cellVal !== null && cellVal !== undefined ? cellVal.toString() : '')}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                    {expandable && isExpanded && (
                                        <tr>
                                            <td colSpan={columns.length + 1} className="bg-slate-50/30 dark:bg-slate-800/30 p-0 transition-colors">
                                                {expandable.renderExpanded(item, index)}
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                        {(!data || data.length === 0) && (
                            <tr>
                                <td
                                    colSpan={columns.length + (expandable ? 1 : 0)}
                                    className="px-6 py-10 text-center text-slate-400 dark:text-slate-500 transition-colors"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
