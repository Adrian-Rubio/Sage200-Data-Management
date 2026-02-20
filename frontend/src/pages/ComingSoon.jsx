import { Link } from 'react-router-dom';

export default function ComingSoon({ title }) {
    return (
        <div className="w-full min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6 text-gray-800">
            <h1 className="text-5xl font-extrabold text-gray-900 mb-6 uppercase tracking-widest">{title}</h1>
            <p className="text-xl mb-8">Este módulo está en construcción.</p>
            <Link to="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium shadow-md">
                ← Volver al Menú Principal
            </Link>
        </div>
    );
}
