import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { searchArticles } from '../services/api';
import ArticleDashboard from '../components/inventory/ArticleDashboard';

export default function Inventario() {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState(null);

    // Effect for real-time search (debounced)
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm.length >= 3) {
                handleSearch();
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleSearch = async () => {
        setSearching(true);
        try {
            const data = await searchArticles(searchTerm);
            setResults(data);

            // If only one result, auto-select if user pressed enter or it's an exact match
            // (For now, just show the list for better UX unless user selects)
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setSearching(false);
        }
    };

    if (selectedArticle) {
        return (
            <div className="p-4 max-w-[1600px] mx-auto min-h-screen bg-[#f8fafc]">
                <PageHeader moduleName="Seguimiento de Artículo" />
                <ArticleDashboard
                    articleCode={selectedArticle}
                    onBack={() => {
                        setSelectedArticle(null);
                        setSearchTerm('');
                        setResults([]);
                    }}
                />
            </div>
        );
    }

    return (
        <div className="p-4 max-w-[1600px] mx-auto min-h-screen bg-[#f8fafc] text-gray-800 font-sans">
            <PageHeader moduleName="Buscador de Inventario Real" />

            <div className="flex flex-col items-center justify-center pt-20 pb-10">
                <div className="text-center mb-10 animate-fadeIn">
                    <h2 className="text-4xl font-black text-slate-800 tracking-tighter mb-4">Motor de Búsqueda de Artículos</h2>
                    <p className="text-slate-400 font-medium max-w-md mx-auto">
                        Consulta stock, pedidos pendientes y fabricación en tiempo real buscando por código o descripción.
                    </p>
                </div>

                {/* Search Bar */}
                <div className="w-full max-w-2xl relative animate-fadeInUp">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                            <svg className={`w-6 h-6 transition-colors ${searching ? 'text-blue-500 animate-pulse' : 'text-slate-300 group-hover:text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Introduce código o descripción del artículo..."
                            className="block w-full pl-16 pr-4 py-6 bg-white border-2 border-slate-100 rounded-[2.5rem] shadow-2xl shadow-blue-500/10 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-xl font-bold text-slate-700 placeholder:text-slate-300 placeholder:font-medium"
                        />
                    </div>

                    {/* Results Dropdown */}
                    {(results.length > 0 || searching) && (
                        <div className="absolute mt-4 w-full bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden z-50 animate-fadeInScale">
                            <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                                {results.map((art, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedArticle(art.code)}
                                        className="w-full text-left px-8 py-4 hover:bg-blue-50 flex items-center justify-between border-b border-slate-50 last:border-0 transition-colors group"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-800 group-hover:text-blue-700 transition-colors">{art.code}</span>
                                            <span className="text-xs text-slate-400 font-medium truncate max-w-[400px]">{art.description}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-bold text-slate-300 bg-slate-100 px-2 py-0.5 rounded uppercase">{art.unit || 'UN'}</span>
                                            <svg className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                        </div>
                                    </button>
                                ))}
                                {searching && results.length === 0 && (
                                    <div className="p-10 text-center flex flex-col items-center gap-3">
                                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Buscando coincidencias...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Suggestions / Shortcuts */}
                <div className="mt-12 flex flex-wrap justify-center gap-4 animate-fadeIn animate-delay-200">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest w-full text-center mb-2">Búsquedas Frecuentes</span>
                    {['ACC-01', 'FILTRO', 'SENSOR', 'LATIGUILLO'].map(term => (
                        <button
                            key={term}
                            onClick={() => setSearchTerm(term)}
                            className="px-4 py-2 bg-white rounded-full border border-slate-100 text-xs font-bold text-slate-500 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm"
                        >
                            {term}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
