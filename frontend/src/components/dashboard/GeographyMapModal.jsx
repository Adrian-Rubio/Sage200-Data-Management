import React, { useState, useEffect } from 'react';
import { fetchSalesByGeography, fetchRegionDetail } from '../../services/api';
import SpainMap from './SpainMap';
import WorldMap from './WorldMap';

export default function GeographyMapModal({ filters, onClose }) {
    const [scope, setScope] = useState('nacional'); // 'nacional' or 'internacional'
    const [geoData, setGeoData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRegion, setSelectedRegion] = useState(null);
    const [regionDetail, setRegionDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        loadGeoData();
    }, [filters, scope]);

    const loadGeoData = async () => {
        setLoading(true);
        try {
            const result = await fetchSalesByGeography(filters, scope);
            setGeoData(result.regions || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRegionClick = async (name, data) => {
        if (!data || data.revenue === 0) return;

        setSelectedRegion({ name, ...data });
        setDetailLoading(true);
        try {
            // Region in DB might be the code for international or the name for national
            const regionId = scope === 'nacional' ? name : data.region;
            const result = await fetchRegionDetail(filters, scope, regionId);
            setRegionDetail(result.clients || []);
        } catch (error) {
            console.error(error);
        } finally {
            setDetailLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-2 sm:p-4 animate-fadeIn">
            <div className="bg-white w-full max-w-[98vw] h-[95vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-6">
                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2 2.5 2.5 0 012.5 2.5v.658a2.5 2.5 0 00.747 1.768l.933.933M15 13a4 4 0 01-4 4 4 4 0 01-4-4 4 4 0 014-4 4 4 0 014 4z"></path></svg>
                            Geografía de Ventas
                        </h2>

                        <div className="flex bg-slate-200/50 p-1 rounded-lg">
                            <button
                                onClick={() => { setScope('nacional'); setSelectedRegion(null); }}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${scope === 'nacional' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                🇪🇸 Nacional
                            </button>
                            <button
                                onClick={() => { setScope('internacional'); setSelectedRegion(null); }}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${scope === 'internacional' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                🌍 Internacional
                            </button>
                        </div>
                    </div>

                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Map Area */}
                    <div className="flex-1 relative p-6 bg-slate-50/30">
                        {loading && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-[2px]">
                                <div className="flex flex-col items-center">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-2"></div>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cargando Mapa...</span>
                                </div>
                            </div>
                        )}

                        {scope === 'nacional' ? (
                            <SpainMap data={geoData} onRegionClick={handleRegionClick} />
                        ) : (
                            <WorldMap data={geoData} onRegionClick={handleRegionClick} />
                        )}
                    </div>

                    {/* Side Detail Panel */}
                    <div className={`w-[400px] border-l border-slate-100 bg-white transition-all duration-300 flex flex-col ${selectedRegion ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 absolute'}`}>
                        {selectedRegion && (
                            <>
                                <div className="p-6 border-b border-slate-50 bg-slate-50/30">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="text-xl font-black text-blue-900">{selectedRegion.name}</h3>
                                        <button onClick={() => setSelectedRegion(null)} className="text-[10px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-tighter">Cerrar ×</button>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Facturación</span>
                                            <span className="text-lg font-bold text-slate-700">{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(selectedRegion.revenue)}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Clientes</span>
                                            <span className="text-lg font-bold text-slate-700">{selectedRegion.clients}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                                    {detailLoading ? (
                                        <div className="p-10 flex flex-col items-center justify-center">
                                            <div className="animate-pulse flex space-x-4">
                                                <div className="flex-1 space-y-4 py-1">
                                                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                                    <div className="space-y-2">
                                                        <div className="h-4 bg-slate-200 rounded"></div>
                                                        <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {regionDetail && regionDetail.map((client, idx) => (
                                                <div key={idx} className="p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="text-xs font-black text-slate-700 leading-tight group-hover:text-blue-700 transition-colors">{client.name}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 font-mono">#{client.code}</span>
                                                    </div>
                                                    <div className="flex justify-between items-end">
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Comercial: {client.rep}</span>
                                                            <span className="text-[9px] text-slate-400">Última: {client.last_date ? new Date(client.last_date).toLocaleDateString() : '---'}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xs font-black text-slate-800">{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(client.revenue)}</div>
                                                            <div className="text-[9px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full inline-block">{client.invoices} facturas</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!regionDetail || regionDetail.length === 0) && (
                                                <div className="p-10 text-center text-slate-400 italic text-xs">No hay datos de clientes para esta región.</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Footer Info */}
                <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Visualización de datos geográficos basados en dirección fiscal del cliente</span>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            Alta Densidad
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
                            <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                            Sin actividad
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
