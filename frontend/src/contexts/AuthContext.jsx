import { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser]       = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token  = localStorage.getItem('token');
        const nombre = localStorage.getItem('nombre');
        if (token && nombre) setUser({ token, nombre });
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const { data } = await client.post('/api/auth/login', { email, password });
        localStorage.setItem('token',  data.token);
        localStorage.setItem('nombre', data.nombre);
        setUser({ token: data.token, nombre: data.nombre });
    };

    const register = async (nombre, email, password) => {
        await client.post('/api/auth/register', { nombre, email, password });
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('nombre');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
