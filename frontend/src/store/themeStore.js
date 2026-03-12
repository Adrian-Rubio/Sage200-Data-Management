import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useThemeStore = create(
    persist(
        (set) => ({
            theme: 'light', // Por defecto usamos el tema claro
            toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
            setDarkTheme: () => set({ theme: 'dark' }),
            setLightTheme: () => set({ theme: 'light' }),
        }),
        {
            name: 'theme-storage', // name of the item in the storage (must be unique)
        }
    )
);

export default useThemeStore;
