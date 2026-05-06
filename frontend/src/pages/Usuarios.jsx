import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import { fetchUsers, createUser, updateUser, deleteUser, fetchRoles, createRole, updateRole, deleteRole, fetchFilterOptions } from '../services/api';
import configApi from '../services/configApi';

export default function Usuarios() {
    const [activeTab, setActiveTab] = useState('usuarios');
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [moduleSettings, setModuleSettings] = useState([]);
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
        user_type: 'CENVAL',
        data_filters: '',
        is_active: true,
        must_change_password: false
    });

    const [roleFormData, setRoleFormData] = useState({
        name: '',
        description: '',
        can_view_ventas: false,
        can_view_compras: false,
        can_view_produccion: false,
        can_view_finanzas: false,
        can_view_almacen: false,
        can_view_inventario: false,
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
            setFilterOptions(filtersData.reps || []);

            // Intentamos cargar los módulos pero si falla no bloqueamos el resto
            try {
                const modulesData = await configApi.getModules();
                setModuleSettings(modulesData);
            } catch (modErr) {
                console.warn("No se pudieron cargar los ajustes de módulos:", modErr);
            }

        } catch (err) {
            setError(err.response?.data?.detail || "Error al cargar los datos.");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleModule = async (name, currentStatus) => {
        try {
            await configApi.updateModule(name, !currentStatus);
            setModuleSettings(prev => prev.map(s => s.name === name ? { ...s, is_active: !currentStatus } : s));
            setSuccessMsg(`Estado del módulo "${name}" actualizado.`);
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setError("Error al actualizar la configuración del módulo.");
        }
    };

    const handleInitializeModules = async () => {
        if (!window.confirm("¿Inicializar todos los módulos por defecto?")) return;
        try {
            await configApi.initialize();
            loadData();
            setSuccessMsg("Módulos inicializados correctamente.");
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setError("Error al inicializar módulos.");
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
            user_type: user.user_type || 'CENVAL',
            data_filters: user.data_filters || '',
            is_active: user.is_active,
            must_change_password: user.must_change_password || false
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
            can_view_almacen: role.can_view_almacen,
            can_view_inventario: role.can_view_inventario,
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
        setRoleFormData({ name: '', description: '', can_view_ventas: false, can_view_compras: false, can_view_produccion: false, can_view_finanzas: false, can_view_almacen: false, can_view_inventario: false, can_manage_users: false });
        setUserFormData({ username: '', email: '', password: '', role: 'comercial', role_id: '', sales_rep_id: '', user_type: 'CENVAL', data_filters: '', is_active: true, must_change_password: false });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('es-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="w-full min-h-screen bg-[#f8fafc] dark:bg-slate-950 p-6 text-gray-800 dark:text-slate-200 font-sans transition-colors">
            <PageHeader moduleName="Usuarios y Permisos" showRefresh={false}>
                {activeTab !== 'config' ? (
                    <button
                        onClick={() => { cerrarModal(); activeTab === 'usuarios' ? setIsUserModalOpen(true) : setIsRoleModalOpen(true); }}
                        className="bg-indigo-600 dark:bg-indigo-500 text-white px-3 py-1.5 rounded shadow-sm hover:bg-indigo-700 dark:hover:bg-indigo-600 transition font-bold text-xs h-[34px] flex items-center gap-2 whitespace-nowrap"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        {activeTab === 'usuarios' ? 'Nuevo Usuario' : 'Nuevo Rol'}
                    </button>
                ) : (
                    <button
                        onClick={handleInitializeModules}
                        className="bg-emerald-600 dark:bg-emerald-500 text-white px-3 py-1.5 rounded shadow-sm hover:bg-emerald-700 dark:hover:bg-emerald-600 transition font-bold text-xs h-[34px] flex items-center gap-2 whitespace-nowrap"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        Inicializar Módulos
                    </button>
                )}
            </PageHeader>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 bg-slate-200/50 dark:bg-slate-800/50 p-1 w-fit rounded-xl transition-colors">
                <button
                    onClick={() => setActiveTab('usuarios')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'usuarios' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    Usuarios
                </button>
                <button
                    onClick={() => setActiveTab('roles')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'roles' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    Roles y Permisos
                </button>
                <button
                    onClick={() => setActiveTab('config')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'config' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    Configuración Global
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
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-20 text-center border border-slate-200 dark:border-slate-800 transition-colors">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-slate-200 dark:border-slate-700 border-t-indigo-600 dark:border-indigo-500 mb-4"></div>
                </div>
            ) : activeTab === 'usuarios' ? (
                <UsersTable users={users} roles={roles} formatDate={formatDate} onEdit={handleEditUser} onDelete={handleDeleteUser} />
            ) : activeTab === 'roles' ? (
                <RolesTable roles={roles} onEdit={handleEditRole} onDelete={handleDeleteRole} />
            ) : (
                <ModuleConfigTable settings={moduleSettings} onToggle={handleToggleModule} />
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
                                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 px-1 transition-colors">Tipo de Cuenta</label>
                                <select required name="user_type" value={userFormData.user_type} onChange={handleUserInputChange} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:ring-indigo-500/40 outline-none transition-colors">
                                    <option value="CENVAL">Interno (CENVAL)</option>
                                    <option value="DISTRIBUIDOR">Externo (DISTRIBUIDOR)</option>
                                    <option value="SOCIO">Externo (SOCIO)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 px-1 transition-colors">Asignar Rol {['DISTRIBUIDOR', 'SOCIO'].includes(userFormData.user_type) && '(Ignorado)'}</label>
                                <select required={userFormData.user_type === 'CENVAL'} disabled={['DISTRIBUIDOR', 'SOCIO'].includes(userFormData.user_type)} name="role_id" value={userFormData.role_id} onChange={handleUserInputChange} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:ring-indigo-500/40 outline-none transition-colors disabled:opacity-50">
                                    <option value="">Selecciona un rol...</option>
                                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 px-1 transition-colors">ID Sage Resp. (Comercial)</label>
                                <select name="sales_rep_id" value={userFormData.sales_rep_id} onChange={handleUserInputChange} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:ring-indigo-500/40 outline-none transition-colors">
                                    <option value="">NINGUNO</option>
                                    {filterOptions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>
                            <InputField label="Filtros de Datos (JSON)" name="data_filters" value={userFormData.data_filters} onChange={handleUserInputChange} placeholder='{"allowed_vendors": ["V001"]}' />
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <input type="checkbox" name="is_active" checked={userFormData.is_active} onChange={handleUserInputChange} className="w-4 h-4 rounded text-indigo-600 dark:text-indigo-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors">Usuario Activo</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" name="must_change_password" checked={userFormData.must_change_password} onChange={handleUserInputChange} className="w-4 h-4 rounded text-amber-600 dark:text-amber-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
                                <span className="text-sm font-bold text-amber-700 dark:text-amber-500 transition-colors">Forzar cambio de contraseña (próximo login)</span>
                            </div>
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
                            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 px-1 transition-colors">Descripción</label>
                            <textarea name="description" value={roleFormData.description} onChange={handleRoleInputChange} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl px-4 py-3 text-sm min-h-[80px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:ring-indigo-500/40 outline-none transition-colors" />
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/20 p-4 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
                            <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 transition-colors">Permisos Granulares</h4>
                            <div className="grid grid-cols-2 gap-y-3">
                                <PermissionCheck label="Panel Ventas" name="can_view_ventas" checked={roleFormData.can_view_ventas} onChange={handleRoleInputChange} />
                                <PermissionCheck label="Módulo Compras" name="can_view_compras" checked={roleFormData.can_view_compras} onChange={handleRoleInputChange} />
                                <PermissionCheck label="Gestión Producción" name="can_view_produccion" checked={roleFormData.can_view_produccion} onChange={handleRoleInputChange} />
                                <PermissionCheck label="Datos Finanzas" name="can_view_finanzas" checked={roleFormData.can_view_finanzas} onChange={handleRoleInputChange} />
                                <PermissionCheck label="Módulo Almacén" name="can_view_almacen" checked={roleFormData.can_view_almacen} onChange={handleRoleInputChange} />
                                <PermissionCheck label="Módulo Inventario" name="can_view_inventario" checked={roleFormData.can_view_inventario} onChange={handleRoleInputChange} />
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 transition-colors">
                <thead className="bg-[#444b41] dark:bg-slate-950 text-white transition-colors">
                    <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest border-b border-transparent dark:border-slate-800">Usuario</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest border-b border-transparent dark:border-slate-800">Email</th>
                        <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-widest border-b border-transparent dark:border-slate-800">Rol Asignado</th>
                        <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-widest border-b border-transparent dark:border-slate-800">Estado</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest border-b border-transparent dark:border-slate-800">Fecha Alta</th>
                        <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest border-b border-transparent dark:border-slate-800">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 italic transition-colors">
                    {users.map(user => (
                        <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-200 transition-colors">{user.username}</td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 transition-colors">{user.email}</td>
                            <td className="px-6 py-4 text-center">
                                <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-lg text-xs font-bold border border-indigo-100 dark:border-indigo-800/50 transition-colors">
                                    {user.role_obj?.name || user.role || 'Sin Rol'}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase border transition-colors ${user.is_active ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50'}`}>
                                    {user.is_active ? 'Activo' : 'Baja'}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-slate-400 dark:text-slate-500 text-xs transition-colors">{formatDate(user.created_at)}</td>
                            <td className="px-6 py-4 text-right space-x-2">
                                {user.must_change_password && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-700 border border-amber-200 uppercase mr-2" title="Debe cambiar contraseña">
                                        🗝️ Reset
                                    </span>
                                )}
                                <button onClick={() => onEdit(user)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 font-bold p-1 transition-colors">Editar</button>
                                <button onClick={() => onDelete(user)} className="text-red-600 dark:text-red-500 hover:text-red-900 dark:hover:text-red-400 font-bold p-1 transition-colors">Borrar</button>
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
                <div key={role.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all relative group">
                    <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onEdit(role)} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 p-1.5 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/50 shadow-sm transition-colors" title="Editar Rol">
                            ✏️
                        </button>
                        <button onClick={() => onDelete(role)} className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/50 shadow-sm transition-colors" title="Borrar Rol">
                            🗑️
                        </button>
                    </div>
                    <div className="flex justify-between items-start mb-4 pr-16">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 transition-colors">{role.name}</h3>
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs transition-colors">{role.id}</div>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 min-h-[40px] leading-relaxed transition-colors">{role.description || 'Sin descripción.'}</p>
                    <div className="space-y-2 border-t border-slate-100 pt-4">
                        <StaticPermission label="Ventas" active={role.can_view_ventas} />
                        <StaticPermission label="Compras" active={role.can_view_compras} />
                        <StaticPermission label="Producción" active={role.can_view_produccion} />
                        <StaticPermission label="Finanzas" active={role.can_view_finanzas} />
                        <StaticPermission label="Almacén" active={role.can_view_almacen} />
                        <StaticPermission label="Inventario" active={role.can_view_inventario} />
                        <StaticPermission label="Gestión USR" active={role.can_manage_users} />
                    </div>
                </div>
            ))}
        </div>
    );
}

function ModuleConfigTable({ settings, onToggle }) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors max-w-2xl">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Visibilidad de Módulos</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase font-black tracking-widest">Activa o desactiva el acceso global a cada herramienta</p>
            </div>
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 transition-colors">
                <thead className="bg-slate-50 dark:bg-slate-950/50 transition-colors">
                    <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Módulo</th>
                        <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado Global</th>
                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acción</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 transition-colors">
                    {settings.map(mod => (
                        <tr key={mod.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-6 py-4">
                                <span className="font-bold text-slate-800 dark:text-slate-200 transition-colors">{mod.name}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border transition-all ${mod.is_active ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50'}`}>
                                    {mod.is_active ? 'Visible' : 'Oculto'}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button
                                    onClick={() => onToggle(mod.name, mod.is_active)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-sm ${mod.is_active ? 'bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white'}`}
                                >
                                    {mod.is_active ? 'Desactivar' : 'Activar'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// UI Components
function Modal({ title, onClose, children }) {
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up transition-colors">
                <div className="bg-slate-800 dark:bg-slate-950 p-6 text-white flex justify-between items-center transition-colors">
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
            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 px-1 transition-colors">{label}</label>
            <input {...props} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:ring-indigo-500/40 outline-none transition" />
        </div>
    );
}

function PermissionCheck({ label, checked, onChange, name }) {
    return (
        <label className="flex items-center gap-2 cursor-pointer group">
            <input type="checkbox" name={name} checked={checked} onChange={onChange} className="w-4 h-4 rounded text-indigo-600 dark:text-indigo-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" />
            <span className={`text-xs font-bold transition-colors ${checked ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-400'}`}>{label}</span>
        </label>
    );
}

function StaticPermission({ label, active }) {
    return (
        <div className="flex justify-between items-center px-2">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 transition-colors">{label}</span>
            {active ? (
                <span className="text-[10px] font-black text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded uppercase transition-colors">Si</span>
            ) : (
                <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 px-2 py-0.5 rounded uppercase transition-colors">No</span>
            )}
        </div>
    );
}
