// API Client for connecting to Go backend

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
// WS URL should correspond to API URL base but with ws/wss protocol
const WS_URL = API_URL.replace('http', 'ws').replace('/api', '');

interface ApiResponse<T> {
    data?: T;
    error?: string;
}

class ApiClient {
    // Helper to get raw token for WS (returns null as we rely on cookies now)
    // Kept for compatibility but returns null so WS uses cookie fallback
    getToken(): string | null {
        return null;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {},
        isRetry = false
    ): Promise<T> {
        const headers: HeadersInit = {
            ...(options.headers || {}),
        };

        // Only set Content-Type to application/json if body is not FormData
        if (!(options.body instanceof FormData)) {
            (headers as Record<string, string>)['Content-Type'] = 'application/json';
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
            credentials: 'include', // Important: Send cookies
        });

        if (response.status === 401 && !isRetry) {
            // Attempt to refresh token
            try {
                await this.refreshSession();
                // Retry original request
                return this.request<T>(endpoint, options, true);
            } catch (error) {
                // Refresh failed
                throw new Error('Unauthorized');
            }
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }

        return response.json();
    }

    // Uploads
    async uploadImage(file: File) {
        const formData = new FormData();
        formData.append('image', file);
        return this.request<{ url: string; filename: string }>('/uploads/image', {
            method: 'POST',
            body: formData,
        });
    }

    // Auth
    async login(email: string, password: string) {
        // Login now sets cookies, doesn't return tokens in body
        return this.request<{
            user: any;
            expires_in: number;
        }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    async logout() {
        await this.request<void>('/auth/logout', { method: 'POST' });
    }

    async refreshSession() {
        return this.request<any>('/auth/refresh', { method: 'POST' }, true);
    }

    async getCurrentUser() {
        return this.request<any>('/auth/me');
    }

    // Teams
    async getTeams() {
        return this.request<any[]>('/teams');
    }

    async getTeam(id: string) {
        return this.request<any>(`/teams/${id}`);
    }

    async getTeamSquad(id: string) {
        return this.request<any[]>(`/teams/${id}/squad`);
    }

    async createTeam(data: any) {
        return this.request<any>('/teams', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateTeam(id: string, data: any) {
        return this.request<any>(`/teams/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteTeam(id: string) {
        return this.request<void>(`/teams/${id}`, { method: 'DELETE' });
    }

    // Players
    async getPlayers(filters?: {
        status?: string;
        role?: string;
        category?: string;
        team_id?: string;
        search?: string;
        limit?: number;
        offset?: number;
    }) {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined) params.append(key, String(value));
            });
        }
        const query = params.toString() ? `?${params}` : '';
        return this.request<{ data: any[]; total: number; has_more: boolean }>(`/players${query}`);
    }

    async getPlayer(id: string) {
        return this.request<any>(`/players/${id}`);
    }

    async getPlayerQueue(limit = 10) {
        return this.request<any[]>(`/players/queue?limit=${limit}`);
    }

    async createPlayer(data: any) {
        return this.request<any>('/players', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updatePlayer(id: string, data: any) {
        return this.request<any>(`/players/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deletePlayer(id: string) {
        return this.request<void>(`/players/${id}`, { method: 'DELETE' });
    }

    // Users
    async getUsers() {
        return this.request<any[]>('/users');
    }

    async createUser(data: any) {
        return this.request<any>('/users', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateUser(id: string, data: any) {
        return this.request<any>(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteUser(id: string) {
        return this.request<void>(`/users/${id}`, { method: 'DELETE' });
    }

    // Auction
    async getAuctionState() {
        return this.request<any>('/auction/state');
    }

    async startAuction() {
        return this.request<any>('/auction/start', { method: 'POST' });
    }

    async endAuction() {
        return this.request<any>('/auction/end', { method: 'POST' });
    }

    async pauseAuction() {
        return this.request<any>('/auction/pause', { method: 'POST' });
    }

    async resumeAuction() {
        return this.request<any>('/auction/resume', { method: 'POST' });
    }

    async nextPlayer() {
        return this.request<any>('/auction/next-player', { method: 'POST' });
    }

    async startBidForPlayer(playerId: string) {
        return this.request<any>(`/auction/start-player/${playerId}`, { method: 'POST' });
    }

    async sellPlayer() {
        return this.request<any>('/auction/sell', { method: 'POST' });
    }

    async sellToTeam(teamId: string) {
        return this.request<any>(`/auction/sell-to-team/${teamId}`, { method: 'POST' });
    }

    async markUnsold() {
        return this.request<any>('/auction/unsold', { method: 'POST' });
    }

    async resetTimer() {
        return this.request<any>('/auction/reset-timer', { method: 'POST' });
    }

    async undoBid() {
        return this.request<any>('/auction/undo-bid', { method: 'POST' });
    }

    async resetAuction() {
        return this.request<any>('/auction/reset', { method: 'POST' });
    }

    async skipPlayer() {
        return this.request<any>('/auction/skip-player', { method: 'POST' });
    }


    async resetEverything() {
        return this.request<any>('/auction/reset-everything', { method: 'POST' });
    }

    async broadcastLive() {
        return this.request<any>('/auction/broadcast-live', { method: 'POST' });
    }

    async placeBid(amount: number) {
        return this.request<any>('/bids', {
            method: 'POST',
            body: JSON.stringify({ amount }),
        });
    }

    async getBidHistory(playerId: string) {
        return this.request<any[]>(`/bids/history/${playerId}`);
    }

    // Settings
    async getSettings() {
        return this.request<Record<string, any>>('/settings');
    }

    async updateSettings(settings: Record<string, any>) {
        return this.request<any>('/settings', {
            method: 'PUT',
            body: JSON.stringify(settings),
        });
    }

    // Stats
    async getOverviewStats() {
        return this.request<any>('/stats/overview');
    }

    async getTopBuys(limit = 10) {
        return this.request<any[]>(`/stats/top-buys?limit=${limit}`);
    }

    async getRecentSales(limit = 10) {
        return this.request<any[]>(`/stats/recent-sales?limit=${limit}`);
    }

    // Public APIs (no auth required) - for auctions page
    async getPublicTeams() {
        return this.request<any[]>('/public/teams');
    }

    async getPublicTeam(id: string) {
        return this.request<any>(`/public/teams/${id}`);
    }

    async getPublicTeamSquad(id: string) {
        return this.request<any[]>(`/public/teams/${id}/squad`);
    }

    async getPublicPlayers(filters?: {
        status?: string;
        role?: string;
        limit?: number;
        offset?: number;
    }) {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined) params.append(key, String(value));
            });
        }
        const query = params.toString() ? `?${params}` : '';
        return this.request<{ data: any[]; total: number; has_more: boolean }>(`/public/players${query}`);
    }

    async getPublicAuctionState() {
        return this.request<any>('/public/auction/state');
    }

    async getPublicTopBuys(limit = 10) {
        return this.request<any[]>(`/public/stats/top-buys?limit=${limit}`);
    }

    async getPublicRecentSales(limit = 10) {
        return this.request<any[]>(`/public/stats/recent-sales?limit=${limit}`);
    }

    // Stream URL (YouTube live)
    async getPublicStreamUrl() {
        return this.request<{ url: string }>('/public/stream-url');
    }

    async setStreamUrl(url: string) {
        return this.request<{ message: string; url: string }>('/auction/stream-url', {
            method: 'POST',
            body: JSON.stringify({ url }),
        });
    }
}

export const api = new ApiClient();
export default api;
