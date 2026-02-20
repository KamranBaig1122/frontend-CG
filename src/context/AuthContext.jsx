import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { apiBaseUrl } from '../config/api';

const AuthContext = createContext();

const isTokenExpired = (token) => {
    if (!token) return true;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now();
    } catch {
        return true;
    }
};

const AUTH_ENDPOINTS = ['/users/login', '/users/register'];

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return null;
        try {
            const parsed = JSON.parse(storedUser);
            if (isTokenExpired(parsed?.token)) {
                localStorage.removeItem('user');
                return null;
            }
            return parsed;
        } catch {
            localStorage.removeItem('user');
            return null;
        }
    });
    const [loading, setLoading] = useState(false);
    const loggingOut = useRef(false);

    const logout = useCallback(() => {
        if (loggingOut.current) return;
        loggingOut.current = true;

        setUser(null);
        localStorage.removeItem('user');
        window.location.href = '/login';
    }, []);

    const login = async (email, password) => {
        const { data } = await axios.post(`${apiBaseUrl}/users/login`, { email, password });
        loggingOut.current = false;
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
        return data;
    };

    const refreshToken = async () => {
        try {
            if (!user?.token) return;

            const { data } = await axios.post(`${apiBaseUrl}/users/refresh`, {
                token: user.token
            });

            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));
            return data;
        } catch (error) {
            console.error('Token refresh failed:', error);
            logout();
            return null;
        }
    };

    useEffect(() => {
        const requestInterceptor = axios.interceptors.request.use(
            (config) => {
                const url = config.url || '';
                if (AUTH_ENDPOINTS.some(ep => url.includes(ep))) {
                    return config;
                }

                const authHeader = config.headers?.Authorization || config.headers?.authorization || '';
                const token = typeof authHeader === 'string' ? authHeader.replace('Bearer ', '') : '';
                if (token && isTokenExpired(token)) {
                    if (!loggingOut.current) {
                        logout();
                    }
                    const err = new Error('Session expired');
                    err.isSessionExpired = true;
                    return Promise.reject(err);
                }
                return config;
            }
        );

        const responseInterceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.isSessionExpired) {
                    return new Promise(() => {});
                }
                if (error.response?.status === 401 && user && !loggingOut.current) {
                    logout();
                    return new Promise(() => {});
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.request.eject(requestInterceptor);
            axios.interceptors.response.eject(responseInterceptor);
        };
    }, [user, logout]);

    useEffect(() => {
        if (!user?.token) return;

        const checkExpiry = () => {
            if (isTokenExpired(user.token)) {
                logout();
            }
        };

        const interval = setInterval(checkExpiry, 30 * 1000);

        const onFocus = () => checkExpiry();
        window.addEventListener('focus', onFocus);

        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') checkExpiry();
        };
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [user, logout]);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, refreshToken }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
