import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import configApi from '../services/configApi';

export default function Home() {
    const { user, logoutUser } = useAuthStore();
    const [moduleSettings, setModuleSettings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const settings = await configApi.getModules();
                setModuleSettings(settings);
            } catch (err) {
                console.warn("Could not fetch module settings, using defaults:", err);
                // No bloqueamos al usuario si falla la config global, usamos valores por defecto (todo activo)
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    // Definimos los módulos del sistema con los colores exactos de tu diseño
    const allModules = [
        {
            name: 'Ventas',
            path: '/ventas',
            permission: 'ventas',
            color: 'bg-[#10b943]',
            hover: 'hover:bg-[#0e9e38]',
            icon: <img src="/ventas.png" alt="Ventas" className="w-16 h-16 mb-2 object-contain group-hover:scale-110 transition-transform" />
        },
        {
            name: 'Compras',
            path: '/compras',
            permission: 'compras',
            color: 'bg-[#2063ff]',
            hover: 'hover:bg-[#1951d4]',
            icon: <img src="/Compras.png" alt="Compras" className="w-16 h-16 mb-2 object-contain group-hover:scale-110 transition-transform" />
        },
        {
            name: 'Producción',
            path: '/produccion',
            permission: 'produccion',
            color: 'bg-[#d88900]',
            hover: 'hover:bg-[#b57300]',
            icon: <img src="/produccion.png" alt="Producción" className="w-16 h-16 mb-2 object-contain group-hover:scale-110 transition-transform" />
        },
        {
            name: 'Contabilidad',
            path: '/contabilidad',
            permission: 'finanzas',
            color: 'bg-[#9814ff]',
            hover: 'hover:bg-[#7b0fd6]',
            icon: <img src="/finanzas.png" alt="Contabilidad" className="w-16 h-16 mb-2 object-contain group-hover:scale-110 transition-transform" />
        },
        {
            name: 'Inventario',
            path: '/inventario',
            permission: 'inventario',
            color: 'bg-[#10b981]',
            hover: 'hover:bg-[#0da271]',
            icon: <img src="/cajas.png" alt="Inventario" className="w-16 h-16 mb-2 object-contain group-hover:scale-110 transition-transform opacity-90" />
        },
        {
            name: 'Almacén',
            path: '/almacen',
            permission: 'almacen',
            color: 'bg-[#f04a24]',
            hover: 'hover:bg-[#d63d1a]',
            icon: <img src="/pedidos.png" alt="Almacén" className="w-16 h-16 mb-2 object-contain group-hover:scale-110 transition-transform" />
        },
        {
            name: 'Marketing',
            path: '/marketing',
            permission: 'marketing',
            color: 'bg-[#e6007e]',
            hover: 'hover:bg-[#cc006f]',
            icon: <img src="/marketing.png" alt="Marketing" className="w-16 h-16 mb-2 object-contain group-hover:scale-110 transition-transform" />
        },
        {
            name: 'Restauración',
            path: '/dubes',
            permission: 'direccion',
            color: 'bg-[#ff9f1c]',
            hover: 'hover:bg-[#e88a0b]',
            icon: <img src="/restauracion.png" alt="Restauración" className="w-16 h-16 mb-2 object-contain group-hover:scale-110 transition-transform" />
        },
        {
            name: 'Usuarios',
            path: '/usuarios',
            permission: 'admin',
            color: 'bg-slate-700',
            hover: 'hover:bg-slate-800',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mb-2 text-white group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        }
    ];

    // We show all modules, but some will be "locked" if no permissions
    const modules = allModules.map(mod => {
        const userRole = (user?.role_name || user?.role || '').toLowerCase();
        const isManagement = userRole.includes('admin') || userRole.includes('direcci') || userRole.includes('direccion');

        // Lógica de permisos:
        // 1. Restauración: Solo admin/dirección
        // 2. Otros: Sus permisos específicos o ser admin
        let hasPermission = false;
        if (mod.name === 'Restauración') {
            hasPermission = isManagement;
        } else {
            hasPermission = user?.permissions?.[mod.permission] || (user?.role === 'admin') || (mod.permission === 'admin' && user?.role === 'admin');
        }

        // Check if module is globally active
        const setting = moduleSettings.find(s => s.name === mod.name);
        const isGloballyActive = setting ? setting.is_active : true;

        // Default permissions for specific modules if not defined (Ventas, Compras, Inventario)
        const isDefault = mod.permission === 'ventas' || mod.permission === 'compras' || mod.permission === 'inventario';
        const finalHasPermission = hasPermission || (!user?.permissions && isDefault);

        return { ...mod, disabled: !finalHasPermission, globallyInactive: !isGloballyActive };
    });

    if (loading) {
        return (
            <div className="w-full min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div
            className="w-full min-h-screen relative flex flex-col items-center justify-center"
            style={{
                margin: 0,
                padding: 0,
                backgroundImage: "url('/bg-industrial.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >
            {/* Header con logout */}
            <div className="absolute top-6 right-6 flex items-center gap-4 bg-[#2a2e35]/90 p-3 rounded-xl shadow-lg border border-white/10 backdrop-blur-sm z-50">
                {(() => {
                    const role = (user?.role_name || user?.role || '').toLowerCase();
                    return role.includes('admin') || role.includes('direcci') || role.includes('direccion');
                })() && (

                        <>
                            <Link
                                to="/temporal"
                                className="text-gray-400 hover:text-indigo-400 transition-colors text-[11px] font-bold uppercase tracking-wider border-r border-white/10 pr-4"
                            >
                                Temporal (ABC)
                            </Link>
                            <Link
                                to="/cierre-mes"
                                className="text-gray-400 hover:text-emerald-400 transition-colors text-[11px] font-bold uppercase tracking-wider border-r border-white/10 pr-4"
                            >
                                Cierre de mes
                            </Link>
                        </>
                    )}
                <span className="text-gray-300 font-medium text-sm px-2">
                    Hola, <span className="text-white font-bold">{user?.username}</span> ({user?.role_obj?.name || user?.role})
                </span>
                <button
                    onClick={logoutUser}
                    className="bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg shadow-sm font-medium transition-all text-sm"
                >
                    Cerrar Sesión
                </button>
            </div>

            {/* Main Navigation Container */}
            <div className="bg-[#2a2e35]/80 backdrop-blur-md rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-wrap justify-center gap-6 max-w-[95%] border border-white/10">

                {modules.filter(m => !m.disabled && !m.globallyInactive).map((mod) => (
                    <Link
                        key={mod.name}
                        to={mod.path}
                        className={`flex flex-col items-center justify-center w-[160px] h-[160px] ${mod.color} ${mod.hover} text-white rounded-[1.5rem] transition-all hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)] border border-white/10`}
                    >
                        <div className="transform group-hover:scale-110 transition-transform">
                            {mod.icon}
                        </div>
                        <span className="text-[13px] font-bold tracking-widest uppercase">
                            {mod.name}
                        </span>
                    </Link>
                ))}

            </div>

            {/* Floating Button for Entregas KPI (Direccion/Admin) */}
            {(() => {
                const role = (user?.role_name || user?.role || '').toLowerCase();
                return role.includes('admin') || role.includes('direcci') || role.includes('direccion');
            })() && (
                <Link
                    to="/entregas-tiempo"
                    className="fixed bottom-8 right-8 bg-indigo-600 hover:bg-indigo-700 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 z-50 group border-2 border-white/20"
                    title="KPI Entregas a Tiempo"
                >
                    <img src="/pedidos.png" alt="KPI" className="w-8 h-8 object-contain" />
                    <span className="absolute right-full mr-4 bg-indigo-900/90 text-white text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold uppercase tracking-wider border border-white/10 backdrop-blur-sm">
                        KPI Entregas a Tiempo
                    </span>
                </Link>
            )}
        </div>
    );
}
