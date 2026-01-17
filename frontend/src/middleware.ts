import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/admin', '/cart', '/checkout'];

// Routes only for unauthenticated users
const authRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check for accessToken cookie (set by backend on login)
    const accessToken = request.cookies.get('accessToken')?.value;

    // Don't just check existence - also check it looks like a valid JWT
    const isAuthenticated = accessToken && accessToken.includes('.') && accessToken.split('.').length === 3;

    // For protected routes: redirect to login if not authenticated
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    if (isProtectedRoute && !isAuthenticated) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // For auth routes (login/register): DON'T redirect if already on these pages
    // This prevents infinite loops when cookies are stale
    // Let the client-side handle the redirect after verifying with the backend

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Apply middleware to these routes

        '/admin/:path*',
        '/cart/:path*',
        '/checkout/:path*',
        '/login',
        '/register',
    ],
};

