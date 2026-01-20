import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../api/client';

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
    _sessionVerified: boolean; // NEW: Track if we've verified with server

    setUser: (user: User | null) => void;
    login: (user: User) => void;
    logout: () => void;
    setLoading: (loading: boolean) => void;
    checkAuth: () => Promise<void>;
    validateSession: () => Promise<boolean>; // NEW: Validate with server
    setHasHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: true,
            _hasHydrated: false,
            _sessionVerified: false,

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
            },

            logout: async () => {
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
                            _sessionVerified: true, // Mark as verified (result: not authenticated)
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
                // Don't persist _sessionVerified - must re-verify on each app load
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
