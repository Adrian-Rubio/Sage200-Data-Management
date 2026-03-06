
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export function PageHeader({ moduleName, showRefresh = true, onRefresh, children, showBackMenu = true }) {
    const { user, logoutUser } = useAuthStore();

    return (
        <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-100 animate-fadeIn">
            <div className="flex items-center gap-4">
                <div className="flex flex-col">
                    <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <span className="bg-[#f04a24] text-white px-2 py-0.5 rounded text-sm tracking-tighter">CENVALSA</span>
                        <span className="text-slate-400 font-medium">/</span>
                        <span className="tracking-tight text-slate-700">{moduleName}</span>
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
                        className="bg-white text-slate-600 border border-slate-200 px-3 py-1.5 rounded shadow-sm hover:bg-slate-50 transition font-bold text-xs h-[34px] flex items-center justify-center whitespace-nowrap"
                    >
                        Volver al Menú
                    </Link>
                )}

                <button
                    onClick={logoutUser}
                    className="bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 px-3 py-1.5 rounded shadow-sm transition font-bold text-xs h-[34px] flex items-center justify-center whitespace-nowrap"
                >
                    Cerrar Sesión
                </button>
                {showRefresh && (
                    <button
                        onClick={onRefresh || (() => window.location.reload(true))}
                        className="bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1.5 rounded shadow-sm hover:bg-blue-100 transition font-bold text-xs h-[34px] flex items-center justify-center whitespace-nowrap"
                    >
                        Refrescar
                    </button>
                )}
            </div>
        </div>
    );
}
