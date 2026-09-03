import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const [mode,     setMode]     = useState('login'); // 'login' | 'register'
    const [nombre,   setNombre]   = useState('');
    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');
    const [error,    setError]    = useState('');
    const [loading,  setLoading]  = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (mode === 'login') {
                await login(email, password);
                navigate('/');
            } else {
                await register(nombre, email, password);
                setMode('login');
                setError('');
                alert('Cuenta creada. Ahora inicia sesión.');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Error al conectar con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <span className="login-icon">🦷</span>
                    <h1 className="login-title">Cindy Dent</h1>
                    <p className="login-subtitle">Sistema de Detección de Caries</p>
                </div>

                <div className="login-tabs">
                    <button
                        className={`tab-btn ${mode === 'login'    ? 'active' : ''}`}
                        onClick={() => { setMode('login');    setError(''); }}
                    >Iniciar sesión</button>
                    <button
                        className={`tab-btn ${mode === 'register' ? 'active' : ''}`}
                        onClick={() => { setMode('register'); setError(''); }}
                    >Registrarse</button>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {mode === 'register' && (
                        <div className="form-group">
                            <label>Nombre completo</label>
                            <input
                                type="text"
                                value={nombre}
                                onChange={e => setNombre(e.target.value)}
                                placeholder="Dr. Ejemplo"
                                required
                            />
                        </div>
                    )}
                    <div className="form-group">
                        <label>Correo electrónico</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="correo@ejemplo.com"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && <p className="form-error">{error}</p>}

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Procesando...' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
                    </button>
                </form>
            </div>
        </div>
    );
}
