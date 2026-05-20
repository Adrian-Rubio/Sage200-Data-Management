
import { Link } from 'react-router-dom';

export function PageHeader({ moduleName, showRefresh = true, onRefresh, children, showBackMenu = true, className = "" }) {
    const hasCustomMargin = className.includes("mb-") || className.includes("m-");
    const hasCustomRounded = className.includes("rounded-");
    const hasCustomBorder = className.includes("border-") || className.includes("border ");
    const hasCustomShadow = className.includes("shadow-") || className.includes("shadow ");

    const defaultClass = `flex justify-between items-center bg-white dark:bg-slate-900 p-4 animate-fadeIn transition-colors 
        ${hasCustomMargin ? "" : "mb-4"} 
        ${hasCustomRounded ? "" : "rounded-xl"} 
        ${hasCustomShadow ? "" : "shadow-sm"} 
        ${hasCustomBorder ? "" : "border border-slate-100 dark:border-slate-800"} 
        ${className}`;

    return (
        <div className={defaultClass}>
            <div className="flex items-center gap-4">
                <div className="flex flex-col">
                    <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <span className="bg-[#f04a24] text-white px-2 py-0.5 rounded text-sm tracking-tighter">CENVALSA</span>
                        <span className="text-slate-400 font-medium">/</span>
                        <span className="tracking-tight text-slate-700 dark:text-slate-300">{moduleName}</span>
                    </h1>
                </div>
            </div>

            <div className="flex items-center gap-3">

                {children}

                {showBackMenu && (
                    <Link
                        to="/"
                        className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition font-bold text-xs h-[34px] flex items-center justify-center whitespace-nowrap"
                    >
                        Volver al Menú
                    </Link>
                )}

                {showRefresh && (
                    <button
                        onClick={onRefresh || (() => window.location.reload(true))}
                        className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50 px-3 py-1.5 rounded shadow-sm hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors font-bold text-xs h-[34px] flex items-center justify-center whitespace-nowrap"
                    >
                        Refrescar
                    </button>
                )}
            </div>
        </div>
    );
}
