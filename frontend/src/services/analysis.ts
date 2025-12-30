import api from '@/lib/api';

export interface SavedChart {
    id: number;
    name: string;
    description?: string;
    data_source_id?: number | null;
    config: any;
    created_at: string;
}

export const analysisService = {
    // Save a chart
    saveChart: async (projectId: string, data: { name: string; description?: string; data_source_id?: number; config: any }) => {
        const response = await api.post<SavedChart>(`/analysis/projects/${projectId}/charts`, data);
        return response.data;
    },

    // List charts for a project
    getProjectCharts: async (projectId: string) => {
        const response = await api.get<SavedChart[]>(`/analysis/projects/${projectId}/charts`);
        return response.data;
    },

    // Delete a chart
    deleteChart: async (chartId: number) => {
        const response = await api.delete(`/analysis/charts/${chartId}`);
        return response.data;
    }
};
