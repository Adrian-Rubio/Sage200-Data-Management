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
            icon: (
                <svg className="w-10 h-10 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    <circle cx="12" cy="12" r="10" strokeWidth={2.5} />
                </svg>
            )
        },
        {
            name: 'Compras',
            path: '/compras',
            permission: 'compras',
            color: 'bg-[#2063ff]',
            hover: 'hover:bg-[#1951d4]',
            icon: (
                <svg className="w-10 h-10 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            )
        },
        {
            name: 'Producción',
            path: '/produccion',
            permission: 'produccion',
            color: 'bg-[#d88900]',
            hover: 'hover:bg-[#b57300]',
            icon: (
                <svg className="w-10 h-10 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
            )
        },
        {
            name: 'Finanzas',
            path: '/finanzas',
            permission: 'finanzas',
            color: 'bg-[#9814ff]',
            hover: 'hover:bg-[#7b0fd6]',
            icon: (
                <svg className="w-10 h-10 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            )
        },
        {
            name: 'Usuarios',
            path: '/usuarios',
            permission: 'admin',
            color: 'bg-slate-700',
            hover: 'hover:bg-slate-800',
            icon: (
                <svg className="w-10 h-10 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            )
        }
    ];

    // Filter modules based on granular permissions in JWT
    const modules = allModules.filter(mod => {
        if (!user || !user.permissions) return mod.permission === 'ventas' || mod.permission === 'compras';
        return user.permissions[mod.permission];
    });

    return (
        <div
            className="w-full min-h-screen relative"
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
            <div className="absolute top-6 right-6 flex items-center gap-4 bg-[#2a2e35]/90 p-3 rounded-xl shadow-lg border border-white/10 backdrop-blur-sm">
                <span className="text-gray-300 font-medium text-sm px-2">
                    Hola, {user?.username} ({user?.role_obj?.name || user?.role})
                </span>
                <button
                    onClick={logoutUser}
                    className="bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg shadow-sm font-medium transition-all text-sm"
                >
                    Cerrar Sesión
                </button>
            </div>

            <div className="absolute top-[22%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#2a2e35] rounded-[1.5rem] p-6 shadow-2xl flex flex-wrap sm:flex-nowrap gap-5 w-fit border border-white/5">

                {modules.map((mod) => (
                    <Link
                        key={mod.name}
                        to={mod.path}
                        className={`flex flex-col items-center justify-center w-[160px] h-[160px] ${mod.color} ${mod.hover} text-white rounded-[1rem] transition-all hover:-translate-y-1 hover:shadow-lg`}
                    >
                        {mod.icon}
                        <span className="text-[13px] font-bold tracking-widest uppercase">
                            {mod.name}
                        </span>
                    </Link>
                ))}

            </div>
        </div>
    );
}
