import React, { useState, useEffect } from 'react';
import {
    fetchArticleInfo,
    fetchArticleStock,
    fetchArticleSales,
    fetchArticlePurchases,
    fetchArticleProduction
} from '../../services/api';

export default function ArticleDashboard({ articleCode, onBack }) {
    const [info, setInfo] = useState(null);
    const [stock, setStock] = useState([]);
    const [sales, setSales] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [production, setProduction] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAllData();
    }, [articleCode]);

    const loadAllData = async () => {
        setLoading(true);
        try {
            // Load in parallel for speed
            const [infoRes, stockRes, salesRes, purchaseRes, prodRes] = await Promise.all([
                fetchArticleInfo(articleCode),
                fetchArticleStock(articleCode),
                fetchArticleSales(articleCode),
                fetchArticlePurchases(articleCode),
                fetchArticleProduction(articleCode)
            ]);

            setInfo(infoRes);
            setStock(stockRes);
            setSales(salesRes);
            setPurchases(purchaseRes);
            setProduction(prodRes);
        } catch (error) {
            console.error("Error loading article dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !info) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Generando Ficha Técnica...</p>
            </div>
        );
    }

    const totalStock = stock.reduce((acc, curr) => acc + (curr.stock || 0), 0);

    return (
        <div className="animate-fadeIn pb-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 pt-2">
                {/* Info Card */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                        <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M13 9h8L11 24v-9H3l10-15v9z" /></svg>
                    </div>
                    <div>
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mb-1">
                                    Ficha Técnica · <span className="text-slate-400">{articleCode}</span>
                                </span>
                                <h2 className="text-xl font-black text-slate-800 leading-tight">{info?.description}</h2>
                            </div>
                            <button 
                                onClick={onBack} 
                                className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-xl hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-all border border-slate-100 hover:border-blue-100"
                                title="Volver al buscador"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-slate-400 font-medium mb-6 uppercase text-[10px] tracking-wider border-l-3 border-blue-500/10 pl-3">{info?.description2 || 'Sin descripción adicional'}</p>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-6">
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Precio Venta</span>
                                <span className="text-base font-bold text-slate-700">{info?.sale_price ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(info.sale_price) : '---'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Últ. Coste</span>
                                <span className="text-base font-bold text-slate-700">{info?.purchase_price ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(info.purchase_price) : '---'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">U. Medida</span>
                                <span className="text-base font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{info?.unit || 'UN'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Stock Mín/Máx</span>
                                <span className="text-sm font-bold text-slate-500">{Math.round(info?.min_stock || 0)} / {Math.round(info?.max_stock || 0)}</span>
                            </div>
                        </div>

                        {/* Technical Specs */}
                        <div className="pt-6 border-t border-slate-50 grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-8">
                            <div>
                                <span className="text-[9px] font-black text-slate-300 uppercase block mb-0.5">Peso Neto/Bruto</span>
                                <p className="text-xs font-bold text-slate-600">
                                    {info?.weight_net || 'N/A'} / {info?.weight_gross || 'N/A'} <span className="text-[9px] font-medium text-slate-400">kg</span>
                                </p>
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-slate-300 uppercase block mb-0.5">Fabricante/Marca</span>
                                <p className="text-xs font-bold text-slate-600">{info?.brand || 'N/A'}</p>
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-slate-300 uppercase block mb-0.5">Ubicación Almacén</span>
                                <p className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded inline-block">{info?.warehouse_location || 'N/A'}</p>
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-slate-300 uppercase block mb-0.5">Origen / Arancel</span>
                                <p className="text-xs font-bold text-slate-600">{info?.origin_country || 'N/A'} <span className="text-[9px] text-slate-300 mx-1">|</span> {info?.tariff_code || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stock Card */}
                <div className="bg-blue-600 rounded-3xl p-6 shadow-xl text-white flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute -bottom-6 -right-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
                        <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M20 7h-4V5l-2-2h-4L8 5v2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z" /></svg>
                    </div>
                    <div className="z-10">
                        <h3 className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-1">Stock Total</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black tracking-tighter">{totalStock.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <span className="text-sm font-bold text-blue-200 uppercase">Unidades</span>
                        </div>
                    </div>
                    <div className="mt-6 z-10 space-y-2">
                        {stock.map((s, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-blue-500/30 font-medium">
                                <span className="text-blue-100">{s.warehouse || 'Almacén Desconocido'}</span>
                                <span className="font-bold">{(s.stock || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tracking Sections */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                {/* Sales Section */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                            Ventas Pendientes
                        </h3>
                        <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full uppercase">
                            {sales.length} Pedidos · {sales.reduce((sum, s) => sum + (s.qty_pending || 0), 0).toLocaleString('es-ES', { maximumFractionDigits: 0 })} Unidades
                        </span>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="text-slate-400 font-black uppercase text-[9px] tracking-widest">
                                    <th className="pb-4">Pedido</th>
                                    <th className="pb-4">Cliente</th>
                                    <th className="pb-4 text-center">Cant.</th>
                                    <th className="pb-4 text-right">Fecha Prev.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {sales.map((item, idx) => (
                                    <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                        <td className="py-4 font-bold text-slate-500">{item.order_num}</td>
                                        <td className="py-4">
                                            <span className="font-bold text-slate-700 leading-tight">{item.client_name || item.client_code || '—'}</span>
                                        </td>
                                        <td className="py-4 text-center">
                                            <span className="bg-slate-100 px-2 py-1 rounded-lg font-black text-slate-700">{(item.qty_pending || 0).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                                        </td>
                                        <td className="py-4 text-right">
                                            <span className="font-black text-emerald-600">{item.date_expected}</span>
                                        </td>
                                    </tr>
                                ))}
                                {sales.length === 0 && (
                                    <tr><td colSpan="4" className="py-10 text-center text-slate-400 italic">No hay pedidos de venta pendientes.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Purchases Section */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-orange-500 rounded-full"></div>
                            Compras a Recibir
                        </h3>
                        <span className="text-[10px] font-black bg-orange-50 text-orange-600 px-2 py-1 rounded-full uppercase">
                            {purchases.length} Pedidos · {purchases.reduce((sum, p) => sum + (p.qty_pending || 0), 0).toLocaleString('es-ES', { maximumFractionDigits: 0 })} Unidades
                        </span>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="text-slate-400 font-black uppercase text-[9px] tracking-widest">
                                    <th className="pb-4">Pedido</th>
                                    <th className="pb-4">Proveedor</th>
                                    <th className="pb-4 text-center">Cant.</th>
                                    <th className="pb-4 text-right">Fecha Rec.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {purchases.map((item, idx) => (
                                    <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                        <td className="py-4 font-bold text-slate-500">{item.order_num}</td>
                                        <td className="py-4">
                                            <span className="font-bold text-slate-700 leading-tight">{item.vendor_name || item.vendor_code || '—'}</span>
                                        </td>
                                        <td className="py-4 text-center">
                                            <span className="bg-slate-100 px-2 py-1 rounded-lg font-black text-slate-700">{(item.qty_pending || 0).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                                        </td>
                                        <td className="py-4 text-right">
                                            <span className="font-black text-orange-600">{item.date_expected || 'S.F.'}</span>
                                        </td>
                                    </tr>
                                ))}
                                {purchases.length === 0 && (
                                    <tr><td colSpan="4" className="py-10 text-center text-slate-400 italic">No hay pedidos de compra en camino.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Production Section */}
                <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-800 flex flex-col xl:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                            Órdenes de Fabricación en Curso
                        </h3>
                        <span className="text-[10px] font-black bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full uppercase tracking-widest">
                            {production.length} OT · {production.reduce((sum, r) => sum + ((r.qty_to_make || 0) - (r.qty_made || 0)), 0).toLocaleString('es-ES', { maximumFractionDigits: 0 })} Unidades
                        </span>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="text-slate-500 font-black uppercase text-[9px] tracking-widest border-b border-slate-800">
                                    <th className="pb-4">Nº Trabajo</th>
                                    <th className="pb-4">Rol</th>
                                    <th className="pb-4">Estado</th>
                                    <th className="pb-4 text-center">Unidades (Progreso)</th>
                                    <th className="pb-4 text-right">Finalización Prevista</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {production.map((item, idx) => (
                                    <tr key={idx} className="group hover:bg-white/5 transition-colors">
                                        <td className="py-4 font-bold text-blue-400">{item.work_num} <span className="text-[10px] text-slate-600 ml-1">/{item.exercise}</span></td>
                                        <td className="py-4">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black ${item.role === 'COMPONENTE' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                                {item.role === 'COMPONENTE' ? 'CONSUMO' : 'FICHA'}
                                            </span>
                                        </td>
                                        <td className="py-4">
                                            <span className={`px-2 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-sm ${item.status === 1 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                                {item.status_desc}
                                            </span>
                                        </td>
                                        <td className="py-4">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="flex justify-between w-32 text-[10px] font-bold text-slate-400 mb-1">
                                                    <span>{Math.round(item.qty_made)}</span>
                                                    <span>{Math.round(item.qty_to_make)}</span>
                                                </div>
                                                <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]"
                                                        style={{ width: `${Math.min(100, (item.qty_made / (item.qty_to_make || 1)) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 text-right">
                                            <span className="font-black text-white">{item.date_expected}</span>
                                        </td>
                                    </tr>
                                ))}
                                {production.length === 0 && (
                                    <tr><td colSpan="5" className="py-10 text-center text-slate-600 italic">No hay órdenes de fabricación activas para este artículo.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
