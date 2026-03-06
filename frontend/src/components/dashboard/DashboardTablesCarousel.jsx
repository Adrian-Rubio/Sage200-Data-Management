import { useState } from 'react';
import { TopClientsTable } from './TopClientsTable';
import { SalesInvoicesTable } from './SalesInvoicesTable';

export function DashboardTablesCarousel({ topClientsData, invoicesListData }) {
    const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' is principal

    return (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            {/* Tabs Header */}
            <div className="flex border-b border-slate-100 bg-slate-50/50">
                <button
                    onClick={() => setActiveTab('invoices')}
                    className={`flex-1 py-4 text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'invoices'
                        ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-[0_2px_0_0_rgba(37,99,235,1)]'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                        }`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    LISTA DE FACTURAS RECIENTES
                </button>
                <button
                    onClick={() => setActiveTab('clients')}
                    className={`flex-1 py-4 text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'clients'
                        ? 'bg-white text-emerald-600 border-b-2 border-emerald-600 shadow-[0_2px_0_0_rgba(5,150,105,1)]'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                        }`}
                >
                    TOP 15 CLIENTES (FACTURACIÓN)
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </button>
            </div>

            {/* Content Area */}
            <div className="p-1 transition-all duration-300">
                {activeTab === 'invoices' ? (
                    <div className="animate-fadeIn">
                        <SalesInvoicesTable data={invoicesListData || []} />
                    </div>
                ) : (
                    <div className="animate-fadeIn">
                        <TopClientsTable data={topClientsData || []} />
                    </div>
                )}
            </div>
        </div>
    );
}
