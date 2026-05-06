import React, { useState } from 'react';
import { changePassword } from '../services/auth';
import useAuthStore from '../store/authStore';

export default function ForcePasswordChange() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { logoutUser } = useAuthStore();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setLoading(true);
        try {
            await changePassword(password);
            alert('Contraseña actualizada con éxito. Por favor, vuelve a iniciar sesión.');
            logoutUser();
        } catch (err) {
            const detail = err.response?.data?.detail;
            if (Array.isArray(detail)) {
                setError(detail[0]?.msg || 'Error de validación');
            } else {
                setError(detail || 'Error al actualizar la contraseña.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <div className="bg-indigo-600 p-6 text-white text-center">
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Actualizar Contraseña</h2>
                    <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mt-1">Por seguridad, debes establecer una nueva clave</p>
                </div>
                
                <div className="p-8">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold mb-6 border border-red-100">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Nueva Contraseña</label>
                            <input 
                                type="password" 
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                placeholder="******"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Confirmar Contraseña</label>
                            <input 
                                type="password" 
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                placeholder="******"
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Procesando...' : 'Actualizar y Continuar'}
                        </button>
                    </form>
                    
                    <button 
                        onClick={logoutUser}
                        className="w-full mt-4 text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-widest transition-all"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>
    );
}
