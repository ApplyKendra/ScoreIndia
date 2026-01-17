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

// Track which URLs should NOT trigger redirect on 401
const noRedirectUrls = ['/auth/profile', '/auth/refresh', '/auth/logout'];

// Response interceptor for token refresh (now cookie-based)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const requestUrl = originalRequest?.url || '';

        // Don't try to refresh for these endpoints
        const shouldSkipRefresh = noRedirectUrls.some(url => requestUrl.includes(url));

        // If 401 and not already retried, try to refresh the token
        if (error.response?.status === 401 && !originalRequest._retry && !shouldSkipRefresh) {
            originalRequest._retry = true;

            try {
                // Cookie-based refresh: the refreshToken cookie is sent automatically
                await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });

                // Retry the original request (new accessToken cookie is set automatically)
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed - DON'T redirect to login here
                // Let the calling code handle this gracefully
                console.warn('Token refresh failed');
            }
        }

        return Promise.reject(error);
    }
);

export default api;
