// API Configuration
// Uses environment variables with fallback to localhost for development

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const apiBaseUrl = API_BASE_URL;
export const apiUrl = API_URL;
export const uploadsUrl = `${API_URL}/uploads`;

// Helper function to get full API endpoint
export const getApiEndpoint = (endpoint) => {
    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${API_BASE_URL}/${cleanEndpoint}`;
};

export default {
    apiBaseUrl,
    apiUrl,
    uploadsUrl,
    getApiEndpoint
};
