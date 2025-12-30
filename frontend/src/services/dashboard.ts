import api from "@/lib/api";

export interface Dashboard {
    id: number;
    user_id: number;
    name: string;
    description?: string;
    created_at: string;
    updated_at?: string;
    widgets: Widget[];
}

export interface Widget {
    id: number;
    dashboard_id: number;
    title: string;
    type: string; // 'chart', 'metric', etc.
    config: any;
    layout?: any;
    created_at: string;
}

export interface CreateDashboardData {
    name: string;
    description?: string;
}

export interface CreateWidgetData {
    title: string;
    type: string;
    config: any;
    layout?: any;
}

export const dashboardService = {
    getAll: async () => {
        const response = await api.get<Dashboard[]>("/dashboards/");
        return response.data;
    },

    getById: async (id: number) => {
        const response = await api.get<Dashboard>(`/dashboards/${id}`);
        return response.data;
    },

    create: async (data: CreateDashboardData) => {
        const response = await api.post<Dashboard>("/dashboards/", data);
        return response.data;
    },

    createWidget: async (dashboardId: number, data: CreateWidgetData) => {
        const response = await api.post<Widget>(`/dashboards/${dashboardId}/widgets`, data);
        return response.data;
    },

    deleteWidget: async (dashboardId: number, widgetId: number) => {
        await api.delete(`/dashboards/${dashboardId}/widgets/${widgetId}`);
    }
};
