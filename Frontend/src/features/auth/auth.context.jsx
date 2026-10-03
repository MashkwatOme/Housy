import React, { createContext, useState, useEffect } from 'react';
import { loginApi, registerApi, getMeApi, logoutApi, updateProfileApi } from './services/auth.api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const data = await getMeApi();
                setUser(data.user);
                setIsLoggedIn(true);
            } catch (err) {
                // Not authenticated, ignore
            } finally {
                setLoading(false);
            }
        };
        checkSession();
    }, []);

    useEffect(() => {
        const handleSessionExpired = () => {
            setUser(null);
            setIsLoggedIn(false);
        };
        window.addEventListener('auth-session-expired', handleSessionExpired);
        return () => {
            window.removeEventListener('auth-session-expired', handleSessionExpired);
        };
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const data = await loginApi(email, password);
            setUser(data.user);
            setIsLoggedIn(true);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const register = async (formData) => {
        setLoading(true);
        setError(null);
        try {
            const data = await registerApi(formData);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await logoutApi();
        } catch(e) {}
        setUser(null);
        setIsLoggedIn(false);
    };

    const updateProfile = async (profileData) => {
        const data = await updateProfileApi(profileData);
        setUser(data.user);
        return data;
    };

    return (
        <AuthContext.Provider value={{ user, isLoggedIn, login, register, logout, updateProfile, error, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
