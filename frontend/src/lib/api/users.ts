import apiClient from './client';

export interface AdminUser {
    id: string;
    email: string;
    name: string;
    phone?: string;
    role: 'USER' | 'SUB_ADMIN' | 'SUPER_ADMIN';
    isActive: boolean;
    isEmailVerified: boolean;
    createdAt: string;
    lastLoginAt?: string;
}

export interface UserStats {
    totalUsers: number;
    activeUsers: number;
    totalOrders: number;
    totalEvents: number;
}

export interface CreateUserDto {
    email: string;
    name: string;
    password: string;
    phone?: string;
    // Note: Only SUB_ADMIN can be created, SUPER_ADMIN is reserved
}

export interface UpdateUserDto {
    name?: string;
    phone?: string;
    role?: 'USER' | 'SUB_ADMIN';
}

export interface VerifyOtpResponse {
    verified: boolean;
    sessionToken: string;
    expiresAt: string;
    message: string;
}

export const usersApi = {
    getAll: async (): Promise<AdminUser[]> => {
        const response = await apiClient.get<{ users: AdminUser[] }>('/users');
        return response.data.users;
    },

    getById: async (id: string): Promise<AdminUser> => {
        const response = await apiClient.get(`/users/${id}`);
        return response.data;
    },

    getStats: async (): Promise<UserStats> => {
        const response = await apiClient.get('/users/stats');
        return response.data;
    },

    // ============================================
    // SECURE OPERATIONS (Require 2FA + OTP)
    // ============================================

    // Send OTP for user management operations
    sendManagementOtp: async (): Promise<{ message: string; token: string; expiresAt: string }> => {
        const response = await apiClient.post('/users/management/send-otp');
        return response.data;
    },

    // Verify OTP and get session token
    verifyManagementOtp: async (otp: string): Promise<VerifyOtpResponse> => {
        const response = await apiClient.post('/users/management/verify-otp', { otp });
        return response.data;
    },

    // Create sub-admin with 2FA + OTP verification
    createAdminSecure: async (
        userData: CreateUserDto,
        twoFactorCode: string,
        sessionToken: string
    ): Promise<AdminUser> => {
        const response = await apiClient.post('/users/admin/secure', {
            userData,
            twoFactorCode,
            sessionToken,
        });
        return response.data;
    },

    // Toggle user active with 2FA (+ OTP for sub-admin)
    toggleActiveSecure: async (
        id: string,
        twoFactorCode: string,
        sessionToken?: string
    ): Promise<AdminUser> => {
        const response = await apiClient.patch(`/users/${id}/toggle-active/secure`, {
            twoFactorCode,
            sessionToken,
        });
        return response.data;
    },

    // Delete user with 2FA (+ OTP for sub-admin)
    deleteSecure: async (
        id: string,
        twoFactorCode: string,
        sessionToken?: string
    ): Promise<void> => {
        await apiClient.delete(`/users/${id}/secure`, {
            data: { twoFactorCode, sessionToken },
        });
    },

    // ============================================
    // LEGACY (kept for backward compatibility)
    // ============================================

    createAdmin: async (data: CreateUserDto): Promise<AdminUser> => {
        const response = await apiClient.post('/users/admin', data);
        return response.data;
    },

    update: async (id: string, data: UpdateUserDto): Promise<AdminUser> => {
        const response = await apiClient.patch(`/users/${id}`, data);
        return response.data;
    },

    toggleActive: async (id: string): Promise<AdminUser> => {
        const response = await apiClient.patch(`/users/${id}/toggle-active`);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/users/${id}`);
    },
};

export default usersApi;

