'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles: string[];
    redirectTo?: string;
}

/**
 * Role-based access control component.
 * Redirects users who don't have the required role.
 */
export function RoleGuard({ children, allowedRoles, redirectTo = '/login' }: RoleGuardProps) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        if (user && !allowedRoles.includes(user.role)) {
            // Redirect to appropriate page based on their actual role
            const redirectPath = getRedirectForRole(user.role);
            router.push(redirectPath);
        }
    }, [isAuthenticated, isLoading, user, allowedRoles, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    if (user && !allowedRoles.includes(user.role)) {
        return null;
    }

    return <>{children}</>;
}

/**
 * Get redirect path based on user role
 */
function getRedirectForRole(role: string): string {
    switch (role) {
        case 'super_admin':
        case 'admin':
            return '/admin';
        case 'host':
            return '/host';
        case 'bidder':
            return '/bidders';
        case 'viewer':
        default:
            return '/auctions';
    }
}

/**
 * Higher-order component for role protection
 */
export function withRoleGuard<P extends object>(
    Component: React.ComponentType<P>,
    allowedRoles: string[]
) {
    return function GuardedComponent(props: P) {
        return (
            <RoleGuard allowedRoles={allowedRoles}>
                <Component {...props} />
            </RoleGuard>
        );
    };
}

// Pre-configured guards for common use cases
export function AdminGuard({ children }: { children: React.ReactNode }) {
    return <RoleGuard allowedRoles={['super_admin', 'admin']}>{children}</RoleGuard>;
}

export function HostGuard({ children }: { children: React.ReactNode }) {
    return <RoleGuard allowedRoles={['super_admin', 'admin', 'host']}>{children}</RoleGuard>;
}

export function BidderGuard({ children }: { children: React.ReactNode }) {
    return <RoleGuard allowedRoles={['super_admin', 'admin', 'bidder']}>{children}</RoleGuard>;
}
