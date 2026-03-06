import { Link } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';

export default function ComingSoon({ title }) {
    return (
        <div className="w-full min-h-screen bg-[#f8fafc] flex flex-col p-6 text-gray-800">
            <PageHeader moduleName={title} showRefresh={false} />
            <div className="flex-1 flex flex-col items-center justify-center">
                <h1 className="text-5xl font-extrabold text-slate-800 mb-6 uppercase tracking-widest">{title}</h1>
                <p className="text-xl mb-8">Este módulo está en construcción.</p>
            </div>
        </div>
    );
}
