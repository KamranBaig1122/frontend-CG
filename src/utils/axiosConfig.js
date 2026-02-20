import axios from 'axios';
import toast from 'react-hot-toast';

const axiosInstance = axios.create();

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 429) {
            const retryAfter = error.response.headers['retry-after'] || 1;
            const waitTime = parseInt(retryAfter) * 1000;

            if (!originalRequest._retry) {
                toast.error(`Too many requests. Please wait ${retryAfter} second(s) and try again.`, {
                    duration: 4000,
                });
                originalRequest._retry = true;
            }

            await new Promise(resolve => setTimeout(resolve, waitTime));
            return axiosInstance(originalRequest);
        }

        if (error.response?.status === 401) {
            localStorage.removeItem('user');
            window.location.href = '/login';
            return new Promise(() => {});
        }

        if (error.response?.status >= 500) {
            toast.error('Server error. Please try again later.');
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
