import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchUsers, createUser, updateUser, deleteUser, fetchRoles, createRole, updateRole, deleteRole, fetchFilterOptions } from '../services/api';

export default function Usuarios() {
    const [activeTab, setActiveTab] = useState('usuarios');
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [filterOptions, setFilterOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modals State
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    // Form States
    const [userFormData, setUserFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'comercial', // legacy
        role_id: '',
        sales_rep_id: '',
        is_active: true
    });

    const [roleFormData, setRoleFormData] = useState({
        name: '',
        description: '',
        can_view_ventas: false,
        can_view_compras: false,
        can_view_produccion: false,
        can_view_finanzas: false,
        can_manage_users: false
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [usersData, rolesData, filtersData] = await Promise.all([
                fetchUsers(),
                fetchRoles(),
                fetchFilterOptions()
            ]);
            setUsers(usersData);
            setRoles(rolesData);
            // We only need the reps array
            setFilterOptions(filtersData.reps || []);
        } catch (err) {
            setError(err.response?.data?.detail || "Error al cargar los datos.");
        } finally {
            setLoading(false);
        }
    };

    const handleUserInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setUserFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleRoleInputChange = (e) => {
        const { name, checked, value, type } = e.target;
        setRoleFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const handleEditUser = (user) => {
        setIsEditMode(true);
        setEditingId(user.id);
        setUserFormData({
            username: user.username,
            email: user.email,
            password: '', // leave empty unless they want to change it
            role: user.role,
            role_id: user.role_id || '',
            sales_rep_id: user.sales_rep_id || '',
            is_active: user.is_active
        });
        setIsUserModalOpen(true);
    };

    const handleDeleteUser = async (user) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar al usuario ${user.username}?`)) return;
        setLoading(true);
        try {
            await deleteUser(user.id);
            setSuccessMsg(`Usuario ${user.username} eliminado correctamente.`);
            loadData();
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (err) {
            setError(err.response?.data?.detail || "Error al eliminar el usuario.");
            setLoading(false);
        }
    };

    const handleEditRole = (role) => {
        setIsEditMode(true);
        setEditingId(role.id);
        setRoleFormData({
            name: role.name,
            description: role.description || '',
            can_view_ventas: role.can_view_ventas,
            can_view_compras: role.can_view_compras,
            can_view_produccion: role.can_view_produccion,
            can_view_finanzas: role.can_view_finanzas,
            can_manage_users: role.can_manage_users
        });
        setIsRoleModalOpen(true);
    };

    const handleDeleteRole = async (role) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar el rol ${role.name}?`)) return;
        setLoading(true);
        try {
            await deleteRole(role.id);
            setSuccessMsg(`Rol ${role.name} eliminado correctamente.`);
            loadData();
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (err) {
            setError(err.response?.data?.detail || "Error al eliminar el rol.");
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const payload = { ...userFormData, role_id: userFormData.role_id ? parseInt(userFormData.role_id) : null };

            if (payload.role_id) {
                const selectedRole = roles.find(r => r.id === payload.role_id);
                if (selectedRole) {
                    payload.role = selectedRole.name;
                }
            } else {
                payload.role = ''; // Reset if no role_id
            }

            if (!payload.password) delete payload.password; // Don't send empty password on update if unchanged

            if (isEditMode) {
                await updateUser(editingId, payload);
                setSuccessMsg(`Usuario ${userFormData.username} actualizado correctamente.`);
            } else {
                await createUser(payload);
                setSuccessMsg(`Usuario ${userFormData.username} creado correctamente.`);
            }
            cerrarModal();
            loadData();
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (err) {
            setError(err.response?.data?.detail || "Error al guardar el usuario.");
        } finally {
            setFormLoading(false);
        }
    };

    const handleCreateRole = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            if (isEditMode) {
                await updateRole(editingId, roleFormData);
                setSuccessMsg(`Rol ${roleFormData.name} actualizado correctamente.`);
            } else {
                await createRole(roleFormData);
                setSuccessMsg(`Rol ${roleFormData.name} creado correctamente.`);
            }
            cerrarModal();
            loadData();
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (err) {
            setError(err.response?.data?.detail || "Error al guardar el rol.");
        } finally {
            setFormLoading(false);
        }
    };

    const cerrarModal = () => {
        setIsUserModalOpen(false);
        setIsRoleModalOpen(false);
        setIsEditMode(false);
        setEditingId(null);
        setUserFormData({ username: '', email: '', password: '', role: 'comercial', role_id: '', sales_rep_id: '', is_active: true });
        setRoleFormData({ name: '', description: '', can_view_ventas: false, can_view_compras: false, can_view_produccion: false, can_view_finanzas: false, can_manage_users: false });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('es-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="w-full min-h-screen bg-[#f8fafc] p-6 text-gray-800 font-sans">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                        <span className="bg-slate-800 text-white px-3 py-1 rounded text-2xl">CENVALSA</span>
                        Seguridad y Permisos
                    </h1>
                    <p className="text-slate-500 mt-1">Gestión avanzada de usuarios, roles y permisos granulares</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => { cerrarModal(); activeTab === 'usuarios' ? setIsUserModalOpen(true) : setIsRoleModalOpen(true); }}
                        className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg shadow-md hover:bg-indigo-700 transition font-bold flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        {activeTab === 'usuarios' ? 'Nuevo Usuario' : 'Nuevo Rol'}
                    </button>
                    <Link to="/" className="bg-white text-slate-600 border border-slate-300 px-5 py-2.5 rounded-lg shadow-sm hover:bg-slate-50 transition font-medium flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        Volver al Menú
                    </Link>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 bg-slate-200/50 p-1 w-fit rounded-xl">
                <button
                    onClick={() => setActiveTab('usuarios')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'usuarios' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Usuarios
                </button>
                <button
                    onClick={() => setActiveTab('roles')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'roles' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Roles y Permisos
                </button>
            </div>

            {/* Notification and Error */}
            {successMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-3 text-sm font-medium">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                    {successMsg}
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-3 text-sm font-medium justify-between">
                    <div className="flex items-center gap-3">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                        {error}
                    </div>
                    <button onClick={() => setError(null)} className="text-red-500 hover:text-red-800 font-bold">X</button>
                </div>
            )}

            {/* Content Area */}
            {loading ? (
                <div className="bg-white rounded-2xl p-20 text-center border border-slate-200">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-indigo-600 mb-4"></div>
                </div>
            ) : activeTab === 'usuarios' ? (
                <UsersTable users={users} roles={roles} formatDate={formatDate} onEdit={handleEditUser} onDelete={handleDeleteUser} />
            ) : (
                <RolesTable roles={roles} onEdit={handleEditRole} onDelete={handleDeleteRole} />
            )}

            {/* User Modal */}
            {isUserModalOpen && (
                <Modal title={isEditMode ? "Editar Usuario" : "Crear Nuevo Usuario"} onClose={cerrarModal}>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <InputField required label="Usuario" name="username" value={userFormData.username} onChange={handleUserInputChange} />
                            <InputField required={!isEditMode} type="password" label="Contraseña" name="password" placeholder={isEditMode ? "Dejar vacío para no cambiar" : ""} value={userFormData.password} onChange={handleUserInputChange} />
                        </div>
                        <InputField required type="email" label="Email" name="email" value={userFormData.email} onChange={handleUserInputChange} />
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Asignar Rol</label>
                                <select required name="role_id" value={userFormData.role_id} onChange={handleUserInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none">
                                    <option value="">Selecciona un rol...</option>
                                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">ID Sage Resp. (Comercial)</label>
                                <select name="sales_rep_id" value={userFormData.sales_rep_id} onChange={handleUserInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none">
                                    <option value="">NINGUNO</option>
                                    {filterOptions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" name="is_active" checked={userFormData.is_active} onChange={handleUserInputChange} className="w-4 h-4 rounded" />
                            <span className="text-sm font-bold text-slate-700">Usuario Activo</span>
                        </div>
                        <div className="pt-4 flex gap-3">
                            <button type="submit" disabled={formLoading} className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold shadow-lg">
                                {formLoading ? 'Guardando...' : (isEditMode ? 'Guardar Cambios' : 'Crear Usuario')}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Role Modal */}
            {isRoleModalOpen && (
                <Modal title={isEditMode ? "Editar Rol" : "Definir Nuevo Rol"} onClose={cerrarModal}>
                    <form onSubmit={handleCreateRole} className="space-y-4">
                        <InputField required label="Nombre del Rol" name="name" value={roleFormData.name} onChange={handleRoleInputChange} placeholder="ej: Logística, Director..." />
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Descripción</label>
                            <textarea name="description" value={roleFormData.description} onChange={handleRoleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm min-h-[80px]" />
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Permisos Granulares</h4>
                            <div className="grid grid-cols-2 gap-y-3">
                                <PermissionCheck label="Panel Ventas" name="can_view_ventas" checked={roleFormData.can_view_ventas} onChange={handleRoleInputChange} />
                                <PermissionCheck label="Módulo Compras" name="can_view_compras" checked={roleFormData.can_view_compras} onChange={handleRoleInputChange} />
                                <PermissionCheck label="Gestión Producción" name="can_view_produccion" checked={roleFormData.can_view_produccion} onChange={handleRoleInputChange} />
                                <PermissionCheck label="Datos Finanzas" name="can_view_finanzas" checked={roleFormData.can_view_finanzas} onChange={handleRoleInputChange} />
                                <PermissionCheck label="Admin Usuarios" name="can_manage_users" checked={roleFormData.can_manage_users} onChange={handleRoleInputChange} />
                            </div>
                        </div>
                        <div className="pt-4">
                            <button type="submit" disabled={formLoading} className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold">
                                {formLoading ? 'Guardando...' : (isEditMode ? 'Guardar Cambios' : 'Crear Rol y Permisos')}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

function UsersTable({ users, roles, formatDate, onEdit, onDelete }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-[#444b41] text-white">
                    <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest">Usuario</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest">Email</th>
                        <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-widest">Rol Asignado</th>
                        <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-widest">Estado</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest">Fecha Alta</th>
                        <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 italic">
                    {users.map(user => (
                        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-900">{user.username}</td>
                            <td className="px-6 py-4 text-slate-500">{user.email}</td>
                            <td className="px-6 py-4 text-center">
                                <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-xs font-bold border border-indigo-100">
                                    {user.role_obj?.name || user.role || 'Sin Rol'}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase border ${user.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                    {user.is_active ? 'Activo' : 'Baja'}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-slate-400 text-xs">{formatDate(user.created_at)}</td>
                            <td className="px-6 py-4 text-right space-x-2">
                                <button onClick={() => onEdit(user)} className="text-indigo-600 hover:text-indigo-900 font-bold p-1">Editar</button>
                                <button onClick={() => onDelete(user)} className="text-red-600 hover:text-red-900 font-bold p-1">Borrar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function RolesTable({ roles, onEdit, onDelete }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map(role => (
                <div key={role.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative group">
                    <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onEdit(role)} className="bg-indigo-50 text-indigo-600 p-1.5 rounded hover:bg-indigo-100 shadow-sm" title="Editar Rol">
                            ✏️
                        </button>
                        <button onClick={() => onDelete(role)} className="bg-red-50 text-red-600 p-1.5 rounded hover:bg-red-100 shadow-sm" title="Borrar Rol">
                            🗑️
                        </button>
                    </div>
                    <div className="flex justify-between items-start mb-4 pr-16">
                        <h3 className="text-xl font-bold text-slate-800">{role.name}</h3>
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">{role.id}</div>
                    </div>
                    <p className="text-sm text-slate-500 mb-6 min-h-[40px] leading-relaxed">{role.description || 'Sin descripción.'}</p>
                    <div className="space-y-2 border-t border-slate-100 pt-4">
                        <StaticPermission label="Ventas" active={role.can_view_ventas} />
                        <StaticPermission label="Compras" active={role.can_view_compras} />
                        <StaticPermission label="Producción" active={role.can_view_produccion} />
                        <StaticPermission label="Finanzas" active={role.can_view_finanzas} />
                        <StaticPermission label="Gestión USR" active={role.can_manage_users} />
                    </div>
                </div>
            ))}
        </div>
    );
}

// UI Components
function Modal({ title, onClose, children }) {
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
                <div className="bg-slate-800 p-6 text-white flex justify-between items-center">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <button onClick={onClose} className="hover:text-slate-300 transition">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <div className="p-8">{children}</div>
            </div>
        </div>
    );
}

function InputField({ label, ...props }) {
    return (
        <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">{label}</label>
            <input {...props} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition" />
        </div>
    );
}

function PermissionCheck({ label, checked, onChange, name }) {
    return (
        <label className="flex items-center gap-2 cursor-pointer group">
            <input type="checkbox" name={name} checked={checked} onChange={onChange} className="w-4 h-4 rounded text-indigo-600 border-slate-300" />
            <span className={`text-xs font-bold ${checked ? 'text-slate-800' : 'text-slate-400 group-hover:text-slate-500'}`}>{label}</span>
        </label>
    );
}

function StaticPermission({ label, active }) {
    return (
        <div className="flex justify-between items-center px-2">
            <span className="text-xs font-medium text-slate-600">{label}</span>
            {active ? (
                <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded uppercase">Si</span>
            ) : (
                <span className="text-[10px] font-black text-slate-300 px-2 py-0.5 rounded uppercase">No</span>
            )}
        </div>
    );
}
