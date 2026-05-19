import React from 'react';

export function FilterBar({ children }) {
    return (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 mb-4 flex flex-wrap gap-4 items-end transition-colors animate-fadeIn">
            {children}
        </div>
    );
}

export function FilterSelect({ label, value, onChange, options, placeholder = "Todos", widthClass = "w-36" }) {
    return (
        <div className="flex flex-col">
            {label && (
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                    {label}
                </label>
            )}
            <select
                value={value}
                onChange={onChange}
                className={`block ${widthClass} rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm focus:border-blue-500 focus:ring-0 text-xs p-2.5 font-bold text-slate-700 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-800/50 transition-colors cursor-pointer outline-none hover:bg-slate-100/50 dark:hover:bg-slate-800`}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {options.map((opt) => {
                    const val = typeof opt === 'object' ? opt.id : opt;
                    const labelText = typeof opt === 'object' ? opt.name : opt;
                    return (
                        <option key={val} value={val}>
                            {labelText}
                        </option>
                    );
                })}
            </select>
        </div>
    );
}
