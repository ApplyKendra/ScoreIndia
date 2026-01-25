'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    team_id?: string;
    team?: any;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for existing session via API (cookies)
        api.getCurrentUser()
            .then(setUser)
            .catch(() => {
                setUser(null);
            })
            .finally(() => setIsLoading(false));
    }, []);

    const login = async (email: string, password: string) => {
        const response = await api.login(email, password);
        setUser(response.user);
    };

    const logout = async () => {
        try {
            await api.logout();
        } catch (error) {
            console.error('Logout failed', error);
        }
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
