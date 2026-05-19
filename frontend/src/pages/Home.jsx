import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import configApi from '../services/configApi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { KpiCard } from '../components/dashboard/KpiCard';
import { fetchHomeSummary } from '../services/api';

export default function Home() {
    const { user, logoutUser } = useAuthStore();
    const [moduleSettings, setModuleSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [homeSummary, setHomeSummary] = useState(null);
    const [activeCross, setActiveCross] = useState(null);

    const isManagement = (() => {
        const username = (user?.sub || user?.username || '').toLowerCase();
        const role = (user?.role_name || user?.role || '').toLowerCase();
        const dept = (user?.department || '').toLowerCase();
        return (
            username === 'joseluis.martin' ||
            username === 'sara.macho' ||
            username === 'sara' ||
            username === 'adrian.rubio' ||
            role.includes('admin') ||
            role.includes('direc') ||
            role.includes('geren') ||
            dept.includes('direc')
        );
    })();

    // Real-time clock for Executive Dashboard
    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        if (!isManagement) return;
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, [isManagement]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const settings = await configApi.getModules();
                setModuleSettings(settings);
            } catch (err) {
                console.warn("Could not fetch module settings, using defaults:", err);
            }
        };

        const loadHomeData = async () => {
            if (isManagement) {
                try {
                    const summary = await fetchHomeSummary();
                    setHomeSummary(summary);
                } catch (err) {
                    console.error("Error loading home summary:", err);
                }
            }
            setLoading(false);
        };

        fetchSettings();
        loadHomeData();
    }, [isManagement]);

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
        const username = (user?.sub || user?.username || '').toLowerCase();
        const userRole = (user?.role_name || user?.role || '').toLowerCase();
        const isManagement = (
            username === 'joseluis.martin' ||
            username === 'sara.macho' ||
            username === 'sara' ||
            username === 'adrian.rubio' ||
            userRole.includes('admin') ||
            userRole.includes('direc') ||
            userRole.includes('geren')
        );

        // Lógica de permisos:
        // 1. Restauración & Almacén: Solo admin/dirección
        // 2. Otros: Sus permisos específicos o ser admin
        let hasPermission = false;
        if (mod.name === 'Restauración' || mod.name === 'Almacén') {
            hasPermission = isManagement;
        } else {
            hasPermission = user?.permissions?.[mod.permission] || (user?.role === 'admin') || (mod.permission === 'admin' && user?.role === 'admin');
        }

        // Check if module is globally active
        const setting = moduleSettings.find(s => s.name === mod.name);
        const isGloballyActive = setting ? setting.is_active : true;

        // Default permissions for specific modules if not defined (Ventas, Compras, Inventario)
        // Almacén is EXCLUDED from default permissions for commercials
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


    if (isManagement) {
        return (
            <div className="p-4 md:p-6 min-h-full animate-fadeIn space-y-4">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-3">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-6 bg-blue-600 rounded-full" />
                            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                                Centro de Mando
                            </h1>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-xs flex items-center gap-2 uppercase tracking-widest">
                            Bienvenido de nuevo, <span className="text-blue-600">{user?.RazonSocial?.split(' ')[0]}</span>
                        </p>
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                            <p className="text-[9px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest">
                                Periodo: 1 al {new Date().getDate()} de {homeSummary?.month_name || '...'}
                            </p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                        <div className="text-right">
                            <div className="text-xl font-black text-slate-800 dark:text-white tracking-tighter leading-none">
                                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {currentTime.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </div>
                        </div>
                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase">Sesión Activa</span>
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{user?.role_name || user?.role}</span>
                        </div>
                    </div>
                </header>

                {/* Main KPI Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                        title="VENTAS INDUSTRIAL"
                        value={homeSummary?.kpis?.ventas_cenval || 0}
                        subtext="Facturación Mes Actual"
                    />
                    <KpiCard
                        title="VENTAS RESTAURACIÓN"
                        value={homeSummary?.kpis?.ventas_restauracion || 0}
                        subtext="Acumulado Dubes"
                    />
                    <KpiCard
                        title="VENTAS SARATUR"
                        value={homeSummary?.kpis?.ventas_saratur || 0}
                        subtext="Facturación Mes Actual"
                    />
                    <KpiCard
                        title="CARTERA PENDIENTE"
                        value={homeSummary?.kpis?.cartera || 0}
                        subtext="Pedidos por servir"
                        isWarning={homeSummary?.kpis?.cartera > 500000}
                    />
                </div>

                {/* Secondary Operational Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-center">
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Nº Pedidos</span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-black text-slate-800 dark:text-white">{homeSummary?.kpis?.stats?.pedidos || 0}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Mes</span>
                        </div>
                    </div>
                    <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-center">
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Pedidos Preparados</span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-black text-slate-800 dark:text-white">{homeSummary?.kpis?.stats?.preparados || 0}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Almacén</span>
                        </div>
                    </div>
                    <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-center">
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Clientes Únicos</span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-black text-slate-800 dark:text-white">{homeSummary?.kpis?.stats?.clientes_unicos || 0}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Activos</span>
                        </div>
                    </div>
                    <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-center border-l-4 border-l-blue-500">
                        <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-0.5">Clientes Nuevos</span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-black text-slate-800 dark:text-white">{homeSummary?.kpis?.stats?.clientes_nuevos || 0}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Este Mes</span>
                        </div>
                    </div>
                </div>

                {/* Cross-Selling YTD Section */}
                {isManagement && homeSummary?.cross_selling?.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                Venta Cruzada YTD ({new Date().getFullYear()})
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {homeSummary.cross_selling.map((item) => {
                                const isActive = activeCross?.combination === item.combination;
                                return (
                                    <button
                                        key={item.combination}
                                        onClick={() => setActiveCross(isActive ? null : item)}
                                        className={`p-3 rounded-2xl border transition-all duration-300 text-left flex flex-col justify-between ${isActive
                                                ? 'bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/5 dark:bg-emerald-950/20'
                                                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                                            }`}
                                    >
                                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1 truncate">
                                            {item.combination}
                                        </span>
                                        <div className="flex items-baseline justify-between w-full mt-1.5">
                                            <span className="text-lg font-black text-slate-800 dark:text-white">
                                                {item.percentage}% <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">({item.count})</span>
                                            </span>
                                            <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 uppercase bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-full">
                                                Clientes
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Collapsible Client List */}
                        {activeCross && (
                            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-emerald-100 dark:border-emerald-950/50 p-6 space-y-4 shadow-sm animate-fadeIn">
                                <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800/50 pb-3">
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                            Clientes en Cartera Cruzada
                                        </h4>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1">
                                            {activeCross.combination} ({activeCross.count})
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setActiveCross(null)}
                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[250px] overflow-y-auto pr-2">
                                    {activeCross.clients.map((client) => (
                                        <div
                                            key={client.id}
                                            className="p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50 dark:border-slate-800/50 flex items-center justify-between text-xs"
                                        >
                                            <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[80%]">
                                                {client.name}
                                            </span>
                                            <span className="font-black text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                                {client.id}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Bottom Section: Alerts, Budget & Purchases */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-grow pb-4">
                    {/* Alerts Panel */}
                    <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[350px]">
                        <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Alertas del Mes</h3>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <div className="p-4 space-y-3 overflow-y-auto">
                            {homeSummary?.alerts?.length > 0 ? (
                                homeSummary.alerts.map((alert) => (
                                    <div key={alert.id} className={`p-4 rounded-2xl border ${alert.type === 'warning'
                                            ? 'bg-amber-50/50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30 text-amber-800 dark:text-amber-400'
                                            : 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400'
                                        } flex gap-3 items-start`}>
                                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${alert.type === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-wider mb-0.5">{alert.title}</div>
                                            <div className="text-[11px] font-medium leading-tight">{alert.message}</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 py-10">
                                    <svg className="w-8 h-8 mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <p className="text-xs font-bold uppercase tracking-widest">Sin alertas pendientes</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Budget Compliance Card (Compact) */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex flex-col items-center justify-center min-h-[350px]">
                        <div className="w-full max-w-lg text-center">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Cumplimiento Presupuesto • {homeSummary?.month_name}</h3>

                            <div className="mb-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Facturación Bruta</span>
                            </div>
                            <div className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
                                {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(homeSummary?.kpis?.budget?.bruto || 0)}
                            </div>

                            <div className="relative w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full mb-3 overflow-hidden">
                                <div
                                    className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${Math.min(homeSummary?.kpis?.budget?.cumplimiento || 0, 100)}%` }}
                                />
                            </div>

                            <div className="flex justify-between items-center mb-6">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    OBJ: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(homeSummary?.kpis?.budget?.objetivo || 0)}
                                </div>
                                <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                    {homeSummary?.kpis?.budget?.cumplimiento?.toFixed(1)}%
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-50 dark:border-slate-800/50 flex justify-center gap-6">
                                <div className="text-center">
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Abonos</div>
                                    <div className="text-xs font-bold text-rose-500">
                                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(homeSummary?.kpis?.budget?.abonos || 0)}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Neto</div>
                                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(homeSummary?.kpis?.budget?.neto || 0)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Purchases Card */}
                    <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex flex-col items-center justify-center min-h-[350px] text-center">
                        <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center mb-6 text-rose-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                        </div>
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Compras del Mes</h3>
                        <div className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(homeSummary?.kpis?.compras || 0)}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Gastado</div>
                    </div>
                </div>

                {/* Footer Helper */}
                <div className="flex justify-center items-center gap-3 text-slate-400 dark:text-slate-600 pt-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Navega usando el menú lateral</span>
                </div>
            </div>
        );
    }

    return (
        <div
            className="w-full min-h-screen relative flex flex-col items-center justify-center p-6 gap-8"
        >
            {/* User Profile Card */}
            <div className="bg-[#2a2e35]/80 backdrop-blur-md rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col items-center text-center max-w-sm w-full animate-fadeIn z-10 relative">
                <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 border-2 border-blue-500/50 shadow-inner">
                    <svg className="w-12 h-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">
                    {user?.sub || user?.username || 'Usuario'}
                </h2>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                        {user?.role_name || user?.role || 'Personal'}
                    </span>
                </div>

                <div className="w-full space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <div className="text-left flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Correo Electrónico</p>
                            <p className="text-sm font-medium text-slate-200 truncate">{user?.email || 'Sin correo registrado'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <div className="text-left flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Departamento</p>
                            <p className="text-sm font-medium text-slate-200 truncate">{user?.department || 'No asignado'}</p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
