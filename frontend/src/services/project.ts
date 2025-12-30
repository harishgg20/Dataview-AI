import api from "@/lib/api";

export interface Project {
    id: number;
    name: string;
    description?: string;
    status: string;
    created_at: string;
    updated_at?: string;
}

export const projectService = {
    getAll: async () => {
        const response = await api.get<Project[]>("/projects/");
        console.log("API /projects/ response:", response);
        return response.data;
    },
    getOne: async (id: number) => {
        const response = await api.get<Project>(`/projects/${id}`);
        return response.data;
    },
    create: async (data: { name: string; description?: string }) => {
        const response = await api.post<Project>("/projects/", data);
        return response.data;
    },
    delete: async (id: number) => {
        await api.delete(`/projects/${id}`);
    },
};
