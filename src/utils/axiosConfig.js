import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const axiosInstance = axios.create();

// Response interceptor to handle rate limiting and errors
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle 429 Too Many Requests
        if (error.response?.status === 429) {
            const retryAfter = error.response.headers['retry-after'] || 1;
            const waitTime = parseInt(retryAfter) * 1000;

            // Show user-friendly message
            if (!originalRequest._retry) {
                toast.error(`Too many requests. Please wait ${retryAfter} second(s) and try again.`, {
                    duration: 4000,
                });
                originalRequest._retry = true;
            }

            // Wait and retry once
            await new Promise(resolve => setTimeout(resolve, waitTime));
            
            // Retry the request
            return axiosInstance(originalRequest);
        }

        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
            // Clear user data and redirect to login
            localStorage.removeItem('user');
            window.location.href = '/login';
            toast.error('Session expired. Please login again.');
        }

        // Handle other errors
        if (error.response?.status >= 500) {
            toast.error('Server error. Please try again later.');
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
