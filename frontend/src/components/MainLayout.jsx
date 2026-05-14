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
    ShieldCheck
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';

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
            permission: 'ventas' 
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
                <div className="h-20 flex items-center px-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20">
                        <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    {!isCollapsed && (
                        <span className="ml-3 font-bold text-lg text-blue-500 tracking-tight whitespace-nowrap">
                            Cenval <span className="text-blue-600">SL</span>
                        </span>
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
                <div className="p-8">
                    {/* User Badge - Helpful for debugging/knowing role */}
                    <div className="absolute top-6 right-8 flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2 rounded-full shadow-sm border border-slate-100 dark:border-slate-800 z-10">
                        <div className="flex flex-col text-right">
                            <span className="text-xs font-black text-slate-900 dark:text-white uppercase leading-none">{user?.sub || 'Usuario'}</span>
                            <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest leading-none mt-1">{user?.role_name || user?.role || 'Personal'}</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <UsersIcon size={14} className="text-slate-400" />
                        </div>
                    </div>
                    {children}
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
