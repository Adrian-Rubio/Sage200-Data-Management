import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import useAuthStore from '../store/authStore';
import { 
    searchArticles, 
    fetchFrequentArticles, 
    fetchArticlesInFabrication,
    searchSuppliers,
    fetchSupplierArticles
} from '../services/api';
import ArticleDashboard from '../components/inventory/ArticleDashboard';

export default function Inventario() {
    const { user } = useAuthStore();
    const isExternal = user?.user_type === 'DISTRIBUIDOR' || user?.user_type === 'SOCIO';

    const [searchMode, setSearchMode] = useState('ARTICLE'); // ARTICLE or SUPPLIER
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [frequentArticles, setFrequentArticles] = useState([]);
    const [articlesInFab, setArticlesInFab] = useState([]);
    const [showFabModal, setShowFabModal] = useState(false);
    const [loadingFab, setLoadingFab] = useState(false);

    // Supplier related state
    const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
    const [supplierResults, setSupplierResults] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [supplierArticles, setSupplierArticles] = useState([]);
    const [supplierTotal, setSupplierTotal] = useState(0);
    const [supplierPage, setSupplierPage] = useState(1);
    const [supplierArticleFilter, setSupplierArticleFilter] = useState('');
    const [loadingSupplierArticles, setLoadingSupplierArticles] = useState(false);

    // Load frequent articles on mount
    useEffect(() => {
        const loadFrequent = async () => {
            try {
                const data = await fetchFrequentArticles();
                setFrequentArticles(data || []);
            } catch (error) {
                console.error("Error loading frequent articles:", error);
            }
        };
        loadFrequent();
    }, []);

    // Effect for real-time article search (debounced)
    useEffect(() => {
        if (searchMode !== 'ARTICLE') return;
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm.length >= 3) {
                handleArticleSearch();
            } else {
                setResults([]);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, searchMode]);

    // Effect for real-time supplier search (debounced)
    useEffect(() => {
        if (searchMode !== 'SUPPLIER' || selectedSupplier) return;
        const delayDebounceFn = setTimeout(() => {
            if (supplierSearchTerm.length >= 2) {
                handleSupplierSearch();
            } else {
                setSupplierResults([]);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [supplierSearchTerm, searchMode, selectedSupplier]);

    // Load supplier articles when supplier or page/filter changes
    useEffect(() => {
        if (selectedSupplier) {
            loadSupplierArticles();
        }
    }, [selectedSupplier, supplierPage, supplierArticleFilter]);

    const handleArticleSearch = async () => {
        setSearching(true);
        try {
            const data = await searchArticles(searchTerm);
            setResults(data);
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setSearching(false);
        }
    };

    const handleSupplierSearch = async () => {
        setSearching(true);
        try {
            const data = await searchSuppliers(supplierSearchTerm);
            setSupplierResults(data);
        } catch (error) {
            console.error("Supplier search error:", error);
        } finally {
            setSearching(false);
        }
    };

    const loadSupplierArticles = async () => {
        setLoadingSupplierArticles(true);
        try {
            const data = await fetchSupplierArticles(selectedSupplier.code, supplierPage, supplierArticleFilter);
            setSupplierArticles(data.items);
            setSupplierTotal(data.total);
        } catch (error) {
            console.error("Error loading supplier articles:", error);
        } finally {
            setLoadingSupplierArticles(false);
        }
    };

    const handleLoadFab = async () => {
        setLoadingFab(true);
        setShowFabModal(true);
        try {
            const data = await fetchArticlesInFabrication();
            setArticlesInFab(data || []);
        } catch (error) {
            console.error("Error loading articles in fabrication:", error);
        } finally {
            setLoadingFab(false);
        }
    };

    const handleBackToSearch = () => {
        setSelectedSupplier(null);
        setSupplierArticles([]);
        setSupplierPage(1);
        setSupplierArticleFilter('');
        setSupplierSearchTerm('');
        setSupplierResults([]);
    };

    if (selectedArticle) {
        return (
            <div className="p-4 max-w-[1600px] mx-auto min-h-screen bg-[#f8fafc] dark:bg-slate-950 transition-colors">
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

    // Intermediate page for Supplier Articles
    if (selectedSupplier) {
        return (
            <div className="p-4 max-w-[1600px] mx-auto min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-gray-800 dark:text-slate-100 font-sans transition-colors">
                <PageHeader moduleName={`Artículos de: ${selectedSupplier.name}`} />
                
                <div className="mt-8 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <button 
                        onClick={handleBackToSearch}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-xs"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Cambiar Proveedor
                    </button>
                    
                    <div className="w-full max-w-md relative">
                        <input 
                            type="text" 
                            placeholder="Filtrar artículos por código o descripción..."
                            value={supplierArticleFilter}
                            onChange={(e) => {
                                setSupplierArticleFilter(e.target.value);
                                setSupplierPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium text-sm transition-all"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
                    {loadingSupplierArticles ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4">
                            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Cargando lista de artículos...</span>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {supplierArticles.map((art) => (
                                    <button 
                                        key={art.code}
                                        onClick={() => setSelectedArticle(art.code)}
                                        className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all text-left flex flex-col group"
                                    >
                                        <span className="text-sm font-black text-slate-800 dark:text-slate-200 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">{art.code}</span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">{art.description}</span>
                                    </button>
                                ))}
                            </div>
                            
                            {supplierArticles.length === 0 && (
                                <div className="py-20 text-center text-slate-400 italic">No se encontraron artículos para este proveedor y filtro.</div>
                            )}

                            {/* Paginator */}
                            <div className="mt-8 flex items-center justify-between border-t border-slate-50 dark:border-slate-800 pt-6">
                                <span className="text-xs font-bold text-slate-400 uppercase">Total: {supplierTotal} artículos</span>
                                <div className="flex gap-2">
                                    <button 
                                        disabled={supplierPage === 1}
                                        onClick={() => setSupplierPage(p => p - 1)}
                                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold text-xs disabled:opacity-30"
                                    >
                                        Anterior
                                    </button>
                                    <span className="px-4 py-2 text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-xl">{supplierPage}</span>
                                    <button 
                                        disabled={supplierPage * 20 >= supplierTotal}
                                        onClick={() => setSupplierPage(p => p + 1)}
                                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold text-xs disabled:opacity-30"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-[1600px] mx-auto min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-gray-800 dark:text-slate-100 font-sans transition-colors">
            <PageHeader moduleName="Buscador de Inventario Real" />

            <div className="flex flex-col items-center justify-center pt-10 pb-10">
                
                {/* Search Mode Toggle */}
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl mb-12 shadow-inner border border-slate-200 dark:border-slate-800">
                    <button 
                        onClick={() => setSearchMode('ARTICLE')}
                        className={`px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${searchMode === 'ARTICLE' ? 'bg-white dark:bg-slate-800 shadow-lg text-blue-600 dark:text-blue-400 scale-[1.02]' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                        Buscar Artículo
                    </button>
                    <button 
                        onClick={() => setSearchMode('SUPPLIER')}
                        className={`px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${searchMode === 'SUPPLIER' ? 'bg-white dark:bg-slate-800 shadow-lg text-blue-600 dark:text-blue-400 scale-[1.02]' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                        Buscar por Proveedor
                    </button>
                </div>

                <div className="text-center mb-10 animate-fadeIn">
                    <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tighter mb-4">
                        {searchMode === 'ARTICLE' ? 'Motor de Búsqueda de Artículos' : 'Buscador por Proveedor'}
                    </h2>
                    <p className="text-slate-400 dark:text-slate-500 font-medium max-w-md mx-auto">
                        {searchMode === 'ARTICLE' 
                            ? 'Consulta stock, pedidos pendientes y fabricación en tiempo real buscando por código o descripción.'
                            : 'Navega por el catálogo completo de un proveedor específico y consulta sus stocks.'
                        }
                    </p>
                </div>

                {/* Search Bar */}
                <div className="w-full max-w-2xl relative animate-fadeInUp">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                            <svg className={`w-6 h-6 transition-colors ${searching ? 'text-blue-500 animate-pulse' : 'text-slate-300 dark:text-slate-500 group-hover:text-blue-400 dark:group-hover:text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <input
                            type="text"
                            value={searchMode === 'ARTICLE' ? searchTerm : supplierSearchTerm}
                            onChange={(e) => searchMode === 'ARTICLE' ? setSearchTerm(e.target.value) : setSupplierSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (searchMode === 'ARTICLE' ? handleArticleSearch() : handleSupplierSearch())}
                            placeholder={searchMode === 'ARTICLE' ? "Introduce código o descripción del artículo..." : "Nombre o código del proveedor..."}
                            className="block w-full pl-16 pr-4 py-6 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-2xl flex-1 shadow-blue-500/10 dark:shadow-blue-500/5 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:focus:border-blue-500 transition-all text-xl font-bold text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none"
                        />
                    </div>

                    {/* Results Dropdown for Articles */}
                    {searchMode === 'ARTICLE' && (results.length > 0 || searching) && (
                        <div className="absolute mt-4 w-full bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50 animate-fadeInScale transition-colors">
                            <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                                {Array.isArray(results) && results.map((art, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedArticle(art.code)}
                                        className="w-full text-left px-8 py-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center justify-between border-b border-slate-50 dark:border-slate-800 last:border-0 transition-colors group"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-800 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{art.code}</span>
                                            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate max-w-[400px]">{art.description}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded uppercase">{art.unit || 'UN'}</span>
                                            <svg className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                        </div>
                                    </button>
                                ))}
                                {searching && results.length === 0 && (
                                    <div className="p-10 text-center flex flex-col items-center gap-3">
                                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Buscando coincidencias...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Results Dropdown for Suppliers */}
                    {searchMode === 'SUPPLIER' && (supplierResults.length > 0 || searching) && (
                        <div className="absolute mt-4 w-full bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50 animate-fadeInScale transition-colors">
                            <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                                {Array.isArray(supplierResults) && supplierResults.map((sup, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedSupplier(sup)}
                                        className="w-full text-left px-8 py-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center justify-between border-b border-slate-50 dark:border-slate-800 last:border-0 transition-colors group"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-800 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{sup.name}</span>
                                            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{sup.code}</span>
                                        </div>
                                        <svg className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                ))}
                                {searching && supplierResults.length === 0 && (
                                    <div className="p-10 text-center flex flex-col items-center gap-3">
                                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Buscando proveedores...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {searchMode === 'ARTICLE' && !isExternal && (
                    <>
                        {/* Suggestions / Shortcuts */}
                        <div className="mt-12 flex flex-col items-center gap-4 animate-fadeIn animate-delay-200 w-full max-w-4xl">
                            <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest w-full text-center mb-2 flex items-center justify-center gap-2">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                                Artículos con más movimientos (Últimos 30 días)
                            </span>
                            <div className="flex flex-wrap justify-center gap-2">
                                {frequentArticles.length > 0 ? (
                                    frequentArticles.map(art => (
                                        <button
                                            key={art.code}
                                            onClick={() => setSelectedArticle(art.code)}
                                            className="px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm hover:shadow-md flex items-center gap-2 group"
                                            title={art.description}
                                        >
                                            <span className="text-blue-600 dark:text-blue-500">{art.code}</span>
                                            <span className="max-w-[120px] truncate text-slate-400 dark:text-slate-500 font-medium group-hover:text-slate-500 dark:group-hover:text-slate-400">{art.description}</span>
                                        </button>
                                    ))
                                ) : (
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="h-8 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-full"></div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* FABRICATION BUTTON */}
                        <div className="mt-8">
                            <button
                                onClick={handleLoadFab}
                                className="flex items-center gap-2 px-6 py-3 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 rounded-2xl font-bold transition-all border border-indigo-100 dark:border-indigo-800/50 shadow-sm"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                Ver todos los artículos en fabricación
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Fabrication Modal */}
            {showFabModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-scaleUp transition-colors border border-gray-100 dark:border-slate-800">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 transition-colors">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">Artículos en Proceso de Planta</h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Lista de artículos presentes en órdenes de trabajo abiertas o preparadas.</p>
                            </div>
                            <button
                                onClick={() => setShowFabModal(false)}
                                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 dark:text-slate-300"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {loadingFab ? (
                                <div className="h-64 flex flex-col items-center justify-center gap-4">
                                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Analizando el estado de fabricación...</span>
                                </div>
                            ) : articlesInFab.length === 0 ? (
                                <div className="h-64 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                                    <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 00-2 2H6a2 2 0 00-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                                    <p className="font-bold">No hay artículos detectados en fabricación actualmente.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
                                    {articlesInFab.map((art) => (
                                        <button
                                            key={art.code}
                                            onClick={() => {
                                                setSelectedArticle(art.code);
                                                setShowFabModal(false);
                                            }}
                                            className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-lg transition-all text-left group flex items-start gap-4"
                                        >
                                            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-500 dark:text-indigo-400 rounded-xl group-hover:bg-indigo-500 dark:group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-black text-slate-800 dark:text-slate-200 text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{art.code}</span>
                                                    <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter transition-colors">
                                                        {art.total_ots} OT{art.total_ots > 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                                <p className="text-slate-400 dark:text-slate-500 text-sm font-medium truncate">{art.description}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center transition-colors">
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">
                                * Se incluyen artículos que son producto final de una OT o componentes requeridos en curso.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
