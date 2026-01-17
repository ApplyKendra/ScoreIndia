// API URL helpers for different use cases

// Get the full API URL (with /api suffix) - use this with axios client
export const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
};

// Get the base URL (without /api suffix) - use this with direct fetch calls that add /api in the path
export const getBaseUrl = () => {
    const envUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    return envUrl.replace(/\/api\/?$/, '');
};

// For compatibility, export the base URL as API_URL
export const API_URL = getBaseUrl();
