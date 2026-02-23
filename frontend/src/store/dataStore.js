import { create } from 'zustand';

const useDataStore = create((set) => ({
    dashboardData: null,
    dashboardFiltersHash: null,

    comparisonData: null,
    comparisonFiltersHash: null,

    filterOptions: null,
    purchasesData: null,

    setDashboardData: (data, hash) => set({ dashboardData: data, dashboardFiltersHash: hash }),
    setComparisonData: (data, hash) => set({ comparisonData: data, comparisonFiltersHash: hash }),
    setFilterOptions: (options) => set({ filterOptions: options }),
    setPurchasesData: (data) => set({ purchasesData: data }),

    clearCache: () => set({
        dashboardData: null,
        dashboardFiltersHash: null,
        comparisonData: null,
        comparisonFiltersHash: null,
        filterOptions: null,
        purchasesData: null
    })
}));

export default useDataStore;
