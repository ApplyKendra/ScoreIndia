import api from './client';

export interface Notification {
    id: string;
    title: string;
    message: string;
    isActive: boolean;
    priority: number;
    createdAt: string;
    updatedAt: string;
    createdBy?: string;
}

export const notificationApi = {
    // Public - get active notifications
    getActive: async (): Promise<Notification[]> => {
        const response = await api.get('/notifications/active');
        return response.data;
    },

    // Admin - get all notifications
    getAll: async (): Promise<Notification[]> => {
        const response = await api.get('/notifications');
        return response.data;
    },

    // Admin - get single notification
    getOne: async (id: string): Promise<Notification> => {
        const response = await api.get(`/notifications/${id}`);
        return response.data;
    },

    // Admin - create notification
    create: async (data: {
        title: string;
        message: string;
        isActive?: boolean;
        priority?: number;
    }): Promise<Notification> => {
        const response = await api.post('/notifications', data);
        return response.data;
    },

    // Admin - update notification
    update: async (
        id: string,
        data: {
            title?: string;
            message?: string;
            isActive?: boolean;
            priority?: number;
        }
    ): Promise<Notification> => {
        const response = await api.put(`/notifications/${id}`, data);
        return response.data;
    },

    // Admin - delete notification
    delete: async (id: string): Promise<void> => {
        await api.delete(`/notifications/${id}`);
    },
};
