import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// DEBUG: Log middleware execution
const DEBUG = true;

// Routes that require authentication
//  - /admin routes need auth
//  - /cart is PUBLIC (auth checked client-side on checkout)
//  - /checkout needs auth
const protectedRoutes = ['/admin', '/checkout'];

// Routes only for unauthenticated users
const authRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check for accessToken cookie (set by backend on login)
    const accessToken = request.cookies.get('accessToken')?.value;
    const refreshToken = request.cookies.get('refreshToken')?.value;

    // DEBUG: Log cookie state
    if (DEBUG) {
        console.log(`[MIDDLEWARE] Path: ${pathname}`);
        console.log(`[MIDDLEWARE] accessToken exists: ${!!accessToken}`);
        console.log(`[MIDDLEWARE] refreshToken exists: ${!!refreshToken}`);
        console.log(`[MIDDLEWARE] All cookies:`, request.cookies.getAll().map(c => c.name));
    }

    // Don't just check existence - also check it looks like a valid JWT
    const isAuthenticated = accessToken && accessToken.includes('.') && accessToken.split('.').length === 3;

    if (DEBUG) {
        console.log(`[MIDDLEWARE] isAuthenticated: ${isAuthenticated}`);
    }

    // For protected routes: redirect to login if not authenticated
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    if (isProtectedRoute && !isAuthenticated) {
        if (DEBUG) {
            console.log(`[MIDDLEWARE] Redirecting to login - protected route without auth`);
        }
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
        '/checkout/:path*',
        '/login',
        '/register',
        // NOTE: /cart removed - it's handled client-side
    ],
};
