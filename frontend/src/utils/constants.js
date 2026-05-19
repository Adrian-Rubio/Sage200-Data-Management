export const YEARS = ['2023', '2024', '2025', '2026'];

export const MONTHS = [
    { id: '1', name: 'Enero' },
    { id: '2', name: 'Febrero' },
    { id: '3', name: 'Marzo' },
    { id: '4', name: 'Abril' },
    { id: '5', name: 'Mayo' },
    { id: '6', name: 'Junio' },
    { id: '7', name: 'Julio' },
    { id: '8', name: 'Agosto' },
    { id: '9', name: 'Septiembre' },
    { id: '10', name: 'Octubre' },
    { id: '11', name: 'Noviembre' },
    { id: '12', name: 'Diciembre' }
];

export const CHART_COLORS = [
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#475569'  // Slate
];

export function getDivisionColor(division) {
    switch (division) {
        case 'Conectrónica':
            return { fill: '#10b981', label: '#065f46', bg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' };
        case 'Mecánica':
        case 'Sismecánica':
            return { fill: '#3b82f6', label: '#1e40af', bg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' };
        case 'Informática Industrial':
        case 'I. Industrial':
            return { fill: '#8b5cf6', label: '#5b21b6', bg: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' };
        default:
            return { fill: '#94a3b8', label: '#334155', bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400' };
    }
}
