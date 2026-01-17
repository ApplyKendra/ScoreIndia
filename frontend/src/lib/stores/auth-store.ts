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

    setUser: (user: User | null) => void;
    login: (user: User) => void;
    logout: () => void;
    setLoading: (loading: boolean) => void;
    checkAuth: () => Promise<void>;
    setHasHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: true, // Start as true - we're loading until hydration completes
            _hasHydrated: false,

            setHasHydrated: () => {
                set({ _hasHydrated: true, isLoading: false });
            },

            setUser: (user) =>
                set({ user, isAuthenticated: !!user }),

            // Login stores user data; tokens are in HttpOnly cookies
            login: (user) => {
                set({
                    user,
                    isAuthenticated: true,
                    isLoading: false,
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
                });
            },

            setLoading: (isLoading) => set({ isLoading }),

            // Check if user is authenticated by calling profile endpoint
            checkAuth: async () => {
                // If we already have auth state, don't re-check
                if (get()._hasHydrated && get().isAuthenticated) {
                    return;
                }

                set({ isLoading: true });

                try {
                    const { data } = await api.get('/auth/profile');
                    set({
                        user: data,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch (e) {
                    set({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
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
            }),
            onRehydrateStorage: () => (state) => {
                // Mark hydration as complete - this is critical!
                // This runs AFTER the persisted state has been loaded from localStorage
                if (state) {
                    state.setHasHydrated();
                }
            },
        }
    )
);

export default useAuthStore;
