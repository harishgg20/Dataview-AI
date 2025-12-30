import api from "@/lib/api";

export interface DataSource {
    id: number;
    project_id: number;
    type: string;
    connection_config: any;
    refresh_schedule?: string;
}

export const dataSourceService = {
    uploadFile: async (projectId: number, file: File) => {
        const formData = new FormData();
        formData.append("project_id", projectId.toString());
        formData.append("file", file);

        const response = await api.post("/data-sources/upload", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    },
    connect: async (data: { project_id: number, name: string, type: 'postgres' | 'mysql', connection_string: string, query: string }) => {
        const response = await api.post("/data-sources/connect", data);
        return response.data;
    },
    async getCorrelation(id: number) {
        const response = await api.get(`/data-sources/${id}/correlation`);
        return response.data;
    },

    async cleanData(id: number, operations: any[]) {
        const response = await api.post(`/data-sources/${id}/clean`, { operations });
        return response.data;
    },

    async queryData(id: number, query: { filters: any[], group_by?: string, agg_column?: string, agg_method?: string, limit?: number }) {
        const response = await api.post(`/data-sources/${id}/query`, query);
        return response.data;
    },

    getAll: async () => {
        const response = await api.get<DataSource[]>("/data-sources/");
        return response.data;
    },
    delete: async (id: number) => {
        await api.delete(`/data-sources/${id}`);
    },
    update: async (id: number, name: string) => {
        const response = await api.put<{ id: number, connection_config: { original_name: string } }>(`/data-sources/${id}`, { name });
        return response.data;
    },
    getPreview: async (id: number, limit: number = 1000) => {
        const response = await api.get<{
            filename: string;
            columns: string[];
            dtypes: Record<string, string>;
            total_rows: number;
            total_columns: number;
            data: any[];
            preview_limit: number;
        }>(`/data-sources/${id}/preview?limit=${limit}`);
        return response.data;
    },
    getStatistics: async (id: number) => {
        const response = await api.get<{
            filename: string;
            statistics: Record<string, Record<string, number | string | null>>;
        }>(`/data-sources/${id}/statistics`);
        return response.data;
    },
    compareSegments: async (id: number, segment1: { name: string, filters: any[] }, segment2: { name: string, filters: any[] }) => {
        const response = await api.post(`/data-sources/${id}/compare-segments`, {
            segment1,
            segment2
        });
        return response.data;
    },

    getRows: async (id: number, start: number, end: number) => {
        const response = await api.get(`/data-sources/${id}/rows?start=${start}&end=${end}`);
        return response.data;
    }
};
