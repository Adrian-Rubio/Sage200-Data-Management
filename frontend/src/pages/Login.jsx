import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { loginUser, error, isAuthenticated } = useAuthStore();
    const navigate = useNavigate();

    // Redirect if already authenticated
    React.useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await loginUser(username, password);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 transition-colors">
            <div className="max-w-md w-full p-8 bg-white dark:bg-slate-900 rounded-lg shadow-md border border-gray-200 dark:border-slate-800 transition-colors">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-200 transition-colors">Cuadros de mando Sage200</h2>
                    <p className="text-gray-500 dark:text-slate-400 mt-2 transition-colors">Introduce tus credenciales de Sage</p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 px-4 py-3 rounded mb-4 transition-colors">
                        {error}
                    </div>
                )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 transition-colors">
                                Username
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-slate-200 transition-colors outline-none"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 transition-colors">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-slate-200 transition-colors outline-none"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded hover:bg-blue-700 transition"
                    >
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;
