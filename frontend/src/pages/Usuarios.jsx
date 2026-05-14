import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { 
    fetchUsers, createUser, updateUser, deleteUser, 
    fetchDepartments, fetchDivisions, fetchPositions, 
    createDepartment, createDivision, createPosition,
    fetchFilterOptions
} from '../services/api';
import configApi from '../services/configApi';
import { Users, Building2, Briefcase, Settings, Plus, Trash2, Edit2, Lock, Unlock, Shield } from 'lucide-react';

export default function Usuarios() {
    const [activeTab, setActiveTab] = useState('usuarios');
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [positions, setPositions] = useState([]);
    const [filterOptions, setFilterOptions] = useState([]);
    const [moduleSettings, setModuleSettings] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');

    // Modals
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form States
    const [userFormData, setUserFormData] = useState({
        username: '',
        email: '',
        password: '',
        department_id: '',
        division_id: '',
        position_id: '',
        sales_rep_id: '',
        user_type: 'CENVAL',
        data_filters: '',
        is_active: true,
        must_change_password: false
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [usersData, deptsData, divsData, posData, filtersData] = await Promise.all([
                fetchUsers(),
                fetchDepartments(),
                fetchDivisions(),
                fetchPositions(),
                fetchFilterOptions()
            ]);
            setUsers(usersData);
            setDepartments(deptsData);
            setDivisions(divsData);
            setPositions(posData);
            setFilterOptions(filtersData.reps || []);

            try {
                const modulesData = await configApi.getModules();
                setModuleSettings(modulesData);
            } catch (modErr) {
                console.warn("Módulos no disponibles");
            }
        } catch (err) {
            setError("Error al cargar datos organizativos.");
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

    const handleSaveUser = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...userFormData };
            // Cleanup IDs
            payload.department_id = payload.department_id ? parseInt(payload.department_id) : null;
            payload.division_id = payload.division_id ? parseInt(payload.division_id) : null;
            payload.position_id = payload.position_id ? parseInt(payload.position_id) : null;
            
            if (!payload.password && isEditMode) delete payload.password;

            if (isEditMode) {
                await updateUser(editingId, payload);
                setSuccessMsg("Usuario actualizado.");
            } else {
                await createUser(payload);
                setSuccessMsg("Usuario creado.");
            }
            setIsUserModalOpen(false);
            loadData();
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || "Error al guardar usuario.");
        }
    };

    const handleEditUser = (user) => {
        setIsEditMode(true);
        setEditingId(user.id);
        setUserFormData({
            username: user.username,
            email: user.email,
            password: '',
            department_id: user.department_id || '',
            division_id: user.division_id || '',
            position_id: user.position_id || '',
            sales_rep_id: user.sales_rep_id || '',
            user_type: user.user_type || 'CENVAL',
            data_filters: user.data_filters || '',
            is_active: user.is_active,
            must_change_password: user.must_change_password || false
        });
        setIsUserModalOpen(true);
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("¿Eliminar usuario?")) return;
        try {
            await deleteUser(id);
            loadData();
        } catch (err) {
            setError("No se pudo eliminar.");
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader moduleName="Gestión de Personal" showRefresh={false}>
                <button
                    onClick={() => { setIsEditMode(false); setIsUserModalOpen(true); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                >
                    <Plus size={18} />
                    Añadir Trabajador
                </button>
            </PageHeader>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-white dark:bg-slate-900 rounded-2xl w-fit border border-slate-200 dark:border-slate-800">
                <TabButton active={activeTab === 'usuarios'} onClick={() => setActiveTab('usuarios')} icon={<Users size={16} />} label="Plantilla" />
                <TabButton active={activeTab === 'estructura'} onClick={() => setActiveTab('estructura')} icon={<Building2 size={16} />} label="Estructura" />
                <TabButton active={activeTab === 'config'} onClick={() => setActiveTab('config')} icon={<Settings size={16} />} label="Configuración" />
            </div>

            {successMsg && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800 flex items-center gap-2 text-sm font-bold">
                    <Shield size={16} /> {successMsg}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                </div>
            ) : activeTab === 'usuarios' ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trabajador</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Departamento / División</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Puesto</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 dark:text-white">{u.username}</span>
                                            <span className="text-xs text-slate-500">{u.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 rounded-md w-fit">
                                                {u.department?.name || 'S/D'}
                                            </span>
                                            {u.division && (
                                                <span className="text-[10px] font-medium text-slate-500 ml-1">
                                                    ↳ {u.division.name}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            {u.position?.name || 'Sin Puesto'}
                                            {u.position?.is_responsable && (
                                                <span className="ml-2 text-[9px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-black uppercase">Responsable</span>
                                            )}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${u.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                            {u.is_active ? 'Activo' : 'Baja'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEditUser(u)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : activeTab === 'estructura' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <EstructuraCard title="Departamentos" items={departments} icon={<Building2 />} />
                    <EstructuraCard title="Divisiones" items={divisions} icon={<Briefcase />} />
                    <EstructuraCard title="Puestos" items={positions} icon={<Shield />} showPermissions />
                </div>
            ) : (
                <div className="max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Settings size={20} className="text-blue-500" /> Ajustes Globales
                    </h3>
                    <div className="space-y-4">
                        {moduleSettings.map(mod => (
                            <div key={mod.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <div>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{mod.name}</span>
                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">Control de acceso global</p>
                                </div>
                                <button className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${mod.is_active ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                                    {mod.is_active ? 'Activo' : 'Oculto'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal de Usuario */}
            {isUserModalOpen && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-slate-800">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                    {isEditMode ? 'Editar Perfil' : 'Alta de Personal'}
                                </h2>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Configuración de acceso y jerarquía</p>
                            </div>
                            <button onClick={() => setIsUserModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                <Plus size={24} className="rotate-45 text-slate-400" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSaveUser} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre de Usuario</label>
                                    <input name="username" value={userFormData.username} onChange={handleUserInputChange} required className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all" placeholder="nombre.apellido" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
                                    <input type="password" name="password" value={userFormData.password} onChange={handleUserInputChange} required={!isEditMode} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all" placeholder={isEditMode ? "********" : "Cenvalsa"} />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                                <input type="email" name="email" value={userFormData.email} onChange={handleUserInputChange} required className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all" placeholder="usuario@cenvalsa.com" />
                            </div>

                            <div className="grid grid-cols-3 gap-4 p-6 bg-slate-50 dark:bg-slate-950/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Departamento</label>
                                    <select name="department_id" value={userFormData.department_id} onChange={handleUserInputChange} className="w-full bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer">
                                        <option value="">Seleccionar...</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">División</label>
                                    <select name="division_id" value={userFormData.division_id} onChange={handleUserInputChange} className="w-full bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer">
                                        <option value="">Ninguna...</option>
                                        {divisions.filter(d => d.department_id === parseInt(userFormData.department_id)).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Puesto</label>
                                    <select name="position_id" value={userFormData.position_id} onChange={handleUserInputChange} className="w-full bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer">
                                        <option value="">Seleccionar...</option>
                                        {positions.filter(p => p.department_id === parseInt(userFormData.department_id)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ID Sage (Comisionista)</label>
                                    <select name="sales_rep_id" value={userFormData.sales_rep_id} onChange={handleUserInputChange} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer">
                                        <option value="">Vincular a Sage...</option>
                                        {filterOptions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Usuario</label>
                                    <select name="user_type" value={userFormData.user_type} onChange={handleUserInputChange} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer">
                                        <option value="CENVAL">CENVAL (Interno)</option>
                                        <option value="DISTRIBUIDOR">DISTRIBUIDOR</option>
                                        <option value="SOCIO">SOCIO</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-10 h-6 rounded-full transition-all relative ${userFormData.is_active ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${userFormData.is_active ? 'left-5' : 'left-1'}`} />
                                    </div>
                                    <input type="checkbox" name="is_active" checked={userFormData.is_active} onChange={handleUserInputChange} className="hidden" />
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Cuenta Activa</span>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-10 h-6 rounded-full transition-all relative ${userFormData.must_change_password ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${userFormData.must_change_password ? 'left-5' : 'left-1'}`} />
                                    </div>
                                    <input type="checkbox" name="must_change_password" checked={userFormData.must_change_password} onChange={handleUserInputChange} className="hidden" />
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Reset de Contraseña</span>
                                </label>
                            </div>

                            <div className="pt-4">
                                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-[20px] shadow-xl shadow-blue-500/30 transition-all uppercase tracking-widest text-sm">
                                    {isEditMode ? 'Actualizar Trabajador' : 'Confirmar Alta'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function TabButton({ active, onClick, icon, label }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${active ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
        >
            {icon} {label}
        </button>
    );
}

function EstructuraCard({ title, items, icon, showPermissions }) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-xl">
                    {icon}
                </div>
                <h3 className="font-black uppercase tracking-tighter text-slate-900 dark:text-white">{title}</h3>
            </div>
            <div className="space-y-2">
                {items.length === 0 && <p className="text-xs text-slate-400 italic">No hay datos.</p>}
                {items.map(item => (
                    <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">#{item.id}</span>
                        </div>
                        {showPermissions && (
                            <div className="flex flex-wrap gap-1">
                                {item.can_view_ventas && <PermissionBadge label="Ventas" />}
                                {item.can_view_compras && <PermissionBadge label="Compras" />}
                                {item.can_view_produccion && <PermissionBadge label="Prod" />}
                                {item.can_view_finanzas && <PermissionBadge label="Fin" />}
                                {item.can_view_almacen && <PermissionBadge label="Alm" />}
                                {item.can_view_inventario && <PermissionBadge label="Inv" />}
                                {item.can_manage_users && <PermissionBadge label="Admin" color="red" />}
                                {item.is_responsable && <PermissionBadge label="Resp" color="orange" />}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function PermissionBadge({ label, color = 'blue' }) {
    const colors = {
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
        orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
    };
    return (
        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${colors[color] || colors.blue}`}>
            {label}
        </span>
    );
}
