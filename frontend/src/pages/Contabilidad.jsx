import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { PageHeader } from '../components/common/PageHeader';

export default function Contabilidad() {
    const { logoutUser } = useAuthStore();

    const sections = [
        {
            name: 'Tesorería',
            description: 'Seguimiento de cobros y pagos pendientes, vencimientos y saldos en cartera.',
            path: '/finanzas/tesoreria',
            color: 'bg-[#9814ff]',
            textColor: 'text-[#9814ff] dark:text-[#b14cff]',
            hover: 'hover:bg-[#7b0fd6]',
            icon: '💰'
        },
        {
            name: 'Cuenta de Explotación',
            description: 'Análisis detallado de pérdidas y ganancias, ingresos y costes por empresa.',
            path: '/finanzas/explotacion',
            color: 'bg-[#c026d3]',
            textColor: 'text-[#c026d3] dark:text-[#d946ee]',
            hover: 'hover:bg-[#a21caf]',
            icon: '📊'
        }
    ];

    return (
        <div className="w-full min-h-screen bg-[#f8fafc] dark:bg-slate-950 p-6 text-gray-800 dark:text-slate-200 font-sans flex flex-col items-center transition-colors">
            <PageHeader moduleName="Contabilidad" showRefresh={false} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mt-12">
                {sections.map((sec) => (
                    <Link
                        key={sec.name}
                        to={sec.path}
                        className="group bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-8 hover:shadow-xl dark:hover:shadow-lg dark:hover:shadow-slate-800/50 transition-all hover:-translate-y-2 flex flex-col items-center text-center"
                    >
                        <div className={`w-20 h-20 ${sec.color} rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-lg group-hover:scale-110 transition-transform text-white`}>
                            {sec.icon}
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3 transition-colors">{sec.name}</h2>
                        <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed mb-6 transition-colors">
                            {sec.description}
                        </p>
                        <span className={`text-xs font-bold uppercase tracking-widest ${sec.textColor || sec.color.replace('bg-', 'text-')} group-hover:underline transition-colors`}>
                            Acceder al Panel
                        </span>
                    </Link>
                ))}
            </div>

            {/* Bottom Info */}
            <div className="mt-20 text-gray-400 dark:text-slate-500 text-xs flex gap-6 transition-colors">
                <span>Cenval (100)</span>
                <span>Cenvalsa Industrial (2)</span>
                <span>Dubes (4)</span>
                <span>Saratur (6)</span>
            </div>
        </div>
    );
}
