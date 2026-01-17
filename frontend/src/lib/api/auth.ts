import api from './client';

export interface LoginDto {
    email: string;
    password: string;
}

export interface RegisterDto {
    email: string;
    password: string;
    name: string;
    phone?: string;
}

export interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    role: 'USER' | 'SUB_ADMIN' | 'SUPER_ADMIN';
    isEmailVerified?: boolean;
    twoFactorEnabled?: boolean;
    createdAt?: string;
    lastLoginAt?: string;
}

// Response no longer contains tokens; they are in HttpOnly cookies
export interface AuthResponse {
    user: User;
    message: string;
    requiresTwoFactor?: boolean;
    requiresTwoFactorSetup?: boolean;
    requiresEmailOtp?: boolean;
    userId?: string;
    setupToken?: string; // For 2FA setup authentication
}

export interface TwoFactorSetupResponse {
    qrCode: string;
    secret: string;
    message: string;
}

export interface TwoFactorVerifyResponse {
    message: string;
    recoveryCodes?: string[];
}

export const authApi = {
    login: async (dto: LoginDto): Promise<AuthResponse> => {
        const { data } = await api.post('/auth/login', dto);
        return data;
    },

    register: async (dto: RegisterDto): Promise<AuthResponse> => {
        const { data } = await api.post('/auth/register', dto);
        return data;
    },

    logout: async (): Promise<void> => {
        // Backend clears the cookies
        await api.post('/auth/logout');
    },

    refresh: async (): Promise<void> => {
        // Cookie is sent automatically to refresh
        await api.post('/auth/refresh');
    },

    getProfile: async (): Promise<User> => {
        const { data } = await api.get('/auth/profile');
        return data;
    },

    // 2FA endpoints
    setupTwoFactor: async (): Promise<TwoFactorSetupResponse> => {
        const { data } = await api.post('/auth/2fa/setup');
        return data;
    },

    verifyTwoFactor: async (token: string): Promise<TwoFactorVerifyResponse> => {
        const { data } = await api.post('/auth/2fa/verify', { token });
        return data;
    },

    validateTwoFactor: async (userId: string, token: string): Promise<AuthResponse> => {
        const { data } = await api.post('/auth/2fa/validate', { userId, token });
        return data;
    },

    disableTwoFactor: async (token: string): Promise<{ message: string }> => {
        const { data } = await api.post('/auth/2fa/disable', { token });
        return data;
    },

    // 2FA setup for first-time admin login (requires setupToken from login)
    setupTwoFactorForUser: async (userId: string, setupToken: string): Promise<TwoFactorSetupResponse> => {
        const { data } = await api.post('/auth/2fa/setup-for-user', { userId, setupToken });
        return data;
    },

    verifyTwoFactorSetup: async (userId: string, token: string): Promise<AuthResponse> => {
        const { data } = await api.post('/auth/2fa/verify-setup', { userId, token });
        return data;
    },

    // Email OTP endpoints
    verifyEmailOtp: async (userId: string, otp: string): Promise<AuthResponse> => {
        const { data } = await api.post('/auth/otp/verify-login', { userId, otp });
        return data;
    },

    resendLoginOtp: async (userId: string): Promise<{ message: string }> => {
        const { data } = await api.post('/auth/otp/resend-login', { userId });
        return data;
    },

    sendPasswordChangeOtp: async (): Promise<{ message: string }> => {
        const { data } = await api.post('/auth/otp/send-password-change');
        return data;
    },

    verifyPasswordChangeOtp: async (otp: string): Promise<{ verified: boolean; token: string; expiresAt: string; message: string }> => {
        const { data } = await api.post('/auth/otp/verify-password-change', { otp });
        return data;
    },

    // Password change with token (after OTP verified) - new secure flow
    changePasswordWithToken: async (token: string, currentPassword: string, newPassword: string): Promise<{ message: string }> => {
        const { data } = await api.post('/auth/change-password-with-token', { token, currentPassword, newPassword });
        return data;
    },

    // Password change (old method - now requires OTP)
    changePassword: async (otp: string, newPassword: string): Promise<{ message: string }> => {
        const { data } = await api.post('/auth/change-password', { otp, newPassword });
        return data;
    },

    // Email verification
    resendVerification: async (email: string): Promise<{ message: string }> => {
        const { data } = await api.post('/auth/resend-verification', { email });
        return data;
    },
};

export default authApi;
