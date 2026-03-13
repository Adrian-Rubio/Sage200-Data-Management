import React, { useState, useEffect } from 'react';
import { fetchClientBudgets } from '../../services/api';

const formatCurrency = (val) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

const ProgressBar = ({ actual, budget, label, showWarning }) => {
    const progress = budget > 0 ? (actual / budget) * 100 : 0;
    const isOver = progress > 100;
    const boundedProgress = Math.min(progress, 100);
    
    // Choose color scheme based on progress and warning state
    let barColor = 'bg-blue-500';
    if (isOver) barColor = 'bg-emerald-500';
    else if (showWarning && progress < 50) barColor = 'bg-amber-500';
    
    return (
        <div className="w-full flex flex-col gap-1 mb-3">
            <div className="flex justify-between items-end text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-tight">{label}</span>
                <div className="flex items-center gap-2">
                    <span className="font-mono">{formatCurrency(actual)} / {formatCurrency(budget)}</span>
                    <span className={`font-bold ${isOver ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        {progress.toFixed(1)}% {isOver && '🚀'}
                    </span>
                </div>
            </div>
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex border border-slate-200 dark:border-slate-700">
                <div 
                    className={`h-full ${barColor} transition-all duration-1000 ease-out`} 
                    style={{ width: `${boundedProgress}%` }}
                />
            </div>
        </div>
    );
};

export const ClientBudgetTracker = ({ filters }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortBy, setSortBy] = useState('budget'); // 'budget', 'actual', 'progress', 'code'
    
    const [expandedClients, setExpandedClients] = useState(new Set());

    const toggleExpand = (code) => {
        setExpandedClients(prev => {
            const newSet = new Set(prev);
            if (newSet.has(code)) newSet.delete(code);
            else newSet.add(code);
            return newSet;
        });
    };

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const year = filters.start_date ? new Date(filters.start_date).getFullYear() : new Date().getFullYear();
            const res = await fetchClientBudgets({ 
                company_id: filters.company_id || '2',
                year: year
            });
            
            if (res.error) {
                setError(res.error);
                return;
            }

            let clients = res.data || [];
            
            if (filters.client_id) {
                clients = clients.filter(c => c.client_code === filters.client_id);
            }
            
            if (filters.division) {
                const norm_div = filters.division.toLowerCase();
                const div_map = {
                    'conectrónica': 'conectores',
                    'sismecánica': 'sismecanic',
                    'informática industrial': 'informatica'
                };
                const search_div = div_map[norm_div] || norm_div;
                clients = clients.filter(c => c.divisions.some(d => d.name.toLowerCase() === search_div));
            }

            setData(clients);
        } catch (err) {
            console.error("Error fetching budgets:", err);
            setError("Error al cargar los presupuestos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line
    }, [filters.start_date, filters.company_id, filters.client_id, filters.division]);

    // Sorting logic
    const sortedData = [...data].sort((a, b) => {
        if (sortBy === 'budget') return b.total_budget - a.total_budget;
        if (sortBy === 'actual') return b.total_actual - a.total_actual;
        if (sortBy === 'progress') return b.total_progress - a.total_progress;
        if (sortBy === 'code') return a.client_code.localeCompare(b.client_code);
        return 0;
    });

    if (loading && !data.length) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-slate-500">Cargando presupuestos...</span>
            </div>
        );
    }

    if (error && !data.length && !loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-red-200 dark:border-red-900/30 rounded-xl bg-red-50 dark:bg-red-900/10">
                <svg className="w-12 h-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">Error de Datos</h3>
                <p className="text-sm text-red-600 dark:text-red-400 text-center max-w-sm">{error}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-fadeIn">
            {/* Header / Actions */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50 dark:bg-slate-800/20">
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Seguimiento ({filters.start_date ? new Date(filters.start_date).getFullYear() : new Date().getFullYear()})
                    </h3>
                </div>
                
                {/* Sorting Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Ordenar por:</span>
                    <button 
                        onClick={() => setSortBy('progress')}
                        className={`text-[10px] px-2.5 py-1.5 rounded-md font-bold transition-all border ${sortBy === 'progress' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50'}`}
                    >
                        Cumplimiento
                    </button>
                    <button 
                        onClick={() => setSortBy('actual')}
                        className={`text-[10px] px-2.5 py-1.5 rounded-md font-bold transition-all border ${sortBy === 'actual' ? 'bg-blue-100 text-blue-700 border-blue-200 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50'}`}
                    >
                        Facturación
                    </button>
                    <button 
                        onClick={() => setSortBy('budget')}
                        className={`text-[10px] px-2.5 py-1.5 rounded-md font-bold transition-all border ${sortBy === 'budget' ? 'bg-indigo-100 text-indigo-700 border-indigo-200 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50'}`}
                    >
                        Presupuesto
                    </button>
                    <button 
                        onClick={() => setSortBy('code')}
                        className={`text-[10px] px-2.5 py-1.5 rounded-md font-bold transition-all border ${sortBy === 'code' ? 'bg-slate-200 text-slate-800 border-slate-300 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50'}`}
                    >
                        Nº Cliente
                    </button>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                    <button onClick={fetchData} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors" title="Actualizar">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 p-2 bg-slate-50 dark:bg-slate-900/50" style={{ maxHeight: 'calc(100vh - 400px)', minHeight: '500px' }}>
                {sortedData.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        No hay datos que coincidan con los filtros.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {sortedData.map(client => (
                            <div key={client.client_code} className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-blue-300 transition-all">
                                <div className="flex justify-between items-center cursor-pointer group" onClick={() => toggleExpand(client.client_code)}>
                                    <div className="flex-1 pr-6">
                                        <div className="flex items-center gap-2 mb-2 w-full justify-between">
                                            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate flex-1">
                                                <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px] mr-2 text-slate-600 dark:text-slate-400 font-mono">{client.client_code}</span>
                                                {client.client_name}
                                            </h4>
                                        </div>
                                        <ProgressBar 
                                            actual={client.total_actual} 
                                            budget={client.total_budget} 
                                            label="General" 
                                            showWarning={true}
                                        />
                                    </div>
                                    <div className="w-8 flex justify-end">
                                        <div className="bg-slate-100 dark:bg-slate-700 p-1.5 rounded-full text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition">
                                            <svg className={`w-4 h-4 transform transition-transform ${expandedClients.has(client.client_code) ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                
                                {expandedClients.has(client.client_code) && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 animate-fadeIn overflow-hidden">
                                        <div className="space-y-6">
                                            {client.divisions.map((div, idx) => (
                                                <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-5 border border-slate-200 dark:border-slate-800 shadow-inner">
                                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-4">
                                                        <div className="flex-1 w-full">
                                                            <ProgressBar actual={div.actual} budget={div.budget} label={`DIVISIÓN: ${div.name}`} />
                                                        </div>
                                                        <div className="bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-800 flex flex-col">
                                                            <span className="text-[9px] uppercase font-bold text-indigo-400 dark:text-indigo-500 leading-none mb-1">Comercial asignado</span>
                                                            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">{div.comercial}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Monthly Table */}
                                                    <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50">
                                                        <table className="w-full text-[11px] border-collapse">
                                                            <thead>
                                                                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                                                                    <th className="text-left py-2.5 px-4 font-bold uppercase tracking-wider w-1/4">Mes</th>
                                                                    <th className="text-right py-2.5 px-4 font-bold uppercase tracking-wider">Presupuesto</th>
                                                                    <th className="text-right py-2.5 px-4 font-bold uppercase tracking-wider">Ventas Reales</th>
                                                                    <th className="text-right py-2.5 px-4 font-bold uppercase tracking-wider">Cumplimiento</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                                {div.monthly.map((m, midx) => {
                                                                    const mProgress = m.budget > 0 ? (m.actual / m.budget * 100) : 0;
                                                                    return (
                                                                        <tr key={midx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors even:bg-slate-50/30 dark:even:bg-slate-800/20">
                                                                            <td className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300">{m.month}</td>
                                                                            <td className="py-2.5 px-4 text-right font-mono text-slate-500">{formatCurrency(m.budget)}</td>
                                                                            <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200">{formatCurrency(m.actual)}</td>
                                                                            <td className="py-2.5 px-4 text-right">
                                                                                <div className="flex items-center justify-end gap-2">
                                                                                    {m.budget > 0 ? (
                                                                                        <>
                                                                                            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden hidden sm:block">
                                                                                                <div 
                                                                                                    className={`h-full rounded-full ${mProgress >= 100 ? 'bg-emerald-500' : mProgress > 0 ? 'bg-blue-500' : 'bg-slate-300'}`}
                                                                                                    style={{ width: `${Math.min(mProgress, 100)}%` }}
                                                                                                ></div>
                                                                                            </div>
                                                                                            <span className={`font-bold min-w-[35px] ${mProgress >= 100 ? 'text-emerald-600' : mProgress > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                                                                                                {mProgress.toFixed(0)}%
                                                                                            </span>
                                                                                        </>
                                                                                    ) : (
                                                                                        <span className="text-slate-300 italic">--</span>
                                                                                    )}
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
