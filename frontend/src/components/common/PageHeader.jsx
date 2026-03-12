
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';

export function PageHeader({ moduleName, showRefresh = true, onRefresh, children, showBackMenu = true }) {
    const { user, logoutUser } = useAuthStore();
    const { theme, toggleTheme } = useThemeStore();

    return (
        <div className="flex justify-between items-center mb-6 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 animate-fadeIn transition-colors">
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
                {user && (
                    <span className="hidden md:block text-slate-400 text-[10px] font-black uppercase tracking-widest mr-2">
                        {user.sub || user.username}
                    </span>
                )}

                {children}

                {showBackMenu && (
                    <Link
                        to="/"
                        className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition font-bold text-xs h-[34px] flex items-center justify-center whitespace-nowrap"
                    >
                        Volver al Menú
                    </Link>
                )}

                <button
                    onClick={toggleTheme}
                    className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1.5 rounded shadow-sm hover:bg-slate-200 transition font-bold text-xs h-[34px] flex items-center justify-center whitespace-nowrap dark:bg-indigo-900/30 dark:border-indigo-800/50 dark:text-indigo-300 dark:hover:bg-indigo-800/50"
                    title={theme === 'dark' ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                >
                    {theme === 'dark' ? '☀️ Claro' : '🌙 Oscuro'}
                </button>

                <button
                    onClick={logoutUser}
                    className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-800/50 px-3 py-1.5 rounded shadow-sm transition-colors font-bold text-xs h-[34px] flex items-center justify-center whitespace-nowrap"
                >
                    Cerrar Sesión
                </button>
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
