import { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [loading, setLoading] = useState(false);

    const logout = useCallback(async () => {
        try {
            if (user?.token) {
                await axios.post('http://localhost:5000/api/users/logout', {}, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
    }, [user]);

    const login = async (email, password) => {
        const { data } = await axios.post('http://localhost:5000/api/users/login', { email, password });
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
        return data;
    };

    const refreshToken = async () => {
        try {
            if (!user?.token) return;

            const { data } = await axios.post('http://localhost:5000/api/users/refresh', {
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
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                if (error.response?.status === 401 && user) {
                    logout();
                }
                return Promise.reject(error);
            }
        );

        return () => axios.interceptors.response.eject(interceptor);
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
