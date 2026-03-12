import { Link } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';

export default function ComingSoon({ title }) {
    return (
        <div className="w-full min-h-screen bg-[#f8fafc] dark:bg-slate-950 flex flex-col p-6 text-gray-800 dark:text-slate-200 transition-colors">
            <PageHeader moduleName={title} showRefresh={false} />
            <div className="flex-1 flex flex-col items-center justify-center">
                <h1 className="text-5xl font-extrabold text-slate-800 dark:text-slate-200 mb-6 uppercase tracking-widest transition-colors">{title}</h1>
                <p className="text-xl mb-8 text-slate-600 dark:text-slate-400 transition-colors">Este módulo está en construcción.</p>
            </div>
        </div>
    );
}
