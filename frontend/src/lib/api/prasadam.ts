import api from './client';

export interface PrasadamCategory {
    id: string;
    name: string;
    description?: string;
    imageUrl?: string;
    displayOrder: number;
}

export interface PrasadamItem {
    id: string;
    name: string;
    description?: string;
    price: number;
    isAvailable: boolean;
    imageUrl?: string;
    categoryId: string;
    category?: { name: string };
    maxQuantityPerOrder: number;
}

export interface OrderItem {
    itemId: string;
    name: string;
    price: number;
    quantity: number;
}

export interface CreateOrderDto {
    deliveryType: 'PICKUP' | 'DELIVERY';
    items: OrderItem[];
    deliveryAddress?: string;
    deliveryPhone?: string;
    instructions?: string;
}

export interface PrasadamOrder {
    id: string;
    orderNumber: string;
    status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
    deliveryType: 'PICKUP' | 'DELIVERY';
    subtotal: number;
    deliveryFee: number;
    totalAmount: number;
    items: OrderItem[];
    createdAt: string;
    user?: { id: string; name: string; email: string };
}

export const prasadamApi = {
    // Public
    getCategories: async (): Promise<PrasadamCategory[]> => {
        const { data } = await api.get('/prasadam/categories');
        return data;
    },

    getMenuItems: async (categoryId?: string): Promise<PrasadamItem[]> => {
        const params = categoryId ? { categoryId } : {};
        const { data } = await api.get('/prasadam/menu', { params });
        return data;
    },

    getMenuItem: async (id: string): Promise<PrasadamItem> => {
        const { data } = await api.get(`/prasadam/menu/${id}`);
        return data;
    },

    // User
    createOrder: async (dto: CreateOrderDto): Promise<PrasadamOrder> => {
        const { data } = await api.post('/prasadam/orders', dto);
        return data;
    },

    getMyOrders: async (): Promise<PrasadamOrder[]> => {
        const { data } = await api.get('/prasadam/orders/my');
        return data;
    },

    getOrderById: async (id: string): Promise<PrasadamOrder> => {
        const { data } = await api.get(`/prasadam/orders/${id}`);
        return data;
    },

    // Admin
    getAdminOrders: async (status?: string): Promise<PrasadamOrder[]> => {
        const params = status ? { status } : {};
        const { data } = await api.get('/prasadam/admin/orders', { params });
        return data;
    },

    updateOrderStatus: async (id: string, status: string, cancelReason?: string) => {
        const { data } = await api.patch(`/prasadam/admin/orders/${id}/status`, {
            status,
            cancelReason,
        });
        return data;
    },

    // Admin Menu CRUD
    createMenuItem: async (dto: { name: string; description?: string; price: number; categoryId: string; maxQuantityPerOrder?: number; imageUrl?: string }): Promise<PrasadamItem> => {
        const { data } = await api.post('/prasadam/admin/menu', dto);
        return data;
    },

    updateMenuItem: async (id: string, dto: Partial<{ name: string; description: string; price: number; categoryId: string; maxQuantityPerOrder: number; imageUrl: string }>): Promise<PrasadamItem> => {
        const { data } = await api.patch(`/prasadam/admin/menu/${id}`, dto);
        return data;
    },

    toggleAvailability: async (id: string): Promise<PrasadamItem> => {
        const { data } = await api.patch(`/prasadam/admin/menu/${id}/toggle-availability`);
        return data;
    },

    deleteMenuItem: async (id: string): Promise<void> => {
        await api.delete(`/prasadam/admin/menu/${id}`);
    },
};

export default prasadamApi;
