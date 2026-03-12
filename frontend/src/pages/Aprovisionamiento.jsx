import React, { useState, useEffect, useMemo } from 'react';
import { fetchAprovisionamientoForecast } from '../services/api';
import { PageHeader } from '../components/common/PageHeader';
import { Link } from 'react-router-dom';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export default function Aprovisionamiento() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState([]);
    
    const [familia, setFamilia] = useState('C');
    const [selectedMonths, setSelectedMonths] = useState([]);
    const [year1, setYear1] = useState(2024);
    const [year2, setYear2] = useState(2025);
    
    // Quick search
    const [searchTerm, setSearchTerm] = useState('');
    
    // Sort logic
    const [sortConfig, setSortConfig] = useState({ key: 'Prevision2026', direction: 'desc' });

    const mesesOpciones = [
        { val: 1, label: 'Ene' }, { val: 2, label: 'Feb' }, { val: 3, label: 'Mar' },
        { val: 4, label: 'Abr' }, { val: 5, label: 'May' }, { val: 6, label: 'Jun' },
        { val: 7, label: 'Jul' }, { val: 8, label: 'Ago' }, { val: 9, label: 'Sep' },
        { val: 10, label: 'Oct' }, { val: 11, label: 'Nov' }, { val: 12, label: 'Dic' }
    ];

    useEffect(() => {
        loadData();
    }, [familia, year1, year2, selectedMonths]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const monthsStr = selectedMonths.length > 0 ? selectedMonths.join(',') : null;
            const res = await fetchAprovisionamientoForecast({ familia, year1, year2, months: monthsStr });
            setData(res || []);
        } catch (err) {
            console.error("Failed to fetch forecast:", err);
            setError("No se pudo cargar la previsión de aprovisionamiento.");
        } finally {
            setLoading(false);
        }
    };

    const handleMonthToggle = (m) => {
        setSelectedMonths(prev => 
            prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
        );
    };

    const toggleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const [viewMode, setViewMode] = useState('articulos');

    const filteredAndSortedData = useMemo(() => {
        let processData = [...data];
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            processData = processData.filter(d => 
                (d.CodigoArticulo && d.CodigoArticulo.toLowerCase().includes(lowerSearch)) ||
                (d.DescripcionArticulo && d.DescripcionArticulo.toLowerCase().includes(lowerSearch)) ||
                (d.NombreProveedor && d.NombreProveedor.toLowerCase().includes(lowerSearch))
            );
        }

        processData.sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];
            
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return processData;
    }, [data, searchTerm, sortConfig]);

    const proveedoresData = useMemo(() => {
        if (viewMode !== 'proveedores') return [];
        const provs = {};
        filteredAndSortedData.forEach(d => {
            if (!d.CodigoProveedor || d.CodigoProveedor.trim() === '') return;
            if (!provs[d.CodigoProveedor]) {
                provs[d.CodigoProveedor] = {
                    codigo: d.CodigoProveedor,
                    nombre: d.NombreProveedor,
                    crecimientos: [],
                    crecimientoMedio: 0
                };
            }
            if (d.UnidadesYear1 > 0) {
                provs[d.CodigoProveedor].crecimientos.push(d.Crecimiento);
            }
        });

        return Object.values(provs).map(p => {
            if (p.crecimientos.length > 0) {
                p.crecimientoMedio = p.crecimientos.reduce((a, b) => a + b, 0) / p.crecimientos.length;
            }
            return p;
        }).sort((a, b) => {
             // sort matching the current sortConfig if relevant, else fallback to name
             if (sortConfig.key === 'NombreProveedor') {
                const dir = sortConfig.direction === 'asc' ? 1 : -1;
                return a.nombre.localeCompare(b.nombre) * dir;
             } else if (sortConfig.key === 'Crecimiento') {
                const dir = sortConfig.direction === 'asc' ? 1 : -1;
                return (a.crecimientoMedio - b.crecimientoMedio) * dir;
             }
             return a.nombre.localeCompare(b.nombre);
        });
    }, [filteredAndSortedData, viewMode, sortConfig]);

    const formatPct = (val) => {
        if (val === null || val === undefined) return '-';
        return `${val > 0 ? '+' : ''}${val.toFixed(1)}%`;
    };

    const exportToExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Aprovisionamiento');

        // Styles
        const headerStyle = {
            font: { bold: true, color: { argb: 'FFFFFF' } },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F46E5' } },
            alignment: { horizontal: 'center' }
        };

        if (viewMode === 'articulos') {
            worksheet.columns = [
                { header: 'Cód. Artículo', key: 'CodigoArticulo', width: 20 },
                { header: 'Descripción', key: 'DescripcionArticulo', width: 40 },
                { header: 'Proveedor', key: 'NombreProveedor', width: 30 },
                { header: 'Stock Actual', key: 'StockActual', width: 12 },
                { header: `Uds ${year1}`, key: 'UnidadesYear1', width: 12 },
                { header: `Alb ${year1}`, key: 'AlbaranesYear1', width: 12 },
                { header: `Uds ${year2}`, key: 'UnidadesYear2', width: 12 },
                { header: `Alb ${year2}`, key: 'AlbaranesYear2', width: 12 },
                { header: 'Crecimiento (%)', key: 'Crecimiento', width: 15 },
                { header: 'Previsión Compra', key: 'Prevision2026', width: 18 }
            ];

            filteredAndSortedData.forEach(row => {
                worksheet.addRow({
                    ...row,
                    Crecimiento: row.Crecimiento ? `${row.Crecimiento.toFixed(1)}%` : '0%'
                });
            });
        } else {
            worksheet.columns = [
                { header: 'Cód. Proveedor', key: 'codigo', width: 20 },
                { header: 'Nombre Proveedor', key: 'nombre', width: 40 },
                { header: 'Crecimiento Medio (%)', key: 'crecimientoMedio', width: 25 }
            ];

            proveedoresData.forEach(row => {
                worksheet.addRow({
                    ...row,
                    crecimientoMedio: row.crecimientoMedio ? `${row.crecimientoMedio.toFixed(1)}%` : '0%'
                });
            });
        }

        // Apply header styling
        worksheet.getRow(1).eachCell((cell) => {
            cell.style = headerStyle;
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const fileName = `Prevision_Aprovisionamiento_${familia}_${new Date().toISOString().split('T')[0]}.xlsx`;
        saveAs(blob, fileName);
    };

    const Th = ({ label, sortKey, align = 'left' }) => (
        <th 
            className={`px-3 py-3 text-${align} text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors`}
            onClick={() => toggleSort(sortKey)}
        >
            <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
                {label}
                {sortConfig.key === sortKey && (
                    <span className="text-indigo-600 dark:text-indigo-400">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
            </div>
        </th>
    );

    return (
        <div className="w-full min-h-screen bg-[#f8fafc] dark:bg-slate-950 p-4 text-gray-800 dark:text-slate-200 font-sans pb-16 transition-colors">
            <PageHeader moduleName="Previsión de Aprovisionamiento" onRefresh={loadData}>
                <div className="flex items-center gap-3">
                    <button
                        onClick={exportToExcel}
                        className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded shadow-sm hover:bg-blue-100 dark:hover:bg-blue-900/50 transition font-bold text-xs flex items-center gap-2 h-[34px]"
                        title="Exportar a Excel"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Excel
                    </button>
                    <button
                        onClick={() => setViewMode(prev => prev === 'articulos' ? 'proveedores' : 'articulos')}
                        className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded shadow-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition font-bold text-xs flex items-center h-[34px]"
                    >
                        {viewMode === 'articulos' ? '📋 Ver Proveedores' : '📊 Ver Artículos'}
                    </button>
                    <Link to="/compras" className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition font-bold text-xs flex items-center h-[34px]">
                        Volver a Compras
                    </Link>
                </div>
            </PageHeader>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6 transition-colors">
                <div className="flex flex-col md:flex-row gap-6 mb-4">
                    {/* Familia Selector */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-start transition-colors">
                        <button 
                            className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${familia === 'C' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                            onClick={() => setFamilia('C')}
                        >
                            Conectrónica
                        </button>
                        <button 
                            className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${familia === 'M' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                            onClick={() => setFamilia('M')}
                        >
                            Sismecánica
                        </button>
                    </div>

                    <div className="flex gap-4 items-center flex-wrap">
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Año Comp:</label>
                            <input type="number" value={year1} onChange={e => setYear1(e.target.value)} className="w-20 rounded border-slate-200 dark:border-slate-700 text-sm p-1.5 font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors" />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Año Actual:</label>
                            <input type="number" value={year2} onChange={e => setYear2(e.target.value)} className="w-20 rounded border-slate-200 dark:border-slate-700 text-sm p-1.5 font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors" />
                        </div>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase block mb-2">Filtrar por Meses (Histórico)</label>
                    <div className="flex flex-wrap gap-2">
                        <button 
                            className={`px-3 py-1.5 rounded text-xs font-semibold border transition-colors ${selectedMonths.length === 0 ? 'bg-slate-800 dark:bg-slate-700 text-white border-slate-800 dark:border-slate-700' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            onClick={() => setSelectedMonths([])}
                        >
                            Todos
                        </button>
                        {mesesOpciones.map(m => (
                            <button
                                key={m.val}
                                onClick={() => handleMonthToggle(m.val)}
                                className={`px-3 py-1.5 rounded text-xs font-semibold border transition-colors ${selectedMonths.includes(m.val) ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <input 
                        type="text" 
                        placeholder="Buscar artículo o proveedor..." 
                        className="w-full md:w-1/3 rounded-lg border-slate-200 dark:border-slate-700 shadow-sm text-sm p-2 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:border-indigo-500 focus:ring-0 transition-colors placeholder-slate-400 dark:placeholder-slate-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 transition-colors">
                        <thead className="bg-[#f8fafc] dark:bg-slate-800/50 transition-colors">
                            {viewMode === 'articulos' ? (
                                <tr>
                                    <Th label="Cód. Artículo" sortKey="CodigoArticulo" />
                                    <Th label="Descripción" sortKey="DescripcionArticulo" />
                                    <Th label="Proveedor" sortKey="NombreProveedor" />
                                    <Th label="Stock" sortKey="StockActual" align="right" />
                                    <Th label={`Uds ${year1}`} sortKey="UnidadesYear1" align="right" />
                                    <Th label={`Alb ${year1}`} sortKey="AlbaranesYear1" align="right" />
                                    <Th label={`Uds ${year2}`} sortKey="UnidadesYear2" align="right" />
                                    <Th label={`Alb ${year2}`} sortKey="AlbaranesYear2" align="right" />
                                    <Th label="Crecimiento" sortKey="Crecimiento" align="right" />
                                    <Th label="Previsión" sortKey="Prevision2026" align="right" />
                                </tr>
                            ) : (
                                <tr>
                                    <Th label="Cód. Proveedor" sortKey="CodigoProveedor" />
                                    <Th label="Nombre Proveedor" sortKey="NombreProveedor" />
                                    <Th label="Crecimiento Medio" sortKey="Crecimiento" align="right" />
                                </tr>
                            )}
                        </thead>
                        <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800/50 transition-colors">
                            {loading ? (
                                <tr>
                                    <td colSpan="10" className="p-12 text-center text-slate-500 dark:text-slate-400">Cargando previsiones...</td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan="10" className="p-12 text-center text-red-500 dark:text-red-400">{error}</td>
                                </tr>
                            ) : (viewMode === 'articulos' ? filteredAndSortedData : proveedoresData).length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="p-12 text-center text-slate-500 dark:text-slate-400">No hay registros con los filtros seleccionados.</td>
                                </tr>
                            ) : viewMode === 'articulos' ? (
                                filteredAndSortedData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-3 py-2 whitespace-nowrap text-sm font-bold text-slate-800 dark:text-slate-200">{row.CodigoArticulo}</td>
                                        <td className="px-3 py-2 text-sm text-slate-600 dark:text-slate-300 truncate max-w-[200px]" title={row.DescripcionArticulo}>{row.DescripcionArticulo}</td>
                                        <td className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400 truncate max-w-[150px]" title={row.NombreProveedor}>{row.NombreProveedor}</td>
                                        
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-right">
                                            <span className={`px-2 py-0.5 rounded font-bold transition-colors ${row.StockActual <= 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                                                {row.StockActual.toLocaleString('es-ES')}
                                            </span>
                                        </td>
                                        
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-slate-600 dark:text-slate-300">{row.UnidadesYear1.toLocaleString('es-ES')}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-slate-400 dark:text-slate-500">{row.AlbaranesYear1}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-slate-800 dark:text-slate-200 font-semibold">{row.UnidadesYear2.toLocaleString('es-ES')}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-slate-400 dark:text-slate-500">{row.AlbaranesYear2}</td>
                                        
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-bold">
                                            <span className={row.Crecimiento >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}>
                                                {formatPct(row.Crecimiento)}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-bold text-indigo-700 dark:text-indigo-400">
                                            {row.Prevision2026.toLocaleString('es-ES')}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                proveedoresData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-3 py-2 whitespace-nowrap text-sm font-bold text-slate-800 dark:text-slate-200">{row.codigo}</td>
                                        <td className="px-3 py-2 text-sm text-slate-700 dark:text-slate-300 font-medium">{row.nombre}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-bold">
                                            <span className={row.crecimientoMedio >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}>
                                                {formatPct(row.crecimientoMedio)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
