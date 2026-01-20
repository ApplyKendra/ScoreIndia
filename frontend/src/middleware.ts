import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// DEBUG: Log middleware execution
const DEBUG = true;

// IMPORTANT: Due to cross-domain cookies (api.iskconburla.com → vercel frontend),
// we CANNOT check cookies in middleware. Auth is handled client-side.
// Only /checkout remains protected as it's a critical payment flow.
const protectedRoutes = ['/checkout'];

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
        // NOTE: /admin removed - cookies aren't visible cross-domain
        '/checkout/:path*',
        '/login',
        '/register',
    ],
};
