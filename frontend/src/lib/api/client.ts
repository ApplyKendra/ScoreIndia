import axios from 'axios';

// Get API URL from environment, fallback to localhost for development
// NEXT_PUBLIC_API_URL should be set to the full API path like: https://iskconburla-api.onrender.com/api
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    // CRITICAL: This tells axios to send cookies with every request
    withCredentials: true,
});

// Track which URLs should NOT trigger token refresh on 401
// These are endpoints involved in the authentication flow
const noRefreshUrls = [
    '/auth/login',
    '/auth/register',
    '/auth/2fa/validate',
    '/auth/2fa/setup',
    '/auth/2fa/verify',
    '/auth/2fa/setup-for-user',
    '/auth/2fa/verify-setup',
    '/auth/otp/verify-login',
    '/auth/otp/resend-login',
    '/auth/profile',
    '/auth/refresh',
    '/auth/logout',
    '/auth/verify-email',
    '/auth/resend-verification',
];

// Response interceptor for token refresh (now cookie-based)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const requestUrl = originalRequest?.url || '';

        // Don't try to refresh for auth endpoints
        const shouldSkipRefresh = noRefreshUrls.some(url => requestUrl.includes(url));

        // If 401 and not already retried, try to refresh the token
        if (error.response?.status === 401 && !originalRequest._retry && !shouldSkipRefresh) {
            console.log('[API] 401 received, attempting token refresh for:', requestUrl);
            originalRequest._retry = true;

            try {
                // Cookie-based refresh: the refreshToken cookie is sent automatically
                console.log('[API] Calling /auth/refresh with credentials...');
                await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
                console.log('[API] Token refresh successful, retrying original request');

                // Retry the original request (new accessToken cookie is set automatically)
                return api(originalRequest);
            } catch (refreshError: any) {
                // Refresh failed - DON'T redirect to login here
                // Let the calling code handle this gracefully
                console.error('[API] Token refresh FAILED:', refreshError.response?.status, refreshError.message);
            }
        }

        return Promise.reject(error);
    }
);

export default api;

