import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../api/client';
import axios from 'axios';

// Get API URL for direct refresh calls
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Token refresh interval - refresh before access token expires
// Access token for admins is 15 min, so refresh at 10 min
const TOKEN_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

export interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    role: 'USER' | 'SUB_ADMIN' | 'SUPER_ADMIN';
    isActive?: boolean;
    isEmailVerified?: boolean;
    twoFactorEnabled?: boolean;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    _hasHydrated: boolean;
    _sessionVerified: boolean;
    _refreshInterval: NodeJS.Timeout | null;

    setUser: (user: User | null) => void;
    login: (user: User) => void;
    logout: () => void;
    setLoading: (loading: boolean) => void;
    checkAuth: () => Promise<void>;
    validateSession: () => Promise<boolean>;
    setHasHydrated: () => void;
    startTokenRefresh: () => void;
    stopTokenRefresh: () => void;
    refreshToken: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: true,
            _hasHydrated: false,
            _sessionVerified: false,
            _refreshInterval: null,

            setHasHydrated: () => {
                const state = get();
                console.log('[AUTH-STORE] Hydration complete', {
                    user: state.user?.email,
                    isAuthenticated: state.isAuthenticated,
                });
                set({ _hasHydrated: true });
                // After hydration, validate session with server
                get().validateSession();
            },

            setUser: (user) =>
                set({ user, isAuthenticated: !!user }),

            login: (user) => {
                set({
                    user,
                    isAuthenticated: true,
                    isLoading: false,
                    _sessionVerified: true,
                });
                // Start proactive token refresh for admins
                if (user.role === 'SUPER_ADMIN' || user.role === 'SUB_ADMIN') {
                    get().startTokenRefresh();
                }
            },

            logout: async () => {
                // Stop token refresh
                get().stopTokenRefresh();

                try {
                    await api.post('/auth/logout');
                } catch (e) {
                    // Ignore errors during logout
                }
                set({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    _sessionVerified: false,
                });
            },

            setLoading: (isLoading) => set({ isLoading }),

            // Proactive token refresh - call /auth/refresh before token expires
            refreshToken: async () => {
                try {
                    console.log('[AUTH-STORE] Proactive token refresh...');
                    await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
                    console.log('[AUTH-STORE] Token refreshed successfully');
                    return true;
                } catch (error: any) {
                    console.error('[AUTH-STORE] Proactive refresh failed:', error.response?.status);
                    // If refresh fails, session is invalid
                    if (error.response?.status === 401) {
                        get().stopTokenRefresh();
                        set({
                            user: null,
                            isAuthenticated: false,
                            _sessionVerified: true,
                        });
                    }
                    return false;
                }
            },

            // Start interval for proactive token refresh
            startTokenRefresh: () => {
                const state = get();

                // Clear any existing interval
                if (state._refreshInterval) {
                    clearInterval(state._refreshInterval);
                }

                console.log('[AUTH-STORE] Starting proactive token refresh interval');

                // Refresh immediately to ensure we have a fresh token
                get().refreshToken();

                // Then refresh every 10 minutes
                const interval = setInterval(() => {
                    const currentState = get();
                    if (currentState.isAuthenticated && currentState.user) {
                        get().refreshToken();
                    } else {
                        get().stopTokenRefresh();
                    }
                }, TOKEN_REFRESH_INTERVAL);

                set({ _refreshInterval: interval });
            },

            // Stop the refresh interval
            stopTokenRefresh: () => {
                const state = get();
                if (state._refreshInterval) {
                    console.log('[AUTH-STORE] Stopping token refresh interval');
                    clearInterval(state._refreshInterval);
                    set({ _refreshInterval: null });
                }
            },

            // Validate session with server - ALWAYS calls the API
            validateSession: async () => {
                const state = get();

                console.log('[AUTH-STORE] validateSession called', {
                    _sessionVerified: state._sessionVerified,
                    isAuthenticated: state.isAuthenticated,
                    user: state.user?.email,
                });

                // If we've already verified this session, skip
                if (state._sessionVerified) {
                    console.log('[AUTH-STORE] Session already verified, skipping');
                    set({ isLoading: false });
                    return true;
                }

                // If localStorage says we're authenticated, verify with server
                if (state.isAuthenticated && state.user) {
                    console.log('[AUTH-STORE] Verifying session with server...');
                    set({ isLoading: true });
                    try {
                        const { data } = await api.get('/auth/profile');
                        console.log('[AUTH-STORE] Session verified successfully', { email: data.email });
                        set({
                            user: data,
                            isAuthenticated: true,
                            isLoading: false,
                            _sessionVerified: true,
                        });

                        // Start proactive refresh for admins
                        if (data.role === 'SUPER_ADMIN' || data.role === 'SUB_ADMIN') {
                            get().startTokenRefresh();
                        }

                        return true;
                    } catch (e: any) {
                        // Cookies are invalid - clear localStorage state
                        console.error('[AUTH-STORE] Session validation FAILED', {
                            status: e.response?.status,
                            message: e.response?.data?.message || e.message,
                        });
                        set({
                            user: null,
                            isAuthenticated: false,
                            isLoading: false,
                            _sessionVerified: true,
                        });
                        return false;
                    }
                } else {
                    // Not authenticated in localStorage
                    set({ isLoading: false, _sessionVerified: true });
                    return false;
                }
            },

            // Check auth - for manual calls (used after login/register)
            checkAuth: async () => {
                set({ isLoading: true });
                try {
                    const { data } = await api.get('/auth/profile');
                    set({
                        user: data,
                        isAuthenticated: true,
                        isLoading: false,
                        _sessionVerified: true,
                    });

                    // Start proactive refresh for admins
                    if (data.role === 'SUPER_ADMIN' || data.role === 'SUB_ADMIN') {
                        get().startTokenRefresh();
                    }
                } catch (e) {
                    set({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                        _sessionVerified: true,
                    });
                }
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
                // Don't persist _sessionVerified or _refreshInterval
            }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.setHasHydrated();
                }
            },
        }
    )
);

export default useAuthStore;
