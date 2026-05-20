import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, 
    TrendingUp, 
    ShoppingCart, 
    Factory, 
    Warehouse, 
    Calculator, 
    ClipboardList, 
    Coffee, 
    RefreshCw, 
    Calendar, 
    Users as UsersIcon,
    Lock,
    Settings,
    Moon,
    Sun,
    LogOut,
    Menu,
    ChevronLeft,
    ShieldCheck,
    Palmtree
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import { formatUserRole } from '../utils/constants';

const MainLayout = ({ children }) => {
    const { user, logoutUser } = useAuthStore();
    const { theme, toggleTheme } = useThemeStore();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Permissions logic from JWT payload
    const permissions = user?.permissions || {};

    const menuItems = [
        { 
            name: 'Home', 
            path: '/', 
            icon: <LayoutDashboard size={20} />, 
            permission: null 
        },
        { 
            name: 'Ventas', 
            path: '/ventas', 
            icon: <TrendingUp size={20} />, 
            permission: 'ventas' 
        },
        { 
            name: 'Compras', 
            path: '/compras', 
            icon: <ShoppingCart size={20} />, 
            permission: 'compras' 
        },
        { 
            name: 'Producción', 
            path: '/produccion', 
            icon: <Factory size={20} />, 
            permission: 'produccion' 
        },
        { 
            name: 'Almacén', 
            path: '/almacen', 
            icon: <Warehouse size={20} />, 
            permission: 'almacen' 
        },
        { 
            name: 'Contabilidad', 
            path: '/contabilidad', 
            icon: <Calculator size={20} />, 
            permission: 'finanzas' 
        },
        { 
            name: 'Inventario', 
            path: '/inventario', 
            icon: <ClipboardList size={20} />, 
            permission: 'inventario' 
        },
        { 
            name: 'Restauración', 
            path: '/dubes', 
            icon: <Coffee size={20} />, 
            permission: 'restauracion' 
        },
        { 
            name: 'Saratur', 
            path: '/saratur', 
            icon: <Palmtree size={20} />, 
            permission: 'saratur' 
        },
        { 
            name: 'Recursos Humanos', 
            path: '/rrhh', 
            icon: <Calendar size={20} />, 
            permission: 'rrhh' 
        },
        { 
            name: 'Rotación', 
            path: '/temporal', 
            icon: <RefreshCw size={20} />, 
            permission: 'almacen' 
        },
        { 
            name: 'Cierre Mes', 
            path: '/cierre-mes', 
            icon: <Calendar size={20} />, 
            permission: 'finanzas' 
        },
        { 
            name: 'Usuarios', 
            path: '/usuarios', 
            icon: <UsersIcon size={20} />, 
            permission: 'admin' 
        },
    ];

    const handleLogout = () => {
        logoutUser();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            {/* Sidebar */}
            <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 z-50`}>
                {/* Logo Section */}
                <div className="h-20 flex items-center px-5 border-b border-slate-100 dark:border-slate-800 shrink-0 gap-3">
                    <img src="/icono.png" alt="Cenval SL Logo" className="w-9 h-9 object-contain rounded-lg" />
                    {!isCollapsed && (
                        <span className="font-bold text-lg text-blue-500 tracking-tight whitespace-nowrap">
                            Cenval <span className="text-blue-600">SL</span>
                        </span>
                    )}
                </div>

                {/* User Profile Section (moved from floating main layout to sidebar) */}
                <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    {isCollapsed ? (
                        <div className="mx-auto w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-850 flex items-center justify-center shadow-sm" title={user?.sub || 'Usuario'}>
                            <UsersIcon size={16} className="text-slate-400 dark:text-slate-500" />
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 bg-slate-50/50 dark:bg-slate-800/30 px-3 py-2 rounded-2xl border border-slate-100/50 dark:border-slate-800/60 shadow-sm">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center shrink-0">
                                <UsersIcon size={16} className="text-slate-500 dark:text-slate-400" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-black text-slate-800 dark:text-white uppercase leading-none truncate" title={user?.sub || 'Usuario'}>
                                    {user?.sub || 'Usuario'}
                                </span>
                                <span className="text-[9px] text-blue-500 font-black uppercase tracking-widest leading-none mt-1.5 truncate" title={formatUserRole(user?.role_name || user?.role)}>
                                    {formatUserRole(user?.role_name || user?.role)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Menu Items */}
                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
                    {menuItems.map((item) => {
                        const hasPermission = item.permission === null || permissions[item.permission];
                        const isActive = location.pathname === item.path;
                        
                        return (
                            <div key={item.name}>
                                {hasPermission ? (
                                    <Link
                                        to={item.path}
                                        className={`flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                                            isActive 
                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold shadow-sm' 
                                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                                        }`}
                                        title={isCollapsed ? item.name : ''}
                                    >
                                        <span className={`${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
                                            {item.icon}
                                        </span>
                                        {!isCollapsed && (
                                            <span className="ml-3 text-sm tracking-wide">
                                                {item.name}
                                            </span>
                                        )}
                                        {isActive && !isCollapsed && (
                                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                        )}
                                    </Link>
                                ) : (
                                    <div
                                        className="flex items-center px-3 py-2.5 rounded-xl opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-600"
                                        title={`${item.name} (Bloqueado)`}
                                    >
                                        <span>{item.icon}</span>
                                        {!isCollapsed && (
                                            <>
                                                <span className="ml-3 text-sm tracking-wide">{item.name}</span>
                                                <Lock size={12} className="ml-auto" />
                                            </>
                                        )}
                                        {isCollapsed && <Lock size={8} className="absolute top-1 right-1" />}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="w-full flex items-center px-3 py-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        title={isCollapsed ? "Expandir" : "Contraer"}
                    >
                        {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
                        {!isCollapsed && <span className="ml-3 text-sm">Contraer</span>}
                    </button>

                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center px-3 py-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        {!isCollapsed && <span className="ml-3 text-sm">Cambiar Modo</span>}
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-3 py-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"
                    >
                        <LogOut size={20} />
                        {!isCollapsed && <span className="ml-3 text-sm font-semibold">Cerrar Sesión</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto relative">
                <div className="p-6 pt-4">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
