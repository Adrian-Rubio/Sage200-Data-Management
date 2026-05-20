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

// Count working days (Mon-Fri) between two ISO date strings (inclusive)
const countWorkingDays = (startIso, endIso) => {
  const start = new Date(startIso.split('T')[0]);
  const end   = new Date(endIso.split('T')[0]);
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

// Compute Asuntos Propios minutes used for an employee in a given year
// Uses duration_minutes from the record if available, falls back to working days * 8h * 60min
const computeAPMinutes = (empVacations, year) => {
  return empVacations
    .filter(v => v.type === 'Asuntos Propios' && new Date(v.start_date).getFullYear() === year)
    .reduce((sum, v) => {
      if (v.duration_minutes != null) return sum + v.duration_minutes;
      return sum + countWorkingDays(v.start_date, v.end_date) * 8 * 60;
    }, 0);
};

// Compute vacation days used for an employee in a given year
const computeVacationDays = (empVacations, year) => {
  return empVacations
    .filter(v => v.type === 'Vacaciones' && new Date(v.start_date).getFullYear() === year)
    .reduce((sum, v) => sum + countWorkingDays(v.start_date, v.end_date), 0);
};

// Vacation day limits per company (matching by name)
const getVacationLimit = (companyName) => {
  if (!companyName) return 23;
  const name = companyName.toUpperCase();
  if (name.includes('INDUSTRIAL')) return 22;
  return 23; // CENVAL and SARATUR
};

// Format minutes as "Xh Ym"
const formatMinutes = (totalMinutes) => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
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
  { value: 'Baja', label: 'Ausencia', colorClass: 'bg-rose-500 text-white', borderClass: 'border-rose-600', textClass: 'text-rose-500' },
  { value: 'Asuntos Propios', label: 'Asuntos Propios', colorClass: 'bg-amber-500 text-white', borderClass: 'border-amber-600', textClass: 'text-amber-500' }
];

const EMPLOYEE_COLORS = [
  { bg: 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-900/40', dot: 'bg-indigo-500', name: 'Indigo' },
  { bg: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/40', dot: 'bg-emerald-500', name: 'Esmeralda' },
  { bg: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/40', dot: 'bg-amber-500', name: 'Ámbar' },
  { bg: 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/40', dot: 'bg-rose-500', name: 'Rosa' },
  { bg: 'bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/50 dark:border-sky-900/40', dot: 'bg-sky-500', name: 'Cielo' },
  { bg: 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-900/40', dot: 'bg-purple-500', name: 'Púrpura' },
  { bg: 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200/50 dark:border-orange-900/40', dot: 'bg-orange-500', name: 'Naranja' },
  { bg: 'bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/50 dark:border-teal-900/40', dot: 'bg-teal-500', name: 'Teal' },
  { bg: 'bg-fuchsia-100 dark:bg-fuchsia-950/40 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-200/50 dark:border-fuchsia-900/40', dot: 'bg-fuchsia-500', name: 'Fucsia' },
  { bg: 'bg-pink-100 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border border-pink-200/50 dark:border-pink-900/40', dot: 'bg-pink-500', name: 'Pink' }
];

const getMonthDays = (year, monthIndex) => {
  const firstDay = new Date(year, monthIndex, 1);
  let startOffset = firstDay.getDay();
  startOffset = startOffset === 0 ? 6 : startOffset - 1; // Lunes = 0, Domingo = 6
  
  const totalDays = new Date(year, monthIndex + 1, 0).getDate();
  
  const days = [];
  // Celdas vacías de inicio
  for (let i = 0; i < startOffset; i++) {
    days.push({ day: null, dateStr: null });
  }
  // Días del mes
  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ day: d, dateStr });
  }
  return days;
};

export const RrhhDashboard = () => {
  const { user } = useAuthStore();
  const isHR = user?.permissions?.rrhh === true;
  
  // Current date view state
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [viewMode, setViewMode] = useState(isHR ? 'gantt' : 'calendar'); // 'gantt' or 'calendar' for regular employees
  
  // Data lists
  const [vacations, setVacations] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  // Active filters
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedType, setSelectedType] = useState('');  // nuevo: filtro por tipo
  
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
  const [formAPHours, setFormAPHours] = useState(0);     // solo para Asuntos Propios
  const [formAPMinutes, setFormAPMinutes] = useState(0); // solo para Asuntos Propios

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

  // Check if a vacation starts on a specific day (considering visible work days)
  const isVacationStart = (userVacations, day) => {
    const checkDateStr = formatDateString(currentYear, currentMonth, day);
    return userVacations.some(v => v.start_date.split('T')[0] === checkDateStr);
  };

  // Check if a vacation ends on a specific day
  const isVacationEnd = (userVacations, day) => {
    const checkDateStr = formatDateString(currentYear, currentMonth, day);
    return userVacations.some(v => v.end_date.split('T')[0] === checkDateStr);
  };

  // Check if this is the first visible (non-weekend) day of a block
  const isFirstVisibleDay = (vacation, day) => {
    // Walk backwards to see if previous workday is also covered
    let prev = day - 1;
    while (prev >= 1 && isWeekend(currentYear, currentMonth, prev)) prev--;
    if (prev < 1) return true;
    const prevStr = formatDateString(currentYear, currentMonth, prev);
    const start = new Date(vacation.start_date.split('T')[0]).getTime();
    return new Date(prevStr).getTime() < start;
  };

  // Check if this is the last visible (non-weekend) day of a block
  const isLastVisibleDay = (vacation, day) => {
    let next = day + 1;
    while (next <= daysInMonth && isWeekend(currentYear, currentMonth, next)) next++;
    if (next > daysInMonth) return true;
    const nextStr = formatDateString(currentYear, currentMonth, next);
    const end = new Date(vacation.end_date.split('T')[0]).getTime();
    return new Date(nextStr).getTime() > end;
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
      if (existingVacation.type === 'Asuntos Propios' && existingVacation.duration_minutes != null) {
        setFormAPHours(Math.floor(existingVacation.duration_minutes / 60));
        setFormAPMinutes(existingVacation.duration_minutes % 60);
      } else {
        setFormAPHours(0);
        setFormAPMinutes(0);
      }
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
      setFormAPHours(0);
      setFormAPMinutes(0);
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
    setFormAPHours(0);
    setFormAPMinutes(0);
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

    const totalMinutes = formType === 'Asuntos Propios'
      ? (parseInt(formAPHours) || 0) * 60 + (parseInt(formAPMinutes) || 0)
      : null;

    if (formType === 'Asuntos Propios' && (!totalMinutes || totalMinutes <= 0)) {
      alert("Indique la duración en horas y minutos para Asuntos Propios.");
      return;
    }

    const payload = {
      user_id: parseInt(formEmployeeId),
      start_date: new Date(formStartDate).toISOString(),
      end_date: new Date(formEndDate).toISOString(),
      type: formType,
      notes: formNotes,
      duration_minutes: totalMinutes
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
              <p className="text-xs text-slate-500">
                Calendario interactivo del equipo de {user?.division || user?.department || 'la empresa'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Vista (Only visible to HR managers / admins) */}
            {isHR && (
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 mr-2">
                <button
                  onClick={() => setViewMode('gantt')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'gantt'
                      ? 'bg-white dark:bg-slate-900 shadow-sm text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Cronograma
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'calendar'
                      ? 'bg-white dark:bg-slate-900 shadow-sm text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Calendario Anual
                </button>
              </div>
            )}

            {viewMode === 'gantt' ? (
              <>
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
              </>
            ) : (
              <>
                <button 
                  onClick={() => setCurrentYear(currentYear - 1)}
                  className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-bold min-w-[100px] text-center">
                  Año {currentYear}
                </span>
                <button 
                  onClick={() => setCurrentYear(currentYear + 1)}
                  className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}

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

        {/* Filter Inputs Row (Only visible to HR managers / admins) */}
        {isHR && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
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

            {/* Tipo de ausencia filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Filter size={12} /> Tipo
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">Todos los tipos</option>
                {VACATION_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
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
      ) : viewMode === 'gantt' ? (
        <div className="flex flex-col bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm overflow-hidden">
          {/* Scrollable Container — overflow-visible para que los tooltips no se corten */}
          <div className="overflow-x-auto w-full">
            <div className="divide-y divide-slate-100/60 dark:divide-slate-800/40">

              {/* Header Days Row */}
              <div className="flex items-stretch bg-slate-50 dark:bg-slate-850/50">
                {/* User column spacer */}
                <div className="w-56 flex-shrink-0 p-3 text-xs font-bold text-slate-500 border-r border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                  <Users size={14} /> Empleado
                </div>

                {/* Days column — solo días laborables */}
                <div className="flex flex-grow">
                  {Array.from({ length: daysInMonth })
                    .map((_, i) => i + 1)
                    .filter(day => !isWeekend(currentYear, currentMonth, day))
                    .map(day => {
                      const dayName = getDayName(currentYear, currentMonth, day);
                      return (
                        <div
                          key={day}
                          className="flex-1 flex flex-col items-center justify-center p-1.5 text-center border-r border-slate-100 dark:border-slate-800/40 text-[10px] font-bold text-slate-500 dark:text-slate-400"
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
                const allEmpVacations = vacations.filter(v => v.user_id === emp.id);
                // Aplicar filtro de tipo en cliente
                const empVacations = selectedType
                  ? allEmpVacations.filter(v => v.type === selectedType)
                  : allEmpVacations;

                // AP counter (in minutes, limit = 480 = 8h)
                const apMinutesUsed = computeAPMinutes(allEmpVacations, currentYear);
                const apLimit = 480;
                const apPct = Math.min((apMinutesUsed / apLimit) * 100, 100);
                const apColor = apMinutesUsed > apLimit ? 'bg-rose-500' : apMinutesUsed === apLimit ? 'bg-amber-500' : 'bg-emerald-500';

                // Vacation days counter
                const vacDaysUsed = computeVacationDays(allEmpVacations, currentYear);
                const empCompany = companies.find(c => c.id === emp.company_id);
                const vacLimit = getVacationLimit(empCompany?.name);
                const vacPct = Math.min((vacDaysUsed / vacLimit) * 100, 100);
                const vacColor = vacDaysUsed > vacLimit ? 'bg-rose-500' : vacDaysUsed >= vacLimit ? 'bg-amber-500' : 'bg-indigo-500';

                return (
                  <div key={emp.id} className="flex items-center hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group/row">
                    {/* Employee Profile Cell */}
                    <div className="w-56 flex-shrink-0 px-4 py-3 border-r border-slate-100 dark:border-slate-800/60 flex flex-col justify-center gap-1.5">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {formatUsername(emp.username)}
                      </span>
                      {/* Contador Asuntos Propios */}
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center justify-between text-[9px] font-semibold text-slate-400 uppercase tracking-wide">
                          <span>A. Propios</span>
                          <span className={apMinutesUsed > apLimit ? 'text-rose-500 font-bold' : ''}>
                            {formatMinutes(apMinutesUsed)} / 8h
                          </span>
                        </div>
                        <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${apColor}`} style={{ width: `${apPct}%` }} />
                        </div>
                      </div>
                      {/* Contador Días Vacaciones */}
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center justify-between text-[9px] font-semibold text-slate-400 uppercase tracking-wide">
                          <span>Vacaciones</span>
                          <span className={vacDaysUsed > vacLimit ? 'text-rose-500 font-bold' : ''}>
                            {vacDaysUsed}d / {vacLimit}d
                          </span>
                        </div>
                        <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${vacColor}`} style={{ width: `${vacPct}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Timeline Cell — solo días laborables */}
                    <div className="flex flex-grow py-2 px-0.5 gap-px">
                      {Array.from({ length: daysInMonth })
                        .map((_, i) => i + 1)
                        .filter(day => !isWeekend(currentYear, currentMonth, day))
                        .map(day => {
                          const dayVacation = getVacationForDay(empVacations, day);
                          const firstVisible = dayVacation && isFirstVisibleDay(dayVacation, day);
                          const lastVisible  = dayVacation && isLastVisibleDay(dayVacation, day);

                          const baseColor = dayVacation
                            ? (VACATION_TYPES.find(t => t.value === dayVacation.type)?.colorClass || 'bg-indigo-500')
                            : '';

                          const roundedClass = dayVacation
                            ? `${firstVisible ? 'rounded-l-lg ml-0.5' : ''} ${lastVisible ? 'rounded-r-lg mr-0.5' : ''}`
                            : 'rounded-sm';

                          return (
                            <div
                              key={day}
                              onClick={() => handleCellClick(emp.id, day, dayVacation)}
                              className={`flex-1 min-h-[44px] relative group flex items-center justify-center transition-all duration-150
                                ${baseColor} ${roundedClass}
                                ${!dayVacation ? 'border-r border-slate-100/60 dark:border-slate-800/20' : ''}
                                ${isHR ? 'cursor-pointer' : ''}
                                ${dayVacation && isHR ? 'hover:brightness-90 hover:shadow-md' : ''}
                              `}
                            >
                              {/* Tooltip — aparece solo en hover */}
                              {dayVacation && (
                                <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col
                                  bg-slate-900/95 backdrop-blur-sm text-white text-[11px] px-3 py-2.5 rounded-xl
                                  shadow-2xl z-50 w-48 pointer-events-none gap-1 border border-slate-700/50">
                                  {/* Indicador de tipo */}
                                  <div className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md w-fit
                                    ${VACATION_TYPES.find(t => t.value === dayVacation.type)?.colorClass || 'bg-indigo-500 text-white'}`}>
                                    {dayVacation.type}
                                  </div>
                                  <p className="font-semibold text-slate-200 mt-0.5">
                                    {formatUsername(emp.username)}
                                  </p>
                                  <p className="text-slate-400 text-[10px]">
                                    {new Date(dayVacation.start_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                    {' → '}
                                    {new Date(dayVacation.end_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                  </p>
                                  {dayVacation.notes && (
                                    <p className="border-t border-slate-700/60 mt-1 pt-1 italic text-slate-400 text-[10px] leading-relaxed">
                                      {dayVacation.notes}
                                    </p>
                                  )}
                                  {/* Arrow */}
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900/95 border-r border-b border-slate-700/50 rotate-45 -mt-1" />
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
                <span>Ausencia</span>
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
      ) : (
        /* Calendario Anual de Vacaciones y Ausencias */
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {monthNames.map((monthName, monthIndex) => {
              const monthDays = getMonthDays(currentYear, monthIndex);
              
              // Custom colors for month headers matching beautiful and friendly style
              const monthHeaderColors = [
                'bg-sky-500 text-white',      // Enero
                'bg-teal-500 text-white',     // Febrero
                'bg-emerald-500 text-white',  // Marzo
                'bg-lime-500 text-slate-900',  // Abril
                'bg-green-600 text-white',    // Mayo
                'bg-amber-400 text-slate-900', // Junio
                'bg-orange-500 text-white',   // Julio
                'bg-red-500 text-white',      // Agosto
                'bg-yellow-500 text-slate-900', // Septiembre
                'bg-amber-600 text-white',    // Octubre
                'bg-orange-600 text-white',   // Noviembre
                'bg-cyan-500 text-white'      // Diciembre
              ];
              
              return (
                <div key={monthIndex} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                   {/* Month Name Header */}
                   <div className={`px-3 py-1.5 text-center font-bold text-xs tracking-wide ${monthHeaderColors[monthIndex]}`}>
                    {monthName}
                  </div>
                  
                  {/* Weekdays header */}
                  <div className="grid grid-cols-7 text-center bg-slate-50 dark:bg-slate-850/50 py-1 border-b border-slate-100 dark:border-slate-800 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <span>L</span>
                    <span>M</span>
                    <span>X</span>
                    <span>J</span>
                    <span>V</span>
                    <span>S</span>
                    <span>D</span>
                  </div>
                  
                  {/* Days grid */}
                  <div className="grid grid-cols-7 gap-0.5 p-1.5 flex-grow">
                    {monthDays.map((cell, cellIdx) => {
                      if (!cell.day) {
                        return <div key={`empty-${cellIdx}`} className="aspect-square" />;
                      }
                      
                      const dateStr = cell.dateStr;
                      
                      // Filter employee vacations active on this day
                      const dayAbsences = vacations.filter(v => {
                        if (selectedEmployee && v.user_id !== parseInt(selectedEmployee)) return false;
                        if (selectedType && v.type !== selectedType) return false;
                        
                        return dateStr >= v.start_date && dateStr <= v.end_date;
                      });
                      
                      let cellClass = 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300';
                      
                      const getEmployeeColor = (empId) => {
                        const idx = employees.findIndex(e => e.id === empId);
                        if (idx === -1) return EMPLOYEE_COLORS[0];
                        return EMPLOYEE_COLORS[idx % EMPLOYEE_COLORS.length];
                      };
                      
                      if (dayAbsences.length === 1) {
                        const empColor = getEmployeeColor(dayAbsences[0].user_id);
                        cellClass = empColor.bg;
                      } else if (dayAbsences.length > 1) {
                        // Multiple absences on the same day: Neutral colored background and dots inside cell
                        cellClass = 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700';
                      }
                      
                      // Check if weekend
                      const isCellWeekend = isWeekend(currentYear, monthIndex, cell.day);
                      const weekendClass = isCellWeekend && dayAbsences.length === 0 ? 'text-slate-400 dark:text-slate-600 bg-slate-50/30 dark:bg-slate-900/10' : '';
                      
                      return (
                        <div 
                          key={`day-${cell.day}`}
                          className={`aspect-square rounded-md flex flex-col items-center justify-center text-[10px] md:text-xs font-bold relative group transition-all select-none ${cellClass} ${weekendClass}`}
                        >
                          <span className={dayAbsences.length > 1 ? 'mb-0.5' : ''}>{cell.day}</span>
                          
                          {/* Colored dots for multiple absences */}
                          {dayAbsences.length > 1 && (
                            <div className="flex gap-0.5 items-center justify-center mt-0.5 max-w-full overflow-hidden px-1">
                              {dayAbsences.map(abs => {
                                const empColor = getEmployeeColor(abs.user_id);
                                return (
                                  <span 
                                    key={abs.id} 
                                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${empColor.dot}`} 
                                  />
                                );
                              })}
                            </div>
                          )}
                          
                          {/* Tooltip on Hover */}
                          {dayAbsences.length > 0 && (
                            <div className="absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col
                              bg-slate-900/95 backdrop-blur-sm text-white text-[11px] px-3 py-2 rounded-xl
                              shadow-2xl z-50 w-56 pointer-events-none gap-2 border border-slate-700/50">
                              {dayAbsences.map((abs, idx) => {
                                const emp = employees.find(e => e.id === abs.user_id);
                                const empName = emp ? formatUsername(emp.username) : 'Desconocido';
                                const typeObj = VACATION_TYPES.find(t => t.value === abs.type);
                                const typeLabel = typeObj ? typeObj.label : abs.type;
                                const typeColor = typeObj?.colorClass || 'bg-indigo-500 text-white';
                                const durationText = abs.type === 'Asuntos Propios' && abs.duration_minutes
                                  ? ` (${Math.floor(abs.duration_minutes / 60)}h ${abs.duration_minutes % 60}m)`
                                  : '';
                                
                                return (
                                  <div key={abs.id} className={`${idx > 0 ? 'border-t border-slate-800/80 pt-1.5' : ''} flex flex-col gap-0.5`}>
                                    <div className="flex items-center justify-between gap-1.5">
                                      <span className="font-bold text-slate-100">{empName}</span>
                                      <span className={`text-[8px] font-black uppercase tracking-widest px-1 py-0.5 rounded-md ${typeColor}`}>
                                        {typeLabel}
                                      </span>
                                    </div>
                                    <span className="text-slate-400 text-[10px]">
                                      {new Date(abs.start_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                      {' → '}
                                      {new Date(abs.end_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                      {durationText}
                                    </span>
                                    {abs.notes && (
                                      <span className="italic text-slate-400 text-[9px] leading-relaxed">
                                        {abs.notes}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                              {/* Arrow */}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900/95 border-r border-b border-slate-700/50 rotate-45 -mt-1" />
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
          
          {/* Department Legend */}
          <div className="p-5 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col gap-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Leyenda de Empleados</h5>
            <div className="flex flex-wrap gap-4">
              {employees.map(emp => {
                const idx = employees.findIndex(e => e.id === emp.id);
                const colorObj = EMPLOYEE_COLORS[idx % EMPLOYEE_COLORS.length];
                return (
                  <div key={emp.id} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800/60 text-xs font-semibold">
                    <span className={`w-2.5 h-2.5 rounded-full ${colorObj.dot}`} />
                    <span className="text-slate-700 dark:text-slate-200">{formatUsername(emp.username)}</span>
                  </div>
                );
              })}
            </div>
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

              {/* Duración — solo Asuntos Propios */}
              {formType === 'Asuntos Propios' && (
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                    ⏱ Duración (límite anual: 8h)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Horas</span>
                      <input
                        type="number"
                        min="0" max="8"
                        value={formAPHours}
                        onChange={(e) => setFormAPHours(Math.max(0, Math.min(8, parseInt(e.target.value) || 0)))}
                        disabled={!isHR}
                        className="px-3 py-2 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/50 text-xs font-bold text-amber-700 dark:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60 text-center"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Minutos</span>
                      <input
                        type="number"
                        min="0" max="59"
                        value={formAPMinutes}
                        onChange={(e) => setFormAPMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                        disabled={!isHR}
                        className="px-3 py-2 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/50 text-xs font-bold text-amber-700 dark:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60 text-center"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 italic">
                    Total: {formatMinutes(formAPHours * 60 + formAPMinutes)} · Fecha de inicio = día del permiso
                  </p>
                </div>
              )}

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
