import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Users, Plus, Trash2, Edit, Filter, ChevronLeft, ChevronRight, 
  Info, Lock, Building2, Bookmark, CheckCircle2, AlertCircle
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { PageHeader } from '../components/common/PageHeader';
import { 
  fetchVacations, createVacation, updateVacation, deleteVacation, 
  fetchCompanies, fetchDepartments, fetchEmployees 
} from '../services/rrhhApi';

// Helpers to handle dates
const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

const getDayName = (year, month, day) => {
  const date = new Date(year, month, day);
  const days = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  return days[date.getDay()];
};

const isWeekend = (year, month, day) => {
  const date = new Date(year, month, day);
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday
};

const formatDateString = (year, month, day) => {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
};

const nameMap = {
  "jose.cespedes": "José Céspedes",
  "adrian.romero": "Adrián Romero",
  "antonio.macho": "Antonio Macho",
  "aaron.heredia": "Aarón Heredia",
  "juancarlos.benito": "Juan Carlos Benito",
  "juan.benito": "Juan Benito",
  "javier.allen": "Javier Allen",
  "jaime.cesteros": "Jaime Cesteros",
  "juancarlos.valdes": "Juan Carlos Valdés",
  "juan.valdes": "Juan Valdés",
  "andrei.minca": "Andrei Minca",
  "alberto.perez": "Alberto Pérez",
  "carlos.meza": "Carlos Meza",
  "antonio.fernandez": "Antonio Fernández",
  "juanjo.nuno": "Juanjo Nuño",
  "hector.massa": "Héctor Massa",
  "jorge.nieto": "Jorge Nieto",
  "elena.lozano": "Elena Lozano",
  "pao.tsai": "Pao Tsai",
  "carmen.martin": "Carmen Martín",
  "ana.querol": "Ana Querol",
  "marlene.barrientos": "Marlene Barrientos",
  "paula.albarran": "Paula Albarrán",
  "gabriela.briceno": "Gabriela Briceño",
  "alfredo.rubio": "Alfredo Rubio",
  "adrian.rubio": "Adrián Rubio",
  "robert.calderon": "Robert Calderón",
  "marivi.sanchez": "Mariví Sánchez",
  "sergio.martinez": "Sergio Martínez",
  "maria.romero": "María Romero",
  "angela.pardo": "Ángela Pardo",
  "joseluis.martin": "José Luis Martín",
  "josem.fernandez": "José Miguel Fernández",
  "sara": "Sara",
  "ismael.gutierrez": "Ismael Gutiérrez",
  "merce.arbona": "Merce Arbona",
  "jesus.collado": "Jesús Collado"
};

const formatUsername = (username) => {
  if (!username) return '';
  const key = username.toLowerCase();
  if (nameMap[key]) return nameMap[key];
  
  return username
    .split('.')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const VACATION_TYPES = [
  { value: 'Vacaciones', label: 'Vacaciones', colorClass: 'bg-emerald-500 text-white', borderClass: 'border-emerald-600', textClass: 'text-emerald-500' },
  { value: 'Baja', label: 'Baja Médica', colorClass: 'bg-rose-500 text-white', borderClass: 'border-rose-600', textClass: 'text-rose-500' },
  { value: 'Asuntos Propios', label: 'Asuntos Propios', colorClass: 'bg-amber-500 text-white', borderClass: 'border-amber-600', textClass: 'text-amber-500' }
];

export const RrhhDashboard = () => {
  const { user } = useAuthStore();
  const isHR = user?.permissions?.rrhh === true;
  
  // Current date view state
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  
  // Data lists
  const [vacations, setVacations] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  // Active filters
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  
  // Loading & UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [editingVacationId, setEditingVacationId] = useState(null);
  
  // Form states
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formType, setFormType] = useState('Vacaciones');
  const [formNotes, setFormNotes] = useState('');

  // Fetch filter metadata on mount
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [compList, deptList] = await Promise.all([
          fetchCompanies(),
          fetchDepartments()
        ]);
        setCompanies(compList);
        setDepartments(deptList);
        
        // Auto-select if non-HR
        if (!isHR && compList.length > 0) {
          setSelectedCompany(compList[0].id);
        }
        if (!isHR && deptList.length > 0) {
          setSelectedDepartment(deptList[0].id);
        }
      } catch (err) {
        console.error("Error loading RRHH metadata:", err);
      }
    };
    loadMetadata();
  }, [isHR]);

  // Fetch employees when company or department filters change
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const empList = await fetchEmployees(selectedCompany || null, selectedDepartment || null);
        setEmployees(empList);
      } catch (err) {
        console.error("Error loading employees:", err);
      }
    };
    loadEmployees();
  }, [selectedCompany, selectedDepartment]);

  // Main load vacations call
  const loadVacations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVacations({
        company_id: selectedCompany || null,
        department_id: selectedDepartment || null,
        user_id: selectedEmployee || null
      });
      setVacations(data);
    } catch (err) {
      console.error(err);
      setError("Error al cargar el calendario de vacaciones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVacations();
  }, [selectedCompany, selectedDepartment, selectedEmployee, currentYear, currentMonth]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  // Helper to check if a day falls within a vacation range
  const getVacationForDay = (userVacations, day) => {
    const checkDateStr = formatDateString(currentYear, currentMonth, day);
    const checkTime = new Date(checkDateStr).getTime();
    
    return userVacations.find(v => {
      // Clean dates to exclude hours for precise comparison
      const start = new Date(v.start_date.split('T')[0]).getTime();
      const end = new Date(v.end_date.split('T')[0]).getTime();
      return checkTime >= start && checkTime <= end;
    });
  };

  // Check if a vacation starts on a specific day
  const isVacationStart = (userVacations, day) => {
    const checkDateStr = formatDateString(currentYear, currentMonth, day);
    return userVacations.some(v => v.start_date.split('T')[0] === checkDateStr);
  };

  const handleCellClick = (empId, day, existingVacation) => {
    if (!isHR) return;
    
    if (existingVacation) {
      // Edit mode
      setModalMode('edit');
      setEditingVacationId(existingVacation.id);
      setFormEmployeeId(existingVacation.user_id);
      setFormStartDate(existingVacation.start_date.split('T')[0]);
      setFormEndDate(existingVacation.end_date.split('T')[0]);
      setFormType(existingVacation.type);
      setFormNotes(existingVacation.notes || '');
      setIsModalOpen(true);
    } else {
      // Create mode
      const selectedDateStr = formatDateString(currentYear, currentMonth, day);
      setModalMode('create');
      setFormEmployeeId(empId);
      setFormStartDate(selectedDateStr);
      setFormEndDate(selectedDateStr);
      setFormType('Vacaciones');
      setFormNotes('');
      setIsModalOpen(true);
    }
  };

  const handleOpenCreateModal = () => {
    if (!isHR) return;
    setModalMode('create');
    setFormEmployeeId(employees[0]?.id || '');
    setFormStartDate(formatDateString(currentYear, currentMonth, 1));
    setFormEndDate(formatDateString(currentYear, currentMonth, 1));
    setFormType('Vacaciones');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVacationId(null);
  };

  const showToast = (message) => {
    setSuccessMsg(message);
    setTimeout(() => {
      setSuccessMsg(null);
    }, 4000);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formEmployeeId || !formStartDate || !formEndDate) {
      alert("Por favor rellene todos los campos obligatorios.");
      return;
    }

    if (new Date(formStartDate) > new Date(formEndDate)) {
      alert("La fecha de inicio no puede ser posterior a la fecha de fin.");
      return;
    }

    const payload = {
      user_id: parseInt(formEmployeeId),
      start_date: new Date(formStartDate).toISOString(),
      end_date: new Date(formEndDate).toISOString(),
      type: formType,
      notes: formNotes
    };

    try {
      if (modalMode === 'create') {
        await createVacation(payload);
        showToast("Vacaciones registradas con éxito.");
      } else {
        await updateVacation(editingVacationId, payload);
        showToast("Registro actualizado correctamente.");
      }
      setIsModalOpen(false);
      loadVacations();
    } catch (err) {
      console.error(err);
      alert("Error al guardar la información. Compruebe los permisos o rango.");
    }
  };

  const handleDeleteVacation = async () => {
    if (!editingVacationId) return;
    if (!window.confirm("¿Está seguro de que desea eliminar este registro de vacaciones?")) return;

    try {
      await deleteVacation(editingVacationId);
      showToast("Registro eliminado con éxito.");
      setIsModalOpen(false);
      loadVacations();
    } catch (err) {
      console.error(err);
      alert("Error al eliminar el registro.");
    }
  };

  return (
    <div className="flex flex-col gap-6 min-h-screen text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <PageHeader 
        moduleName="Recursos Humanos" 
        showBackMenu={false}
        showRefresh={false}
      />

      {/* Success Toast */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-emerald-500 text-white rounded-xl shadow-lg animate-fade-in-down border border-emerald-400">
          <CheckCircle2 size={20} />
          <span className="text-sm font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Top Controls & Filters */}
      <div className="flex flex-col gap-4 p-5 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Calendar size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Ausencias y Vacaciones</h4>
              <p className="text-xs text-slate-500">Calendario interactivo del equipo</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrevMonth}
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-bold min-w-[140px] text-center">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button 
              onClick={handleNextMonth}
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
            <button 
              onClick={handleToday}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 transition-colors"
            >
              Hoy
            </button>
            
            {isHR && (
              <button 
                onClick={handleOpenCreateModal}
                className="ml-2 flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-500/10 hover:shadow-indigo-500/20"
              >
                <Plus size={14} /> Registrar Ausencia
              </button>
            )}
          </div>
        </div>

        {/* Filter Inputs Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Building2 size={12} /> Empresa
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => {
                setSelectedCompany(e.target.value);
                setSelectedEmployee('');
              }}
              disabled={!isHR}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
            >
              {isHR && <option value="">Todas las empresas</option>}
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Users size={12} /> Departamento
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setSelectedEmployee('');
              }}
              disabled={!isHR}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
            >
              {isHR && <option value="">Todos los departamentos</option>}
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Users size={12} /> Empleado
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">Todos los empleados</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{formatUsername(e.username)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="flex items-center justify-center p-20 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-100 dark:border-slate-800/80">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-100 dark:border-slate-800/80 gap-3">
          <Users size={40} className="text-slate-400" />
          <h3 className="text-sm font-bold text-slate-500">No se encontraron empleados</h3>
          <p className="text-xs text-slate-400">Verifique los filtros seleccionados o añada nuevos empleados al sistema.</p>
        </div>
      ) : (
        <div className="flex flex-col bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm overflow-hidden">
          {/* Scrollable Container */}
          <div className="overflow-x-auto w-full">
            <div className="min-w-[900px] divide-y divide-slate-100 dark:divide-slate-800/80">
              
              {/* Header Days Row */}
              <div className="flex items-stretch bg-slate-50 dark:bg-slate-850/50">
                {/* User column spacer */}
                <div className="w-56 flex-shrink-0 p-3 text-xs font-bold text-slate-500 border-r border-slate-150 dark:border-slate-800 flex items-center gap-1.5">
                  <Users size={14} /> Empleado
                </div>
                
                {/* Days column */}
                <div className="flex flex-grow justify-between">
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const weekend = isWeekend(currentYear, currentMonth, day);
                    const dayName = getDayName(currentYear, currentMonth, day);
                    return (
                      <div 
                        key={day} 
                        className={`flex-grow flex flex-col items-center justify-center p-1.5 text-center border-r border-slate-100 dark:border-slate-800/40 text-[10px] font-bold ${
                          weekend ? 'bg-slate-100/70 dark:bg-slate-800/50 text-slate-400' : 'text-slate-500 dark:text-slate-400'
                        }`}
                        style={{ width: `${100 / daysInMonth}%` }}
                      >
                        <span className="opacity-60">{dayName}</span>
                        <span className="text-xs mt-0.5">{day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Employee Rows */}
              {employees.map(emp => {
                const empVacations = vacations.filter(v => v.user_id === emp.id);
                return (
                  <div key={emp.id} className="flex items-stretch hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    {/* Employee Profile Cell */}
                    <div className="w-56 flex-shrink-0 p-3 border-r border-slate-150 dark:border-slate-800 flex flex-col justify-center gap-0.5">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {formatUsername(emp.username)}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">
                        ID: {emp.id}
                      </span>
                    </div>

                    {/* Timeline Cell */}
                    <div className="flex flex-grow justify-between relative">
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const weekend = isWeekend(currentYear, currentMonth, day);
                        const dayVacation = getVacationForDay(empVacations, day);
                        const isStart = dayVacation && isVacationStart([dayVacation], day);
                        
                        // Select color scheme
                        let cellClass = '';
                        if (dayVacation) {
                          const matchType = VACATION_TYPES.find(t => t.value === dayVacation.type);
                          cellClass = matchType ? matchType.colorClass : 'bg-indigo-500 text-white';
                        } else if (weekend) {
                          cellClass = 'bg-slate-50/60 dark:bg-slate-800/30';
                        }

                        return (
                          <div 
                            key={day}
                            onClick={() => handleCellClick(emp.id, day, dayVacation)}
                            className={`flex-grow border-r border-slate-100 dark:border-slate-800/30 min-h-[48px] relative group flex items-center justify-center transition-all ${cellClass} ${
                              isHR ? 'cursor-pointer hover:brightness-95 hover:scale-[0.98]' : ''
                            }`}
                            style={{ width: `${100 / daysInMonth}%` }}
                          >
                            {dayVacation && isStart && (
                              <div className="absolute left-1 right-1 text-[9px] font-extrabold truncate select-none text-center pointer-events-none drop-shadow-sm">
                                {dayVacation.notes || dayVacation.type}
                              </div>
                            )}

                            {/* Cell Info Tooltip */}
                            {dayVacation && (
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:flex flex-col bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-xl z-10 w-44 pointer-events-none gap-0.5">
                                <p className="font-bold flex items-center gap-1">
                                  <Bookmark size={10} className="text-indigo-400" /> {dayVacation.type}
                                </p>
                                <p className="opacity-80">
                                  {new Date(dayVacation.start_date).toLocaleDateString('es-ES')} al {new Date(dayVacation.end_date).toLocaleDateString('es-ES')}
                                </p>
                                {dayVacation.notes && (
                                  <p className="border-t border-slate-700 mt-1 pt-1 italic text-slate-300">
                                    "{dayVacation.notes}"
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

            </div>
          </div>

          {/* Footer Legend */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-850/50 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
              <span className="text-slate-400 flex items-center gap-1.5"><Info size={14} /> Código de colores:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-emerald-500"></span>
                <span>Vacaciones</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-rose-500"></span>
                <span>Baja Médica</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-amber-500"></span>
                <span>Asuntos Propios</span>
              </div>
            </div>

            {!isHR && (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                <Lock size={12} /> Calendario en modo de sólo lectura para tu departamento
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vacation CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 max-w-md w-full shadow-2xl overflow-hidden animate-scale-up">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-850/50 flex items-center justify-between">
              <h3 className="text-sm font-extrabold flex items-center gap-2">
                <Calendar size={18} className="text-indigo-500" />
                {modalMode === 'create' ? 'Registrar Ausencia / Vacaciones' : 'Editar Ausencia'}
              </h3>
              {!isHR && <Lock size={14} className="text-slate-400" />}
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-400 uppercase tracking-wider">Empleado</label>
                <select
                  value={formEmployeeId}
                  onChange={(e) => setFormEmployeeId(e.target.value)}
                  disabled={modalMode === 'edit' || !isHR}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{formatUsername(e.username)}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider">Fecha Inicio</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    disabled={!isHR}
                    required
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider">Fecha Fin</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    disabled={!isHR}
                    required
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-400 uppercase tracking-wider">Tipo de Ausencia</label>
                <div className="grid grid-cols-3 gap-2">
                  {VACATION_TYPES.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      disabled={!isHR}
                      onClick={() => setFormType(type.value)}
                      className={`py-2 rounded-xl text-center border font-bold transition-all ${
                        formType === type.value
                          ? `${type.colorClass} ${type.borderClass} shadow-sm shadow-indigo-500/10`
                          : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-400 uppercase tracking-wider">Notas / Observaciones</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  disabled={!isHR}
                  placeholder="Ej: Vacaciones de verano aprobadas..."
                  rows={3}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 resize-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                {modalMode === 'edit' && isHR ? (
                  <button
                    type="button"
                    onClick={handleDeleteVacation}
                    className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold transition-colors"
                  >
                    <Trash2 size={14} /> Eliminar
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl font-bold transition-colors"
                  >
                    Cerrar
                  </button>
                  {isHR && (
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all"
                    >
                      Guardar
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
