import { create } from 'zustand';

export interface FilterRule {
    id: string;
    column: string;
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'not_contains';
    value: string;
}

interface DashboardState {
    // Global Filters (Slicers)
    globalFilters: FilterRule[];
    addGlobalFilter: (filter: FilterRule) => void;
    removeGlobalFilter: (id: string) => void;
    clearGlobalFilters: () => void;

    // Cross-Filtering (Chart Selections)
    // Map of chartId -> { column: value }
    selections: Record<string, Record<string, any>>;
    setSelection: (chartId: string, filter: Record<string, any> | null) => void;
    clearAllSelections: () => void;

    // UI State
    isEditMode: boolean;
    toggleEditMode: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
    globalFilters: [],
    addGlobalFilter: (filter) => set((state) => ({ globalFilters: [...state.globalFilters, filter] })),
    removeGlobalFilter: (id) => set((state) => ({ globalFilters: state.globalFilters.filter(f => f.id !== id) })),
    clearGlobalFilters: () => set({ globalFilters: [] }),

    selections: {},
    setSelection: (chartId, filter) => set((state) => {
        const newSelections = { ...state.selections };
        if (filter === null) {
            delete newSelections[chartId];
        } else {
            newSelections[chartId] = filter;
        }
        return { selections: newSelections };
    }),
    clearAllSelections: () => set({ selections: {} }),

    isEditMode: false,
    toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),
}));
