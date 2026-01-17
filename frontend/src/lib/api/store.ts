import apiClient from './client';

export interface StoreCategory {
    id: string;
    name: string;
    description?: string;
    displayOrder: number;
    isActive: boolean;
    imageUrl?: string;
}

export interface StoreItem {
    id: string;
    name: string;
    description: string;
    displayPrice?: number;
    inStock: boolean;
    imageUrl?: string;
    images: string[];
    categoryId: string;
    category?: StoreCategory;
    author?: string;
    language?: string;
    material?: string;
    slug?: string;
    isFeatured: boolean;
    createdAt: string;
}

export interface CreateStoreItemDto {
    name: string;
    description: string;
    displayPrice?: number;
    categoryId: string;
    imageUrl?: string;
    images?: string[];
    author?: string;
    language?: string;
    material?: string;
    isFeatured?: boolean;
}

export interface UpdateStoreItemDto extends Partial<CreateStoreItemDto> { }

export interface StoreFilters {
    categoryId?: string;
    search?: string;
    inStock?: boolean;
    isFeatured?: boolean;
}

export const storeApi = {
    // Public
    getCategories: async (): Promise<StoreCategory[]> => {
        const response = await apiClient.get('/store/categories');
        return response.data;
    },

    getItems: async (filters?: StoreFilters): Promise<StoreItem[]> => {
        const response = await apiClient.get('/store/items', { params: filters });
        return response.data;
    },

    getFeaturedItems: async (): Promise<StoreItem[]> => {
        const response = await apiClient.get('/store/items/featured');
        return response.data;
    },

    getItemById: async (id: string): Promise<StoreItem> => {
        const response = await apiClient.get(`/store/items/${id}`);
        return response.data;
    },

    getItemBySlug: async (slug: string): Promise<StoreItem> => {
        const response = await apiClient.get(`/store/items/slug/${slug}`);
        return response.data;
    },

    // Admin
    createItem: async (data: CreateStoreItemDto): Promise<StoreItem> => {
        const response = await apiClient.post('/store/admin/items', data);
        return response.data;
    },

    updateItem: async (id: string, data: UpdateStoreItemDto): Promise<StoreItem> => {
        const response = await apiClient.patch(`/store/admin/items/${id}`, data);
        return response.data;
    },

    toggleStock: async (id: string): Promise<StoreItem> => {
        const response = await apiClient.patch(`/store/admin/items/${id}/toggle-stock`);
        return response.data;
    },

    deleteItem: async (id: string): Promise<void> => {
        await apiClient.delete(`/store/admin/items/${id}`);
    },
};

export default storeApi;
