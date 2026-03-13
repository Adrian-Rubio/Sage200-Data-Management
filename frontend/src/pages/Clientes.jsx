import React, { useState, useEffect } from 'react';
import { searchClients } from '../services/api';
import { PageHeader } from '../components/common/PageHeader';
import { Link } from 'react-router-dom';

export default function Clientes() {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchInitialClients();
    }, []);

    const fetchInitialClients = async () => {
        setLoading(true);
        try {
            const data = await searchClients('');
            setClients(data);
        } catch (err) {
            console.error("Initial load failed", err);
            setError("Error al cargar clientes.");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        
        if (val.length > 0 && val.length < 2) {
            // Wait for more characters or show initial list if empty
            return;
        }

        if (val.length === 0) {
            fetchInitialClients();
            return;
        }

        setLoading(true);
        try {
            const data = await searchClients(val);
            setClients(data);
        } catch (err) {
            console.error("Search failed", err);
            setError("Error al buscar clientes.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full min-h-screen bg-[#f8fafc] dark:bg-slate-950 p-6 text-gray-800 dark:text-slate-100 font-sans flex flex-col transition-colors">
            <PageHeader moduleName="Listado de Clientes" />

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 mb-6 transition-colors">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Escribe código o nombre del cliente..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="w-full rounded-xl border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 shadow-sm focus:border-indigo-500 focus:ring-0 text-sm p-3 pl-10 font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                        />
                        <svg className="w-5 h-5 absolute left-3 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Código</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre / Razón Social</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                        {loading ? (
                            <tr>
                                <td colSpan="3" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                        <span>Buscando clientes...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : clients.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 italic">
                                    {searchTerm.length < 2 ? "Empieza a escribir para buscar clientes" : "No se encontraron clientes que coincidan con la búsqueda"}
                                </td>
                            </tr>
                        ) : (
                            clients.map((client) => (
                                <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-lg text-xs font-bold border border-indigo-100 dark:border-indigo-800">
                                            {client.id}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                                            {client.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link 
                                            to={`/ventas?client_id=${client.id}`}
                                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-xs font-black uppercase tracking-widest"
                                        >
                                            Ver Ventas →
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
