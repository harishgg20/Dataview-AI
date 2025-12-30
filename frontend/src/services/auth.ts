import api from "@/lib/api";

export interface User {
    id: number;
    first_name: string;
    last_name?: string;
    email: string;
    avatar_data?: string;
    role: string;
}

export interface UserUpdate {
    first_name?: string;
    last_name?: string;
    email?: string;
    password?: string;
    avatar_data?: string;
    api_key?: string;
}

export const authService = {
    getProfile: async () => {
        const response = await api.get<User>("/users/me");
        return response.data;
    },

    updateProfile: async (data: UserUpdate) => {
        const response = await api.put<User>("/users/me", data);
        return response.data;
    },

    deleteAccount: async () => {
        await api.delete("/users/me");
    },

    getAllUsers: async () => {
        // Skip and limit could be parametized if needed
        const response = await api.get<User[]>("/users/");
        return response.data;
    }
};
