import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

// Configura la URL base si es necesario, asumiendo que los endpoints están en /api/marketing
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function Marketing() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState(null);
  const rowsPerPage = 15;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/marketing/data`, { withCredentials: true });
      if (response.data.error) {
        setError(response.data.error);
        setData(null);
      } else {
        setData(response.data);
        setError(null);
      }
    } catch (err) {
      setError('Error al conectar con el servidor.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await axios.post(`${API_URL}/marketing/sync`, {}, { withCredentials: true });
      if (response.data.status === 'success') {
        alert("Sincronización iniciada en segundo plano. Los datos se actualizarán en unos minutos.");
        // Opcional: podrías poner un polling aquí para refrescar
      } else {
        alert("Error: " + response.data.message);
      }
    } catch (err) {
      alert("Error de conexión al sincronizar.");
    } finally {
      setSyncing(false);
    }
  };

  const leads = data?.sales?.leads || [];
  
  const filteredLeads = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return leads;
    
    return leads.filter(l => 
      l.email.toLowerCase().includes(term) || 
      l.history.pdfs.some(p => p.product_name.toLowerCase().includes(term)) || 
      l.history.quotes.some(q => q.product_list_names.some(pn => pn.toLowerCase().includes(term)))
    );
  }, [leads, searchTerm]);

  const totalPages = Math.ceil(filteredLeads.length / rowsPerPage) || 1;
  const currentLeads = filteredLeads.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f1a] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-slate-200 font-sans p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center bg-[#172035]/80 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-xl">
          <div>
            <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-fuchsia-400">
              Marketing Hub
            </h1>
            <p className="text-slate-400 mt-2 text-sm">
              Última actualización: {data ? new Date(data.last_updated).toLocaleString() : 'Desconocida'}
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <button
              onClick={handleSync}
              disabled={syncing}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${
                syncing 
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                  : 'bg-emerald-500 hover:bg-emerald-400 text-white hover:scale-105 hover:shadow-emerald-500/20'
              }`}
            >
              {syncing ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              )}
              {syncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
            </button>
          </div>
        </header>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            {error}
          </div>
        )}

        {/* KPIs */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             <div className="bg-[#172035]/80 p-6 rounded-2xl border border-white/5 flex flex-col justify-center shadow-lg">
                <span className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Total Leads</span>
                <span className="text-3xl font-black text-white mt-2">{data.sales.leads.length}</span>
             </div>
             <div className="bg-[#172035]/80 p-6 rounded-2xl border border-white/5 flex flex-col justify-center shadow-lg">
                <span className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Subscriptores Mailchimp</span>
                <span className="text-3xl font-black text-white mt-2">{data.marketing.total_subscribers}</span>
             </div>
             <div className="bg-[#172035]/80 p-6 rounded-2xl border border-white/5 flex flex-col justify-center shadow-lg">
                <span className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Total PDFs</span>
                <span className="text-3xl font-black text-indigo-400 mt-2">{data.sales.total_pdfs}</span>
             </div>
             <div className="bg-[#172035]/80 p-6 rounded-2xl border border-white/5 flex flex-col justify-center shadow-lg">
                <span className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Presupuestos Web</span>
                <span className="text-3xl font-black text-fuchsia-400 mt-2">{data.sales.total_quotes}</span>
             </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-[#172035]/80 p-4 rounded-2xl border border-white/5 shadow-lg">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              type="text"
              placeholder="Buscar por email, producto o comentario..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full bg-[#0b0f1a] text-white border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#172035]/80 rounded-2xl border border-white/5 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/20 text-slate-400 text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold">Email</th>
                  <th className="p-4 font-semibold">Tienda</th>
                  <th className="p-4 font-semibold">Actividad</th>
                  <th className="p-4 font-semibold text-center">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <AnimatePresence>
                  {currentLeads.map((lead, idx) => (
                    <React.Fragment key={lead.email}>
                      <motion.tr 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-white/5 cursor-pointer transition-colors group"
                        onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                      >
                        <td className="p-4">
                          <div className="font-medium text-slate-200 group-hover:text-white transition-colors">{lead.email}</div>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                            {lead.store}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-slate-400">
                          <span className="text-indigo-400 font-semibold">{lead.stats.pdfs_count}</span> PDFs,{' '}
                          <span className="text-fuchsia-400 font-semibold">{lead.stats.quotes_count}</span> Presupuestos
                        </td>
                        <td className="p-4 text-center">
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                            {lead.score}
                          </div>
                        </td>
                      </motion.tr>
                      
                      {/* Expanded Row */}
                      {expandedRow === idx && (
                        <tr className="bg-black/40">
                          <td colSpan="4" className="p-0">
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-6 border-l-4 border-indigo-500 m-4 bg-[#172035]/50 rounded-r-xl">
                                <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  Historial Completo
                                </h4>
                                
                                <div className="space-y-4">
                                  {lead.history.pdfs.length > 0 && (
                                    <div>
                                      <h5 className="text-xs text-indigo-400 font-semibold mb-2">Descargas de PDF</h5>
                                      <ul className="space-y-1">
                                        {lead.history.pdfs.map((p, i) => (
                                          <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                            <span className="text-slate-500 mt-0.5">•</span>
                                            <div>
                                              <span className="text-slate-400 text-xs mr-2">{p.date?.split(' ')[0]}</span>
                                              <span className="font-medium text-slate-200">{p.product_name}</span>
                                            </div>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {lead.history.quotes.length > 0 && (
                                    <div>
                                      <h5 className="text-xs text-fuchsia-400 font-semibold mb-2">Presupuestos Solicitados</h5>
                                      <ul className="space-y-2">
                                        {lead.history.quotes.map((q, i) => (
                                          <li key={i} className="text-sm text-slate-300 bg-black/20 p-3 rounded-lg border border-white/5">
                                            <div className="flex justify-between items-start mb-1">
                                              <span className="font-medium text-fuchsia-200">{q.product_list_names?.join(', ')}</span>
                                              <span className="text-slate-500 text-xs">{q.date_add?.split(' ')[0]}</span>
                                            </div>
                                            {q.comment && <p className="text-slate-400 text-xs italic mt-1 border-l-2 border-fuchsia-500/30 pl-2">"{q.comment}"</p>}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {lead.history.pdfs.length === 0 && lead.history.quotes.length === 0 && (
                                    <p className="text-sm text-slate-500 italic">No hay historial detallado disponible.</p>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </AnimatePresence>
                
                {currentLeads.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-slate-500">
                      No se encontraron leads que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="bg-black/20 p-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-sm text-slate-400">
              Mostrando {filteredLeads.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} a {Math.min(currentPage * rowsPerPage, filteredLeads.length)} de {filteredLeads.length} leads
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg bg-[#172035] border border-white/10 text-slate-300 hover:bg-indigo-500/20 hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                Anterior
              </button>
              <div className="flex gap-1">
                 <span className="px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-sm font-bold">
                   {currentPage} / {totalPages}
                 </span>
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg bg-[#172035] border border-white/10 text-slate-300 hover:bg-indigo-500/20 hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
