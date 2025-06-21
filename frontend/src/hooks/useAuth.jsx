import { useState } from 'react';

// Use "export const" to create a NAMED export
export const useAuth = () => {
    const [token, setToken] = useState(localStorage.getItem('authToken'));

    const login = (newToken) => {
        localStorage.setItem('authToken', newToken);
        setToken(newToken);
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        setToken(null);
    };

    return { isAuthenticated: !!token, token, login, logout };
};