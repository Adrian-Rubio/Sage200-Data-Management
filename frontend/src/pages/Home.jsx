import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function Home() {
    const { user, logoutUser } = useAuthStore();

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
            name: 'Finanzas',
            path: '/finanzas',
            permission: 'finanzas',
            color: 'bg-[#9814ff]',
            hover: 'hover:bg-[#7b0fd6]',
            icon: <img src="/finanzas.png" alt="Finanzas" className="w-16 h-16 mb-2 object-contain group-hover:scale-110 transition-transform" />
        },
        {
            name: 'Usuarios',
            path: '/usuarios',
            permission: 'admin',
            color: 'bg-slate-700',
            hover: 'hover:bg-slate-800',
            icon: <img src="/usuarios.png" alt="Usuarios" className="w-16 h-16 mb-2 object-contain group-hover:scale-110 transition-transform" />
        }
    ];

    // We show all modules, but some will be "locked" if no permissions
    const modules = allModules.map(mod => {
        const hasPermission = user?.permissions?.[mod.permission] || (user?.role === 'admin') || (mod.permission === 'admin' && user?.role === 'admin');
        // Default permissions for specific modules if not defined
        const isDefault = mod.permission === 'ventas' || mod.permission === 'compras';
        const finalHasPermission = hasPermission || (!user?.permissions && isDefault);

        return { ...mod, disabled: !finalHasPermission };
    });

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

                {modules.map((mod) => (
                    mod.disabled ? (
                        <div
                            key={mod.name}
                            className="flex flex-col items-center justify-center w-[160px] h-[160px] bg-slate-800/40 text-gray-500 rounded-[1.5rem] border border-white/5 cursor-not-allowed opacity-60 grayscale relative group"
                        >
                            {mod.icon}
                            <span className="text-[13px] font-bold tracking-widest uppercase mb-1">
                                {mod.name}
                            </span>
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[1.5rem] opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002-2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                        </div>
                    ) : (
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
                    )
                ))}

            </div>
        </div>
    );
}
