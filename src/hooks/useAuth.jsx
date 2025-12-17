import { useState, useEffect, createContext, useContext } from 'react';
import api from '@/lib/api';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const { data } = await api.get('/auth/me');
                    setUser(data);
                } catch (error) {
                    console.error('Auth check failed:', error);
                    localStorage.removeItem('token');
                    setUser(null);
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const signUp = async (formData) => {
        try {
            const { data } = await api.post('/auth/signup', formData);
            localStorage.setItem('token', data.token);
            setUser(data);
            return { error: null };
        } catch (error) {
            return { error: error.response?.data?.message || 'Signup failed' };
        }
    };

    const signIn = async (formData) => {
        try {
            // formData can contain email or username in the 'email' field sometimes
            // wrapper to match API expectation
            const { data } = await api.post('/auth/login', formData);
            localStorage.setItem('token', data.token);
            setUser(data);
            return { error: null };
        } catch (error) {
            return { error: error.response?.data?.message || 'Login failed' };
        }
    };

    const signOut = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
