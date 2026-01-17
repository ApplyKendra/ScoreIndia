import apiClient from './client';

// ============================================
// INTERFACES
// ============================================

export interface DarshanSetting {
    id: string;
    key: string;
    value: string;
    updatedAt: string;
    updatedBy?: string;
}

export interface AartiScheduleItem {
    id: string;
    name: string;
    time: string;
    description?: string;
    displayOrder: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface DarshanImage {
    id: string;
    title: string;
    description?: string;
    url: string;
    date: string;
    displayOrder: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    createdBy?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ============================================
// DARSHAN API
// ============================================

export const darshanApi = {
    // ============================================
    // SETTINGS
    // ============================================

    getSettings: async (): Promise<DarshanSetting[]> => {
        const response = await apiClient.get('/darshan/settings');
        return response.data;
    },

    getSetting: async (key: string): Promise<DarshanSetting | null> => {
        try {
            const response = await apiClient.get(`/darshan/settings/${key}`);
            return response.data;
        } catch {
            return null;
        }
    },

    updateSetting: async (key: string, value: string): Promise<DarshanSetting> => {
        const response = await fetch(`${API_URL}/darshan/settings/${key}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ value }),
        });
        if (!response.ok) throw new Error('Failed to update setting');
        return response.json();
    },

    // ============================================
    // AARTI SCHEDULE
    // ============================================

    getAartiSchedule: async (includeInactive = false): Promise<AartiScheduleItem[]> => {
        const response = await apiClient.get(`/darshan/aarti?includeInactive=${includeInactive}`);
        return response.data;
    },

    createAarti: async (data: { name: string; time: string; description?: string }): Promise<AartiScheduleItem> => {
        const response = await fetch(`${API_URL}/darshan/aarti`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to create aarti');
        return response.json();
    },

    updateAarti: async (id: string, data: Partial<AartiScheduleItem>): Promise<AartiScheduleItem> => {
        const response = await fetch(`${API_URL}/darshan/aarti/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to update aarti');
        return response.json();
    },

    deleteAarti: async (id: string): Promise<void> => {
        const response = await fetch(`${API_URL}/darshan/aarti/${id}`, {
            method: 'DELETE',
            credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to delete aarti');
    },

    // ============================================
    // DARSHAN IMAGES
    // ============================================

    getDarshanImages: async (includeInactive = false): Promise<DarshanImage[]> => {
        const response = await apiClient.get(`/darshan/images?includeInactive=${includeInactive}`);
        return response.data;
    },

    createDarshanImage: async (data: { title: string; description?: string; url: string }): Promise<DarshanImage> => {
        const response = await fetch(`${API_URL}/darshan/images`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to create darshan image');
        return response.json();
    },

    updateDarshanImage: async (id: string, data: Partial<DarshanImage>): Promise<DarshanImage> => {
        const response = await fetch(`${API_URL}/darshan/images/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to update darshan image');
        return response.json();
    },

    deleteDarshanImage: async (id: string): Promise<void> => {
        const response = await fetch(`${API_URL}/darshan/images/${id}`, {
            method: 'DELETE',
            credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to delete darshan image');
    },

    // ============================================
    // UPLOAD HELPER
    // ============================================

    uploadDarshanImage: async (file: File, title: string, description?: string): Promise<DarshanImage> => {
        // First upload the image
        const formData = new FormData();
        formData.append('image', file);

        const uploadRes = await fetch(`${API_URL}/api/upload/image`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });

        if (!uploadRes.ok) throw new Error('Failed to upload image');
        const { imageUrl } = await uploadRes.json();

        // Then create the darshan image entry
        return darshanApi.createDarshanImage({ title, description, url: imageUrl });
    },
};

export default darshanApi;
