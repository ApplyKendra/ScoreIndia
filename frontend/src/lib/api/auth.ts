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

// Debug logger for auth flow (only in development)
const isDev = process.env.NODE_ENV === 'development';
const logAuth = (step: string, data?: any, error?: any) => {
    if (!isDev) return;
    const timestamp = new Date().toISOString();
    if (error) {
        console.error(`🔐 [AUTH ${timestamp}] ${step}:`, error);
    } else if (data) {
        console.log(`🔐 [AUTH ${timestamp}] ${step}:`, data);
    } else {
        console.log(`🔐 [AUTH ${timestamp}] ${step}`);
    }
};

export const authApi = {
    login: async (dto: LoginDto): Promise<AuthResponse> => {
        logAuth('LOGIN_START', { email: dto.email });
        try {
            const { data } = await api.post('/auth/login', dto);
            logAuth('LOGIN_SUCCESS', data);
            return data;
        } catch (error: any) {
            logAuth('LOGIN_ERROR', null, error.response?.data || error.message);
            throw error;
        }
    },

    register: async (dto: RegisterDto): Promise<AuthResponse> => {
        logAuth('REGISTER_START', { email: dto.email });
        try {
            const { data } = await api.post('/auth/register', dto);
            logAuth('REGISTER_SUCCESS', data);
            return data;
        } catch (error: any) {
            logAuth('REGISTER_ERROR', null, error.response?.data || error.message);
            throw error;
        }
    },

    logout: async (): Promise<void> => {
        logAuth('LOGOUT_START');
        await api.post('/auth/logout');
        logAuth('LOGOUT_COMPLETE');
    },

    refresh: async (): Promise<void> => {
        logAuth('REFRESH_START');
        await api.post('/auth/refresh');
        logAuth('REFRESH_COMPLETE');
    },

    getProfile: async (): Promise<User> => {
        const { data } = await api.get('/auth/profile');
        return data;
    },

    // 2FA endpoints
    setupTwoFactor: async (): Promise<TwoFactorSetupResponse> => {
        logAuth('2FA_SETUP_START');
        const { data } = await api.post('/auth/2fa/setup');
        logAuth('2FA_SETUP_SUCCESS');
        return data;
    },

    verifyTwoFactor: async (token: string): Promise<TwoFactorVerifyResponse> => {
        logAuth('2FA_VERIFY_START');
        const { data } = await api.post('/auth/2fa/verify', { token });
        logAuth('2FA_VERIFY_SUCCESS', data);
        return data;
    },

    validateTwoFactor: async (userId: string, token: string): Promise<AuthResponse> => {
        logAuth('2FA_VALIDATE_START', { userId, tokenLength: token.length });
        try {
            const { data } = await api.post('/auth/2fa/validate', { userId, token });
            logAuth('2FA_VALIDATE_SUCCESS', {
                hasUser: !!data.user,
                requiresEmailOtp: data.requiresEmailOtp,
                message: data.message
            });
            return data;
        } catch (error: any) {
            logAuth('2FA_VALIDATE_ERROR', null, error.response?.data || error.message);
            throw error;
        }
    },

    disableTwoFactor: async (token: string): Promise<{ message: string }> => {
        const { data } = await api.post('/auth/2fa/disable', { token });
        return data;
    },

    // 2FA setup for first-time admin login (requires setupToken from login)
    setupTwoFactorForUser: async (userId: string, setupToken: string): Promise<TwoFactorSetupResponse> => {
        logAuth('2FA_SETUP_FOR_USER_START', { userId });
        try {
            const { data } = await api.post('/auth/2fa/setup-for-user', { userId, setupToken });
            logAuth('2FA_SETUP_FOR_USER_SUCCESS');
            return data;
        } catch (error: any) {
            logAuth('2FA_SETUP_FOR_USER_ERROR', null, error.response?.data || error.message);
            throw error;
        }
    },

    verifyTwoFactorSetup: async (userId: string, token: string): Promise<AuthResponse> => {
        logAuth('2FA_VERIFY_SETUP_START', { userId });
        try {
            const { data } = await api.post('/auth/2fa/verify-setup', { userId, token });
            logAuth('2FA_VERIFY_SETUP_SUCCESS', data);
            return data;
        } catch (error: any) {
            logAuth('2FA_VERIFY_SETUP_ERROR', null, error.response?.data || error.message);
            throw error;
        }
    },

    // Email OTP endpoints
    verifyEmailOtp: async (userId: string, otp: string): Promise<AuthResponse> => {
        logAuth('EMAIL_OTP_VERIFY_START', { userId, otpLength: otp.length });
        try {
            const { data } = await api.post('/auth/otp/verify-login', { userId, otp });
            logAuth('EMAIL_OTP_VERIFY_SUCCESS', data);
            return data;
        } catch (error: any) {
            logAuth('EMAIL_OTP_VERIFY_ERROR', null, error.response?.data || error.message);
            throw error;
        }
    },

    resendLoginOtp: async (userId: string): Promise<{ message: string }> => {
        logAuth('EMAIL_OTP_RESEND_START', { userId });
        try {
            const { data } = await api.post('/auth/otp/resend-login', { userId });
            logAuth('EMAIL_OTP_RESEND_SUCCESS', data);
            return data;
        } catch (error: any) {
            logAuth('EMAIL_OTP_RESEND_ERROR', null, error.response?.data || error.message);
            throw error;
        }
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

