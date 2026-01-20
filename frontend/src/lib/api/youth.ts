import apiClient from './client';

export interface YouthEvent {
    id: string;
    title: string;
    slug?: string;
    description: string;
    content?: string;
    date: string;
    endDate?: string;
    location: string;
    venue?: string;
    maxParticipants?: number;
    registrationFee?: number;
    registrationEnd?: string;
    imageUrl?: string;
    status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
    isFeatured: boolean;
    preJoinedCount?: number;
    createdAt: string;
    _count?: { registrations: number };
}

export interface EventRegistration {
    id: string;
    eventId: string;
    userId?: string;
    guestName?: string;
    guestEmail?: string;
    phone?: string;
    emergencyContact?: string;
    dietaryReq?: string;
    isConfirmed: boolean;
    createdAt: string;
    user?: { id: string; name: string; email: string };
}

export interface CreateEventDto {
    title: string;
    description: string;
    content?: string;
    date: string;
    endDate?: string;
    location: string;
    venue?: string;
    maxParticipants?: number;
    registrationFee?: number;
    registrationEnd?: string;
    imageUrl?: string;
    isFeatured?: boolean;
    preJoinedCount?: number;
}

export interface UpdateEventDto extends Partial<CreateEventDto> { }

export const youthApi = {
    // Public
    getEvents: async (): Promise<YouthEvent[]> => {
        const response = await apiClient.get('/youth/events');
        return response.data;
    },

    getFeaturedEvents: async (): Promise<YouthEvent[]> => {
        const response = await apiClient.get('/youth/events/featured');
        return response.data;
    },

    getEventById: async (id: string): Promise<YouthEvent> => {
        const response = await apiClient.get(`/youth/events/${id}`);
        return response.data;
    },

    // User
    registerForEvent: async (eventId: string, data: { phone?: string; emergencyContact?: string; dietaryReq?: string }): Promise<EventRegistration> => {
        const response = await apiClient.post(`/youth/events/${eventId}/register`, data);
        return response.data;
    },

    // Guest registration (no auth required)
    guestRegisterForEvent: async (eventId: string, data: { guestName: string; guestEmail?: string; phone: string; emergencyContact?: string; dietaryReq?: string }): Promise<EventRegistration> => {
        const response = await apiClient.post(`/youth/events/${eventId}/guest-register`, data);
        return response.data;
    },

    getMyRegistrations: async (): Promise<EventRegistration[]> => {
        const response = await apiClient.get('/youth/registrations/my');
        return response.data;
    },

    cancelRegistration: async (eventId: string): Promise<void> => {
        await apiClient.delete(`/youth/events/${eventId}/registration`);
    },

    // Admin
    createEvent: async (data: CreateEventDto): Promise<YouthEvent> => {
        const response = await apiClient.post('/youth/admin/events', data);
        return response.data;
    },

    updateEvent: async (id: string, data: UpdateEventDto): Promise<YouthEvent> => {
        const response = await apiClient.patch(`/youth/admin/events/${id}`, data);
        return response.data;
    },

    updateEventStatus: async (id: string, status: YouthEvent['status']): Promise<YouthEvent> => {
        const response = await apiClient.patch(`/youth/admin/events/${id}/status`, { status });
        return response.data;
    },

    getEventRegistrations: async (eventId: string): Promise<EventRegistration[]> => {
        const response = await apiClient.get(`/youth/admin/events/${eventId}/registrations`);
        return response.data;
    },

    deleteEvent: async (id: string): Promise<void> => {
        await apiClient.delete(`/youth/admin/events/${id}`);
    },
};

export default youthApi;
