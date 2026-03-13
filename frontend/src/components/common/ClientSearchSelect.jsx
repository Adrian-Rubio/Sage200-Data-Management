import React, { useState, useEffect, useRef } from 'react';
import { searchClients } from '../../services/api';

export default function ClientSearchSelect({ value, onChange, placeholder = "Buscar cliente...", name = "client_id" }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = async (val) => {
        setSearchTerm(val);
        if (val.length < 2) {
            setResults([]);
            setShowDropdown(false);
            return;
        }

        setLoading(true);
        try {
            const data = await searchClients(val);
            setResults(data);
            setShowDropdown(true);
        } catch (e) {
            console.error("Search failed", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (client) => {
        onChange({ target: { name, value: client.id } });
        setSearchTerm(`${client.id} - ${client.name}`);
        setShowDropdown(false);
    };

    const handleClear = () => {
        setSearchTerm('');
        onChange({ target: { name, value: null } });
        setResults([]);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <div className="relative">
                <input
                    type="text"
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => searchTerm.length >= 2 && setShowDropdown(true)}
                    className="block w-64 rounded border border-slate-200 dark:border-slate-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs p-1.5 pl-8 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 transition-colors"
                />
                <svg className="w-3.5 h-3.5 absolute left-2 top-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchTerm && (
                    <button onClick={handleClear} className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                )}
            </div>

            {showDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {loading ? (
                        <div className="p-3 text-xs text-slate-500 animate-pulse">Buscando...</div>
                    ) : results.length > 0 ? (
                        results.map(client => (
                            <button
                                key={client.id}
                                onClick={() => handleSelect(client)}
                                className="w-full text-left px-4 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 border-b border-slate-50 dark:border-slate-700/50 last:border-0"
                            >
                                <span className="font-bold text-indigo-600 dark:text-indigo-400 mr-2">{client.id}</span>
                                <span className="text-slate-700 dark:text-slate-200">{client.name}</span>
                            </button>
                        ))
                    ) : (
                        <div className="p-3 text-xs text-slate-500 italic">No se encontraron clientes</div>
                    )}
                </div>
            )}
        </div>
    );
}
